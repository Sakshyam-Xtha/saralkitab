export function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export function Spinner() {
  return <div className="spinner" aria-label="Loading" />
}

export function CacheStatus({ stale, updating, offline, authError, cachedAt }) {
  const hasSaved = cachedAt != null
  let label = null
  if (updating) label = 'Updating…'
  else if (offline && hasSaved) label = 'Offline — showing saved data'
  else if (authError && hasSaved) label = 'Session expired — showing saved data'
  else if (stale) label = `Last updated ${timeAgoLabel(cachedAt)}`
  if (!label) return null
  return (
    <div className="cache-status" role="status">
      <span className="cache-status-dot" />
      {label}
    </div>
  )
}

function timeAgoLabel(cachedAt) {
  const ms = Date.now() - cachedAt
  if (ms < 60_000) return 'just now'
  const min = Math.floor(ms / 60_000)
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="loading-state">
      <Spinner />
      {label ? <p className="muted">{label}</p> : null}
    </div>
  )
}

export function OfflineState({ onRetry, busy }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M1 1l22 22" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <path d="M12 20h.01" />
        </svg>
      </div>
      <div className="empty-title">Can't reach the server</div>
      <p className="muted">Check your internet connection and try again.</p>
      <button className="btn btn-primary" onClick={onRetry} disabled={busy}>
        {busy ? 'Retrying…' : 'Try again'}
      </button>
    </div>
  )
}
