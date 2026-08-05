import { useState } from 'react'
import { api, errorText, getBaseUrl, setBaseUrl } from '../api'
import { Field, Message } from './ui'

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [server, setServer] = useState(getBaseUrl())
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', phone_num: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const setLogin = (key) => (e) => setLoginForm((f) => ({ ...f, [key]: e.target.value }))
  const setRegister = (key) => (e) => setRegisterForm((f) => ({ ...f, [key]: e.target.value }))

  const switchMode = (m) => {
    setMode(m)
    setMsg(null)
  }

  const saveServer = (e) => {
    e.preventDefault()
    setBaseUrl(server)
    setMsg({ type: 'success', text: 'Server address saved.' })
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
      <div className="auth-gate-card">
        <div className="brand auth-brand">Sales<span>Record</span></div>
        <form className="form server-form" onSubmit={saveServer}>
          <Field label="Server address">
            <input
              type="text"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="http://192.168.1.5:8000"
            />
          </Field>
          <button className="btn btn-ghost btn-sm" type="submit">Save</button>
        </form>
        <Message type={msg?.type}>{msg?.text}</Message>
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'auth-tab active' : 'auth-tab'} onClick={() => switchMode('login')}>
            Sign in
          </button>
          <button className={mode === 'register' ? 'auth-tab active' : 'auth-tab'} onClick={() => switchMode('register')}>
            Create account
          </button>
        </div>

        <Message type={msg?.type}>{msg?.text}</Message>

        {mode === 'login' ? (
          <form className="form" onSubmit={handleLogin}>
            <Field label="Email">
              <input type="email" value={loginForm.email} onChange={setLogin('email')} required />
            </Field>
            <Field label="Password">
              <input type="password" value={loginForm.password} onChange={setLogin('password')} required />
            </Field>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
        ) : (
          <form className="form" onSubmit={handleRegister}>
            <Field label="Name">
              <input value={registerForm.username} onChange={setRegister('username')} required />
            </Field>
            <Field label="Email">
              <input type="email" value={registerForm.email} onChange={setRegister('email')} required />
            </Field>
            <Field label="Phone">
              <input type="tel" value={registerForm.phone_num} onChange={setRegister('phone_num')} required />
            </Field>
            <Field label="Password">
              <input type="password" value={registerForm.password} onChange={setRegister('password')} required />
            </Field>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
