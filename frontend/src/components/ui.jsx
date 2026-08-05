export function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export function Message({ type, children }) {
  if (!children) return null
  return <div className={`message ${type === 'error' ? 'message-error' : 'message-success'}`}>{children}</div>
}

export function Spinner() {
  return <div className="spinner" aria-label="Loading" />
}
