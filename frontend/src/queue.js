import { invalidate } from './cache'

const STORAGE_KEY = 'sra_queue'

let owner = null
let flushing = false
let handler = null
let lastResult = null
let retryTimer = null
const listeners = new Set()

const RETRY_INTERVAL = 30_000

/** Automatic fallback: while anything is queued, retry in the background. */
function scheduleRetry() {
  if (retryTimer) return
  retryTimer = setInterval(() => {
    if (!flushing && read().length > 0) flushQueue()
  }, RETRY_INTERVAL)
}

function stopRetry() {
  if (retryTimer && read().length === 0) {
    clearInterval(retryTimer)
    retryTimer = null
  }
}

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function save(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  notify()
}

function notify() {
  const snapshot = { count: read().length, flushing, lastResult }
  for (const fn of listeners) fn(snapshot)
}

/** Owner tag (account username) so pending work never syncs into another account. */
export function setQueueOwner(name) {
  owner = name || null
}

/** api.js registers a function that executes one queued op over the network. */
export function setSyncHandler(fn) {
  handler = fn
}

export function enqueue(op) {
  const arr = read()
  arr.push({
    id: `q${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: op.kind,
    label: op.label || null,
    tempId: op.tempId ?? null,
    method: op.method,
    path: op.path,
    body: op.body ?? null,
    invalidateKeys: op.invalidateKeys || [],
    createdAt: Date.now(),
    owner: owner ?? '',
  })
  save(arr)
  scheduleRetry()
}

export function count() {
  return read().length
}

export function all() {
  return read()
}

export function remove(id) {
  const arr = read()
  const next = arr.filter((e) => e.id !== id)
  if (next.length !== arr.length) {
    save(next)
    stopRetry()
  }
}

export function clear() {
  if (read().length > 0) {
    save([])
    stopRetry()
  }
}

export function isFlushing() {
  return flushing
}

export function subscribeQueue(fn) {
  listeners.add(fn)
  fn({ count: count(), flushing, lastResult })
  return () => listeners.delete(fn)
}

/**
 * Rewrite pending references that pointed at a locally created record
 * (temp id) now that its real server id is known.
 */
function applyRemap(op, map) {
  let path = op.path
  let body = op.body
  if (op.tempId != null && map.has(op.tempId)) {
    path = String(path).replace(String(op.tempId), String(map.get(op.tempId)))
  }
  if (body && body.product != null) {
    const pid = Number(body.product)
    if (Number.isFinite(pid) && map.has(pid)) {
      body = { ...body, product: map.get(pid) }
    }
  }
  return { path, body }
}

/**
 * Flush pending writes in FIFO order. Stops and retries later when the
 * network or auth blocks; drops and reports ops the server rejects (400/404).
 * Successful flushes invalidate the affected caches so the app refetches.
 */
export async function flushQueue() {
  if (flushing) return { synced: 0, skipped: [], stoppedBy: 'busy' }
  if (!handler) return { synced: 0, skipped: [], stoppedBy: 'none' }

  flushing = true
  notify()

  const map = new Map()
  const syncedKeys = new Set()
  const skipped = []
  let syncedCount = 0
  let stoppedBy = null

  try {
    for (;;) {
      const arr = read()
      const entry = arr[0]
      if (!entry) break

      if (entry.owner && owner && entry.owner !== owner) {
        remove(entry.id)
        continue
      }

      const { path, body } = applyRemap(entry, map)
      let res = null
      try {
        res = await handler({ kind: entry.kind, method: entry.method, path, body })
      } catch {
        stoppedBy = 'server'
        break
      }

      if (res && res.ok) {
        remove(entry.id)
        syncedCount++
        for (const k of entry.invalidateKeys) syncedKeys.add(k)
        const serverId = res.data && res.data.id
        if (serverId != null && (entry.kind === 'addProduct' || entry.kind === 'createTransaction')) {
          map.set(entry.tempId, Number(serverId))
        }
        continue
      }

      const status = res ? res.status : 0
      if (status === 0) { stoppedBy = 'offline'; break }
      if (status === 401 || status === 403) { stoppedBy = 'auth'; break }
      if (status >= 500 || status === 429) { stoppedBy = 'server'; break }
      remove(entry.id)
      skipped.push({ kind: entry.kind })
    }
  } finally {
    flushing = false
  }

  const needsRefresh = syncedCount > 0 && stoppedBy === null
  if (needsRefresh && syncedKeys.size > 0) invalidate(...syncedKeys)

  stopRetry()

  lastResult = { synced: syncedCount, skipped: skipped.length, stoppedBy, at: Date.now() }
  notify()
  return { synced: syncedCount, skipped, stoppedBy, needsRefresh }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flushQueue())
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') flushQueue()
  })
}
