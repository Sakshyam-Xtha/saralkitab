import { getSettings } from './settings'
import { invalidate } from './cache'

const API_URL = 'https://saralkitab.onrender.com'
const REQUEST_TIMEOUT = 60_000

export function getToken() {
  return localStorage.getItem('sra_token')
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  const combinedSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal
  const config = { method, headers: {}, signal: combinedSignal }
  const token = getToken()
  if (token) config.headers['Authorization'] = `Token ${token}`
  if (body !== undefined) {
    config.headers['Content-Type'] = 'application/json'
    config.body = JSON.stringify(body)
  }
  try {
    const res = await fetch(`${API_URL}${path}`, config)
    let data = null
    try {
      data = await res.json()
    } catch {
      data = null
    }
    return { ok: res.ok, status: res.status, data }
  } catch (err) {
    console.error('[api] fetch failed', `${API_URL}${path}`, err)
    return {
      ok: false,
      status: 0,
      data: { msg: "Can't connect to the server. Check your internet connection and try again." },
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function invalidating(promise, keys) {
  const res = await promise
  if (res && res.ok) invalidate(...keys)
  return res
}

export const api = {
  listProducts: (signal) => request('/products/', { signal }),
  getProduct: (id) => request(`/products/${id}/`),
  addProduct: (payload) => invalidating(request('/products/add/', { method: 'POST', body: payload }), ['products:list']),
  deleteProduct: (id) => invalidating(request(`/products/delete/${id}/`, { method: 'DELETE' }), ['products:list']),
  updateProduct: (id, payload) => invalidating(request(`/products/update/${id}/`, { method: 'PATCH', body: payload }), ['products:list']),
  restock: (id, payload) => invalidating(request(`/products/restock/${id}/`, { method: 'POST', body: payload }), ['products:list', 'transactions:list']),
  listTransactions: (signal) => request('/products/transactions/', { signal }),
  createTransaction: (payload) => invalidating(request('/products/transactions/add/', { method: 'POST', body: payload }), ['products:list', 'transactions:list']),
  updateTransaction: (id, payload) => invalidating(request(`/products/transactions/update/${id}/`, { method: 'PATCH', body: payload }), ['products:list', 'transactions:list']),
  register: (payload) => request('/user/register/', { method: 'POST', body: payload }),
  login: (payload) => request('/user/login/', { method: 'POST', body: payload }),
}

export function errorText(data, fallback = 'Something went wrong') {
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (Array.isArray(data)) return data.join(', ')
  if (typeof data === 'object') {
    if (data.msg) return data.msg
    return Object.entries(data)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('; ')
  }
  return fallback
}

export function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  const symbol = getSettings().currency || ''
  const formatted = n.toLocaleString('en-IN')
  return symbol ? `${symbol} ${formatted}` : formatted
}

export async function exportData() {
  const [pRes, tRes] = await Promise.all([api.listProducts(), api.listTransactions()])
  if (!pRes.ok || !tRes.ok) {
    throw new Error(errorText(!pRes.ok ? pRes.data : tRes.data, 'Failed to export data'))
  }
  return {
    exported_at: new Date().toISOString(),
    products: pRes.data || [],
    transactions: tRes.data || [],
  }
}
