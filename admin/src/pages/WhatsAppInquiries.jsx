import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const STATUS_COLORS = {
  initiated:  'bg-blue-100 text-blue-700 border-blue-200',
  responded:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  converted:  'bg-green-100 text-green-700 border-green-200',
}

const WhatsAppInquiries = ({ token }) => {
  const [inquiries, setInquiries]   = useState([])
  const [summary,   setSummary]     = useState([])
  const [loading,   setLoading]     = useState(true)
  const [view,      setView]        = useState('list')   // 'list' | 'summary'
  const [page,      setPage]        = useState(1)
  const [total,     setTotal]       = useState(0)

  const fetchInquiries = useCallback(async (pageNum = 1) => {
    if (!token) return
    setLoading(true)
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/whatsapp-inquiry/admin/all?page=${pageNum}&limit=20`,
        { headers: { token } }
      )
      if (data.success) {
        setInquiries(data.inquiries)
        setTotal(data.total)
        setPage(pageNum)
      }
    } catch {
      toast.error('Failed to load WhatsApp inquiries.')
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchSummary = useCallback(async () => {
    if (!token) return
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/whatsapp-inquiry/admin/summary`,
        { headers: { token } }
      )
      if (data.success) setSummary(data.summary)
    } catch {
      toast.error('Failed to load inquiry summary.')
    }
  }, [token])

  useEffect(() => {
    fetchInquiries()
    fetchSummary()
  }, [fetchInquiries, fetchSummary])

  const updateStatus = async (id, status) => {
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/whatsapp-inquiry/admin/${id}/status`,
        { status },
        { headers: { token } }
      )
      if (data.success) {
        toast.success(`Marked as ${status}.`)
        fetchInquiries(page)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to update status.')
    }
  }

  return (
    <div className='max-w-6xl'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-3 mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>WhatsApp Inquiries</h1>
          <p className='text-sm text-gray-500'>{total} total inquiries</p>
        </div>
        <div className='flex gap-2'>
          <button onClick={() => fetchInquiries(1)} className='text-sm border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors'>↻ Refresh</button>
        </div>
      </div>

      {/* View toggle */}
      <div className='flex gap-2 mb-5'>
        {['list', 'summary'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 text-sm rounded-lg border transition-colors ${
              view === v ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {v === 'list' ? '📋 All Inquiries' : '📊 By Product'}
          </button>
        ))}
      </div>

      {/* ── Summary view ─────────────────────────────────────── */}
      {view === 'summary' && (
        <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
          <div className='px-5 py-3 border-b border-gray-100 bg-gray-50'>
            <h2 className='font-semibold text-gray-800 text-sm'>Products by Inquiry Volume</h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50'>
                <tr>
                  {['Product', 'Inquiries', 'Last Inquiry'].map(h => (
                    <th key={h} className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {summary.map((item, idx) => (
                  <tr key={idx} className='hover:bg-gray-50 transition-colors'>
                    <td className='px-4 py-3 flex items-center gap-3'>
                      {item.productImage && (
                        <img src={item.productImage} alt={item.productName} className='w-10 h-10 object-contain rounded border bg-gray-50 flex-shrink-0' loading='lazy' />
                      )}
                      <span className='font-medium text-gray-900'>{item.productName || 'Unknown Product'}</span>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200'>
                        💬 {item.count}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-gray-500 text-xs'>
                      {new Date(item.last).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {summary.length === 0 && (
                  <tr>
                    <td colSpan={3} className='px-4 py-10 text-center text-gray-400 text-sm'>No inquiry data yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── List view ─────────────────────────────────────────── */}
      {view === 'list' && (
        <>
          {loading && (
            <div className='space-y-3'>
              {[1, 2, 3].map(i => (
                <div key={i} className='animate-pulse border border-gray-200 rounded-xl p-5 flex gap-4'>
                  <div className='w-12 h-12 bg-gray-200 rounded flex-shrink-0' />
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-gray-200 rounded w-1/3' />
                    <div className='h-3 bg-gray-200 rounded w-1/2' />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && inquiries.length === 0 && (
            <div className='text-center py-16 text-gray-400'>
              <p className='text-5xl mb-3'>💬</p>
              <p className='font-medium text-gray-600'>No WhatsApp inquiries yet</p>
              <p className='text-xs mt-1'>They will appear here when customers click "Customize via WhatsApp".</p>
            </div>
          )}

          {!loading && inquiries.map(inq => (
            <div key={inq._id} className='border border-gray-200 rounded-xl mb-3 overflow-hidden bg-white'>
              <div className='p-4'>
                <div className='flex flex-wrap gap-3 items-start justify-between'>
                  {/* Product info */}
                  <div className='flex gap-3 items-start'>
                    {inq.productId?.image?.[0] && (
                      <img
                        src={inq.productId.image[0]}
                        alt={inq.productName}
                        className='w-12 h-12 object-contain rounded border bg-gray-50 flex-shrink-0'
                        loading='lazy'
                      />
                    )}
                    <div>
                      <p className='font-semibold text-gray-900 text-sm'>{inq.productName}</p>
                      <p className='text-xs text-gray-500 mt-0.5'>
                        {currency}{Number(inq.productPrice).toLocaleString('en-IN')}
                      </p>
                      <p className='text-xs text-gray-400 mt-0.5'>
                        {new Date(inq.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium flex-shrink-0 ${STATUS_COLORS[inq.status]}`}>
                    {inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}
                  </span>
                </div>

                {/* User info */}
                <div className='mt-3 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-700 space-y-0.5'>
                  <p><span className='font-medium'>Name:</span> {inq.userName || '—'}</p>
                  <p><span className='font-medium'>Email:</span> {inq.userEmail || '—'}</p>
                  {inq.userPhone && <p><span className='font-medium'>Phone:</span> {inq.userPhone}</p>}
                </div>

                {/* Status actions */}
                <div className='flex gap-2 mt-3 flex-wrap'>
                  {inq.status !== 'initiated' && (
                    <button onClick={() => updateStatus(inq._id, 'initiated')} className='text-xs border border-blue-200 text-blue-600 px-2.5 py-1 rounded hover:bg-blue-50 transition-colors'>Initiated</button>
                  )}
                  {inq.status !== 'responded' && (
                    <button onClick={() => updateStatus(inq._id, 'responded')} className='text-xs border border-yellow-200 text-yellow-600 px-2.5 py-1 rounded hover:bg-yellow-50 transition-colors'>Mark Responded</button>
                  )}
                  {inq.status !== 'converted' && (
                    <button onClick={() => updateStatus(inq._id, 'converted')} className='text-xs border border-green-200 text-green-700 px-2.5 py-1 rounded hover:bg-green-50 transition-colors'>Mark Converted ✓</button>
                  )}
                  {inq.productUrl && (
                    <a
                      href={inq.productUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-xs border border-gray-200 text-gray-600 px-2.5 py-1 rounded hover:bg-gray-100 transition-colors'
                    >
                      View Product ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {total > 20 && (
            <div className='flex items-center justify-center gap-3 mt-6'>
              <button
                onClick={() => fetchInquiries(page - 1)}
                disabled={page === 1 || loading}
                className='px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors'
              >
                ← Prev
              </button>
              <span className='text-sm text-gray-600'>Page {page} of {Math.ceil(total / 20)}</span>
              <button
                onClick={() => fetchInquiries(page + 1)}
                disabled={page >= Math.ceil(total / 20) || loading}
                className='px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors'
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default WhatsAppInquiries
