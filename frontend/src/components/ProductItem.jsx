import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

const ProductItem = React.memo(({ id, image, name, price, stock }) => {
  const { currency, addToCart, cartItems, navigate } = useContext(ShopContext)

  const isOutOfStock = stock === 0
  const isInCart = cartItems[id] && Object.keys(cartItems[id]).length > 0

  const handleAdd = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    const ok = await addToCart(id)
    if (ok) toast.success(`${name} added to cart!`, { icon: '🛒' })
  }

  return (
    <Link
      className={`text-gray-700 cursor-pointer border border-gray-200 rounded-sm block hover:shadow-md transition-shadow group relative ${isOutOfStock ? 'opacity-60' : ''}`}
      to={`/product/${id}`}
    >
      <div className='overflow-hidden aspect-square bg-white flex items-center justify-center p-3 relative'>
        <img
          className={`hover:scale-105 transition ease-in-out max-w-full max-h-full object-contain ${isOutOfStock ? 'grayscale' : ''}`}
          src={Array.isArray(image) ? image[0] : image}
          alt={name}
          loading='lazy'
          onError={e => { e.target.src = '/placeholder.png' }}
        />

        {/* Out of Stock overlay */}
        {isOutOfStock && (
          <div className='absolute inset-0 bg-white/70 flex items-center justify-center'>
            <span className='bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full border border-red-200'>
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className='p-3'>
        <p className='pb-1 text-sm truncate'>{name}</p>
        <p className='text-sm font-medium'>{currency}{Number(price).toLocaleString('en-IN')}</p>
      </div>

      {/* Quick Add to Cart (hover, only when in stock) */}
      {!isOutOfStock && (
        <button
          onClick={handleAdd}
          className='absolute bottom-0 left-0 right-0 bg-black text-white text-xs py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-b-sm'
          aria-label={isInCart ? 'Already in cart' : 'Add to cart'}
        >
          {isInCart ? 'IN CART ✓' : '+ ADD TO CART'}
        </button>
      )}
    </Link>
  )
})

ProductItem.displayName = 'ProductItem'

export default ProductItem
