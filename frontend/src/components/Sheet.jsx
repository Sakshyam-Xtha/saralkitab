import { useEffect } from 'react'

let openSheets = 0

function updateOverflow() {
  document.body.style.overflow = openSheets > 0 ? 'hidden' : ''
}

const closeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

export default function Sheet({ open, onClose, title, children, stacked = false }) {
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

  if (!open) return null

  return (
    <>
      <div className={stacked ? 'sheet-backdrop open stacked' : 'sheet-backdrop open'} onClick={onClose} />
      <div className={stacked ? 'sheet open stacked' : 'sheet open'} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grabber" />
        <div className="sheet-head">
          <div className="sheet-title">{title}</div>
          <button className="sheet-close" aria-label="Close" onClick={onClose}>
            {closeIcon}
          </button>
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
