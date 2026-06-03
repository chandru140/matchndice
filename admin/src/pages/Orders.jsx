import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App.jsx'
import { toast } from 'react-toastify'

const STATUS_OPTIONS = ['All', 'Order Placed', 'Packing', 'Shipped', 'Out for delivery', 'Delivered', 'Cancelled']

const STATUS_COLORS = {
  'Order Placed':     'bg-blue-100 text-blue-700',
  'Packing':          'bg-yellow-100 text-yellow-700',
  'Shipped':          'bg-indigo-100 text-indigo-700',
  'Out for delivery': 'bg-orange-100 text-orange-700',
  'Out for Delivery': 'bg-orange-100 text-orange-700',
  'Delivered':        'bg-green-100 text-green-700',
  'Cancelled':        'bg-red-100 text-red-700',
}

const Orders = ({ token }) => {
  const [orderData,   setOrderData]   = useState([])
  const [filtered,    setFiltered]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [search,      setSearch]      = useState('')
  const [expandedId,  setExpandedId]  = useState(null)

  const fetchAllOrders = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const { data } = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } })
      if (data.success) {
        setOrderData(data.orders)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error('Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchAllOrders() }, [fetchAllOrders])

  // ── Filter + Search ─────────────────────────────────────────
  useEffect(() => {
    let result = [...orderData]
    if (statusFilter !== 'All') {
      result = result.filter(o => o.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(o =>
        o._id?.toLowerCase().includes(q) ||
        `${o.address?.firstName} ${o.address?.lastName}`.toLowerCase().includes(q) ||
        o.address?.phone?.includes(q)
      )
    }
    setFiltered(result)
  }, [orderData, statusFilter, search])

  // ── Status Update ───────────────────────────────────────────
  const statusHandler = async (orderId, newStatus) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/order/status',
        { orderId, status: newStatus },
        { headers: { token } }
      )
      if (data.success) {
        toast.success('Status updated!')
        fetchAllOrders()
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to update status.')
    }
  }

  // ── CSV Export ──────────────────────────────────────────────
  const exportToCSV = () => {
    const rows = [
      ['Order ID', 'Customer', 'Phone', 'Date', 'Amount', 'Status', 'Payment', 'Items'],
      ...filtered.map(o => [
        o._id?.slice(-8).toUpperCase(),
        `${o.address?.firstName || ''} ${o.address?.lastName || ''}`.trim(),
        o.address?.phone || '',
        new Date(o.date).toLocaleDateString('en-IN'),
        o.amount,
        o.status,
        o.payment ? 'Paid' : 'Pending',
        o.items?.length || 0,
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Orders exported!')
  }

  return (
    <div className='max-w-6xl'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-3 mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Orders</h1>
          <p className='text-sm text-gray-500'>{filtered.length} of {orderData.length} orders</p>
        </div>
        <div className='flex gap-2'>
          <button onClick={fetchAllOrders} className='flex items-center gap-1 text-sm border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors'>
            ↻ Refresh
          </button>
          <button onClick={exportToCSV} className='flex items-center gap-1 text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors'>
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className='flex flex-wrap gap-3 mb-4'>
        <input
          type='text'
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder='Search by order ID, customer, phone...'
          className='border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black flex-1 min-w-[200px]'
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className='border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black bg-white'
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className='space-y-3'>
          {[1, 2, 3].map(i => (
            <div key={i} className='animate-pulse border border-gray-200 rounded-xl p-5 flex gap-4'>
              <div className='w-12 h-12 bg-gray-200 rounded flex-shrink-0' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 bg-gray-200 rounded w-1/3' />
                <div className='h-3 bg-gray-200 rounded w-1/2' />
                <div className='h-3 bg-gray-200 rounded w-1/4' />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className='text-center py-16 text-gray-400'>
          <p className='text-lg'>No orders found</p>
          <p className='text-sm mt-1'>Try adjusting your search or filter</p>
        </div>
      )}

      {/* Orders List */}
      {!loading && filtered.map(order => (
        <div key={order._id} className='border border-gray-200 rounded-xl mb-3 overflow-hidden'>
          {/* Order Row */}
          <div className='grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center p-4 bg-white'>
            {/* Thumbnails */}
            <div className='flex gap-1 flex-shrink-0'>
              {order.items?.slice(0, 2).map((item, i) => (
                <img key={i} src={item.image?.[0]} alt={item.name} className='w-12 h-12 object-contain border rounded bg-gray-50' loading='lazy' />
              ))}
              {(order.items?.length || 0) > 2 && (
                <div className='w-12 h-12 border rounded bg-gray-50 flex items-center justify-center text-xs text-gray-500'>
                  +{order.items.length - 2}
                </div>
              )}
            </div>

            {/* Customer + Order Info */}
            <div>
              <p className='font-semibold text-gray-900 text-sm'>
                {order.address?.firstName} {order.address?.lastName}
              </p>
              <p className='text-xs text-gray-500 mt-0.5'>
                #{order._id?.slice(-8).toUpperCase()} · {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className='text-xs text-gray-500'>{order.address?.phone}</p>
            </div>

            {/* Amount + Payment */}
            <div className='text-right'>
              <p className='font-bold text-gray-900'>{currency}{Number(order.amount).toLocaleString('en-IN')}</p>
              <p className={`text-xs font-medium mt-0.5 ${order.payment ? 'text-green-600' : 'text-orange-500'}`}>
                {order.payment ? '✓ Paid' : '⏳ Pending'}
              </p>
              <p className='text-xs text-gray-400'>{order.paymentMethod}</p>
            </div>

            {/* Status Selector */}
            <select
              value={order.status}
              onChange={e => statusHandler(order._id, e.target.value)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border-0 outline-none cursor-pointer ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}
            >
              {STATUS_OPTIONS.filter(s => s !== 'All').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Expand Toggle */}
            <button
              onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
              className='text-xs text-gray-500 hover:text-black border border-gray-300 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap'
            >
              {expandedId === order._id ? '▲ Hide' : '▼ Details'}
            </button>
          </div>

          {/* Expanded Details */}
          {expandedId === order._id && (
            <div className='border-t border-gray-100 bg-gray-50 p-4'>
              {/* Items */}
              <h3 className='text-xs font-semibold text-gray-500 uppercase mb-2'>Items Ordered</h3>
              <div className='space-y-2 mb-4'>
                {order.items?.map((item, i) => (
                  <div key={i} className='flex items-center gap-3 bg-white rounded-lg p-2 border border-gray-100'>
                    <img src={item.image?.[0]} alt={item.name} className='w-10 h-10 object-contain rounded border flex-shrink-0' loading='lazy' />
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>{item.name}</p>
                      <p className='text-xs text-gray-500'>{currency}{item.price} × {item.quantity}</p>
                      {item.customization && Object.keys(item.customization).length > 0 && (
                        <p className='text-xs text-blue-600 mt-0.5'>
                          {Object.entries(item.customization).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      )}
                    </div>
                    <p className='text-sm font-semibold'>{currency}{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>

              {/* Address */}
              <h3 className='text-xs font-semibold text-gray-500 uppercase mb-2'>Delivery Address</h3>
              <div className='bg-white rounded-lg p-3 border border-gray-100 text-sm text-gray-700'>
                <p className='font-semibold'>{order.address?.firstName} {order.address?.lastName}</p>
                <p>{order.address?.street}</p>
                <p>{order.address?.city}, {order.address?.state} – {order.address?.zipCode}, {order.address?.country}</p>
                <p className='mt-1 text-gray-500'>📞 {order.address?.phone}</p>
                {order.address?.email && <p className='text-gray-500'>✉ {order.address.email}</p>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default Orders