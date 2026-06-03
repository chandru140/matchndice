import React, { useEffect, useCallback } from 'react'

/**
 * SessionWarningModal — shown 2 minutes before auto-logout.
 *
 * Props:
 *  - countdown (number)  : seconds remaining
 *  - onStayLoggedIn (fn) : reset timer and close modal
 *  - onLogoutNow (fn)    : immediately logout
 */
const SessionWarningModal = ({ countdown, onStayLoggedIn, onLogoutNow }) => {
  const minutes = Math.floor(countdown / 60)
  const seconds = String(countdown % 60).padStart(2, '0')

  // Allow Esc to trigger "Stay Logged In"
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onStayLoggedIn?.()
  }, [onStayLoggedIn])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm'
      role='dialog'
      aria-modal='true'
      aria-labelledby='session-warning-title'
    >
      <div className='bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center animate-[fadeIn_0.2s_ease]'>
        {/* Warning Icon */}
        <div className='flex justify-center mb-4'>
          <div className='w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-8 h-8 text-amber-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' />
            </svg>
          </div>
        </div>

        <h2 id='session-warning-title' className='text-xl font-bold text-gray-900 mb-2'>
          Session Expiring Soon
        </h2>
        <p className='text-gray-500 text-sm mb-4'>
          You&apos;ve been inactive. Your session will expire in:
        </p>

        {/* Countdown Timer */}
        <div className='text-4xl font-mono font-bold text-red-500 mb-6'>
          {minutes}:{seconds}
        </div>

        <div className='flex flex-col gap-3'>
          <button
            onClick={onStayLoggedIn}
            className='w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors'
          >
            Stay Logged In
          </button>
          <button
            onClick={onLogoutNow}
            className='w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors'
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionWarningModal
