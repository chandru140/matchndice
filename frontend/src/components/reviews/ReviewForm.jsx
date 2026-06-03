import React, { useState, useRef } from 'react'
import { useContext } from 'react'
import { ShopContext } from '../../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { StarRow } from './ReviewSummary'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
const MAX_COMMENT = 500
const MIN_COMMENT = 20

/**
 * ReviewForm — shown only when eligibility.reason === 'ELIGIBLE'
 * Props:
 *   productId (string)
 *   orderId   (string)
 *   onSubmitted (fn) — called with the created review object
 */
const ReviewForm = ({ productId, orderId, onSubmitted }) => {
  const { token } = useContext(ShopContext)

  const [rating,    setRating]    = useState(0)
  const [hovered,   setHovered]   = useState(0)
  const [title,     setTitle]     = useState('')
  const [comment,   setComment]   = useState('')
  const [images,    setImages]    = useState([])    // { file, preview }
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [newReview, setNewReview] = useState(null)
  const fileInputRef = useRef(null)

  const displayRating = hovered || rating

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || [])
    const remaining = 3 - images.length
    const toAdd = files.slice(0, remaining)

    toAdd.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image must be under 5MB.')
        return
      }
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImages(prev => [...prev, { file, preview: ev.target.result }])
      }
      reader.readAsDataURL(file)
    })

    // Reset file input so same file can be re-selected
    e.target.value = ''
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    if (rating === 0) {
      toast.error('Please select a star rating.')
      return
    }
    if (comment.trim().length < MIN_COMMENT) {
      toast.error(`Review must be at least ${MIN_COMMENT} characters.`)
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/reviews`,
        { productId, orderId, rating, title: title.trim(), comment: comment.trim() },
        { headers: { token } }
      )
      if (data.success) {
        setSubmitted(true)
        setNewReview(data.review)
        toast.success('Review submitted! Thank you 🎉')
        onSubmitted?.(data.review)
      } else {
        toast.error(data.message || 'Failed to submit review.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (submitted && newReview) {
    return (
      <div className='bg-green-50 border border-green-200 rounded-xl p-6 text-center'>
        <p className='text-3xl mb-2'>🎉</p>
        <p className='font-semibold text-green-800'>Thank you for your review!</p>
        <div className='flex justify-center mt-2'>
          <StarRow rating={newReview.rating} size='md' />
        </div>
        {newReview.comment && (
          <p className='text-sm text-green-700 mt-2 italic'>"{newReview.comment}"</p>
        )}
      </div>
    )
  }

  return (
    <div className='bg-gray-50 border border-gray-200 rounded-xl p-5'>
      {/* Verified badge */}
      <div className='flex items-center gap-2 mb-4'>
        <span className='bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200'>
          ✓ Verified Purchase — Share Your Experience
        </span>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>

        {/* Star selector */}
        <div>
          <label className='text-sm font-medium text-gray-700 block mb-1.5'>
            Your Rating <span className='text-red-500'>*</span>
          </label>
          <div className='flex items-center gap-1'>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type='button'
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className='text-3xl leading-none transition-transform hover:scale-125 cursor-pointer'
                aria-label={`Rate ${star} star`}
              >
                <span className={star <= displayRating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
              </button>
            ))}
            {displayRating > 0 && (
              <span className='text-sm text-gray-500 ml-2'>
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][displayRating]}
              </span>
            )}
          </div>
        </div>

        {/* Title (optional) */}
        <div>
          <label className='text-sm font-medium text-gray-700 block mb-1.5'>
            Review Title <span className='text-gray-400 font-normal'>(optional)</span>
          </label>
          <input
            type='text'
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={100}
            placeholder='Summarize your experience'
            className='w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black transition-colors'
          />
          <p className='text-xs text-gray-400 mt-0.5 text-right'>{title.length}/100</p>
        </div>

        {/* Comment */}
        <div>
          <label className='text-sm font-medium text-gray-700 block mb-1.5'>
            Your Review <span className='text-red-500'>*</span>
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value.slice(0, MAX_COMMENT))}
            placeholder={`Tell others about your experience (min ${MIN_COMMENT} characters)...`}
            rows={4}
            className='w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black transition-colors resize-none'
          />
          <div className='flex justify-between mt-0.5'>
            <p className={`text-xs ${comment.length < MIN_COMMENT ? 'text-orange-500' : 'text-green-600'}`}>
              {comment.length < MIN_COMMENT
                ? `${MIN_COMMENT - comment.length} more characters needed`
                : '✓ Good length'}
            </p>
            <p className='text-xs text-gray-400'>{comment.length}/{MAX_COMMENT}</p>
          </div>
        </div>

        {/* Photo upload (optional) */}
        <div>
          <label className='text-sm font-medium text-gray-700 block mb-1.5'>
            Photos <span className='text-gray-400 font-normal'>(optional, max 3)</span>
          </label>
          <div className='flex flex-wrap gap-2'>
            {images.map((img, idx) => (
              <div key={idx} className='relative w-20 h-20 rounded border border-gray-200 overflow-hidden group'>
                <img src={img.preview} alt='Preview' className='w-full h-full object-cover' />
                <button
                  type='button'
                  onClick={() => removeImage(idx)}
                  className='absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
                >
                  ✕
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-colors text-xs gap-1'
              >
                <span className='text-xl'>+</span>
                <span>Add photo</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            multiple
            className='hidden'
            onChange={handleImageUpload}
          />
        </div>

        {/* Submit */}
        <button
          type='submit'
          disabled={loading || rating === 0 || comment.trim().length < MIN_COMMENT}
          className='w-full sm:w-auto bg-black text-white px-8 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
        >
          {loading ? (
            <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> Submitting...</>
          ) : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}

export default ReviewForm
