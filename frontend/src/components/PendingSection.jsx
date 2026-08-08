import { useEffect, useRef, useState } from 'react'
import { all, flushQueue, subscribeQueue } from '../queue'
import { useToast } from './Toast'

const KIND_ICON = {
  addProduct: 'plus',
  updateProduct: 'edit',
  deleteProduct: 'trash',
  restock: 'refresh',
  createTransaction: 'receipt',
  updateTransaction: 'receipt',
}

const icons = {
  plus: <path d="M12 5v14M5 12h14" />,
  edit: (
    <>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </>
  ),
  receipt: (
    <>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </>
  ),
}

function Icon({ name }) {
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
      {icons[name]}
    </svg>
  )
}

function timeAgoLabel(ts) {
  const ms = Date.now() - ts
  if (ms < 60_000) return 'just now'
  const min = Math.floor(ms / 60_000)
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function PendingSection() {
  const [snapshot, setSnapshot] = useState({ count: 0, flushing: false, lastResult: null })
  const [ops, setOps] = useState(() => all())
  const toast = useToast()
  const toastedRef = useRef(Date.now())

  useEffect(
    () =>
      subscribeQueue((s) => {
        setSnapshot(s)
        setOps(all())
      }),
    []
  )

  useEffect(() => {
    const r = snapshot.lastResult
    if (!r || r.at === toastedRef.current) return
    toastedRef.current = r.at
    if (r.skipped > 0) {
      toast.error(
        r.synced > 0
          ? `Synced ${r.synced} change${r.synced === 1 ? '' : 's'}. ${r.skipped} rejected by the server.`
          : `${r.skipped} change${r.skipped === 1 ? '' : 's'} could not be synced and were rejected.`
      )
    } else if (r.synced > 0) {
      toast.success(r.synced === 1 ? 'Change synced' : `${r.synced} changes synced`)
    }
  }, [snapshot, toast])

  if (snapshot.count === 0 && !snapshot.flushing) return null

  const plural = snapshot.count === 1 ? '' : 's'
  const title = snapshot.flushing
    ? snapshot.count > 0
      ? `Syncing ${snapshot.count} change${plural}…`
      : 'Syncing…'
    : `${snapshot.count} change${plural} waiting to sync`

  return (
    <section className="pending-section" aria-label="Pending sync">
      <div className="pending-head">
        <span className={`pending-dot${snapshot.flushing ? ' spinning' : ''}`} />
        <span className="pending-title">{title}</span>
        {!snapshot.flushing && (
          <button className="pending-sync-btn" onClick={() => flushQueue()}>
            Sync now
          </button>
        )}
      </div>
      {ops.length > 0 && (
        <ul className="pending-list">
          {ops.map((op) => (
            <li key={op.id} className="pending-row">
              <span className="list-icon primary">
                <Icon name={KIND_ICON[op.kind] || 'receipt'} />
              </span>
              <span className="list-main">
                <span className="list-title">{op.label || 'Pending change'}</span>
                <span className="list-sub">{timeAgoLabel(op.createdAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
