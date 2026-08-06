import { useState } from 'react'
import { getBaseUrl, setBaseUrl } from '../api'
import { Field, Message } from './ui'
import Sheet, { ConfirmSheet } from './Sheet'

const icons = {
  chevron: <path d="m9 18 6-6-6-6" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
}

function Icon({ name, className }) {
  return (
    <svg
      className={className}
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

export default function Profile({ user, onLogout }) {
  const [server, setServer] = useState(getBaseUrl())
  const [serverSheet, setServerSheet] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [msg, setMsg] = useState(null)

  const saveServer = (e) => {
    e.preventDefault()
    setBaseUrl(server)
    setMsg({ type: 'success', text: 'Saved. It applies on the next API call.' })
    setServerSheet(false)
  }

  return (
    <section>
      <Message type={msg?.type}>{msg?.text}</Message>

      <div className="card">
        <div className="profile-hero">
          <span className="avatar-lg">{user.username?.[0]?.toUpperCase()}</span>
          <div>
            <h2>{user.username}</h2>
            <p className="muted">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="settings-list">
        <button className="settings-row" onClick={() => setServerSheet(true)}>
          <span className="list-icon primary"><Icon name="globe" /></span>
          <span className="settings-main">
            <span className="settings-title">Server address</span>
            <span className="settings-sub">{getBaseUrl()}</span>
          </span>
          <Icon name="chevron" className="list-chevron" />
        </button>
        <button className="settings-row" onClick={() => setConfirmLogout(true)}>
          <span className="list-icon danger"><Icon name="logout" /></span>
          <span className="settings-main">
            <span className="settings-title danger-text">Logout</span>
            <span className="settings-sub">Sign out of this device</span>
          </span>
          <Icon name="chevron" className="list-chevron" />
        </button>
      </div>

      <Sheet open={serverSheet} onClose={() => setServerSheet(false)} title="Server address">
        <p className="sheet-note">
          Where the app talks to your Django backend. On a phone, use your computer&apos;s LAN IP, e.g.{' '}
          <code>http://192.168.1.5:8000</code>, and run the server with{' '}
          <code>python manage.py runserver 0.0.0.0:8000</code>.
        </p>
        <form className="form" onSubmit={saveServer}>
          <Field label="API base URL">
            <input
              type="text"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="http://192.168.1.5:8000"
            />
          </Field>
          <button className="btn btn-primary btn-block" type="submit">Save</button>
        </form>
      </Sheet>

      <ConfirmSheet
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={onLogout}
        title="Logout"
        message="Sign out of Sales Record on this device?"
        confirmLabel="Logout"
      />
    </section>
  )
}
