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

const ICONS = {
  products: (
    <>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>
  ),
  transactions: (
    <>
      <path d="m7 8-4 4 4 4" />
      <path d="M3 12h14" />
      <path d="m17 8 4 4-4 4" />
      <path d="M21 12H7" />
    </>
  ),
  analytics: (
    <>
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </>
  ),
  profile: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
}

function TabIcon({ id }) {
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
      {ICONS[id]}
    </svg>
  )
}

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
          <div className="user-badge">
            <span className="avatar">{user.username?.[0]?.toUpperCase()}</span>
            <span className="user-name">{user.username}</span>
          </div>
        </div>
      </header>

      <main className="content">
        {tab === 'products' && <Products />}
        {tab === 'transactions' && <Transactions />}
        {tab === 'analytics' && <Analytics />}
        {tab === 'profile' && <Profile user={user} onLogout={handleLogout} />}
      </main>

      <nav className="tabbar" aria-label="Primary">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'tabbar-item active' : 'tabbar-item'}
            onClick={() => setTab(t.id)}
          >
            <span className="tabbar-icon"><TabIcon id={t.id} /></span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
