import React from 'react'

/**
 * ReviewSummary — shows avg rating, star bars, verified badge.
 * Props: summary { avgRating, totalReviews, distribution { 5,4,3,2,1 } }
 */
const ReviewSummary = ({ summary }) => {
  if (!summary || summary.totalReviews === 0) return null

  const { avgRating, totalReviews, distribution } = summary

  return (
    <div className='bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6'>
      <div className='flex flex-col sm:flex-row gap-6 items-start sm:items-center'>

        {/* Big number + stars */}
        <div className='flex flex-col items-center sm:items-start flex-shrink-0'>
          <p className='text-5xl font-bold text-gray-900 leading-none'>{avgRating.toFixed(1)}</p>
          <StarRow rating={avgRating} size='lg' />
          <p className='text-xs text-gray-500 mt-1'>
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </p>
          <div className='mt-2 flex items-center gap-1 bg-green-50 border border-green-200 rounded-full px-2 py-0.5'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-3 h-3 text-green-600' viewBox='0 0 20 20' fill='currentColor'>
              <path fillRule='evenodd' d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
            </svg>
            <span className='text-xs text-green-700 font-medium'>Verified Purchases Only</span>
          </div>
        </div>

        {/* Star distribution bars */}
        <div className='flex-1 w-full space-y-1.5'>
          {[5, 4, 3, 2, 1].map(star => {
            const count   = distribution[star] || 0
            const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
            return (
              <div key={star} className='flex items-center gap-2'>
                <span className='text-xs text-gray-600 w-6 text-right flex-shrink-0'>{star}★</span>
                <div className='flex-1 bg-gray-200 rounded-full h-2 overflow-hidden'>
                  <div
                    className='h-2 rounded-full bg-yellow-400 transition-all duration-500'
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className='text-xs text-gray-500 w-8 flex-shrink-0'>{percent}%</span>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

// ── Shared StarRow helper (exported for reuse) ─────────────────────────────
export const StarRow = ({ rating = 0, size = 'sm', interactive = false, onRate }) => {
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' }
  return (
    <div className={`flex items-center gap-0.5 ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type='button'
          onClick={() => interactive && onRate?.(star)}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} leading-none`}
          aria-label={`${star} star`}
          tabIndex={interactive ? 0 : -1}
        >
          <span className={star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  )
}

export default ReviewSummary
