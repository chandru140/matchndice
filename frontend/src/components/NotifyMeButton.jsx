import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

/**
 * NotifyMeButton — shown on out-of-stock products.
 * Collects customer email and calls POST /api/notify-me.
 *
 * Props:
 *   productId (string) — MongoDB _id of the product
 *   productName (string) — used in success/error messages
 */
const NotifyMeButton = ({ productId, productName }) => {
  const [showForm,   setShowForm]   = useState(false)
  const [email,      setEmail]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    try {
      const { data } = await axios.post(BACKEND_URL + '/api/notify-me', { productId, email })
      if (data.success) {
        setSubscribed(true)
        toast.success(data.message)
      } else {
        toast.error(data.message || 'Subscription failed.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (subscribed) {
    return (
      <div className='flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm'>
        <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4 flex-shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
        </svg>
        <span>We&apos;ll notify you when <strong>{productName}</strong> is back in stock!</span>
      </div>
    )
  }

  return (
    <div className='mt-4'>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className='flex items-center gap-2 border border-gray-400 text-gray-700 px-5 py-2.5 text-sm hover:bg-gray-100 transition-colors w-full justify-center'
        >
          <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
          </svg>
          Notify Me When Available
        </button>
      ) : (
        <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
          <p className='text-sm text-gray-600'>Enter your email to be notified when this is back in stock:</p>
          <div className='flex gap-2'>
            <input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='your@email.com'
              required
              autoFocus
              className='flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black transition-colors'
            />
            <button
              type='submit'
              disabled={loading}
              className='bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-60 transition-colors rounded flex items-center gap-1.5'
            >
              {loading ? <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' /> : null}
              {loading ? 'Saving...' : 'Notify Me'}
            </button>
            <button
              type='button'
              onClick={() => setShowForm(false)}
              className='text-gray-400 hover:text-gray-600 px-2'
            >
              ✕
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default NotifyMeButton
