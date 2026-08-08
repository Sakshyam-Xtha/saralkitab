import { useEffect, useMemo, useState } from 'react'
import { api, formatMoney } from '../api'
import { CacheStatus, LoadingState, OfflineState } from './ui'
import { useRefresh } from './PullToRefresh'
import useCachedData from '../useCachedData'

const PERIODS = [
  { id: 'all', label: 'All', days: null },
  { id: '7', label: '7d', days: 7 },
  { id: '30', label: '30d', days: 30 },
  { id: '90', label: '90d', days: 90 },
]

const PAYMENT_LABELS = {
  cash: 'Cash',
  esewa: 'eSewa',
  khalti: 'Khalti',
  card: 'Card',
  bank: 'Bank transfer',
}

const num = (v) => Number(v) || 0

function localKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function tinyMoney(n) {
  if (!Number.isFinite(n)) return '0'
  const abs = Math.abs(n)
  if (abs >= 100000) return `${(n / 1000).toFixed(0)}k`
  if (abs >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${Math.round(n)}`
}

function buildDaily(items, getValue, days = 14) {
  const map = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    map[localKey(d)] = { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: 0 }
  }
  items.forEach((t) => {
    const k = localKey(new Date(t.created_at))
    if (map[k]) map[k].value += getValue(t)
  })
  return Object.values(map)
}

function Kpi({ label, value, sub }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub ? <div className="kpi-sub">{sub}</div> : null}
    </div>
  )
}

function VBarChart({ data, format = tinyMoney, accent }) {
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)), 1)
  return (
    <div className="vbar-chart">
      {data.map((d, i) => {
        const negative = d.value < 0
        return (
          <div className="vbar-col" key={i}>
            <div className="vbar-value">{format(d.value)}</div>
            <div className={`vbar-track${negative ? ' vbar-track-neg' : ''}`}>
              <div
                className={`vbar-fill${negative ? ' vbar-fill-neg' : accent ? ` vbar-fill-${accent}` : ''}`}
                style={{ height: `${(Math.abs(d.value) / maxAbs) * 100}%` }}
                title={`${d.label}: ${formatMoney(d.value)}`}
              />
            </div>
            <div className="vbar-label">{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}

function HBarList({ data, format = (v) => v }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="hbar-list">
      {data.map((d, i) => (
        <div className="hbar-row" key={i}>
          <span className="hbar-label">{d.label}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="hbar-value">{format(d.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const prod = useCachedData(api.listProducts, 'products:list')
  const txn = useCachedData(api.listTransactions, 'transactions:list')
  const products = prod.data
  const transactions = txn.data
  const loading = prod.loading || txn.loading
  const offline = prod.offline || txn.offline
  const [periodId, setPeriodId] = useState('all')
  const [barDays, setBarDays] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches ? 7 : 14
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const onChange = () => setBarDays(mq.matches ? 7 : 14)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useRefresh(() => Promise.all([prod.reload(), txn.reload()]))

  const period = PERIODS.find((p) => p.id === periodId)

  const stats = useMemo(() => {
    const days = period.days
    const inRange = (t) => (days ? new Date(t.created_at).getTime() >= Date.now() - days * 86400000 : true)

    const sales = transactions.filter((t) => t.transaction_type === 'sale' && inRange(t))
    const returns = transactions.filter((t) => t.transaction_type === 'return' && inRange(t))
    const restocks = transactions.filter((t) => t.transaction_type === 'restock' && inRange(t))

    const salesRevenue = sales.reduce((a, t) => a + num(t.unit_selling_price) * num(t.quantity), 0)
    const salesCogs = sales.reduce((a, t) => a + num(t.unit_cost_price) * num(t.quantity), 0)
    const returnsRevenue = returns.reduce((a, t) => a + num(t.unit_selling_price) * num(t.quantity), 0)
    const returnsCogs = returns.reduce((a, t) => a + num(t.unit_cost_price) * num(t.quantity), 0)
    const revenue = salesRevenue - returnsRevenue
    const cogs = salesCogs - returnsCogs
    const profit = revenue - cogs
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0
    const unitsSold = sales.reduce((a, t) => a + num(t.quantity), 0)
    const avgOrder = sales.length ? revenue / sales.length : 0

    const restockUnits = restocks.reduce((a, t) => a + num(t.quantity), 0)
    const restockSpend = restocks.reduce((a, t) => a + num(t.unit_cost_price) * num(t.quantity), 0)
    const returnUnits = returns.reduce((a, t) => a + num(t.quantity), 0)
    const returnsValue = returns.reduce((a, t) => a + num(t.unit_selling_price) * num(t.quantity), 0)
    const netStockChange = restockUnits + returnUnits - unitsSold

    const paymentMap = {}
    sales.forEach((t) => {
      paymentMap[t.payment_type] = (paymentMap[t.payment_type] || 0) + num(t.unit_selling_price) * num(t.quantity)
    })
    const paymentData = Object.entries(paymentMap)
      .map(([label, value]) => ({ label: PAYMENT_LABELS[label] || label, value }))
      .sort((a, b) => b.value - a.value)

    const restockPaymentMap = {}
    restocks.forEach((t) => {
      restockPaymentMap[t.payment_type] = (restockPaymentMap[t.payment_type] || 0) + num(t.unit_cost_price) * num(t.quantity)
    })
    const restockPaymentData = Object.entries(restockPaymentMap)
      .map(([label, value]) => ({ label: PAYMENT_LABELS[label] || label, value }))
      .sort((a, b) => b.value - a.value)

    const dailyEntries = [
      ...sales.map((t) => ({ created_at: t.created_at, value: num(t.unit_selling_price) * num(t.quantity) })),
      ...returns.map((t) => ({ created_at: t.created_at, value: -num(t.unit_selling_price) * num(t.quantity) })),
    ]
    const dailyData = buildDaily(dailyEntries, (e) => e.value, barDays)
    const dailyRestockData = buildDaily(restocks, (t) => num(t.unit_cost_price) * num(t.quantity), barDays)

    const productMap = new Map(products.map((p) => [p.id, p.name]))
    const salesByProduct = {}
    sales.forEach((t) => {
      salesByProduct[t.product] = salesByProduct[t.product] || { qty: 0, revenue: 0 }
      salesByProduct[t.product].qty += num(t.quantity)
      salesByProduct[t.product].revenue += num(t.unit_selling_price) * num(t.quantity)
    })
    const topProducts = Object.entries(salesByProduct)
      .map(([id, v]) => ({ id: Number(id), name: productMap.get(Number(id)) || `Product #${id}`, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const catByProduct = new Map(products.map((p) => [p.id, p.category]))
    const catRevenue = {}
    sales.forEach((t) => {
      const c = catByProduct.get(t.product) || 'uncategorised'
      catRevenue[c] = (catRevenue[c] || 0) + num(t.unit_selling_price) * num(t.quantity)
    })
    const categoryData = Object.entries(catRevenue)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)

    return {
      revenue,
      profit,
      margin,
      unitsSold,
      avgOrder,
      saleCount: sales.length,
      returnCount: returns.length,
      restockCount: restocks.length,
      restockUnits,
      restockSpend,
      returnUnits,
      returnsValue,
      netStockChange,
      paymentData,
      restockPaymentData,
      dailyData,
      dailyRestockData,
      topProducts,
      categoryData,
    }
  }, [transactions, products, period, barDays])

  const inventory = useMemo(() => {
    const totalUnits = products.reduce((a, p) => a + num(p.stock), 0)
    const costValue = products.reduce((a, p) => a + num(p.stock) * num(p.cost_price), 0)
    const retailValue = products.reduce((a, p) => a + num(p.stock) * num(p.selling_price), 0)
    const lowStock = products.filter((p) => num(p.stock) <= 5).sort((a, b) => num(a.stock) - num(b.stock))
    return { totalUnits, costValue, retailValue, lowStock }
  }, [products])

  return (
    <section>
      <CacheStatus
        stale={prod.stale || txn.stale}
        updating={prod.updating || txn.updating}
        offline={offline}
        authError={prod.authError || txn.authError}
        cachedAt={prod.cachedAt || txn.cachedAt}
      />
      <div className="seg period-seg" aria-label="Period">
        {PERIODS.map((p) => (
          <button key={p.id} className={periodId === p.id ? 'active' : ''} onClick={() => setPeriodId(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading analytics…" />
      ) : offline && transactions.length === 0 && products.length === 0 ? (
        <OfflineState onRetry={() => Promise.all([prod.reload(), txn.reload()])} />
      ) : (
        <>
          <div className="kpi-grid">
            <Kpi label="Revenue" value={formatMoney(stats.revenue)} sub={`${stats.saleCount} sales · ${stats.returnCount} returns`} />
            <Kpi label="Gross profit" value={formatMoney(stats.profit)} sub="net of returns" />
            <Kpi label="Margin" value={`${stats.margin.toFixed(1)}%`} sub={`Avg order ${formatMoney(stats.avgOrder)}`} />
            <Kpi label="Units sold" value={stats.unitsSold} sub={`${stats.restockCount} restocks`} />
          </div>

          <div className="kpi-grid">
            <Kpi label="Units bought" value={stats.restockUnits} sub="restocked" />
            <Kpi label="Stock spend" value={formatMoney(stats.restockSpend)} sub="restock cost" />
            <Kpi label="Net stock change" value={stats.netStockChange} sub="restocked + returned − sold" />
            <Kpi label="Returns" value={stats.returnUnits} sub={formatMoney(stats.returnsValue)} />
          </div>

          <div className="card">
            <h2>Revenue — last {barDays} days</h2>
            <VBarChart data={stats.dailyData} />
          </div>

          <div className="card">
            <h2>Restock spend — last {barDays} days</h2>
            <VBarChart data={stats.dailyRestockData} accent="alt" />
          </div>

          <div className="card">
            <h2>Sales by payment</h2>
            {stats.paymentData.length ? (
              <HBarList data={stats.paymentData} format={(v) => formatMoney(v)} />
            ) : (
              <p className="muted">No sales in this period.</p>
            )}
          </div>

          <div className="card">
            <h2>Restocks by payment</h2>
            {stats.restockPaymentData.length ? (
              <HBarList data={stats.restockPaymentData} format={(v) => formatMoney(v)} />
            ) : (
              <p className="muted">No restocks in this period.</p>
            )}
          </div>

          <div className="card">
            <h2>Top products</h2>
            {stats.topProducts.length ? (
              <div className="list">
                {stats.topProducts.map((p) => (
                  <div key={p.id} className="list-row">
                    <span className="list-main">
                      <span className="list-title">{p.name}</span>
                      <span className="list-sub">{p.qty} sold</span>
                    </span>
                    <span className="list-value">{formatMoney(p.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No sales in this period.</p>
            )}
          </div>

          <div className="card">
            <h2>Revenue by category</h2>
            {stats.categoryData.length ? (
              <HBarList data={stats.categoryData} format={(v) => formatMoney(v)} />
            ) : (
              <p className="muted">No sales in this period.</p>
            )}
          </div>

          <div className="card">
            <h2>Inventory</h2>
            <div className="kpi-grid" style={{ marginBottom: 0 }}>
              <Kpi label="Units in stock" value={inventory.totalUnits} />
              <Kpi label="Stock value" value={formatMoney(inventory.costValue)} sub="at cost" />
              <Kpi label="Retail value" value={formatMoney(inventory.retailValue)} sub="at selling" />
            </div>
          </div>

          <div className="card">
            <h2>Low stock</h2>
            {inventory.lowStock.length ? (
              <div className="lowstock-list">
                {inventory.lowStock.map((p) => (
                  <div key={p.id} className="lowstock-row">
                    <span className="strong">{p.name}</span>
                    <span className={`badge ${num(p.stock) === 0 ? 'badge-return' : ''}`}>{p.stock} left</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">All products sufficiently stocked.</p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
