import React, { useContext, useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import axios from 'axios'
import OrderReviewPrompt from '../components/orders/OrderReviewPrompt'
import { saveRedirectIntent } from '../utils/safeRedirect'

// ── Status Configuration ──────────────────────────────────────────
const STATUS_CONFIG = {
  'Order Placed':     { color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500',   step: 0 },
  'Packing':          { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', step: 1 },
  'Shipped':          { color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500', step: 2 },
  // ✅ Fixed: was 'Out for delivery' (lowercase d) — DB stores 'Out for Delivery' (uppercase D)
  // This mismatch meant the badge always fell through to default grey styling
  'Out for Delivery': { color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', step: 3 },
  'Delivered':        { color: 'bg-green-100 text-green-700',   dot: 'bg-green-500',  step: 4 },
  'Cancelled':        { color: 'bg-red-100 text-red-700',       dot: 'bg-red-500',    step: -1 },
}

const ORDER_STEPS = ['Order Placed', 'Packing', 'Shipped', 'Out for Delivery', 'Delivered']

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || { color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400', step: 0 }

// ── Status Timeline ───────────────────────────────────────────────
const StatusTimeline = ({ status }) => {
  const currentStep = getStatusConfig(status).step
  if (currentStep === -1) {
    return <p className='text-sm text-red-600 font-medium mt-2'>✕ Order Cancelled</p>
  }
  return (
    <div className='mt-4 mb-2'>
      <div className='flex items-center gap-0'>
        {ORDER_STEPS.map((step, index) => {
          const done = index <= currentStep
          const active = index === currentStep
          return (
            <React.Fragment key={step}>
              <div className='flex flex-col items-center gap-1'>
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-colors ${
                    done
                      ? 'bg-black border-black'
                      : 'bg-white border-gray-300'
                  } ${active ? 'ring-2 ring-offset-1 ring-black' : ''}`}
                />
                <p className={`text-[9px] sm:text-[10px] text-center max-w-[56px] leading-tight ${done ? 'text-black font-medium' : 'text-gray-400'}`}>
                  {step}
                </p>
              </div>
              {index < ORDER_STEPS.length - 1 && (
                <div className={`flex-1 h-[2px] mb-4 transition-colors ${index < currentStep ? 'bg-black' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
const Orders = () => {
  const { backendUrl, token, currency, navigate, addToCart } = useContext(ShopContext)
  const [orderData, setOrderData] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState({})
  const [cancellingOrder, setCancellingOrder] = useState(null)

  useEffect(() => {
    if (!token) {
      saveRedirectIntent('/orders', 'checkout')
      navigate('/login')
    }
  }, [token])

  const fetchOrderData = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const response = await axios.post(
        backendUrl + '/api/order/userorders',
        {},
        { headers: { token } }
      )
      if (response.data.success) {
        // Sort: newest first
        const sorted = [...response.data.orders].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        )
        setOrderData(sorted)
      } else {
        toast.error(response.data.message || 'Failed to load orders.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [token, backendUrl])

  useEffect(() => {
    if (token) fetchOrderData()
  }, [token, fetchOrderData])

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }))
  }

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    setCancellingOrder(orderId)
    try {
      const response = await axios.post(
        backendUrl + '/api/order/cancel',
        { orderId },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success('Order cancelled successfully.')
        fetchOrderData()
      } else {
        toast.error(response.data.message || 'Cancellation failed.')
      }
    } catch (error) {
      // Graceful fallback: if endpoint doesn't exist yet, show info message
      toast.info('To cancel this order, please contact us via WhatsApp.')
    } finally {
      setCancellingOrder(null)
    }
  }

  // ── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className='border-t pt-16 min-h-[50vh]'>
        <div className='text-2xl mb-6'><Title text1={'MY'} text2={'ORDERS'} /></div>
        {[1, 2, 3].map(i => (
          <div key={i} className='animate-pulse border-t py-6'>
            <div className='flex gap-4 mb-4'>
              <div className='w-20 h-20 bg-gray-200 rounded flex-shrink-0' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 bg-gray-200 rounded w-1/2' />
                <div className='h-3 bg-gray-200 rounded w-1/3' />
                <div className='h-3 bg-gray-200 rounded w-1/4' />
              </div>
            </div>
            <div className='h-2 bg-gray-200 rounded w-full mt-2' />
          </div>
        ))}
      </div>
    )
  }

  // ── Empty State ───────────────────────────────────────────────
  if (orderData.length === 0) {
    return (
      <div className='border-t pt-16'>
        <div className='text-2xl mb-6'><Title text1={'MY'} text2={'ORDERS'} /></div>
        <div className='flex flex-col items-center py-20 gap-4 text-gray-500'>
          <svg xmlns='http://www.w3.org/2000/svg' className='w-20 h-20 text-gray-200' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
          </svg>
          <p className='text-2xl font-medium text-gray-700'>No orders yet</p>
          <p className='text-sm text-gray-400'>You haven&apos;t placed any orders. Start shopping!</p>
          <button
            onClick={() => navigate('/collection')}
            className='bg-black text-white px-10 py-3 text-sm hover:bg-gray-800 transition-colors mt-2'
          >
            START SHOPPING
          </button>
        </div>
      </div>
    )
  }

  // ── Orders List ───────────────────────────────────────────────
  return (
    <div className='border-t pt-16 pb-20'>
      <div className='flex items-center justify-between mb-6'>
        <div className='text-2xl'><Title text1={'MY'} text2={'ORDERS'} /></div>
        <button
          onClick={fetchOrderData}
          className='text-sm text-gray-500 hover:text-black border border-gray-300 px-4 py-2 rounded transition-colors flex items-center gap-2'
        >
          <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
          </svg>
          Refresh
        </button>
      </div>

      <div className='flex flex-col gap-4'>
        {orderData.map((order) => {
          const config = getStatusConfig(order.status)
          const isExpanded = expandedOrders[order._id]
          const canCancel = order.status === 'Order Placed' || order.status === 'Packing'
          const orderId = order._id ? order._id.slice(-8).toUpperCase() : '–'
          const orderDate = order.date
            ? new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : '–'

          return (
            <div key={order._id} className='border border-gray-200 rounded-lg overflow-hidden'>

              {/* Order Header */}
              <div className='bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm'>
                  <span className='font-semibold text-gray-800'>Order #{orderId}</span>
                  <span className='text-gray-500'>{orderDate}</span>
                  <span className='font-medium text-gray-800'>{currency}{Number(order.amount).toLocaleString('en-IN')}</span>
                  <span className='text-gray-500 text-xs capitalize'>{order.paymentMethod} — {order.payment ? (
                    <span className='text-green-600 font-medium'>Paid</span>
                  ) : (
                    <span className='text-orange-500 font-medium'>Pending</span>
                  )}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.color}`}>
                    {order.status}
                  </span>
                  <button
                    onClick={() => toggleExpand(order._id)}
                    className='text-xs text-gray-500 hover:text-black border border-gray-300 px-3 py-1 rounded transition-colors ml-1'
                  >
                    {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                  </button>
                </div>
              </div>

              {/* Order Timeline */}
              <div className='px-4 pt-4 pb-2'>
                <StatusTimeline status={order.status} />
              </div>

              {/* Collapsed: thumbnail strip */}
              {!isExpanded && order.items && (
                <div className='px-4 pb-4 flex gap-2 overflow-x-auto'>
                  {order.items.slice(0, 4).map((item, i) => (
                    <img
                      key={i}
                      src={item.image?.[0]}
                      alt={item.name}
                      className='w-14 h-14 object-contain border border-gray-100 rounded flex-shrink-0 bg-gray-50'
                      loading='lazy'
                      onError={e => { e.target.src = '/placeholder.png' }}
                    />
                  ))}
                  {order.items.length > 4 && (
                    <div className='w-14 h-14 border border-gray-100 rounded flex items-center justify-center text-xs text-gray-500 bg-gray-50 flex-shrink-0'>
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>
              )}

              {/* Expanded: full item list */}
              {isExpanded && (
                <div className='px-4 pb-4 border-t border-gray-100 mt-2'>
                  {order.items && order.items.map((item, itemIndex) => (
                    <div key={itemIndex} className='flex items-start gap-4 py-3 border-b border-gray-50 last:border-0'>
                      <img
                        className='w-16 h-16 object-contain border border-gray-100 rounded bg-gray-50 flex-shrink-0'
                        src={item.image?.[0]}
                        alt={item.name}
                        loading='lazy'
                        onError={e => { e.target.src = '/placeholder.png' }}
                      />
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate'>{item.name}</p>
                        <div className='flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600'>
                          <span>{currency}{Number(item.price).toLocaleString('en-IN')}</span>
                          <span className='text-gray-400'>×</span>
                          <span>Qty: {item.quantity}</span>
                          {item.size && item.size !== 'default' && (
                            <span className='px-2 py-0.5 border text-xs bg-gray-50'>{item.size}</span>
                          )}
                        </div>
                        {item.customization && Object.keys(item.customization).length > 0 && (
                          <div className='mt-1 text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded'>
                            {Object.entries(item.customization).map(([k, v]) =>
                              v ? <span key={k} className='mr-2 capitalize'>• {k}: {v}</span> : null
                            )}
                          </div>
                        )}
                      </div>
                      <p className='text-sm font-medium flex-shrink-0 text-right'>
                        {currency}{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}

                  {/* Delivery Address */}
                  {order.address && (
                    <div className='mt-3 text-xs text-gray-500 bg-gray-50 rounded p-3'>
                      <p className='font-semibold text-gray-700 mb-1'>Delivered to:</p>
                      <p>{order.address.firstName} {order.address.lastName}</p>
                      <p>{order.address.street}, {order.address.city}, {order.address.state} – {order.address.zipCode}</p>
                      <p>{order.address.phone}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className='mt-4 flex flex-wrap gap-3'>
                    <button
                      onClick={async () => {
                        // ✅ Actually re-add all items to cart instead of navigating to /collection
                        let addedCount = 0
                        for (const item of order.items) {
                          const ok = await addToCart(
                            item._id,
                            item.size || null,
                            item.customization || {}
                          )
                          if (ok) addedCount++
                        }
                        if (addedCount > 0) {
                          toast.success(`${addedCount} item${addedCount > 1 ? 's' : ''} added to cart`)
                          navigate('/cart')
                        } else {
                          toast.error('Could not add items to cart. Products may be unavailable.')
                        }
                      }}
                      className='text-sm border border-gray-300 px-4 py-2 hover:bg-gray-50 transition-colors rounded'
                    >
                      Reorder
                    </button>
                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancellingOrder === order._id}
                        className='text-sm border border-red-300 text-red-600 px-4 py-2 hover:bg-red-50 transition-colors rounded disabled:opacity-50'
                      >
                        {cancellingOrder === order._id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>

                  {/* Review prompt — only renders for Delivered orders */}
                  <OrderReviewPrompt order={order} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Orders
