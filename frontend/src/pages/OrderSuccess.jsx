import React, { useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { useContext } from 'react'

const OrderSuccess = () => {
  const location = useLocation()
  const { navigate } = useContext(ShopContext)
  const orderId = location.state?.orderId

  // Redirect to orders if landed here without state (direct URL access)
  useEffect(() => {
    document.title = 'Order Confirmed! | Match n Dice'
    return () => { document.title = 'Match n Dice – Personalized Gifting' }
  }, [])

  return (
    <div className='min-h-[80vh] flex items-center justify-center px-4'>
      <div className='max-w-md w-full text-center'>

        {/* Success Animation */}
        <div className='flex justify-center mb-6'>
          <div className='w-24 h-24 rounded-full bg-green-100 flex items-center justify-center'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='w-12 h-12 text-green-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
            </svg>
          </div>
        </div>

        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Order Confirmed!</h1>
        <p className='text-gray-500 mb-2'>
          Thank you for shopping with Match n Dice. 🎉
        </p>
        <p className='text-gray-400 text-sm mb-6'>
          We&apos;ll send a confirmation to your email shortly.
        </p>

        {/* Order ID */}
        {orderId && (
          <div className='bg-gray-50 border border-gray-200 rounded-lg px-6 py-4 mb-8'>
            <p className='text-xs text-gray-500 mb-1'>Your Order ID</p>
            <p className='text-lg font-bold tracking-widest text-black'>
              #{typeof orderId === 'string' ? orderId.slice(-8).toUpperCase() : 'CONFIRMED'}
            </p>
          </div>
        )}

        {/* What happens next */}
        <div className='text-left bg-blue-50 rounded-lg p-4 mb-8 text-sm text-blue-800'>
          <p className='font-semibold mb-2'>What happens next?</p>
          <ol className='list-decimal list-inside space-y-1 text-blue-700'>
            <li>Our team will review and confirm your order</li>
            <li>Customization work begins within 24 hours</li>
            <li>You&apos;ll receive a design preview via WhatsApp</li>
            <li>Product is shipped after your approval</li>
          </ol>
        </div>

        {/* CTA Buttons */}
        <div className='flex flex-col sm:flex-row gap-3'>
          <button
            onClick={() => navigate('/orders')}
            className='flex-1 bg-black text-white py-3 text-sm font-medium hover:bg-gray-800 transition-colors'
          >
            VIEW MY ORDERS
          </button>
          <Link
            to='/collection'
            className='flex-1 border border-gray-300 text-gray-700 py-3 text-sm font-medium hover:bg-gray-50 transition-colors text-center'
          >
            CONTINUE SHOPPING
          </Link>
        </div>

        {/* WhatsApp support link */}
        <p className='mt-6 text-xs text-gray-400'>
          Questions?{' '}
          <a
            href='https://wa.me/919004140139'
            target='_blank'
            rel='noopener noreferrer'
            className='text-green-600 font-medium hover:underline'
          >
            Chat with us on WhatsApp
          </a>
        </p>
      </div>
    </div>
  )
}

export default OrderSuccess
