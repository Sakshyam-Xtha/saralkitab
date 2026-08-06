import { useEffect, useRef } from 'react'

let openSheets = 0

function updateOverflow() {
  document.body.style.overflow = openSheets > 0 ? 'hidden' : ''
}

const CLOSE_THRESHOLD = 120
const SLIDE_OUT_MS = 220

const closeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

export default function Sheet({ open, onClose, title, children, stacked = false }) {
  const sheetRef = useRef(null)
  const drag = useRef({ startY: 0, y: 0, active: false, done: false })

  useEffect(() => {
    if (!open) return
    openSheets += 1
    updateOverflow()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      openSheets -= 1
      updateOverflow()
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const onGripDown = (e) => {
    if (e.target.closest('.sheet-close')) return
    drag.current.startY = e.clientY
    drag.current.y = 0
    drag.current.active = true
    drag.current.done = false
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onGripMove = (e) => {
    if (!drag.current.active || drag.current.done) return
    const dy = e.clientY - drag.current.startY
    if (dy <= 0) return
    drag.current.y = dy
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`
  }

  const onGripUp = () => {
    if (!drag.current.active) return
    drag.current.active = false
    const el = sheetRef.current
    if (!el || drag.current.done) return
    drag.current.done = true
    el.style.transition = ''
    const dy = drag.current.y
    if (dy >= CLOSE_THRESHOLD) {
      el.style.transform = `translateY(${el.offsetHeight}px)`
      window.setTimeout(onClose, SLIDE_OUT_MS)
    } else {
      el.style.transform = ''
    }
  }

  if (!open) return null

  return (
    <>
      <div className={stacked ? 'sheet-backdrop open stacked' : 'sheet-backdrop open'} onClick={onClose} />
      <div
        ref={sheetRef}
        className={stacked ? 'sheet open stacked' : 'sheet open'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="sheet-grip"
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={onGripUp}
          onPointerCancel={onGripUp}
        >
          <div className="sheet-grabber" />
          <div className="sheet-head">
            <div className="sheet-title">{title}</div>
            <button className="sheet-close" aria-label="Close" onClick={onClose}>
              {closeIcon}
            </button>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  )
}

export function ConfirmSheet({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', busy = false }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="sheet-note">{message}</p>
      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger-solid" onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Sheet>
  )
}
