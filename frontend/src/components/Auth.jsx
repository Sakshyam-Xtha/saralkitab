import { useState } from 'react'
import { api, errorText } from '../api'
import { Field, Message } from './ui'

export default function Auth({ user, onLogin }) {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', phone_num: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const setLogin = (key) => (e) => setLoginForm((f) => ({ ...f, [key]: e.target.value }))
  const setRegister = (key) => (e) => setRegisterForm((f) => ({ ...f, [key]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await api.login(loginForm)
    if (res.ok && res.data?.user) {
      onLogin(res.data.user)
      setMsg({ type: 'success', text: res.data.msg || 'Login successful' })
    } else {
      setMsg({ type: 'error', text: errorText(res.data, 'Login failed') })
    }
    setBusy(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await api.register({
      ...registerForm,
      phone_num: Number(registerForm.phone_num),
    })
    if (res.ok) {
      setMsg({ type: 'success', text: `${res.data?.msg || 'User created'}. You can now sign in.` })
      setLoginForm({ email: registerForm.email, password: registerForm.password })
      setMode('login')
    } else {
      setMsg({ type: 'error', text: errorText(res.data, 'Registration failed') })
    }
    setBusy(false)
  }

  if (user) {
    return (
      <section>
        <div className="card profile-card">
          <div className="profile">
            <span className="avatar avatar-lg">{user.name?.[0]?.toUpperCase()}</span>
            <div>
              <h2>{user.name}</h2>
              <p className="muted">{user.email}</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Account</h1>
          <p className="muted">Sign in or create an account</p>
        </div>
      </div>

      <div className="card auth-card">
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setMode('login'); setMsg(null) }}>Sign in</button>
          <button className={mode === 'register' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setMode('register'); setMsg(null) }}>Create account</button>
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
    </section>
  )
}
