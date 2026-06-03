import React, { useEffect, useContext, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'

const BestSeller = () => {
  const { products } = useContext(ShopContext)
  const [bestSeller, setBestSeller] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const bestProducts = products.filter(item => item.bestseller)
    setBestSeller(bestProducts.slice(0, 5))
    setLoading(false)
  }, [products])

  return (
    <div className='my-10'>
      <div className='text-center py-8 text-3xl'>
        <Title text1={'BEST'} text2={'SELLERS'} />
        <p className='w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600 mt-2'>
          Our most loved and top-rated personalized gifts — chosen by thousands of happy customers.
        </p>
      </div>

      {loading ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='animate-pulse'>
              <div className='bg-gray-200 aspect-square rounded-sm mb-2' />
              <div className='h-3 bg-gray-200 rounded w-3/4 mb-1' />
              <div className='h-3 bg-gray-200 rounded w-1/2' />
            </div>
          ))}
        </div>
      ) : bestSeller.length === 0 ? (
        <p className='text-center text-gray-400 py-10'>No featured products yet.</p>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
          {bestSeller.map(item => (
            <ProductItem
              key={item._id}
              id={item._id}
              name={item.name}
              image={item.image}
              price={item.price}
              stock={item.stock}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default BestSeller
