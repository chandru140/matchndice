import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useState } from 'react'
import { useEffect } from 'react'
import Title from './Title'
import ProductItem from './ProductItem'

const RelatedProducts = ({category , subCategory}) => {

  const { products } = useContext(ShopContext)
  const [related , setRelated] = useState([])

  useEffect(() => {
    if(products.length > 0){
      let productCopy = products.slice();
      
      // Handle both populated objects and ID strings
      productCopy = productCopy.filter((item) => {
        const itemCatId = item.category && typeof item.category === 'object' ? item.category._id : item.category;
        const targetCatId = category && typeof category === 'object' ? category._id : category;
        return itemCatId === targetCatId;
      });

      productCopy = productCopy.filter((item) => {
        const itemSubCatId = item.subCategory && typeof item.subCategory === 'object' ? item.subCategory._id : item.subCategory;
        const targetSubCatId = subCategory && typeof subCategory === 'object' ? subCategory._id : subCategory;
        return itemSubCatId === targetSubCatId;
      });

     setRelated(productCopy.slice(0,5))
    }
  }, [products, category, subCategory])
  
  return (
    <div className='my-16'>
        <div className='text-center text-3xl py-2'>
            <Title text1={'RELATED'} text2={'PRODUCTS'}/>
        </div>

        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
            {related.map((item,index)=>(
                <ProductItem key={index} id={item._id} name={item.name} price={item.price} image={item.image}/>)
            )
            }
        </div>
    </div>
  )
}
export default RelatedProducts