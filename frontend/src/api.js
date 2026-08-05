const isNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.()

// Android emulator reaches the host machine's loopback via 10.0.2.2.
// On a physical phone, set the server address in the Account tab instead.
const DEVICE_API_URL = 'http://10.0.2.2:8000'

export function getBaseUrl() {
  const saved = localStorage.getItem('sra_api_url')
  if (saved) return saved.replace(/\/+$/, '')
  return isNative ? DEVICE_API_URL : 'http://localhost:8000'
}

export function setBaseUrl(url) {
  localStorage.setItem('sra_api_url', url)
}

export function getToken() {
  return localStorage.getItem('sra_token')
}

async function request(path, { method = 'GET', body } = {}) {
  const config = { method, headers: {} }
  const token = getToken()
  if (token) config.headers['Authorization'] = `Token ${token}`
  if (body !== undefined) {
    config.headers['Content-Type'] = 'application/json'
    config.body = JSON.stringify(body)
  }
  try {
    const res = await fetch(`${getBaseUrl()}${path}`, config)
    let data = null
    try {
      data = await res.json()
    } catch {
      data = null
    }
    return { ok: res.ok, status: res.status, data }
  } catch {
    return {
      ok: false,
      status: 0,
      data: { msg: `Cannot reach the API at ${getBaseUrl()}. Make sure the Django server is running.` },
    }
  }
}

export const api = {
  listProducts: () => request('/products/'),
  getProduct: (id) => request(`/products/${id}/`),
  addProduct: (payload) => request('/products/add/', { method: 'POST', body: payload }),
  deleteProduct: (id) => request(`/products/delete/${id}/`, { method: 'DELETE' }),
  updateProduct: (id, payload) => request(`/products/update/${id}/`, { method: 'PATCH', body: payload }),
  restock: (id, payload) => request(`/products/restock/${id}/`, { method: 'POST', body: payload }),
  listTransactions: () => request('/products/transactions/'),
  createTransaction: (payload) => request('/products/transactions/add/', { method: 'POST', body: payload }),
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
  return Number.isFinite(n) ? `Rs. ${n.toLocaleString('en-IN')}` : value
}
