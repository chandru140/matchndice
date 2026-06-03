import React, { useContext, useMemo } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'

const CartTotal = () => {
  const { currency, getCartAmount, delivery_fee } = useContext(ShopContext)

  // Compute once, not three times
  const subtotal = useMemo(() => getCartAmount(), [getCartAmount])
  const shipping = subtotal === 0 ? 0 : delivery_fee
  const total = subtotal + shipping

  return (
    <div className='w-full'>
      <div className='text-2xl'>
        <Title text1={'CART'} text2={'TOTALS'} />
      </div>

      <div className='flex flex-col gap-2 mt-2 text-sm'>
        <div className='flex justify-between'>
          <p className='text-gray-600'>Subtotal</p>
          <p className='font-medium'>{currency}{subtotal.toLocaleString('en-IN')}</p>
        </div>
        <hr />
        <div className='flex justify-between'>
          <p className='text-gray-600'>Shipping Fee</p>
          {shipping === 0
            ? <p className='text-green-600 font-medium'>FREE</p>
            : <p className='font-medium'>{currency}{shipping.toLocaleString('en-IN')}</p>
          }
        </div>
        <hr />
        <div className='flex justify-between font-semibold text-base pt-1'>
          <p>Total</p>
          <p>{currency}{total.toLocaleString('en-IN')}</p>
        </div>
        {subtotal > 0 && shipping > 0 && (
          <p className='text-xs text-gray-400 text-right'>Free shipping on orders above {currency}500</p>
        )}
      </div>
    </div>
  )
}

export default CartTotal