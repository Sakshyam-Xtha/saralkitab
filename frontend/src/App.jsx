import { useState } from 'react'
import Products from './components/Products'
import Transactions from './components/Transactions'
import Auth from './components/Auth'

const TABS = [
  { id: 'products', label: 'Products' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'auth', label: 'Account' },
]

export default function App() {
  const [tab, setTab] = useState('products')
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('sra_user') || 'null'))

  const handleLogin = (u) => {
    localStorage.setItem('sra_user', JSON.stringify(u))
    setUser(u)
  }

  const handleLogout = () => {
    localStorage.removeItem('sra_user')
    setUser(null)
    setTab('auth')
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">Sales<span>Record</span></div>
          <nav className="tabs">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'tab active' : 'tab'} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="user-badge">
            {user ? (
              <>
                <span className="avatar">{user.name?.[0]?.toUpperCase()}</span>
                <span className="user-name">{user.name}</span>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setTab('auth')}>Sign in</button>
            )}
          </div>
        </div>
      </header>
      <main className="content">
        {tab === 'products' && <Products />}
        {tab === 'transactions' && <Transactions />}
        {tab === 'auth' && <Auth user={user} onLogin={handleLogin} />}
      </main>
    </div>
  )
}
