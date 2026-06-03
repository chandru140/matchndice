import React, { useState } from 'react'
import { useContext } from 'react'
import { ShopContext } from '../../context/ShopContext'
import { StarRow } from './ReviewSummary'
import axios from 'axios'
import { toast } from 'react-toastify'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

/**
 * ReviewCard — displays one review.
 * Props:
 *   review         (object) — review data from API
 *   currentUserToken (string|null)
 *   onVote         (fn) — called with (reviewId, upCount, downCount)
 */
const ReviewCard = ({ review, currentUserToken, onVote }) => {
  const { navigate } = useContext(ShopContext)
  const [voting,       setVoting]       = useState(false)
  const [lightboxImg,  setLightboxImg]  = useState(null)

  const upCount   = (review.helpfulVotes || []).filter(v => v.vote === 'up').length
  const downCount = (review.helpfulVotes || []).filter(v => v.vote === 'down').length

  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const handleVote = async (vote) => {
    if (!currentUserToken) {
      toast.info('Please login to vote on reviews.')
      navigate('/login')
      return
    }
    if (voting) return
    setVoting(true)
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/reviews/${review._id}/vote`,
        { vote },
        { headers: { token: currentUserToken } }
      )
      if (data.success) {
        onVote?.(review._id, data.upCount, data.downCount)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not record vote.')
    } finally {
      setVoting(false)
    }
  }

  return (
    <>
      <div className='border border-gray-200 rounded-xl p-5 bg-white hover:shadow-sm transition-shadow'>
        {/* Header row */}
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-center gap-2'>
            {/* Avatar initial */}
            <div className='w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0'>
              {(review.userName || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className='text-sm font-medium text-gray-900'>{review.userName || 'Customer'}</p>
              <p className='text-xs text-gray-400'>{formattedDate}</p>
            </div>
          </div>

          {/* Verified badge */}
          {review.isVerifiedPurchase && (
            <span className='flex-shrink-0 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium'>
              ✓ Verified Purchase
            </span>
          )}
        </div>

        {/* Star rating */}
        <div className='mt-3'>
          <StarRow rating={review.rating} size='sm' />
        </div>

        {/* Review title */}
        {review.title && (
          <p className='mt-2 font-semibold text-gray-900 text-sm'>{review.title}</p>
        )}

        {/* Review comment */}
        <p className='mt-1.5 text-sm text-gray-700 leading-relaxed'>{review.comment}</p>

        {/* Review photos */}
        {review.images && review.images.length > 0 && (
          <div className='flex gap-2 mt-3 flex-wrap'>
            {review.images.map((img, i) => (
              <button
                key={i}
                type='button'
                onClick={() => setLightboxImg(img)}
                className='w-16 h-16 border border-gray-200 rounded overflow-hidden hover:opacity-80 transition-opacity'
              >
                <img src={img} alt={`Review photo ${i + 1}`} className='w-full h-full object-cover' loading='lazy' />
              </button>
            ))}
          </div>
        )}

        {/* Admin reply */}
        {review.adminReply?.text && (
          <div className='mt-4 border-l-2 border-gray-300 pl-4 bg-gray-50 rounded-r py-2'>
            <p className='text-xs font-semibold text-gray-600 mb-1'>💬 Response from Match n Dice</p>
            <p className='text-sm text-gray-700'>{review.adminReply.text}</p>
            {review.adminReply.repliedAt && (
              <p className='text-xs text-gray-400 mt-0.5'>
                {new Date(review.adminReply.repliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        )}

        {/* Helpful votes */}
        <div className='mt-4 flex items-center gap-4'>
          <p className='text-xs text-gray-400'>Was this helpful?</p>
          <button
            onClick={() => handleVote('up')}
            disabled={voting}
            className='flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 disabled:opacity-50 transition-colors'
            aria-label='Helpful'
          >
            <ThumbUpIcon />
            <span>{upCount}</span>
          </button>
          <button
            onClick={() => handleVote('down')}
            disabled={voting}
            className='flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 disabled:opacity-50 transition-colors'
            aria-label='Not helpful'
          >
            <ThumbDownIcon />
            <span>{downCount}</span>
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className='fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4'
          onClick={() => setLightboxImg(null)}
        >
          <div className='relative max-w-2xl max-h-[90vh]'>
            <img src={lightboxImg} alt='Review photo' className='max-w-full max-h-[85vh] object-contain rounded-lg' />
            <button
              onClick={() => setLightboxImg(null)}
              className='absolute -top-3 -right-3 w-8 h-8 bg-white text-black rounded-full text-sm font-bold shadow-lg hover:bg-gray-100 flex items-center justify-center'
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const ThumbUpIcon = () => (
  <svg xmlns='http://www.w3.org/2000/svg' className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5' />
  </svg>
)

const ThumbDownIcon = () => (
  <svg xmlns='http://www.w3.org/2000/svg' className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5' />
  </svg>
)

export default ReviewCard
