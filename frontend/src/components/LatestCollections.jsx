import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'
import ProductItem from './ProductItem'

const LatestCollection = () => {
  const { products } = useContext(ShopContext)
  const [latestProducts, setLatestProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Show newest 10 products (products are already sorted by date desc in context)
    setLatestProducts(products.slice(0, 10))
    setLoading(false)
  }, [products])

  return (
    <div className='my-10'>
      <div className='text-center py-8 text-3xl'>
        <Title text1={'LATEST'} text2={'COLLECTIONS'} />
        <p className='w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600 mt-2'>
          Fresh arrivals — explore our newest personalized gifts, just added to the store.
        </p>
      </div>

      {loading ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
          {[...Array(10)].map((_, i) => (
            <div key={i} className='animate-pulse'>
              <div className='bg-gray-200 aspect-square rounded-sm mb-2' />
              <div className='h-3 bg-gray-200 rounded w-3/4 mb-1' />
              <div className='h-3 bg-gray-200 rounded w-1/2' />
            </div>
          ))}
        </div>
      ) : latestProducts.length === 0 ? (
        <p className='text-center text-gray-400 py-10'>No products available yet. Check back soon!</p>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
          {latestProducts.map(item => (
            <ProductItem
              key={item._id}
              id={item._id}
              image={item.image}
              name={item.name}
              price={item.price}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default LatestCollection
