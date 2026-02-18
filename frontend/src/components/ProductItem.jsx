import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'

const ProductItem = ({id , image , name , price }) => {
  
    const {currency} = useContext(ShopContext)

    return (
    <Link className='text-gray-700 cursor-pointer border border-gray-200 rounded-sm block hover:shadow-md transition-shadow' to={`/product/${id}`}>
        <div className='overflow-hidden aspect-square bg-gray-100'>
            <img className='hover:scale-110 transition ease-in-out w-full h-full object-cover' src={image[0]} alt={name} loading="lazy" />
        </div>
        <div className='p-3'>
            <p className='pb-1 text-sm truncate'>{name}</p>
            <p className='text-sm font-medium'>{currency}{price}</p>
        </div>
    </Link>
  )
}

export default ProductItem
