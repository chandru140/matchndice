import React, { useState, useEffect, useCallback } from 'react'
import { useContext } from 'react'
import { ShopContext } from '../../context/ShopContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

/**
 * OrderReviewPrompt — shown inside a delivered order card.
 * For each item in the order, shows one of:
 *   - "Write a Review" button (eligible, not yet reviewed)
 *   - "You Reviewed" (already reviewed, with star display)
 *   - "Edit Review" if within 30 days
 *
 * Props:
 *   order     (object) — full order object
 *   productId (string) — specific product to check (optional: if omitted, checks all items)
 */
const OrderReviewPrompt = ({ order }) => {
  const { token } = useContext(ShopContext)
  const navigate  = useNavigate()

  // Map of productId → eligibility result
  const [eligibilityMap, setEligibilityMap] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchEligibility = useCallback(async () => {
    if (!token || !order?.items?.length) return

    // Only check for delivered orders
    if (order.status !== 'Delivered') { setLoading(false); return }

    try {
      const results = await Promise.allSettled(
        order.items.map(item =>
          axios.get(
            `${BACKEND_URL}/api/reviews/eligibility/${item._id}`,
            { headers: { token } }
          )
        )
      )

      const map = {}
      order.items.forEach((item, i) => {
        const result = results[i]
        if (result.status === 'fulfilled' && result.value.data.success) {
          map[item._id] = result.value.data
        }
      })
      setEligibilityMap(map)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }, [token, order])

  useEffect(() => { fetchEligibility() }, [fetchEligibility])

  // Only show for delivered orders
  if (order.status !== 'Delivered') return null
  if (loading) return null // don't flash while loading

  // Only show if at least one item has a relevant eligibility state
  const hasRelevant = order.items?.some(item => {
    const e = eligibilityMap[item._id]
    return e && (e.eligible || e.reason === 'ALREADY_REVIEWED')
  })
  if (!hasRelevant) return null

  return (
    <div className='mt-4 border-t border-green-100 pt-4'>
      <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3'>
        📝 Share Your Experience
      </p>
      <div className='space-y-2'>
        {order.items?.map(item => {
          const eligibility = eligibilityMap[item._id]
          if (!eligibility) return null

          return (
            <ReviewPromptItem
              key={item._id}
              item={item}
              eligibility={eligibility}
              order={order}
              navigate={navigate}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Per-item prompt row ─────────────────────────────────────────────────────
const ReviewPromptItem = ({ item, eligibility, order, navigate }) => {
  const goToReview = () => {
    // Navigate to product page and switch to reviews tab
    navigate(`/product/${item._id}?tab=reviews`)
  }

  if (eligibility.eligible) {
    return (
      <div className='flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5'>
        <img
          src={item.image?.[0]}
          alt={item.name}
          className='w-10 h-10 object-contain rounded border border-green-100 bg-white flex-shrink-0'
          loading='lazy'
        />
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium text-gray-900 truncate'>{item.name}</p>
          <p className='text-xs text-green-600'>How did it turn out?</p>
        </div>
        <button
          onClick={goToReview}
          className='flex-shrink-0 bg-black text-white text-xs px-3 py-1.5 rounded hover:bg-gray-800 transition-colors whitespace-nowrap'
        >
          Write Review ★
        </button>
      </div>
    )
  }

  if (eligibility.reason === 'ALREADY_REVIEWED') {
    const canEdit = eligibility.existingReview?.canEdit
    return (
      <div className='flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5'>
        <img
          src={item.image?.[0]}
          alt={item.name}
          className='w-10 h-10 object-contain rounded border border-gray-100 bg-white flex-shrink-0'
          loading='lazy'
        />
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium text-gray-900 truncate'>{item.name}</p>
          <div className='flex items-center gap-1'>
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} className={`text-xs ${s <= (eligibility.existingReview?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
            ))}
            <span className='text-xs text-gray-500 ml-1'>Reviewed</span>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={goToReview}
            className='flex-shrink-0 border border-gray-300 text-gray-600 text-xs px-3 py-1.5 rounded hover:bg-gray-100 transition-colors whitespace-nowrap'
          >
            Edit Review
          </button>
        )}
      </div>
    )
  }

  return null
}

export default OrderReviewPrompt
