import { useEffect, useMemo, useState } from 'react'
import { api, errorText, formatMoney } from '../api'
import { Field, Message, Spinner } from './ui'
import Sheet, { ConfirmSheet } from './Sheet'
import SelectField from './Select'

const emptyForm = {
  product_name: '',
  cost_price: '',
  selling_price: '',
  quantity: '',
  supplier_contact: '',
  category: '',
  payment_type: 'cash',
}

const PAYMENT_TYPES = [
  ['cash', 'Cash'],
  ['esewa', 'eSewa'],
  ['khalti', 'Khalti'],
  ['card', 'Card'],
  ['bank', 'Bank Transfer'],
]

const icons = {
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  box: (
    <>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>
  ),
  package: (
    <>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="M7.5 4.27l9 5.15" />
      <path d="M21 8 12 13 3 8" />
      <path d="M12 22V13" />
    </>
  ),
  edit: (
    <>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
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

function stockBadge(stock) {
  if (Number(stock) <= 0) return { cls: 'stock-out', label: 'Out of stock' }
  if (Number(stock) <= 5) return { cls: 'stock-low', label: `${stock} left` }
  return { cls: 'stock-ok', label: `${stock} in stock` }
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [actionProduct, setActionProduct] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState(null)

  const sheetOpen = Boolean(actionProduct)

  const load = async () => {
    setLoading(true)
    const res = await api.listProducts()
    if (res.ok) {
      setProducts(res.data || [])
      setMsg(null)
    } else {
      setProducts([])
      setMsg({ type: 'error', text: errorText(res.data, 'Failed to load products') })
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products]
  )

  const filtered = useMemo(() => {
    let list = products
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    if (category) list = list.filter((p) => p.category === category)
    return list
  }, [products, search, category])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setActionProduct({ mode: 'add' })
  }

  const openEdit = (p) => {
    setForm({
      product_name: p.name,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      quantity: p.stock,
      supplier_contact: p.supplier_phone ?? '',
      category: p.category || '',
    })
    setEditing(p)
    setActionProduct({ mode: 'edit', product: p })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    if (editing) {
      const res = await api.updateProduct(editing.id, {
        name: form.product_name,
        cost_price: Number(form.cost_price),
        selling_price: Number(form.selling_price),
        stock: Number(form.quantity),
        supplier_phone: form.supplier_contact,
        category: form.category,
      })
      if (res.ok) {
        setMsg({ type: 'success', text: res.data?.msg || 'Product updated' })
        setActionProduct(null)
        await load()
      } else {
        setMsg({ type: 'error', text: errorText(res.data, 'Failed to update product') })
      }
    } else {
      const res = await api.addProduct({
        ...form,
        cost_price: Number(form.cost_price),
        selling_price: Number(form.selling_price),
        quantity: Number(form.quantity),
      })
      if (res.ok) {
        setMsg({ type: 'success', text: res.data?.msg || 'Product added' })
        setForm(emptyForm)
        setActionProduct(null)
        await load()
      } else {
        setMsg({ type: 'error', text: errorText(res.data, 'Failed to add product') })
      }
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    setMsg(null)
    const res = await api.deleteProduct(confirmDelete.id)
    setDeleting(false)
    if (res.ok) {
      setMsg({ type: 'success', text: res.data?.msg || 'Product deleted' })
      setConfirmDelete(null)
      setActionProduct(null)
      await load()
    } else {
      setMsg({ type: 'error', text: errorText(res.data, 'Failed to delete product') })
      setConfirmDelete(null)
    }
  }

  const isFormSheet = actionProduct?.mode === 'add' || actionProduct?.mode === 'edit'

  return (
    <section>
      <Message type={msg?.type}>{msg?.text}</Message>

      <div className="search-row">
        <Icon name="search" className="search-icon" />
        <input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
        />
      </div>

      <div className="chips" role="tablist" aria-label="Filter by category">
        <button
          className={category === '' ? 'chip active' : 'chip'}
          onClick={() => setCategory('')}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={category === c ? 'chip active' : 'chip'}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : msg?.type === 'error' && products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon name="package" /></div>
          <p className="muted">{msg.text}</p>
          <button className="btn btn-ghost" onClick={load}>Retry</button>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon name="package" /></div>
          <div className="empty-title">No products yet</div>
          <p className="muted">Add your first product to start tracking inventory.</p>
          <button className="btn btn-primary" onClick={openAdd}>Add product</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon name="search" /></div>
          <p className="muted">No products match your search.</p>
          <button className="btn btn-ghost" onClick={() => { setSearch(''); setCategory('') }}>Clear filters</button>
        </div>
      ) : (
        <div className="list">
          {filtered.map((p) => {
            const badge = stockBadge(p.stock)
            return (
              <button
                key={p.id}
                className="list-row"
                onClick={() => setActionProduct({ mode: 'view', product: p })}
              >
                <span className="list-icon primary"><Icon name="box" /></span>
                <span className="list-main">
                  <span className="list-title">{p.name}</span>
                  <span className="list-sub">
                    Sell {formatMoney(p.selling_price)}
                    {p.category ? ` · ${p.category}` : ''}
                  </span>
                </span>
                <span className="list-right">
                  <span className={`stock-badge ${badge.cls}`}>{badge.label}</span>
                </span>
                <Icon name="chevron" className="list-chevron" />
              </button>
            )
          })}
        </div>
      )}

      {products.length > 0 && (
        <button className="fab" aria-label="Add product" onClick={openAdd}>
          <Icon name="plus" />
        </button>
      )}

      {isFormSheet && (
        <Sheet
          open={sheetOpen}
          onClose={() => setActionProduct(null)}
          title={editing ? 'Edit product' : 'Add product'}
        >
          <form className="form" onSubmit={handleSubmit}>
            <Field label="Product name">
              <input value={form.product_name} onChange={set('product_name')} required />
            </Field>
            <div className="grid-2">
              <Field label="Cost price">
                <input type="number" step="0.01" min="0" value={form.cost_price} onChange={set('cost_price')} required />
              </Field>
              <Field label="Selling price">
                <input type="number" step="0.01" min="0" value={form.selling_price} onChange={set('selling_price')} required />
              </Field>
            </div>
            <div className="grid-2">
              <Field label={editing ? 'Stock' : 'Quantity'}>
                <input type="number" min={editing ? 0 : 1} value={form.quantity} onChange={set('quantity')} required />
              </Field>
              <Field label="Supplier contact">
                <input value={form.supplier_contact} onChange={set('supplier_contact')} placeholder="Optional" />
              </Field>
            </div>
            <Field label="Category">
              <input value={form.category} onChange={set('category')} placeholder="e.g. electronics" required />
            </Field>
            {!editing && (
              <>
                <SelectField
                  label="Initial stock payment"
                  value={form.payment_type}
                  onChange={(v) => setForm((f) => ({ ...f, payment_type: v }))}
                  options={PAYMENT_TYPES.map(([value, label]) => ({ value, label }))}
                />
                <p className="field-hint">Initial stock is recorded as a restock transaction.</p>
              </>
            )}
            <button className="btn btn-primary btn-block" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
            </button>
          </form>
        </Sheet>
      )}

      {actionProduct?.mode === 'view' && (
        <Sheet
          open={sheetOpen}
          onClose={() => setActionProduct(null)}
          title={actionProduct.product.name}
        >
          <p className="sheet-note">
            {actionProduct.product.category ? `${actionProduct.product.category} · ` : ''}
            Sell {formatMoney(actionProduct.product.selling_price)} · Cost {formatMoney(actionProduct.product.cost_price)} · Stock {actionProduct.product.stock}
          </p>
          <div className="sheet-actions">
            <button className="btn btn-ghost" onClick={() => openEdit(actionProduct.product)}>
              Edit
            </button>
            <button className="btn btn-danger" onClick={() => setConfirmDelete(actionProduct.product)}>
              Delete
            </button>
          </div>
        </Sheet>
      )}

      <ConfirmSheet
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
        title="Delete product"
        message={`Delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </section>
  )
}
