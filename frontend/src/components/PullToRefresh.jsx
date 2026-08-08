import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 70

let activeRefresh = null

export function useRefresh(fn) {
  const latest = useRef(fn)
  latest.current = fn
  useEffect(() => {
    activeRefresh = () => latest.current()
    return () => {
      activeRefresh = null
    }
  }, [])
}

export function getRefresh() {
  return activeRefresh
}

export default function PullToRefresh({ children }) {
  const [pull, setPull] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startY = useRef(null)
  const pullDist = useRef(0)
  const engaging = useRef(false)
  const refreshingRef = useRef(false)

  useEffect(() => {
    const onStart = (e) => {
      if (refreshingRef.current || !getRefresh() || window.scrollY > 0) return
      if (e.touches.length !== 1) return
      if (e.target.closest?.('.sheet, .sheet-backdrop')) return
      startY.current = e.touches[0].clientY
      pullDist.current = 0
      engaging.current = true
    }

    const onMove = (e) => {
      if (!engaging.current || startY.current == null) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) {
        engaging.current = false
        startY.current = null
        pullDist.current = 0
        setDragging(false)
        setPull(0)
        return
      }
      e.preventDefault()
      pullDist.current = dy
      setDragging(true)
      setPull(Math.min(dy * 0.5, 160))
    }

    const onEnd = async () => {
      if (!engaging.current) return
      engaging.current = false
      startY.current = null
      const dist = pullDist.current
      pullDist.current = 0
      setDragging(false)
      setPull(0)
      if (dist < THRESHOLD || refreshingRef.current) return
      refreshingRef.current = true
      try {
        const fn = getRefresh()
        if (fn) await fn()
      } finally {
        refreshingRef.current = false
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  return (
    <div
      className={`ptr-content${dragging ? '' : ' ptr-spring'}`}
      style={pull > 0 ? { transform: `translateY(${pull * 0.35}px) scaleY(${1 + pull * 0.0012})` } : undefined}
    >
      {children}
    </div>
  )
}
