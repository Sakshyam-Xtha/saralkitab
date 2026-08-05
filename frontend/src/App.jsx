import { useState } from 'react'
import Products from './components/Products'
import Transactions from './components/Transactions'
import Analytics from './components/Analytics'
import Profile from './components/Profile'
import Auth from './components/Auth'

const TABS = [
  { id: 'products', label: 'Products' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'profile', label: 'Account' },
]

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('sra_user') || 'null'))
  const [tab, setTab] = useState('products')

  const handleLogin = (u, token) => {
    localStorage.setItem('sra_user', JSON.stringify(u))
    localStorage.setItem('sra_token', token)
    setUser(u)
    setTab('products')
  }

  const handleLogout = () => {
    localStorage.removeItem('sra_user')
    localStorage.removeItem('sra_token')
    setUser(null)
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />
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
            <span className="avatar">{user.username?.[0]?.toUpperCase()}</span>
            <span className="user-name">{user.username}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>
      <main className="content">
        {tab === 'products' && <Products />}
        {tab === 'transactions' && <Transactions />}
        {tab === 'analytics' && <Analytics />}
        {tab === 'profile' && <Profile user={user} onLogout={handleLogout} />}
      </main>
    </div>
  )
}
