import React, { useContext, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

const verify = () => {

    const {navigate , token , setCartItems , backendUrl} = useContext(ShopContext)
    const [searchParams , setSearchParams] = useSearchParams()

    const success = searchParams.get("success")
    const orderId = searchParams.get("orderId")
    const userId = searchParams.get("userId")

    const verifyPayment = async () => {
        try {
            if(!token){
                navigate("/login")
            }

            const response = await axios.post(`${backendUrl}/api/order/verifyStripe`, {
                success,
                orderId,
                userId
            } , {headers:{token}} );

            if (response.data.success) {
                setCartItems({})
                navigate("/orders")
            }else{
                navigate("/cart")
            }

        } catch (error) {
            console.error("Payment verification failed:", error);
            toast.error("Payment verification failed")
        }
    };

    useEffect(() => {
        if (success === "true") {
            verifyPayment();
        }
    }, [token]);

  return (
    <div>

    </div>
  )
}

export default verify