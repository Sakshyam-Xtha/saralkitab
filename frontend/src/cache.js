const NAMESPACE = 'sra_cache_'

export const CACHE = {
  freshMs: 5 * 60_000,
}

const listeners = new Set()

function notify() {
  for (const fn of listeners) fn()
}

export function get(name) {
  try {
    const raw = localStorage.getItem(NAMESPACE + name)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (!entry || typeof entry !== 'object' || typeof entry.cachedAt !== 'number' || !('data' in entry)) {
      return null
    }
    return entry
  } catch {
    return null
  }
}

export function set(name, data) {
  const entry = { data, cachedAt: Date.now() }
  localStorage.setItem(NAMESPACE + name, JSON.stringify(entry))
  notify()
}

export function remove(name) {
  localStorage.removeItem(NAMESPACE + name)
  notify()
}

export function invalidate(...names) {
  for (const name of names) remove(name)
}

export function clear() {
  let changed = false
  const remove = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(NAMESPACE)) {
      remove.push(k)
      changed = true
    }
  }
  for (const k of remove) localStorage.removeItem(k)
  if (changed) notify()
}

export function keys() {
  const out = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(NAMESPACE)) out.push(k.slice(NAMESPACE.length))
  }
  return out
}

export function isFresh(entry, now = Date.now()) {
  if (!entry) return false
  return now - entry.cachedAt <= CACHE.freshMs
}

export function isStale(entry, now = Date.now()) {
  return Boolean(entry) && !isFresh(entry, now)
}

export function timeAgo(entry, now = Date.now()) {
  if (!entry) return ''
  const ms = now - entry.cachedAt
  if (ms < 60_000) return 'just now'
  const min = Math.floor(ms / 60_000)
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function subscribeCache(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(NAMESPACE)) notify()
  })
}
