import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { useContext } from 'react'
import { ShopContext } from '../../context/ShopContext'
import { saveRedirectIntent } from '../../utils/safeRedirect'
import ReviewSummary  from './ReviewSummary'
import ReviewForm     from './ReviewForm'
import ReviewCard     from './ReviewCard'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

/**
 * ReviewSection — full reviews UI for a product page.
 * Props: productId (string), productName (string)
 */
const ReviewSection = ({ productId, productName }) => {
  const { token, navigate } = useContext(ShopContext)

  const [eligibility,  setEligibility]  = useState(null)   // null = loading
  const [reviews,      setReviews]      = useState([])
  const [summary,      setSummary]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [sort,         setSort]         = useState('recent')
  const [filterRating, setFilterRating] = useState('')
  const [page,         setPage]         = useState(1)
  const [totalPages,   setTotalPages]   = useState(1)
  const [loadingMore,  setLoadingMore]  = useState(false)

  // ── Fetch eligibility (only when logged in) ──────────────────────────
  const fetchEligibility = useCallback(async () => {
    if (!token || !productId) return
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/reviews/eligibility/${productId}`,
        { headers: { token } }
      )
      setEligibility(data)
    } catch {
      setEligibility(null)
    }
  }, [token, productId])

  // ── Fetch reviews ────────────────────────────────────────────────────
  const fetchReviews = useCallback(async (pageNum = 1, append = false) => {
    if (!productId) return
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({ sort, page: pageNum, limit: 5 })
      if (filterRating) params.set('rating', filterRating)

      const { data } = await axios.get(
        `${BACKEND_URL}/api/reviews/product/${productId}?${params}`
      )
      if (data.success) {
        setReviews(prev => append ? [...prev, ...data.reviews] : data.reviews)
        setSummary(data.summary)
        setTotalPages(data.pages)
        setPage(pageNum)
      }
    } catch {
      // fail silently for reviews
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [productId, sort, filterRating])

  useEffect(() => { fetchEligibility() }, [fetchEligibility])
  useEffect(() => { fetchReviews(1) },    [fetchReviews])

  // ── After successful review submission ───────────────────────────────
  const handleReviewSubmitted = (newReview) => {
    setReviews(prev => [newReview, ...prev])
    fetchEligibility()   // re-check: now "already reviewed"
    fetchReviews(1)      // refresh to get updated summary
  }

  const handleVoteUpdate = (reviewId, upCount, downCount) => {
    setReviews(prev =>
      prev.map(r => r._id === reviewId
        ? { ...r, helpfulVotes: Array(upCount).fill({ vote: 'up' }).concat(Array(downCount).fill({ vote: 'down' })) }
        : r
      )
    )
  }

  const handleLoginRedirect = (reason = 'write_review') => {
    saveRedirectIntent(window.location.href, reason)
    navigate('/login')
  }

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchReviews(page + 1, true)
    }
  }

  // ── Render write-review CTA based on eligibility ─────────────────────
  const renderCTA = () => {
    // Guest
    if (!token) {
      return (
        <div className='bg-gray-50 border border-gray-200 rounded-xl p-6 text-center'>
          <p className='text-gray-600 mb-3 text-sm'>Login to write a verified review</p>
          <button
            onClick={() => handleLoginRedirect('write_review')}
            className='bg-black text-white px-5 py-2 text-sm hover:bg-gray-800 transition-colors'
          >
            Login to Write a Review
          </button>
        </div>
      )
    }

    // Loading eligibility
    if (!eligibility) {
      return <div className='h-16 bg-gray-100 animate-pulse rounded-xl' />
    }

    switch (eligibility.reason) {
      case 'NOT_PURCHASED':
        return (
          <div className='bg-gray-50 border border-gray-200 rounded-xl p-6 text-center'>
            <p className='text-gray-600 text-sm mb-1'>Purchase this product to leave a review</p>
            <p className='text-gray-400 text-xs mb-3'>Only verified buyers can write reviews</p>
            <button onClick={() => navigate('/collection')} className='bg-black text-white px-5 py-2 text-sm'>
              Shop Now
            </button>
          </div>
        )

      case 'NOT_DELIVERED':
        return (
          <div className='bg-blue-50 border border-blue-200 rounded-xl p-5'>
            <p className='font-medium text-blue-800 text-sm'>📦 Your order is on its way!</p>
            <p className='text-blue-600 text-xs mt-1'>
              You can review this product once it&apos;s delivered.
              {eligibility.orderStatus && ` Current status: ${eligibility.orderStatus}.`}
            </p>
            <div className='flex items-center gap-1 mt-3'>
              {['Placed', 'Shipped', 'Delivered'].map((step, i) => {
                const active = i === 1 && eligibility.orderStatus === 'Shipped'
                return (
                  <React.Fragment key={step}>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                      {step}
                    </span>
                    {i < 2 && <div className='flex-1 h-px bg-blue-200' />}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        )

      case 'ALREADY_REVIEWED':
        return (
          <div className='bg-green-50 border border-green-200 rounded-xl p-5'>
            <p className='font-medium text-green-800 text-sm'>✓ You reviewed this product</p>
            <div className='flex items-center gap-1 mt-1'>
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className={`text-lg ${s <= eligibility.existingReview?.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
              ))}
            </div>
            {eligibility.existingReview?.canEdit && (
              <p className='text-green-600 text-xs mt-1'>You can edit your review within 30 days.</p>
            )}
          </div>
        )

      case 'ELIGIBLE':
        return (
          <ReviewForm
            productId={productId}
            orderId={eligibility.orderId}
            onSubmitted={handleReviewSubmitted}
          />
        )

      default:
        return null
    }
  }

  return (
    <div id='reviews' className='mt-20'>
      {/* Section header */}
      <div className='flex items-baseline gap-3 mb-6'>
        <h2 className='text-xl font-semibold text-gray-900'>Customer Reviews</h2>
        {summary?.totalReviews > 0 && (
          <span className='text-sm text-gray-500'>({summary.totalReviews} reviews)</span>
        )}
      </div>

      {/* Summary */}
      {summary && <ReviewSummary summary={summary} />}

      {/* Write-a-review CTA */}
      <div className='my-6'>
        <h3 className='text-sm font-semibold text-gray-700 mb-3'>Share Your Experience</h3>
        {renderCTA()}
      </div>

      {/* Sort + filter controls */}
      {(reviews.length > 0 || filterRating) && (
        <div className='flex flex-wrap gap-3 mb-4 items-center'>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className='border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-black bg-white'
          >
            <option value='recent'>Most Recent</option>
            <option value='highest'>Highest Rated</option>
            <option value='lowest'>Lowest Rated</option>
          </select>
          <select
            value={filterRating}
            onChange={e => setFilterRating(e.target.value)}
            className='border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-black bg-white'
          >
            <option value=''>All Stars</option>
            {[5, 4, 3, 2, 1].map(r => (
              <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>
            ))}
          </select>
          {filterRating && (
            <button onClick={() => setFilterRating('')} className='text-xs text-gray-400 hover:text-black underline'>
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className='space-y-3'>
          {[1, 2].map(i => <div key={i} className='h-32 bg-gray-100 rounded-xl animate-pulse' />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className='text-center py-12 text-gray-400'>
          <p className='text-4xl mb-3'>⭐</p>
          <p className='font-medium text-gray-600'>No reviews yet for {productName}</p>
          <p className='text-sm mt-1'>Be the first to share your experience!</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {reviews.map(review => (
            <ReviewCard
              key={review._id}
              review={review}
              currentUserToken={token}
              onVote={handleVoteUpdate}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {page < totalPages && !loading && (
        <div className='text-center mt-6'>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className='border border-gray-300 px-6 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-60'
          >
            {loadingMore
              ? <><span className='inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2' />Loading...</>
              : 'Load More Reviews'
            }
          </button>
        </div>
      )}
    </div>
  )
}

export default ReviewSection
