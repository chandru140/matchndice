import React, { useState, useEffect, useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import { assets } from '../assets/frontend_assets/assets'
import CartTotal from '../components/CartTotal'
import { toast } from 'react-toastify'

const Cart = () => {
  const { products, currency, cartItems, updateQuantity, navigate, token, getCartCount } = useContext(ShopContext)
  const [cartData, setCartData] = useState([])

  // Build flat cart data array from nested cartItems map
  useEffect(() => {
    if (products.length === 0) return
    const tempData = []
    for (const itemId in cartItems) {
      for (const cartKey in cartItems[itemId]) {
        const entry = cartItems[itemId][cartKey]
        if (typeof entry === 'number' && entry > 0) {
          tempData.push({ _id: itemId, cartKey, size: cartKey, quantity: entry, customization: null })
        } else if (typeof entry === 'object' && entry.quantity > 0) {
          tempData.push({ _id: itemId, cartKey, size: entry.size, quantity: entry.quantity, customization: entry.customization })
        }
      }
    }
    setCartData(tempData)
  }, [cartItems, products])

  const handleRemove = (itemId, cartKey, name) => {
    updateQuantity(itemId, cartKey, 0)
    toast.info(`${name} removed from cart.`)
  }

  const handleQuantityChange = (itemId, cartKey, val, maxStock) => {
    const num = Number(val)
    // ✅ Cap at actual product stock, not a hardcoded 99
    if (num >= 1 && num <= (maxStock || 99)) updateQuantity(itemId, cartKey, num)
  }

  // ── Empty Cart ──────────────────────────────────────────────
  if (cartData.length === 0 && products.length > 0) {
    return (
      <div className='border-t pt-14 min-h-[70vh] flex flex-col items-center justify-center gap-4 text-gray-500'>
        <svg xmlns='http://www.w3.org/2000/svg' className='w-20 h-20 text-gray-200' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' />
        </svg>
        <p className='text-2xl font-medium text-gray-700'>Your cart is empty</p>
        <p className='text-sm text-gray-400'>Looks like you haven&apos;t added anything yet.</p>
        <button
          onClick={() => navigate('/collection')}
          className='bg-black text-white px-10 py-3 text-sm hover:bg-gray-800 transition-colors mt-2'
        >
          BROWSE PRODUCTS
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className='border-t pt-14'>
        <div className='text-2xl mb-3'>
          <Title text1={'YOUR'} text2={'CART'} />
        </div>

        {/* Cart Items */}
        <div>
          {cartData.map((item) => {
            const productData = products.find(p => p._id === item._id)
            if (!productData) return null

            // Price including customization
            let itemPrice = productData.price
            if (productData.isCustomizable && item.customization && productData.customizationFields) {
              itemPrice += productData.customizationFields
                .filter(f => item.customization[f.name])
                .reduce((sum, f) => sum + (f.priceModifier || 0), 0)
            }

            const lineTotal = itemPrice * item.quantity
            const isOutOfStock = productData.stock === 0

            return (
              <div
                key={item.cartKey}
                className={`py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4 ${isOutOfStock ? 'opacity-60' : ''}`}
              >
                <div className='flex items-start gap-4 sm:gap-6'>
                  <img
                    className='w-16 sm:w-20 object-contain border border-gray-100 rounded'
                    src={productData.image[0]}
                    alt={productData.name}
                    loading='lazy'
                    onError={e => { e.target.src = '/placeholder.png' }}
                  />
                  <div>
                    <p className='text-sm sm:text-base font-medium'>{productData.name}</p>

                    <div className='flex items-center flex-wrap gap-3 mt-1 text-sm'>
                      <p className='font-medium'>{currency}{itemPrice.toLocaleString('en-IN')}</p>
                      {item.size && item.size !== 'default' && (
                        <p className='px-2 py-0.5 border bg-slate-50 text-xs'>{item.size}</p>
                      )}
                      <p className='text-gray-400 text-xs'>
                        Total: {currency}{lineTotal.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Out of stock warning in cart */}
                    {isOutOfStock && (
                      <p className='text-red-500 text-xs mt-1'>⚠ This item is no longer available</p>
                    )}

                    {/* Customization preview */}
                    {item.customization && Object.keys(item.customization).length > 0 && (
                      <div className='mt-2 text-xs text-gray-600 bg-blue-50 px-2 py-1.5 rounded'>
                        <p className='font-semibold mb-0.5'>Customization:</p>
                        {Object.entries(item.customization).map(([key, value]) =>
                          value ? <p key={key} className='capitalize'>• {key}: <span className='font-medium'>{value}</span></p> : null
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className='flex items-center border border-gray-300 w-fit'>
                  <button
                    onClick={() => handleQuantityChange(item._id, item.cartKey, item.quantity - 1, productData.stock)}
                    disabled={item.quantity <= 1}
                    className='w-8 h-8 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 text-lg'
                    aria-label='Decrease quantity'
                  >
                    −
                  </button>
                  <input
                    type='number'
                    value={item.quantity}
                    min={1}
                    max={productData.stock || 99}
                    onChange={e => handleQuantityChange(item._id, item.cartKey, e.target.value, productData.stock)}
                    className='w-10 text-center text-sm border-x border-gray-300 py-1 outline-none'
                    aria-label='Quantity'
                  />
                  <button
                    onClick={() => handleQuantityChange(item._id, item.cartKey, item.quantity + 1, productData.stock)}
                    disabled={item.quantity >= (productData.stock || 99)}
                    className='w-8 h-8 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 text-lg'
                    aria-label='Increase quantity'
                  >
                    +
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(item._id, item.cartKey, productData.name)}
                  className='flex justify-end pr-2 sm:pr-4'
                  aria-label={`Remove ${productData.name} from cart`}
                >
                  <img className='w-4 sm:w-5 cursor-pointer hover:opacity-70 transition-opacity' src={assets.bin_icon} alt='Remove' />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cart Summary */}
      <div className='flex justify-end my-20'>
        <div className='w-full sm:w-[450px]'>
          <CartTotal />
          <div className='w-full text-end mt-4'>
            {!token ? (
              <div className='text-center'>
                <p className='text-sm text-gray-500 mb-3'>Please login to proceed to checkout</p>
                <button
                  onClick={() => navigate('/login', { state: { from: '/cart' } })}
                  className='bg-black text-white py-3 px-8 text-sm hover:bg-gray-800 transition-colors w-full'
                >
                  LOGIN TO CHECKOUT
                </button>
              </div>
            ) : (() => {
              // ✅ Block checkout if any item is out of stock
              const hasOOS = cartData.some(item => {
                const p = products.find(p => p._id === item._id)
                return p && p.stock === 0
              })
              return (
                <>
                  {hasOOS && (
                    <p className='text-sm text-red-500 mb-2'>⚠ Remove out-of-stock items before checking out.</p>
                  )}
                  <button
                    onClick={() => navigate('/place-order')}
                    disabled={cartData.length === 0 || hasOOS}
                    className='bg-black text-white my-4 py-4 px-6 w-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors tracking-widest'
                  >
                    PROCEED TO CHECKOUT ({getCartCount()} {getCartCount() === 1 ? 'item' : 'items'})
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
