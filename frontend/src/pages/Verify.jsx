import React, { useContext, useEffect, useRef } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

const Verify = () => {
    const { navigate, token, setCartItems, backendUrl } = useContext(ShopContext)
    const [searchParams] = useSearchParams()
    const hasVerified = useRef(false)

    const success = searchParams.get('success')
    const orderId = searchParams.get('orderId')

    const verifyPayment = async () => {
        // Prevent duplicate verification calls
        if (hasVerified.current) return
        hasVerified.current = true

        if (!token) {
            navigate('/login')
            return
        }

        if (!orderId) {
            toast.error('Invalid verification link.')
            navigate('/cart')
            return
        }

        try {
            // Note: userId is NOT taken from URL — the backend extracts it from the JWT
            const response = await axios.post(
                `${backendUrl}/api/order/verifyStripe`,
                { success, orderId },
                { headers: { token } }
            )

            if (response.data.success) {
                setCartItems({})
                toast.success('Payment verified! Your order has been placed.')
                navigate('/orders')
            } else {
                toast.error(response.data.message || 'Payment was not completed.')
                navigate('/cart')
            }
        } catch (error) {
            console.error('Payment verification error:', error)
            toast.error('Payment verification failed. Please contact support.')
            navigate('/cart')
        }
    }

    useEffect(() => {
        if (token !== undefined) {
            // Wait until token state is resolved (avoids calling before context loads)
            verifyPayment()
        }
    }, [token])

    return (
        <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
            <div className='w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin' />
            <p className='text-gray-600 text-sm'>Verifying your payment, please wait...</p>
            <p className='text-gray-400 text-xs'>Do not close or refresh this page.</p>
        </div>
    )
}

export default Verify