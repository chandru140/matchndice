import React, { useContext, useState } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/frontend_assets/assets'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const PlaceOrder = () => {
  const {navigate , backendUrl , token , cartItems , setCartItems , getCartAmount , products , delivery_fee } = useContext(ShopContext)
  const [method , setMethod] = useState('cod')
  const [formData , setFormData] = useState({
    firstName : "",
    lastName : "",
    email : "",
    street : "",
    city : "",
    state : "",
    zipCode : "",
    country : "",
    phone : ""
  })

  const onChangeHandler = (event) => {
    const name = event.target.name
    const value = event.target.value
    setFormData(data => ({...data , [name] : value}))
  }

  const initPay = (order) => {
    const options = {
      key : import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount : order.amount,
      currency : order.currency,
      name : "Order Payment for ecommerce ",
      description : "Online Payment",
      order_id : order.id,
      handler : async(response) => {
        console.log(response)
        try{
          const {data} = await axios.post(backendUrl + '/api/order/verifyRazorpay', response , {headers : {token}})
          if(data.success){
            navigate('/orders')
            setCartItems({})
          }else{
            toast.error(data.message)
          }

        }catch(error){
          toast.error(error.message)
        }
      }
    } 
    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try{
      let orderItems = []
      for(const items in cartItems){
        for(const size in cartItems[items]){
          if(cartItems[items][size] > 0){
            const itemInfo = structuredClone(products.find(product => product._id === items))
            if(itemInfo){
              itemInfo.size = size
              itemInfo.quantity = cartItems[items][size]
              orderItems.push(itemInfo)
            }
          }
        }
      }

      const totalAmount = getCartAmount();
      const deliveryFee = delivery_fee;
      const finalAmount = totalAmount + deliveryFee;
      
      console.log("Cart Amount:", totalAmount);
      console.log("Delivery Fee:", deliveryFee);
      console.log("Final Amount:", finalAmount);
      console.log("Order Items:", orderItems);

      let orderData = {
        address : formData,
        items : orderItems,
        amount : finalAmount,
        paymentMethod : method.toUpperCase()
      }
      
      console.log("Order Data to send:", orderData);

      switch(method){
          //api calling for cod
          case 'cod' : 
            const response = await axios.post(backendUrl + '/api/order/place' , orderData , {headers : {token}})
            if(response.data.success){
              setCartItems({})
              navigate('/orders')
            }else{
              toast.error(response.data.message)
            }
          break;

          case 'stripe' : 
            const responseStripe = await axios.post(backendUrl + '/api/order/stripe' , orderData , {headers : {token}})
            if(responseStripe.data.success){
              const {session_url} = responseStripe.data
              window.location.href = session_url
            }else{
              toast.error(responseStripe.data.message)
            }
          break;

          case 'razorpay' : 
            const responseRazorpay = await axios.post(backendUrl + '/api/order/razorpay' , orderData , {headers : {token}})
            if(responseRazorpay.data.success){
              initPay(responseRazorpay.data.order)
            }else{
              toast.error(responseRazorpay.data.message)
            }
          break;

          default : 
            
          break;
        }
      
    }catch(error){
        console.log(error)
        toast.error(error.message)
    }
  }

  

  return (
    <div>
      <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-top'>
        {/*-----------------------Left Side---------------------------*/}
        <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>

              <div className='text-xl sm:text-2xl my-3'>
                <Title text1={'DELIVERY'} text2={'INFORMATION'}/>
              </div>

              <div className='flex gap-3'>
                <input required onChange={onChangeHandler} value={formData.firstName} name='firstName' className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='First Name'/>
                <input required onChange={onChangeHandler} value={formData.lastName} name='lastName' className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Last Name'/>
              </div>

              <input required onChange={onChangeHandler} value={formData.email} name='email' className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="email" placeholder='Email Address' />
              <input required onChange={onChangeHandler} value={formData.street} name='street' className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Street' />
          
              <div className='flex gap-3'>
                <input required onChange={onChangeHandler} value={formData.city} name='city' className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='City'/>
                <input required onChange={onChangeHandler} value={formData.state} name='state' className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='State'/>
              </div>

              <div className='flex gap-3'>
                <input required onChange={onChangeHandler} value={formData.zipCode} name='zipCode' className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="number" placeholder='Zip Code'/>
                <input required onChange={onChangeHandler} value={formData.country} name='country' className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Country'/>
              </div>

              <input required onChange={onChangeHandler} value={formData.phone} name='phone' className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="number" placeholder='Phone Number'/>
        </div>

        <div className='mt-8'>

            <div className='mt-8 min-w-80'>
              <CartTotal/>
            </div>

            <div className='mt-12'>
                <Title text1={'PAYMENT'} text2={'METHOD'} />
                {/*-------------------------Payment Method---------------------------*/}
                <div className='flex gap-3 flex-col lg:flex-row'>
                  <div onClick={()=>setMethod('stripe')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                    <p className={`min-w-3.5 h-3.5 border rounded-full  ${method === 'stripe' ? 'bg-green-500' : ''}`}></p>
                    <img className='h-5 mx-4 ' src={assets.stripe_logo} alt="" />   
                  </div>

                  <div onClick={()=>setMethod('razorpay')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                    <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'razorpay' ? 'bg-green-500' : ''}`}></p>
                    <img className='h-5 mx-4 ' src={assets.razorpay_logo} alt="" />   
                  </div>

                  <div onClick={()=>setMethod('cod')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                    <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-green-500' : ''}`}></p>
                    <p className='text-gray-500 text-sm font-medium mx-4'>CASH ON DELIVERY</p> 
                  </div>
                </div>

               <div className='w-full text-end mt-8'>
                <button type='submit' className='bg-black text-white px-16 py-3 text-sm'>PLACE ORDER</button>
               </div>
            </div>
        </div>

      </form>
    </div>
  )
}

export default PlaceOrder
