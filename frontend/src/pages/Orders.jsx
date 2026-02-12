import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import axios from 'axios'

const Orders = () => {

  const { backendUrl , token , currency} = useContext(ShopContext)
  const [orderData , setOrderData] = useState([])

  const fetchOrderData = async () => {
    try {
      if(!token){
        return null
      }
      const response = await axios.post(backendUrl + '/api/order/userorders' , {} , {headers:{token}})

      if(response.data.success){
        let allOrdersData =[]
        setOrderData(response.data.orders)
      }
        
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => { 
    fetchOrderData()
  }, [token])

  return (
    <div className='border-t pt-16'>
      <div className='text-2xl '>
        <Title text1={'MY'} text2={'ORDERS'}/>
      </div>
        {
          orderData.map((order,index) => (
            <div key={index} className='py-4 border-t border-b text-gray-700'>
              <div className='text-sm mb-3'>
                <p className='font-medium'>Order #{index + 1}</p>
                <p className='text-xs text-gray-500'>Date: <span>{new Date(order.date).toDateString()}</span></p>
                <p className='text-xs text-gray-500'>Payment: <span>{order.paymentMethod}</span> - {order.payment ? 'Paid' : 'Pending'}</p>
                <p className='text-xs text-gray-500'>Status: <span className='text-green-600'>{order.status}</span></p>
              </div>
              
              {order.items && order.items.map((item, itemIndex) => (
                <div key={itemIndex} className='py-3 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                  <div className='flex items-start gap-6 text-sm'>
                    <img className='w-16 sm:w-20' src={item.image?.[0]} alt="" />
                    <div>
                      <p className='text-xs sm:text-base font-medium'>{item.name}</p>
                      <div className='flex items-center gap-3 mt-2 text-base text-gray-700'>
                        <p>{currency}{item.price}</p>
                        <p>Quantity: {item.quantity}</p>
                        <p className='px-2 sm:px-3 sm:py-1 border bg-slate-50'>Size: {item.size}</p>
                      </div>
                    </div>
                  </div>

                  <div className='md:w-1/2 flex justify-between'>
                    <div className='flex items-center gap-2'>
                      <p className='min-w-2 h-2 bg-green-500 rounded-full'></p>
                      <p className='text-xs sm:text-base font-medium'>{order.status}</p>
                    </div>

                    <button onClick={fetchOrderData} className='border px-4 py-2 text-sm font-medium rounded-sm'>
                      Track Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        }

    </div>
  )
}

export default Orders
