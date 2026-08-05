import { useEffect, useMemo, useState } from 'react'
import { api, errorText, formatMoney } from '../api'
import { Field, Message, Spinner } from './ui'

const emptyForm = {
  product_name: '',
  cost_price: '',
  selling_price: '',
  quantity: '',
  supplier_contact: '',
  category: '',
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [msg, setMsg] = useState(null)

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

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    const res = await api.addProduct({
      ...form,
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      quantity: Number(form.quantity),
    })
    if (res.ok) {
      setMsg({ type: 'success', text: res.data?.msg || 'Product added' })
      setForm(emptyForm)
      await load()
    } else {
      setMsg({ type: 'error', text: errorText(res.data, 'Failed to add product') })
    }
    setSaving(false)
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setEditForm({
      name: p.name,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      stock: p.stock,
      supplier_phone: p.supplier_phone,
      category: p.category,
    })
  }

  const handleSaveEdit = async (id) => {
    setMsg(null)
    const res = await api.updateProduct(id, {
      ...editForm,
      cost_price: Number(editForm.cost_price),
      selling_price: Number(editForm.selling_price),
      stock: Number(editForm.stock),
    })
    if (res.ok) {
      setMsg({ type: 'success', text: res.data?.msg || 'Product updated' })
      setEditingId(null)
      await load()
    } else {
      setMsg({ type: 'error', text: errorText(res.data, 'Failed to update product') })
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    setMsg(null)
    const res = await api.deleteProduct(id)
    if (res.ok) {
      setMsg({ type: 'success', text: res.data?.msg || 'Product deleted' })
      await load()
    } else {
      setMsg({ type: 'error', text: errorText(res.data, 'Failed to delete product') })
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Products</h1>
          <p className="muted">Manage your inventory</p>
        </div>
      </div>

      <Message type={msg?.type}>{msg?.text}</Message>

      <div className="grid-2">
        <div className="card">
          <h2>Add product</h2>
          <form className="form" onSubmit={handleAdd}>
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
              <Field label="Quantity">
                <input type="number" min="1" value={form.quantity} onChange={set('quantity')} required />
              </Field>
              <Field label="Supplier contact">
                <input value={form.supplier_contact} onChange={set('supplier_contact')} required />
              </Field>
            </div>
            <Field label="Category">
              <input value={form.category} onChange={set('category')} placeholder="e.g. electronics" required />
            </Field>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding…' : 'Add product'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Inventory</h2>
          <div className="filters">
            <input
              className="input"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <Spinner />
          ) : msg?.type === 'error' ? (
            <div className="empty-state">
              <p className="muted">{msg.text}</p>
              <button className="btn btn-ghost" onClick={load}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="muted">No products found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th className="num">Cost</th>
                    <th className="num">Selling</th>
                    <th className="num">Stock</th>
                    <th>Supplier</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) =>
                    editingId === p.id ? (
                      <tr key={p.id} className="editing">
                        <td><input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                        <td><input className="input" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} /></td>
                        <td><input className="input" type="number" step="0.01" min="0" value={editForm.cost_price} onChange={(e) => setEditForm({ ...editForm, cost_price: e.target.value })} /></td>
                        <td><input className="input" type="number" step="0.01" min="0" value={editForm.selling_price} onChange={(e) => setEditForm({ ...editForm, selling_price: e.target.value })} /></td>
                        <td><input className="input" type="number" min="0" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} /></td>
                        <td><input className="input" value={editForm.supplier_phone} onChange={(e) => setEditForm({ ...editForm, supplier_phone: e.target.value })} /></td>
                        <td className="row-actions">
                          <button className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(p.id)}>Save</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={p.id}>
                        <td className="strong">{p.name}</td>
                        <td><span className="badge">{p.category}</span></td>
                        <td className="num">{formatMoney(p.cost_price)}</td>
                        <td className="num">{formatMoney(p.selling_price)}</td>
                        <td className="num">
                          <span className={Number(p.stock) === 0 ? 'stock-out' : 'stock'}>{p.stock}</span>
                        </td>
                        <td>{p.supplier_phone}</td>
                        <td className="row-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.name)}>Delete</button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
