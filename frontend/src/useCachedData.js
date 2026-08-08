import { useCallback, useEffect, useRef, useState } from 'react'
import { get, isStale, set as cacheSet, subscribeCache } from './cache'

function seed(cacheKey) {
  const entry = get(cacheKey)
  return {
    data: entry ? entry.data : null,
    fromCache: Boolean(entry),
    stale: isStale(entry),
    cachedAt: entry ? entry.cachedAt : null,
    loading: !entry,
    updating: false,
    offline: false,
    authError: false,
    error: null,
  }
}

export default function useCachedData(fetcher, cacheKey) {
  const [state, setState] = useState(() => seed(cacheKey))
  const dataRef = useRef(state.data)
  dataRef.current = state.data
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const abortRef = useRef(null)

  const patch = useCallback((p) => setState((s) => ({ ...s, ...p })), [])

  const revalidate = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    patch({
      loading: dataRef.current == null,
      updating: dataRef.current != null,
      offline: false,
      authError: false,
      error: null,
    })

    const res = await fetcherRef.current(controller.signal)
    if (controller.signal.aborted) return res

    if (res && res.ok) {
      cacheSet(cacheKey, res.data || [])
      patch({
        data: res.data || [],
        fromCache: false,
        stale: false,
        cachedAt: Date.now(),
        loading: false,
        updating: false,
        offline: false,
        authError: false,
        error: null,
      })
    } else {
      patch({
        loading: false,
        updating: false,
        offline: Boolean(res && res.status === 0),
        authError: Boolean(res && (res.status === 401 || res.status === 403)),
        error: res && !res.ok ? res : { ok: false, status: 0, data: { msg: 'Request failed' } },
      })
    }
    return res
  }, [cacheKey, patch])

  useEffect(() => {
    revalidate()
    const unsub = subscribeCache(() => {
      const entry = get(cacheKey)
      if (entry) {
        setState((s) => ({
          ...s,
          data: entry.data,
          fromCache: true,
          stale: isStale(entry),
          cachedAt: entry.cachedAt,
        }))
      } else {
        setState((s) => ({
          ...s,
          data: null,
          fromCache: false,
          stale: false,
          cachedAt: null,
          loading: s.data == null,
        }))
      }
    })
    return () => {
      unsub()
      abortRef.current?.abort()
    }
  }, [revalidate, cacheKey])

  const reload = useCallback(() => revalidate(), [revalidate])

  return {
    data: state.data || [],
    rawData: state.data,
    loading: state.loading,
    offline: state.offline,
    authError: state.authError,
    error: state.error,
    fromCache: state.fromCache,
    stale: state.stale,
    updating: state.updating,
    cachedAt: state.cachedAt,
    reload,
  }
}
