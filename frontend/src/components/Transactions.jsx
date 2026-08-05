import { useEffect, useState } from 'react'
import { api, errorText, formatMoney } from '../api'
import { Field, Message, Spinner } from './ui'

const PAYMENT_TYPES = [
  ['cash', 'Cash'],
  ['esewa', 'eSewa'],
  ['khalti', 'Khalti'],
  ['card', 'Card'],
  ['bank', 'Bank Transfer'],
]

const emptyCreate = { product: '', transaction_type: 'sale', quantity: '', payment_type: 'cash' }
const emptyRestock = { product: '', quantity: '', payment_type: 'cash', unit_cost_price: '', unit_selling_price: '' }

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [restockForm, setRestockForm] = useState(emptyRestock)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = async () => {
    setLoading(true)
    const [tRes, pRes] = await Promise.all([api.listTransactions(), api.listProducts()])
    if (tRes.ok) setTransactions(tRes.data || [])
    else setMsg({ type: 'error', text: errorText(tRes.data, 'Failed to load transactions') })
    if (pRes.ok) setProducts(pRes.data || [])
    else setMsg({ type: 'error', text: errorText(pRes.data, 'Failed to load products') })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const productById = (id) => products.find((p) => String(p.id) === String(id))

  const setCreate = (key) => (e) => setCreateForm((f) => ({ ...f, [key]: e.target.value }))
  const setRestock = (key) => (e) => setRestockForm((f) => ({ ...f, [key]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createForm.product) {
      setMsg({ type: 'error', text: 'Select a product' })
      return
    }
    setBusy(true)
    setMsg(null)
    const res = await api.createTransaction({
      ...createForm,
      product: Number(createForm.product),
      quantity: Number(createForm.quantity),
    })
    if (res.ok) {
      setMsg({ type: 'success', text: res.data?.msg || 'Transaction recorded' })
      setCreateForm(emptyCreate)
      await load()
    } else {
      setMsg({ type: 'error', text: errorText(res.data, 'Failed to create transaction') })
    }
    setBusy(false)
  }

  const handleRestock = async (e) => {
    e.preventDefault()
    if (!restockForm.product) {
      setMsg({ type: 'error', text: 'Select a product' })
      return
    }
    setBusy(true)
    setMsg(null)
    const res = await api.restock(restockForm.product, {
      quantity: Number(restockForm.quantity),
      payment_type: restockForm.payment_type,
      unit_cost_price: Number(restockForm.unit_cost_price),
      unit_selling_price: Number(restockForm.unit_selling_price),
    })
    if (res.ok) {
      setMsg({ type: 'success', text: res.data?.msg || 'Stock restocked' })
      setRestockForm(emptyRestock)
      await load()
    } else {
      setMsg({ type: 'error', text: errorText(res.data, 'Failed to restock') })
    }
    setBusy(false)
  }

  const typeLabel = (t) => {
    const labels = { sale: 'Sale', return: 'Return', restock: 'Restock' }
    return labels[t] || t
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Transactions</h1>
          <p className="muted">Record sales, returns and restocks</p>
        </div>
      </div>

      <Message type={msg?.type}>{msg?.text}</Message>

      <div className="grid-2">
        <div className="card">
          <h2>New sale / return</h2>
          <form className="form" onSubmit={handleCreate}>
            <Field label="Product">
              <select value={createForm.product} onChange={setCreate('product')} required>
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>
                ))}
              </select>
            </Field>
            <div className="grid-2">
              <Field label="Type">
                <select value={createForm.transaction_type} onChange={setCreate('transaction_type')}>
                  <option value="sale">Sale</option>
                  <option value="return">Return</option>
                </select>
              </Field>
              <Field label="Quantity">
                <input type="number" min="1" value={createForm.quantity} onChange={setCreate('quantity')} required />
              </Field>
            </div>
            <Field label="Payment">
              <select value={createForm.payment_type} onChange={setCreate('payment_type')}>
                {PAYMENT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Record transaction'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Restock</h2>
          <form className="form" onSubmit={handleRestock}>
            <Field label="Product">
              <select value={restockForm.product} onChange={setRestock('product')} required>
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>
                ))}
              </select>
            </Field>
            <div className="grid-2">
              <Field label="Quantity">
                <input type="number" min="1" value={restockForm.quantity} onChange={setRestock('quantity')} required />
              </Field>
              <Field label="Payment">
                <select value={restockForm.payment_type} onChange={setRestock('payment_type')}>
                  {PAYMENT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid-2">
              <Field label="Unit cost">
                <input type="number" step="0.01" min="0" value={restockForm.unit_cost_price} onChange={setRestock('unit_cost_price')} required />
              </Field>
              <Field label="Unit selling">
                <input type="number" step="0.01" min="0" value={restockForm.unit_selling_price} onChange={setRestock('unit_selling_price')} required />
              </Field>
            </div>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Restocking…' : 'Restock'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2>History</h2>
        {loading ? (
          <Spinner />
        ) : msg?.type === 'error' && transactions.length === 0 ? (
          <div className="empty-state">
            <p className="muted">{msg.text}</p>
            <button className="btn btn-ghost" onClick={load}>Retry</button>
          </div>
        ) : transactions.length === 0 ? (
          <p className="muted">No transactions yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th className="num">Qty</th>
                  <th>Payment</th>
                  <th className="num">Unit cost</th>
                  <th className="num">Unit selling</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="muted" data-label="ID">{t.id}</td>
                    <td className="strong" data-label="Product">{productById(t.product)?.name || `Product #${t.product}`}</td>
                    <td data-label="Type"><span className={`badge badge-${t.transaction_type}`}>{typeLabel(t.transaction_type)}</span></td>
                    <td className="num" data-label="Qty">{t.quantity}</td>
                    <td data-label="Payment">{t.payment_type}</td>
                    <td className="num" data-label="Unit cost">{formatMoney(t.unit_cost_price)}</td>
                    <td className="num" data-label="Unit selling">{formatMoney(t.unit_selling_price)}</td>
                    <td className="muted" data-label="Date">{new Date(t.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
