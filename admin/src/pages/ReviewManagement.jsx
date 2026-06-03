import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const STATUS_COLORS = {
  published: 'bg-green-100 text-green-700 border-green-200',
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  rejected:  'bg-red-100 text-red-700 border-red-200',
}

const StarDisplay = ({ rating }) => (
  <span className='text-yellow-400 text-sm'>
    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    <span className='text-gray-500 ml-1 text-xs'>({rating}/5)</span>
  </span>
)

const ReviewManagement = ({ token }) => {
  const [reviews,       setReviews]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [statusFilter,  setStatusFilter]  = useState('')
  const [page,          setPage]          = useState(1)
  const [totalPages,    setTotalPages]    = useState(1)
  const [total,         setTotal]         = useState(0)
  const [replyingId,    setReplyingId]    = useState(null)  // review _id being replied to
  const [replyText,     setReplyText]     = useState('')
  const [replyLoading,  setReplyLoading]  = useState(false)

  const fetchReviews = useCallback(async (pageNum = 1) => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 20 })
      if (statusFilter) params.set('status', statusFilter)

      const { data } = await axios.get(
        `${backendUrl}/api/reviews/admin/all?${params}`,
        { headers: { token } }
      )
      if (data.success) {
        setReviews(data.reviews)
        setTotal(data.total)
        setTotalPages(data.pages)
        setPage(pageNum)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to load reviews.')
    } finally {
      setLoading(false)
    }
  }, [token, statusFilter])

  useEffect(() => { fetchReviews(1) }, [fetchReviews])

  // ── Update review status (approve / reject) ───────────────────────────
  const updateStatus = async (reviewId, status) => {
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/reviews/admin/${reviewId}/status`,
        { status },
        { headers: { token } }
      )
      if (data.success) {
        toast.success(`Review ${status}.`)
        fetchReviews(page)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to update review status.')
    }
  }

  // ── Delete review ──────────────────────────────────────────────────────
  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review permanently? This cannot be undone.')) return
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/reviews/admin/${reviewId}`,
        { headers: { token } }
      )
      if (data.success) {
        toast.success('Review permanently deleted.')
        fetchReviews(page)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to delete review.')
    }
  }

  // ── Submit admin reply ────────────────────────────────────────────────
  const submitReply = async (reviewId) => {
    if (!replyText.trim()) { toast.error('Reply text is required.'); return }
    setReplyLoading(true)
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/reviews/admin/${reviewId}/reply`,
        { text: replyText.trim() },
        { headers: { token } }
      )
      if (data.success) {
        toast.success('Reply posted.')
        setReplyingId(null)
        setReplyText('')
        fetchReviews(page)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Failed to post reply.')
    } finally {
      setReplyLoading(false)
    }
  }

  return (
    <div className='max-w-6xl'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-3 mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Review Management</h1>
          <p className='text-sm text-gray-500'>{total} total reviews</p>
        </div>
        <button
          onClick={() => fetchReviews(1)}
          className='text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors'
        >
          ↻ Refresh
        </button>
      </div>

      {/* Status filter pills */}
      <div className='flex gap-2 flex-wrap mb-5'>
        {['', 'published', 'pending', 'rejected'].map(s => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              statusFilter === s
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
            }`}
          >
            {s === '' ? 'All Reviews' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className='space-y-3'>
          {[1, 2, 3].map(i => (
            <div key={i} className='animate-pulse border border-gray-200 rounded-xl p-5 space-y-2'>
              <div className='h-4 bg-gray-200 rounded w-1/3' />
              <div className='h-3 bg-gray-200 rounded w-1/2' />
              <div className='h-3 bg-gray-200 rounded w-2/3' />
            </div>
          ))}
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className='text-center py-16 text-gray-400'>
          <p className='text-5xl mb-3'>⭐</p>
          <p className='font-medium text-gray-600'>No reviews found</p>
        </div>
      )}

      {/* Reviews list */}
      {!loading && reviews.map(review => (
        <div
          key={review._id}
          className={`border rounded-xl mb-3 overflow-hidden ${
            review.status === 'pending' ? 'border-yellow-300 bg-yellow-50/30' :
            review.status === 'rejected' ? 'border-red-200 opacity-70' : 'border-gray-200 bg-white'
          }`}
        >
          <div className='p-5'>
            {/* Top row: product + reviewer */}
            <div className='flex flex-wrap gap-3 items-start justify-between'>
              <div className='flex gap-3 items-start'>
                {/* Product image */}
                <img
                  src={review.productId?.image?.[0]}
                  alt={review.productId?.name}
                  className='w-12 h-12 object-contain border rounded bg-gray-50 flex-shrink-0'
                  loading='lazy'
                />
                <div>
                  <p className='text-sm font-semibold text-gray-900'>
                    {review.productId?.name || 'Unknown Product'}
                  </p>
                  <p className='text-xs text-gray-500'>
                    by <strong>{review.userId?.name || 'Unknown User'}</strong>
                    {review.userId?.email && ` · ${review.userId.email}`}
                  </p>
                  <p className='text-xs text-gray-400 mt-0.5'>
                    {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {review.orderId && ` · Order: #${review.orderId.toString().slice(-6).toUpperCase()}`}
                  </p>
                </div>
              </div>

              {/* Status badge */}
              <span className={`text-xs px-2 py-1 rounded-full border font-medium flex-shrink-0 ${STATUS_COLORS[review.status]}`}>
                {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
              </span>
            </div>

            {/* Rating + content */}
            <div className='mt-3'>
              <StarDisplay rating={review.rating} />
              {review.title && <p className='font-medium text-sm text-gray-900 mt-1'>{review.title}</p>}
              <p className='text-sm text-gray-700 mt-1 leading-relaxed'>{review.comment}</p>
            </div>

            {/* Edit history */}
            {review.editHistory?.length > 0 && (
              <p className='text-xs text-gray-400 mt-2 italic'>
                ✏ Edited {review.editHistory.length} time{review.editHistory.length > 1 ? 's' : ''}
              </p>
            )}

            {/* Admin reply (if any) */}
            {review.adminReply?.text && (
              <div className='mt-3 border-l-2 border-gray-300 pl-3 bg-gray-50 py-2 rounded-r text-sm text-gray-600'>
                <p className='text-xs font-semibold text-gray-500 mb-0.5'>Your reply:</p>
                <p>{review.adminReply.text}</p>
              </div>
            )}

            {/* Inline reply form */}
            {replyingId === review._id && (
              <div className='mt-3 space-y-2'>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder='Write your reply to this review...'
                  rows={3}
                  className='w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black resize-none'
                  autoFocus
                />
                <div className='flex gap-2'>
                  <button
                    onClick={() => submitReply(review._id)}
                    disabled={replyLoading}
                    className='bg-black text-white px-4 py-1.5 text-xs rounded hover:bg-gray-800 disabled:opacity-50'
                  >
                    {replyLoading ? 'Posting...' : 'Post Reply'}
                  </button>
                  <button
                    onClick={() => { setReplyingId(null); setReplyText('') }}
                    className='text-xs text-gray-500 hover:text-gray-700 px-2'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className='flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100'>
              {review.status !== 'published' && (
                <button
                  onClick={() => updateStatus(review._id, 'published')}
                  className='text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded hover:bg-green-200 transition-colors'
                >
                  ✓ Approve
                </button>
              )}
              {review.status !== 'rejected' && (
                <button
                  onClick={() => updateStatus(review._id, 'rejected')}
                  className='text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded hover:bg-red-100 transition-colors'
                >
                  ✕ Reject
                </button>
              )}
              {review.status !== 'pending' && (
                <button
                  onClick={() => updateStatus(review._id, 'pending')}
                  className='text-xs bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1.5 rounded hover:bg-yellow-100 transition-colors'
                >
                  ⏳ Set Pending
                </button>
              )}
              <button
                onClick={() => {
                  setReplyingId(replyingId === review._id ? null : review._id)
                  setReplyText(review.adminReply?.text || '')
                }}
                className='text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors'
              >
                💬 {review.adminReply?.text ? 'Edit Reply' : 'Reply'}
              </button>
              <button
                onClick={() => deleteReview(review._id)}
                className='text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded hover:bg-red-100 transition-colors ml-auto'
              >
                🗑 Delete Permanently
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-3 mt-6'>
          <button
            onClick={() => fetchReviews(page - 1)}
            disabled={page === 1 || loading}
            className='px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors'
          >
            ← Prev
          </button>
          <span className='text-sm text-gray-600'>Page {page} of {totalPages}</span>
          <button
            onClick={() => fetchReviews(page + 1)}
            disabled={page === totalPages || loading}
            className='px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors'
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default ReviewManagement
