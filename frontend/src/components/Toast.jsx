import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

const DURATION = 3200
const EXIT_MS = 180
const MAX_VISIBLE = 3

function ToastIcon({ type }) {
  const isError = type === 'error'
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {isError ? (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </>
      ) : (
        <path d="M20 6 9 17l-5-5" />
      )}
    </svg>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, closing: true } : x)))
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), EXIT_MS)
  }, [])

  const toast = useCallback(
    (type, text) => {
      if (!text) return
      const id = ++idRef.current
      setToasts((t) => [...t.slice(-(MAX_VISIBLE - 1)), { id, type, text }])
      window.setTimeout(() => dismiss(id), DURATION)
    },
    [dismiss]
  )

  const value = {
    success: (text) => toast('success', text),
    error: (text) => toast('error', text),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-host" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type === 'error' ? 'toast-error' : 'toast-success'}${t.closing ? ' toast-closing' : ''}`}
            role={t.type === 'error' ? 'alert' : 'status'}
            onClick={() => dismiss(t.id)}
          >
            <ToastIcon type={t.type} />
            <span className="toast-text">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) return { success: () => {}, error: () => {} }
  return ctx
}
