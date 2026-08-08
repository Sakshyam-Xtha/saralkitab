import { getSettings } from './settings'
import { get as cacheGet, set as cacheSet, invalidate } from './cache'
import { enqueue, flushQueue, setSyncHandler } from './queue'

const API_URL = 'https://saralkitab.onrender.com'
const REQUEST_TIMEOUT = 60_000

let tempSeq = 0
function nextTempId() {
  tempSeq += 1
  return -(Date.now() + tempSeq)
}

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

/**
 * Queue-aware write. Sends immediately; if the network is unreachable the
 * operation is persisted to the sync queue, applied to the local cache so the
 * UI reflects it, and sent automatically once connectivity returns.
 */
async function write(op) {
  const res = await request(op.path, { method: op.method, body: op.body })
  if (res.ok) {
    invalidate(...op.invalidateKeys)
    flushQueue()
    return res
  }
  if (res.status === 0) {
    enqueue(op)
    if (op.optimistic) {
      try {
        op.optimistic()
      } catch (err) {
        console.error('[api] optimistic update failed', err)
      }
    }
    return {
      ok: true,
      queued: true,
      status: 0,
      data: { msg: 'Saved on this device — will sync when you are back online' },
    }
  }
  return res
}

setSyncHandler(async (op) => {
  return request(op.path, { method: op.method, body: op.body == null ? undefined : op.body })
})

/* ---------- Optimistic local cache updates ---------- */

const now = () => new Date().toISOString()
const num = (v) => Number(v)

function listCache(key) {
  const entry = cacheGet(key)
  return entry && Array.isArray(entry.data) ? entry.data : null
}

function saveCache(key, list) {
  if (list) cacheSet(key, list)
}

function cacheProductName(id) {
  const list = listCache('products:list')
  const p = list && list.find((x) => Number(x.id) === Number(id))
  return p ? p.name : null
}

function optimisticAddProduct(payload, tempId) {
  const list = listCache('products:list')
  if (!list) return
  list.push({
    id: tempId,
    name: payload.product_name,
    cost_price: num(payload.cost_price),
    selling_price: num(payload.selling_price),
    stock: num(payload.quantity),
    supplier_phone: payload.supplier_contact || '',
    category: String(payload.category || '').toLowerCase(),
    created_at: now(),
    updated_at: now(),
  })
  saveCache('products:list', list)
}

function optimisticUpdateProduct(id, payload) {
  const list = listCache('products:list')
  const p = list && list.find((x) => Number(x.id) === Number(id))
  if (!p) return
  if (payload.name != null) p.name = payload.name
  if (payload.cost_price != null) p.cost_price = num(payload.cost_price)
  if (payload.selling_price != null) p.selling_price = num(payload.selling_price)
  if (payload.stock != null) p.stock = num(payload.stock)
  if (payload.supplier_phone != null) p.supplier_phone = payload.supplier_phone
  if (payload.category != null) p.category = String(payload.category).toLowerCase()
  p.updated_at = now()
  saveCache('products:list', list)
}

function optimisticDeleteProduct(id) {
  const list = listCache('products:list')
  if (!list) return
  const next = list.filter((x) => Number(x.id) !== Number(id))
  if (next.length !== list.length) saveCache('products:list', next)
  const txns = listCache('transactions:list')
  if (txns) {
    const nextTxns = txns.filter((t) => Number(t.product) !== Number(id))
    if (nextTxns.length !== txns.length) saveCache('transactions:list', nextTxns)
  }
}

function optimisticRestock(id, payload, tempTxnId) {
  const products = listCache('products:list')
  const p = products && products.find((x) => Number(x.id) === Number(id))
  if (p) {
    p.stock = Number(p.stock) + num(payload.quantity)
    if (payload.unit_cost_price != null) p.cost_price = num(payload.unit_cost_price)
    if (payload.unit_selling_price != null) p.selling_price = num(payload.unit_selling_price)
    p.updated_at = now()
    saveCache('products:list', products)
  }
  const txns = listCache('transactions:list')
  if (txns) {
    txns.push({
      id: tempTxnId,
      product: id,
      transaction_type: 'restock',
      quantity: num(payload.quantity),
      payment_type: payload.payment_type,
      unit_cost_price: payload.unit_cost_price != null ? num(payload.unit_cost_price) : (p ? p.cost_price : 0),
      unit_selling_price: payload.unit_selling_price != null ? num(payload.unit_selling_price) : (p ? p.selling_price : 0),
      created_at: now(),
    })
    saveCache('transactions:list', txns)
  }
}

function optimisticTransaction(payload, tempTxnId) {
  const products = listCache('products:list')
  const p = products && products.find((x) => Number(x.id) === Number(payload.product))
  if (p) {
    const delta = payload.transaction_type === 'sale' ? -num(payload.quantity) : num(payload.quantity)
    p.stock = Math.max(0, Number(p.stock) + delta)
    p.updated_at = now()
    saveCache('products:list', products)
  }
  const txns = listCache('transactions:list')
  if (txns) {
    txns.push({
      id: tempTxnId,
      product: payload.product,
      transaction_type: payload.transaction_type,
      quantity: num(payload.quantity),
      payment_type: payload.payment_type,
      unit_cost_price: p ? p.cost_price : 0,
      unit_selling_price: p ? p.selling_price : 0,
      created_at: now(),
    })
    saveCache('transactions:list', txns)
  }
}

function optimisticUpdateTransaction(id, payload) {
  const txns = listCache('transactions:list')
  const t = txns && txns.find((x) => Number(x.id) === Number(id))
  if (!t) return

  const products = listCache('products:list')
  const oldProduct = products && products.find((x) => Number(x.id) === Number(t.product))
  const newProduct = products && products.find((x) => Number(x.id) === Number(payload.product))

  const rollback = (prod, type, qty) => {
    if (type === 'sale') prod.stock = Number(prod.stock) + qty
    else if (type === 'return' || type === 'restock') prod.stock = Number(prod.stock) - qty
  }
  const apply = (prod, type, qty) => {
    if (type === 'sale') prod.stock = Number(prod.stock) - qty
    else if (type === 'return' || type === 'restock') prod.stock = Number(prod.stock) + qty
  }

  if (oldProduct) rollback(oldProduct, t.transaction_type, num(t.quantity))
  if (newProduct) apply(newProduct, payload.transaction_type, num(payload.quantity))
  if (products) saveCache('products:list', products)

  t.product = payload.product
  t.transaction_type = payload.transaction_type
  t.quantity = num(payload.quantity)
  t.payment_type = payload.payment_type
  if (newProduct) {
    t.unit_cost_price = newProduct.cost_price
    t.unit_selling_price = newProduct.selling_price
  }
  saveCache('transactions:list', txns)
}

/* ---------- API surface ---------- */

export const api = {
  listProducts: (signal) => request('/products/', { signal }),
  getProduct: (id) => request(`/products/${id}/`),
  addProduct: (payload) => {
    const tempId = nextTempId()
    return write({
      kind: 'addProduct',
      tempId,
      label: `Add product: ${payload.product_name}`,
      method: 'POST',
      path: '/products/add/',
      body: { ...payload, client_id: tempId },
      invalidateKeys: ['products:list'],
      optimistic: () => optimisticAddProduct(payload, tempId),
    })
  },
  deleteProduct: (id) =>
    write({
      kind: 'deleteProduct',
      tempId: Number(id),
      label: `Delete product${cacheProductName(id) ? `: ${cacheProductName(id)}` : ` #${id}`}`,
      method: 'DELETE',
      path: `/products/delete/${id}/`,
      invalidateKeys: ['products:list'],
      optimistic: () => optimisticDeleteProduct(id),
    }),
  updateProduct: (id, payload) =>
    write({
      kind: 'updateProduct',
      tempId: Number(id),
      label: `Edit product: ${payload.name || '#' + id}`,
      method: 'PATCH',
      path: `/products/update/${id}/`,
      body: payload,
      invalidateKeys: ['products:list'],
      optimistic: () => optimisticUpdateProduct(id, payload),
    }),
  restock: (id, payload) => {
    const tempTxnId = nextTempId()
    return write({
      kind: 'restock',
      tempId: Number(id),
      label: `Restock ${payload.quantity} × ${cacheProductName(id) || '#' + id}`,
      method: 'POST',
      path: `/products/restock/${id}/`,
      body: payload,
      invalidateKeys: ['products:list', 'transactions:list'],
      optimistic: () => optimisticRestock(id, payload, tempTxnId),
    })
  },
  listTransactions: (signal) => request('/products/transactions/', { signal }),
  createTransaction: (payload) => {
    const tempTxnId = nextTempId()
    const kindLabel =
      payload.transaction_type === 'return' ? 'Return' :
      payload.transaction_type === 'restock' ? 'Restock' : 'Sale'
    return write({
      kind: 'createTransaction',
      tempId: tempTxnId,
      label: `${kindLabel} ${payload.quantity} × ${cacheProductName(payload.product) || '#' + payload.product}`,
      method: 'POST',
      path: '/products/transactions/add/',
      body: payload,
      invalidateKeys: ['products:list', 'transactions:list'],
      optimistic: () => optimisticTransaction(payload, tempTxnId),
    })
  },
  updateTransaction: (id, payload) =>
    write({
      kind: 'updateTransaction',
      tempId: Number(id),
      label: `Edit transaction${cacheProductName(payload.product) ? `: ${cacheProductName(payload.product)}` : ''}`,
      method: 'PATCH',
      path: `/products/transactions/update/${id}/`,
      body: payload,
      invalidateKeys: ['products:list', 'transactions:list'],
      optimistic: () => optimisticUpdateTransaction(id, payload),
    }),
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
