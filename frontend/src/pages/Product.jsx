import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/frontend_assets/assets'
import RelatedProducts from '../components/RelatedProducts'

const Product = () => {

  const { productId } = useParams()
  const { products, currency , addToCart } = useContext(ShopContext)
  const [productData, setProductData] = useState(null)
  const [image, setImage] = useState('')
  const [size, setSize] = useState('')
  

  useEffect(() => {
    const product = products.find(item => item._id === productId)
    if (product) {
      setProductData(product)
      setImage(product.image[0])
    }
  }, [products, productId])

  if (!productData) return <div className="opacity-0"></div>

  return (
    <div className="border-t-2 pt-10 transition-opacity duration-500 opacity-100">
      <div className="flex flex-col sm:flex-row gap-12 sm:gap-16">

        {/* -------- Product Images -------- */}
        <div className="flex-1 flex flex-col-reverse sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.image.map((item, index) => (
              <img
                key={index}
                src={item}
                onClick={() => setImage(item)}
                className="w-[24%] sm:w-full sm:w-full sm:mb-3 flex-shrink-0"
                alt=""
              />
            ))}
          </div>

          <div className="w-full sm:w-[80%]">
            <img src={image} className="ml-2 w-full h-auto" alt="" />
          </div>
        </div>

        {/* -------- Product Info -------- */}
        <div className="flex-1">
          <h1 className="text-2xl font-medium mt-2">{productData.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-2">
            <img src={assets.star_icon} className="w-3.5" />
            <img src={assets.star_icon} className="w-3.5" />
            <img src={assets.star_icon} className="w-3.5" />
            <img src={assets.star_icon} className="w-3.5" />
            <img src={assets.star_dull_icon} className="w-3.5" />
            <p className="pl-2 text-sm">(122)</p>
          </div>

          {/* Price */}
          <p className="mt-4 text-3xl font-medium">
            {currency}{productData.price}
          </p>

          {/* Description */}
          <p className="mt-4 text-gray-500">
            {productData.description}
          </p>

          {/* Sizes */}
          <div className="mt-6">
            <p className="mb-3 font-medium">Select Size</p>
            <div className="flex gap-3 flex-wrap">
              {productData.sizes.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSize(item)}
                  className={`border px-4 py-2 ${
                    size === item ? 'border-orange-500 bg-orange-50' : 'bg-gray-100'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Cart */}
          <button onClick={()=>addToCart(productData._id , size)} className="mt-8 bg-black text-white px-8 py-3 text-sm active:bg-gray-700">
            Add to Cart
          </button>

          <hr className="mt-8" />

          {/* Policies */}
          <div className="mt-4 text-sm text-gray-500 flex flex-col gap-1">
            <p>✔ 100% Original</p>
            <p>✔ Cash on delivery available</p>
            <p>✔ Easy return & exchange within 7 days</p>
          </div>
        </div>

      </div>

      {/* Decription and review section */}
      <div className="mt-20">
        <div className='flex '>
          <p className='border px-5 py-3 text-sm'>Description</p>
          <p className='border px-5 py-3 text-sm ml-2'>Reviews (122)</p>
        </div>
        <div className='mt-2 flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500'>
          <p>An e commerce website is dummy </p>
          <p>Ecommer com3rfhjbrfjyrfuvyrfuberjkc dummyDummy data is fake, simulated information used as a placeholder in software development, testing, and demonstrations, mimicking real data without privacy risks, helping developers build, test, and showcase apps efficiently with realistic scenarios, and can be generated using online tools or AI like ChatGPT. </p>
        </div>
      </div>

      {/* Display related products */}
      <RelatedProducts category={productData.category} subCategory={productData.subCategory}/>
    </div>
  )
}

export default Product
