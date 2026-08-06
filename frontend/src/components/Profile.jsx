import { useEffect, useState } from 'react'
import { exportData, getBaseUrl, setBaseUrl } from '../api'
import { getSettings, setSetting, subscribeSettings } from '../settings'
import { Field, Message } from './ui'
import Sheet, { ConfirmSheet } from './Sheet'
import { PickerList } from './Select'

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
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5a2.5 2.5 0 0 0-2.5-1.5c-1.66 0-3 1.12-3 2.5s1.34 2.5 3 2.5 3 1.12 3 2.5-1.34 2.5-3 2.5a2.5 2.5 0 0 1-2.5-1.5" />
      <path d="M12 6v12" />
    </>
  ),
  store: (
    <>
      <path d="M3 9 4.5 3h15L21 9" />
      <path d="M3 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
      <path d="M5 11v9h14v-9" />
      <path d="M9 20v-5h6v5" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
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

const CURRENCIES = [
  { value: 'Rs.', label: 'Rs. — Nepali Rupees' },
  { value: 'NPR', label: 'NPR — Nepalese Rupee' },
  { value: '$', label: '$ — US Dollar' },
  { value: '€', label: '€ — Euro' },
  { value: '', label: 'None — no symbol' },
]

const THEME_OPTIONS = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
]

const THEME_LABELS = { light: 'Light', dark: 'Dark', system: 'Follow device' }

const groupHeading = {
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 10,
  marginTop: 4,
}

export default function Profile({ user, onLogout }) {
  const [settings, setSettings] = useState(getSettings)
  const [server, setServer] = useState(getBaseUrl())
  const [shopName, setShopName] = useState(settings.shop_name)
  const [serverSheet, setServerSheet] = useState(false)
  const [appearanceSheet, setAppearanceSheet] = useState(false)
  const [currencySheet, setCurrencySheet] = useState(false)
  const [shopSheet, setShopSheet] = useState(false)
  const [exportSheet, setExportSheet] = useState(false)
  const [aboutSheet, setAboutSheet] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [exported, setExported] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => subscribeSettings(() => setSettings(getSettings())), [])

  const saveServer = (e) => {
    e.preventDefault()
    setBaseUrl(server)
    setMsg({ type: 'success', text: 'Saved. It applies on the next API call.' })
    setServerSheet(false)
  }

  const saveShopName = (e) => {
    e.preventDefault()
    setSetting('shop_name', shopName.trim())
    setMsg({ type: 'success', text: 'Shop name saved' })
    setShopSheet(false)
  }

  const runExport = async () => {
    setExporting(true)
    setMsg(null)
    try {
      const data = await exportData()
      setExported(data)
      setExportSheet(true)
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
    setExporting(false)
  }

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exported, null, 2))
      setMsg({ type: 'success', text: 'Copied to clipboard' })
      setExportSheet(false)
    } catch {
      setMsg({ type: 'error', text: 'Copy failed. Long-press the text below instead.' })
    }
  }

  return (
    <section>
      <Message type={msg?.type}>{msg?.text}</Message>

      <div className="card">
        <div className="profile-hero">
          <span className="avatar-lg">{user.username?.[0]?.toUpperCase()}</span>
          <div>
            <h2>{settings.shop_name || user.username}</h2>
            <p className="muted">{settings.shop_name ? user.username : user.email}</p>
          </div>
        </div>
      </div>

      <h2 className="muted" style={groupHeading}>Personalization</h2>
      <div className="settings-list">
        <button className="settings-row" onClick={() => setAppearanceSheet(true)}>
          <span className="list-icon primary"><Icon name="sun" /></span>
          <span className="settings-main">
            <span className="settings-title">Appearance</span>
            <span className="settings-sub">{THEME_LABELS[settings.theme] || 'Follow device'}</span>
          </span>
          <Icon name="chevron" className="list-chevron" />
        </button>
        <button className="settings-row" onClick={() => setCurrencySheet(true)}>
          <span className="list-icon primary"><Icon name="coin" /></span>
          <span className="settings-main">
            <span className="settings-title">Currency</span>
            <span className="settings-sub">{settings.currency || 'No symbol'}</span>
          </span>
          <Icon name="chevron" className="list-chevron" />
        </button>
        <button className="settings-row" onClick={() => setShopSheet(true)}>
          <span className="list-icon primary"><Icon name="store" /></span>
          <span className="settings-main">
            <span className="settings-title">Shop name</span>
            <span className="settings-sub">{settings.shop_name || 'Not set'}</span>
          </span>
          <Icon name="chevron" className="list-chevron" />
        </button>
      </div>

      <h2 className="muted" style={groupHeading}>Connection & tools</h2>
      <div className="settings-list">
        <button className="settings-row" onClick={() => setServerSheet(true)}>
          <span className="list-icon primary"><Icon name="globe" /></span>
          <span className="settings-main">
            <span className="settings-title">Server address</span>
            <span className="settings-sub">{getBaseUrl()}</span>
          </span>
          <Icon name="chevron" className="list-chevron" />
        </button>
        <button className="settings-row" onClick={runExport} disabled={exporting}>
          <span className="list-icon primary"><Icon name="download" /></span>
          <span className="settings-main">
            <span className="settings-title">{exporting ? 'Exporting…' : 'Export data'}</span>
            <span className="settings-sub">Copy products & transactions as JSON</span>
          </span>
          <Icon name="chevron" className="list-chevron" />
        </button>
        <button className="settings-row" onClick={() => setAboutSheet(true)}>
          <span className="list-icon primary"><Icon name="info" /></span>
          <span className="settings-main">
            <span className="settings-title">About</span>
            <span className="settings-sub">Sales Record v0.1.0</span>
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

      <Sheet open={appearanceSheet} onClose={() => setAppearanceSheet(false)} title="Appearance">
        <p className="sheet-note">Choose how the app looks. System follows your device settings.</p>
        <div className="seg">
          {THEME_OPTIONS.map((o) => (
            <button
              key={o.id}
              className={settings.theme === o.id ? 'active' : ''}
              onClick={() => setSetting('theme', o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={currencySheet} onClose={() => setCurrencySheet(false)} title="Currency">
        <p className="sheet-note">Shown next to prices across the app.</p>
        <PickerList
          options={CURRENCIES}
          value={settings.currency}
          onSelect={(v) => {
            setSetting('currency', v)
            setCurrencySheet(false)
          }}
        />
      </Sheet>

      <Sheet open={shopSheet} onClose={() => setShopSheet(false)} title="Shop name">
        <p className="sheet-note">Shown in the top bar and on your account card.</p>
        <form className="form" onSubmit={saveShopName}>
          <Field label="Shop name">
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Himalaya Stores"
              maxLength={40}
            />
          </Field>
          <button className="btn btn-primary btn-block" type="submit">Save</button>
        </form>
      </Sheet>

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

      <Sheet open={exportSheet} onClose={() => setExportSheet(false)} title="Exported data">
        <p className="sheet-note">
          {exported?.products?.length || 0} products · {exported?.transactions?.length || 0} transactions.
        </p>
        <pre className="export-block">{JSON.stringify(exported, null, 2)}</pre>
        <div className="sheet-actions">
          <button className="btn btn-ghost" onClick={() => setExportSheet(false)}>Close</button>
          <button className="btn btn-primary" onClick={copyExport}>Copy JSON</button>
        </div>
      </Sheet>

      <Sheet open={aboutSheet} onClose={() => setAboutSheet(false)} title="About">
        <p className="sheet-note">
          <strong>Sales Record</strong> — a lightweight POS &amp; inventory tracker for Android.
          Keeps your products, sales, returns, restocks and analytics in sync with your own
          Django backend. Version 0.1.0.
        </p>
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
