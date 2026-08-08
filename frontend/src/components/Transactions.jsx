import { useState } from 'react'
import { api, errorText, formatMoney } from '../api'
import { CacheStatus, Fab, Field, LoadingState, OfflineState } from './ui'
import { useToast } from './Toast'
import { useRefresh } from './PullToRefresh'
import useCachedData from '../useCachedData'
import Sheet from './Sheet'
import SelectField from './Select'

const PAYMENT_TYPES = [
  ['cash', 'Cash'],
  ['esewa', 'eSewa'],
  ['khalti', 'Khalti'],
  ['card', 'Card'],
  ['bank', 'Bank Transfer'],
]

const TYPES = [
  { id: 'sale', label: 'Sale' },
  { id: 'return', label: 'Return' },
  { id: 'restock', label: 'Restock' },
]

const TYPE_LABELS = { sale: 'Sale', return: 'Return', restock: 'Restock' }

const emptyForm = {
  product: '',
  quantity: '',
  payment_type: 'cash',
  unit_cost_price: '',
  unit_selling_price: '',
}

const icons = {
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  trendUp: (
    <>
      <path d="m22 7-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </>
  ),
  trendDown: (
    <>
      <path d="m22 17-8.5-8.5-5 5L2 7" />
      <path d="M16 17h6v-6" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </>
  ),
  receipt: (
    <>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
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

const payLabel = (v) => {
  const found = PAYMENT_TYPES.find(([key]) => key === v)
  return found ? found[1] : v
}

const num = (v) => Number(v) || 0

function fmtDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date}, ${time}`
}

export default function Transactions() {
  const txn = useCachedData(api.listTransactions, 'transactions:list')
  const prod = useCachedData(api.listProducts, 'products:list')
  const transactions = txn.data
  const products = prod.data
  const loading = txn.loading || prod.loading
  const offline = txn.offline || prod.offline
  const [recordType, setRecordType] = useState('sale')
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [recordOpen, setRecordOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const toast = useToast()

  useRefresh(() => Promise.all([txn.reload(), prod.reload()]))

  const productById = (id) => products.find((p) => String(p.id) === String(id))

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const openRecord = (type = 'sale') => {
    setEditing(null)
    setRecordType(type)
    setForm(emptyForm)
    setRecordOpen(true)
  }

  const openEdit = (t) => {
    setEditing(t)
    setRecordType(t.transaction_type)
    setForm({
      product: t.product,
      quantity: t.quantity,
      payment_type: t.payment_type,
      unit_cost_price: t.unit_cost_price ?? '',
      unit_selling_price: t.unit_selling_price ?? '',
    })
    setRecordOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.product) {
      toast.error('Select a product')
      return
    }
    setBusy(true)

    let res
    if (editing) {
      const payload = {
        product: Number(form.product),
        transaction_type: recordType,
        quantity: Number(form.quantity),
        payment_type: form.payment_type,
      }
      if (recordType === 'restock') {
        if (form.unit_cost_price !== '') payload.unit_cost_price = Number(form.unit_cost_price)
        if (form.unit_selling_price !== '') payload.unit_selling_price = Number(form.unit_selling_price)
      }
      res = await api.updateTransaction(editing.id, payload)
    } else if (recordType === 'restock') {
      const payload = {
        quantity: Number(form.quantity),
        payment_type: form.payment_type,
      }
      if (form.unit_cost_price !== '') payload.unit_cost_price = Number(form.unit_cost_price)
      if (form.unit_selling_price !== '') payload.unit_selling_price = Number(form.unit_selling_price)
      res = await api.restock(form.product, payload)
    } else {
      res = await api.createTransaction({
        product: Number(form.product),
        transaction_type: recordType,
        quantity: Number(form.quantity),
        payment_type: form.payment_type,
      })
    }

    if (res.ok) {
      toast.success(
        res.data?.msg || (editing ? 'Transaction updated' : recordType === 'restock' ? 'Stock restocked' : 'Transaction recorded')
      )
      setForm(emptyForm)
      setEditing(null)
      setRecordOpen(false)
      await Promise.all([txn.reload(), prod.reload()])
    } else {
      toast.error(errorText(res.data, 'Failed to save transaction'))
    }
    setBusy(false)
  }

  const isRestock = recordType === 'restock'

  const rowMeta = (t) => {
    if (t.transaction_type === 'restock') {
      return { icon: 'refresh', tone: 'primary', amount: formatMoney(num(t.unit_cost_price) * num(t.quantity)), qty: `+${t.quantity}` }
    }
    if (t.transaction_type === 'return') {
      return { icon: 'trendDown', tone: 'warning', amount: formatMoney(num(t.unit_selling_price) * num(t.quantity)), qty: `−${t.quantity}` }
    }
    return { icon: 'trendUp', tone: 'success', amount: formatMoney(num(t.unit_selling_price) * num(t.quantity)), qty: `+${t.quantity}` }
  }

  return (
    <section>
      <CacheStatus
        stale={txn.stale || prod.stale}
        updating={txn.updating || prod.updating}
        offline={offline}
        authError={txn.authError || prod.authError}
        cachedAt={txn.cachedAt || prod.cachedAt}
      />
      <div className="chips" aria-label="Record a transaction">
        {TYPES.map((t) => (
          <button key={t.id} className="chip" onClick={() => openRecord(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading transactions…" />
      ) : offline && transactions.length === 0 ? (
        <OfflineState onRetry={() => Promise.all([txn.reload(), prod.reload()])} />
      ) : txn.error && transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon name="receipt" /></div>
          <p className="muted">{txn.authError ? 'Session expired — please log in again.' : errorText(txn.error.data, 'Failed to load transactions')}</p>
          <button className="btn btn-ghost" onClick={() => Promise.all([txn.reload(), prod.reload()])}>Retry</button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon name="receipt" /></div>
          <div className="empty-title">No transactions yet</div>
          <p className="muted">Record your first sale, return or restock.</p>
          <button className="btn btn-primary" onClick={() => openRecord('sale')}>Record transaction</button>
        </div>
      ) : (
        <>
          <h2 className="muted" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            History
          </h2>
          <div className="list">
            {transactions.map((t) => {
              const meta = rowMeta(t)
              return (
                <button key={t.id} className="list-row" onClick={() => openEdit(t)}>
                  <span className={`list-icon ${meta.tone}`}><Icon name={meta.icon} /></span>
                  <span className="list-main">
                    <span className="list-title">{productById(t.product)?.name || `Product #${t.product}`}</span>
                    <span className="list-sub">{TYPE_LABELS[t.transaction_type]} · {payLabel(t.payment_type)} · {fmtDate(t.created_at)}</span>
                  </span>
                  <span className="list-right">
                    <span className="list-value">{meta.qty}</span>
                    <span className="list-sub">{meta.amount}</span>
                  </span>
                  <Icon name="chevron" className="list-chevron" />
                </button>
              )
            })}
          </div>
        </>
      )}

      {transactions.length > 0 && (
        <Fab aria-label="Record transaction" onClick={() => openRecord('sale')}>
          <Icon name="plus" />
        </Fab>
      )}

      <Sheet open={recordOpen} onClose={() => { setEditing(null); setRecordOpen(false) }} title={editing ? 'Edit transaction' : 'Record transaction'}>
        <div className="seg" style={{ marginBottom: 16 }}>
          {TYPES.map((t) => (
            <button
              key={t.id}
              className={recordType === t.id ? 'active' : ''}
              onClick={() => setRecordType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <SelectField
            label="Product"
            value={form.product}
            onChange={(v) => setForm((f) => ({ ...f, product: v }))}
            options={products.map((p) => ({ value: p.id, label: `${p.name} (stock: ${p.stock})` }))}
            placeholder="Select product…"
          />
          <div className="grid-2">
            <Field label="Quantity">
              <input type="number" min="1" value={form.quantity} onChange={set('quantity')} required />
            </Field>
            <SelectField
              label="Payment"
              value={form.payment_type}
              onChange={(v) => setForm((f) => ({ ...f, payment_type: v }))}
              options={PAYMENT_TYPES.map(([v, l]) => ({ value: v, label: l }))}
              placeholder="Select payment…"
            />
          </div>
          {isRestock && (
            <div className="grid-2">
              <Field label="Unit cost">
                <input type="number" step="0.01" min="0" value={form.unit_cost_price} onChange={set('unit_cost_price')} placeholder="Optional" />
              </Field>
              <Field label="Unit selling">
                <input type="number" step="0.01" min="0" value={form.unit_selling_price} onChange={set('unit_selling_price')} placeholder="Optional" />
              </Field>
            </div>
          )}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : isRestock ? 'Restock' : recordType === 'return' ? 'Record return' : 'Record sale'}
          </button>
        </form>
      </Sheet>
    </section>
  )
}
