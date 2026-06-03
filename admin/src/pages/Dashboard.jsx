import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App.jsx'
import { toast } from 'react-toastify'

// ── Stat Card ────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'bg-gray-50', loading }) => (
  <div className={`${color} rounded-xl p-5 border border-gray-200`}>
    {loading ? (
      <div className='animate-pulse space-y-2'>
        <div className='h-3 bg-gray-200 rounded w-1/2' />
        <div className='h-8 bg-gray-300 rounded w-2/3' />
      </div>
    ) : (
      <>
        <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1'>{label}</p>
        <p className='text-3xl font-bold text-gray-900'>{value}</p>
        {sub && <p className='text-xs text-gray-500 mt-1'>{sub}</p>}
      </>
    )}
  </div>
)

// ── Status Badge ─────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    'Order Placed':     'bg-blue-100 text-blue-700',
    'Packing':          'bg-yellow-100 text-yellow-700',
    'Shipped':          'bg-indigo-100 text-indigo-700',
    'Out for delivery': 'bg-orange-100 text-orange-700',
    'Out for Delivery': 'bg-orange-100 text-orange-700',
    'Delivered':        'bg-green-100 text-green-700',
    'Cancelled':        'bg-red-100 text-red-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

// ── Stock Badge ──────────────────────────────────────────────────
const StockBadge = ({ stock, threshold = 5 }) => {
  if (stock === 0)         return <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700'>Out of Stock</span>
  if (stock <= threshold)  return <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700'>Low ({stock})</span>
  return <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700'>In Stock ({stock})</span>
}

// ── Main Dashboard ────────────────────────────────────────────────
const Dashboard = ({ token }) => {
  const [orders,   setOrders]   = useState([])
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const [ordRes, prodRes] = await Promise.all([
        axios.post(backendUrl + '/api/order/list', {}, { headers: { token } }),
        axios.get(backendUrl + '/api/product/list'),
      ])
      if (ordRes.data.success)  setOrders(ordRes.data.orders)
      if (prodRes.data.success) setProducts(prodRes.data.products)
    } catch (err) {
      toast.error('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  // ── Derived stats ─────────────────────────────────────────
  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - 7)
  const monthStart = new Date(today); monthStart.setDate(1)

  const ordersToday    = orders.filter(o => new Date(o.date) >= today)
  const ordersThisWeek = orders.filter(o => new Date(o.date) >= weekStart)
  const ordersPending  = orders.filter(o => o.status === 'Order Placed' || o.status === 'Packing')

  const revenueTotal = orders
    .filter(o => o.payment && o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.amount || 0), 0)

  const revenueThisMonth = orders
    .filter(o => o.payment && o.status !== 'Cancelled' && new Date(o.date) >= monthStart)
    .reduce((sum, o) => sum + (o.amount || 0), 0)

  const outOfStock = products.filter(p => p.stock === 0)
  const lowStock   = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5))

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8)

  return (
    <div className='max-w-6xl'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
          <p className='text-sm text-gray-500'>Match n Dice Admin Overview</p>
        </div>
        <button
          onClick={fetchData}
          className='flex items-center gap-2 text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors'
        >
          <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <StatCard label='Orders Today'    value={ordersToday.length}                               loading={loading} color='bg-blue-50' />
        <StatCard label='Orders This Week' value={ordersThisWeek.length}                           loading={loading} color='bg-indigo-50' />
        <StatCard label='Pending Orders'   value={ordersPending.length}                            loading={loading} color='bg-amber-50'  sub='Needs action' />
        <StatCard label='Total Products'   value={products.length}                                 loading={loading} color='bg-gray-50' />
        <StatCard label='Revenue (Month)'  value={`${currency}${revenueThisMonth.toLocaleString('en-IN')}`} loading={loading} color='bg-green-50' />
        <StatCard label='Total Revenue'    value={`${currency}${revenueTotal.toLocaleString('en-IN')}`}    loading={loading} color='bg-emerald-50' />
        <StatCard label='Out of Stock'     value={outOfStock.length}  sub='Products unavailable'  loading={loading} color={outOfStock.length > 0 ? 'bg-red-50' : 'bg-gray-50'} />
        <StatCard label='Low Stock'        value={lowStock.length}    sub='Below threshold'        loading={loading} color={lowStock.length  > 0 ? 'bg-yellow-50' : 'bg-gray-50'} />
      </div>

      {/* Alerts */}
      {!loading && (outOfStock.length > 0 || lowStock.length > 0) && (
        <div className='mb-6 space-y-3'>
          {outOfStock.length > 0 && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3'>
              <span className='text-red-500 text-xl mt-0.5'>⚠</span>
              <div>
                <p className='font-semibold text-red-800 text-sm'>{outOfStock.length} product(s) are OUT OF STOCK</p>
                <p className='text-red-600 text-xs mt-0.5'>
                  {outOfStock.slice(0, 3).map(p => p.name).join(', ')}{outOfStock.length > 3 ? ` +${outOfStock.length - 3} more` : ''}
                </p>
              </div>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3'>
              <span className='text-yellow-500 text-xl mt-0.5'>⚡</span>
              <div>
                <p className='font-semibold text-yellow-800 text-sm'>{lowStock.length} product(s) are LOW ON STOCK</p>
                <p className='text-yellow-600 text-xs mt-0.5'>
                  {lowStock.slice(0, 3).map(p => `${p.name} (${p.stock})`).join(', ')}{lowStock.length > 3 ? ` +${lowStock.length - 3} more` : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Status Distribution */}
      {!loading && orders.length > 0 && (
        <div className='mb-8 bg-white border border-gray-200 rounded-xl p-5'>
          <h2 className='font-semibold text-gray-800 mb-4'>Orders by Status</h2>
          <div className='flex flex-wrap gap-3'>
            {[
              { label: 'Placed',        key: 'Order Placed',       color: 'bg-blue-500' },
              { label: 'Packing',       key: 'Packing',            color: 'bg-yellow-500' },
              { label: 'Shipped',       key: 'Shipped',            color: 'bg-indigo-500' },
              { label: 'Out for Del.',  key: 'Out for delivery',   color: 'bg-orange-500' },
              { label: 'Delivered',     key: 'Delivered',          color: 'bg-green-500' },
              { label: 'Cancelled',     key: 'Cancelled',          color: 'bg-red-500' },
            ].map(({ label, key, color }) => {
              const count = orders.filter(o => o.status === key || o.status === key).length
              if (count === 0) return null
              return (
                <div key={key} className='flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2'>
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className='text-sm text-gray-700'>{label}</span>
                  <span className='font-bold text-gray-900'>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
        <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100'>
          <h2 className='font-semibold text-gray-800'>Recent Orders</h2>
          <span className='text-xs text-gray-500'>{orders.length} total</span>
        </div>
        {loading ? (
          <div className='p-5 space-y-3'>
            {[1, 2, 3].map(i => (
              <div key={i} className='animate-pulse flex gap-3'>
                <div className='h-4 bg-gray-200 rounded w-1/4' />
                <div className='h-4 bg-gray-200 rounded w-1/3' />
                <div className='h-4 bg-gray-200 rounded w-1/6' />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className='text-center text-gray-400 py-10 text-sm'>No orders yet.</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50'>
                <tr>
                  {['Order ID', 'Customer', 'Date', 'Amount', 'Status', 'Payment'].map(h => (
                    <th key={h} className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {recentOrders.map(order => (
                  <tr key={order._id} className='hover:bg-gray-50 transition-colors'>
                    <td className='px-4 py-3 font-mono text-xs text-gray-600'>
                      #{order._id?.slice(-6).toUpperCase()}
                    </td>
                    <td className='px-4 py-3 text-gray-800'>
                      {order.address?.firstName} {order.address?.lastName}
                    </td>
                    <td className='px-4 py-3 text-gray-500 whitespace-nowrap'>
                      {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className='px-4 py-3 font-medium'>
                      {currency}{Number(order.amount).toLocaleString('en-IN')}
                    </td>
                    <td className='px-4 py-3'>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className='px-4 py-3'>
                      <span className={`text-xs font-medium ${order.payment ? 'text-green-600' : 'text-orange-500'}`}>
                        {order.payment ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inventory Alert: Out of Stock Products Table */}
      {!loading && outOfStock.length > 0 && (
        <div className='mt-6 bg-white border border-red-200 rounded-xl overflow-hidden'>
          <div className='px-5 py-4 border-b border-red-100 bg-red-50'>
            <h2 className='font-semibold text-red-800'>🚨 Out of Stock Products</h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50'>
                <tr>
                  {['Product', 'Category', 'Price', 'Stock'].map(h => (
                    <th key={h} className='text-left px-4 py-2 text-xs font-semibold text-gray-500'>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {outOfStock.map(p => (
                  <tr key={p._id} className='hover:bg-red-50 transition-colors'>
                    <td className='px-4 py-2.5 flex items-center gap-2'>
                      <img src={p.image?.[0]} alt={p.name} className='w-8 h-8 object-contain rounded border' loading='lazy' />
                      <span className='font-medium'>{p.name}</span>
                    </td>
                    <td className='px-4 py-2.5 text-gray-500'>{p.category?.name || '–'}</td>
                    <td className='px-4 py-2.5'>{currency}{Number(p.price).toLocaleString('en-IN')}</td>
                    <td className='px-4 py-2.5'><StockBadge stock={p.stock} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
