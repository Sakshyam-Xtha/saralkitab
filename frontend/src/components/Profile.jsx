import { useState } from 'react'
import { getBaseUrl, setBaseUrl } from '../api'
import { Field, Message } from './ui'

export default function Profile({ user, onLogout }) {
  const [server, setServer] = useState(getBaseUrl())
  const [msg, setMsg] = useState(null)

  const saveServer = (e) => {
    e.preventDefault()
    setBaseUrl(server)
    setMsg({ type: 'success', text: 'Saved. It applies on the next API call.' })
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Account</h1>
          <p className="muted">Your profile</p>
        </div>
      </div>
      <div className="card profile-card">
        <div className="profile">
          <span className="avatar avatar-lg">{user.username?.[0]?.toUpperCase()}</span>
          <div>
            <h2>{user.username}</h2>
            <p className="muted">{user.email}</p>
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn btn-danger" onClick={onLogout}>Logout</button>
        </div>
      </div>
      <div className="card">
        <h3>Server address</h3>
        <p className="muted">
          Where the app talks to your Django backend. On a phone, use your computer&apos;s LAN IP, e.g.
          http://192.168.1.5:8000, and run the server with <code>python manage.py runserver 0.0.0.0:8000</code>.
        </p>
        <Message type={msg?.type}>{msg?.text}</Message>
        <form className="form" onSubmit={saveServer}>
          <Field label="API base URL">
            <input
              type="text"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="http://192.168.1.5:8000"
            />
          </Field>
          <button className="btn btn-primary" type="submit">Save</button>
        </form>
      </div>
    </section>
  )
}
