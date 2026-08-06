const NAMESPACE = 'sra_'

const DEFAULTS = {
  shop_name: '',
  currency: 'Rs.',
  theme: 'system',
}

const listeners = new Set()

export function getSettings() {
  const out = {}
  for (const key in DEFAULTS) {
    const stored = localStorage.getItem(NAMESPACE + key)
    out[key] = stored === null ? DEFAULTS[key] : stored
  }
  return out
}

export function setSetting(key, value) {
  if (!(key in DEFAULTS)) return
  localStorage.setItem(NAMESPACE + key, value)
  notify()
}

export function subscribeSettings(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  for (const fn of listeners) fn()
}
