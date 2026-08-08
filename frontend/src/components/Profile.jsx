import { useEffect, useState } from 'react'
import { exportData } from '../api'
import { getSettings, setSetting, subscribeSettings } from '../settings'
import { Field } from './ui'
import { useToast } from './Toast'
import Sheet, { ConfirmSheet } from './Sheet'
import { PickerList } from './Select'

const icons = {
  chevron: <path d="m9 18 6-6-6-6" />,
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
  font: (
    <>
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
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

const FONT_OPTIONS = [
  { id: 'sm', label: 'Small' },
  { id: 'md', label: 'Default' },
  { id: 'lg', label: 'Large' },
  { id: 'xl', label: 'Extra large' },
]

const FONT_LABELS = { sm: 'Small', md: 'Default', lg: 'Large', xl: 'Extra large' }

const groupHeading = {
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 10,
  marginTop: 4,
}

export default function Profile({ user, onLogout }) {
  const [settings, setSettings] = useState(getSettings)
  const [shopName, setShopName] = useState(settings.shop_name)
  const [appearanceSheet, setAppearanceSheet] = useState(false)
  const [fontSheet, setFontSheet] = useState(false)
  const [currencySheet, setCurrencySheet] = useState(false)
  const [shopSheet, setShopSheet] = useState(false)
  const [exportSheet, setExportSheet] = useState(false)
  const [aboutSheet, setAboutSheet] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [exported, setExported] = useState(null)
  const [exporting, setExporting] = useState(false)
  const toast = useToast()

  useEffect(() => subscribeSettings(() => setSettings(getSettings())), [])

  const saveShopName = (e) => {
    e.preventDefault()
    setSetting('shop_name', shopName.trim())
    toast.success('Shop name saved')
    setShopSheet(false)
  }

  const runExport = async () => {
    setExporting(true)
    try {
      const data = await exportData()
      setExported(data)
      setExportSheet(true)
    } catch (err) {
      toast.error(err.message)
    }
    setExporting(false)
  }

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exported, null, 2))
      toast.success('Copied to clipboard')
      setExportSheet(false)
    } catch {
      toast.error('Copy failed. Long-press the text below instead.')
    }
  }

  return (
    <section>
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
        <button className="settings-row" onClick={() => setFontSheet(true)}>
          <span className="list-icon primary"><Icon name="font" /></span>
          <span className="settings-main">
            <span className="settings-title">Font size</span>
            <span className="settings-sub">{FONT_LABELS[settings.font_size] || 'Default'}</span>
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

      <h2 className="muted" style={groupHeading}>Tools</h2>
      <div className="settings-list">
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
            <span className="settings-sub">SaralKitab v0.1.0</span>
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

      <Sheet open={fontSheet} onClose={() => setFontSheet(false)} title="Font size">
        <p className="sheet-note">Changes text and UI size across the whole app.</p>
        <div className="seg">
          {FONT_OPTIONS.map((o) => (
            <button
              key={o.id}
              className={settings.font_size === o.id ? 'active' : ''}
              onClick={() => setSetting('font_size', o.id)}
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
          <strong>SaralKitab</strong> — a lightweight POS &amp; inventory tracker for Android.
          Keeps your products, sales, returns, restocks and analytics in sync with your own
          Django backend. Version 0.1.0.
        </p>
      </Sheet>

      <ConfirmSheet
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={onLogout}
        title="Logout"
        message="Sign out of SaralKitab on this device?"
        confirmLabel="Logout"
      />
    </section>
  )
}
