import { useState } from 'react'
import { api, errorText, getBaseUrl, setBaseUrl } from '../api'
import { Field, Message } from './ui'

const icons = {
  brand: (
    <>
      <rect width="12" height="12" x="6" y="6" rx="2" />
      <path d="M6 12h12" />
      <path d="M12 12v6" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
}

function Icon({ name, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [server, setServer] = useState(getBaseUrl())
  const [serverOpen, setServerOpen] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', phone_num: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [serverMsg, setServerMsg] = useState(null)
  const [testing, setTesting] = useState(false)

  const setLogin = (key) => (e) => setLoginForm((f) => ({ ...f, [key]: e.target.value }))
  const setRegister = (key) => (e) => setRegisterForm((f) => ({ ...f, [key]: e.target.value }))

  const switchMode = (m) => {
    setMode(m)
    setMsg(null)
  }

  const saveServer = (e) => {
    e.preventDefault()
    setBaseUrl(server)
    setServerMsg({ type: 'success', text: 'Server address saved.' })
  }

  const testServer = async () => {
    setTesting(true)
    setServerMsg(null)
    const url = server.replace(/\/+$/, '')
    try {
      const res = await fetch(`${url}/products/`, { headers: { 'Content-Type': 'application/json' } })
      console.log('[api] test ok', url, res.status)
      setServerMsg({
        type: 'success',
        text: `Reachable! Server responded (HTTP ${res.status}). Save, then sign in.`,
      })
    } catch (err) {
      console.error('[api] test failed', url, err)
      setServerMsg({
        type: 'error',
        text: `Not reachable at ${url}. Check the address and that the server runs with runserver 0.0.0.0:8000.`,
      })
    }
    setTesting(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await api.login(loginForm)
    if (res.ok && res.data?.user && res.data?.token) {
      onLogin(res.data.user, res.data.token)
    } else {
      setMsg({ type: 'error', text: errorText(res.data, 'Login failed') })
      setBusy(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await api.register({
      ...registerForm,
      phone_num: Number(registerForm.phone_num),
    })
    if (res.ok && res.data?.user) {
      setMsg({ type: 'success', text: `${res.data.msg || 'User created'}. Sign in to continue.` })
      setLoginForm({ email: registerForm.email, password: registerForm.password })
      switchMode('login')
    } else {
      setMsg({ type: 'error', text: errorText(res.data, 'Registration failed') })
    }
    setBusy(false)
  }

  return (
    <div className="auth-gate">
      <div className="auth-head">
        <div className="auth-brand">
          <span className="brand-mark"><Icon name="brand" /></span>
          Sales<span>Record</span>
        </div>
      </div>

      <div className="auth-card">
        <div className="seg" aria-label="Auth mode">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
            Sign in
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>
            Create account
          </button>
        </div>

        <div className="auth-body">
          <Message type={msg?.type}>{msg?.text}</Message>
          {mode === 'login' ? (
            <form className="form" onSubmit={handleLogin} id="auth-form">
              <Field label="Email">
                <input type="email" inputMode="email" value={loginForm.email} onChange={setLogin('email')} required />
              </Field>
              <Field label="Password">
                <input type="password" value={loginForm.password} onChange={setLogin('password')} required />
              </Field>
            </form>
          ) : (
            <form className="form" onSubmit={handleRegister} id="auth-form">
              <Field label="Name">
                <input value={registerForm.username} onChange={setRegister('username')} required />
              </Field>
              <Field label="Email">
                <input type="email" inputMode="email" value={registerForm.email} onChange={setRegister('email')} required />
              </Field>
              <Field label="Phone">
                <input type="tel" inputMode="tel" value={registerForm.phone_num} onChange={setRegister('phone_num')} required />
              </Field>
              <Field label="Password">
                <input type="password" value={registerForm.password} onChange={setRegister('password')} required />
              </Field>
            </form>
          )}
        </div>

        <div className="server-block">
          <button
            className="server-toggle"
            aria-expanded={serverOpen}
            onClick={() => setServerOpen((o) => !o)}
          >
            Server address
            <span className="muted">{server}</span>
            <Icon name="chevron" />
          </button>
          {serverOpen && (
            <div className="server-body">
              <input
                type="text"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder="http://192.168.1.5:8000"
              />
              <div className="sheet-actions">
                <button className="btn btn-ghost btn-sm" onClick={testServer} disabled={testing}>
                  {testing ? 'Testing…' : 'Test connection'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={saveServer}>Save</button>
              </div>
              <Message type={serverMsg?.type}>{serverMsg?.text}</Message>
            </div>
          )}
        </div>

        <div className="auth-cta-area">
          <button className="btn btn-primary btn-block" type="submit" form="auth-form" disabled={busy}>
            {busy ? (mode === 'login' ? 'Signing in…' : 'Creating…') : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  )
}
