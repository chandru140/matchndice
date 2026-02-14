import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/frontend_assets/assets'
import RelatedProducts from '../components/RelatedProducts'

const Product = () => {

  const { productId } = useParams()
  const { products, currency } = useContext(ShopContext)
  const [productData, setProductData] = useState(null)
  const [image, setImage] = useState('')
  const [size, setSize] = useState('')
  const [customization, setCustomization] = useState({})
  const [customizationPrice, setCustomizationPrice] = useState(0)
  

  useEffect(() => {
    const product = products.find(item => item._id === productId)
    if (product) {
      setProductData(product)
      setImage(product.image[0])
      // Initialize customization state
      setCustomization({})
      setCustomizationPrice(0)
    }
  }, [products, productId])

  // Calculate customization price whenever customization changes
  useEffect(() => {
    if (productData && productData.isCustomizable && productData.customizationFields) {
      const totalPrice = productData.customizationFields
        .filter(field => customization[field.name])
        .reduce((sum, field) => sum + (field.priceModifier || 0), 0)
      setCustomizationPrice(totalPrice)
    }
  }, [customization, productData])

  const handleCustomizationChange = (fieldName, value) => {
    setCustomization(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const renderCustomizationField = (field) => {
    switch (field.type) {
      case 'dropdown':
        return (
          <div key={field.name} className="mt-4">
            <p className="mb-2 font-medium">{field.label || field.name}</p>
            <select
              value={customization[field.name] || ''}
              onChange={(e) => handleCustomizationChange(field.name, e.target.value)}
              className="border px-4 py-2 w-full max-w-md"
            >
              <option value="">Select {field.label || field.name}</option>
              {field.options && field.options.map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
            {field.priceModifier > 0 && (
              <p className="text-sm text-gray-500 mt-1">+{currency}{field.priceModifier}</p>
            )}
          </div>
        )
      
      case 'text':
        return (
          <div key={field.name} className="mt-4">
            <p className="mb-2 font-medium">{field.label || field.name}</p>
            <input
              type="text"
              value={customization[field.name] || ''}
              onChange={(e) => handleCustomizationChange(field.name, e.target.value)}
              maxLength={field.maxLength || 50}
              placeholder={`Enter ${field.label || field.name}`}
              className="border px-4 py-2 w-full max-w-md"
            />
            {field.maxLength && (
              <p className="text-xs text-gray-400 mt-1">
                {(customization[field.name] || '').length}/{field.maxLength} characters
              </p>
            )}
            {field.priceModifier > 0 && (
              <p className="text-sm text-gray-500 mt-1">+{currency}{field.priceModifier}</p>
            )}
          </div>
        )
      
      case 'textarea':
        return (
          <div key={field.name} className="mt-4">
            <p className="mb-2 font-medium">{field.label || field.name}</p>
            <textarea
              value={customization[field.name] || ''}
              onChange={(e) => handleCustomizationChange(field.name, e.target.value)}
              maxLength={field.maxLength || 200}
              placeholder={`Enter ${field.label || field.name}`}
              className="border px-4 py-2 w-full max-w-md h-24"
            />
            {field.maxLength && (
              <p className="text-xs text-gray-400 mt-1">
                {(customization[field.name] || '').length}/{field.maxLength} characters
              </p>
            )}
            {field.priceModifier > 0 && (
              <p className="text-sm text-gray-500 mt-1">+{currency}{field.priceModifier}</p>
            )}
          </div>
        )
      
      case 'radio':
        return (
          <div key={field.name} className="mt-4">
            <p className="mb-2 font-medium">{field.label || field.name}</p>
            <div className="flex gap-3 flex-wrap">
              {field.options && field.options.map((option, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={field.name}
                    value={option}
                    checked={customization[field.name] === option}
                    onChange={(e) => handleCustomizationChange(field.name, e.target.value)}
                    className="cursor-pointer"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {field.priceModifier > 0 && (
              <p className="text-sm text-gray-500 mt-1">+{currency}{field.priceModifier}</p>
            )}
          </div>
        )
      
      case 'number':
        return (
          <div key={field.name} className="mt-4">
            <p className="mb-2 font-medium">{field.label || field.name}</p>
            <input
              type="number"
              value={customization[field.name] || ''}
              onChange={(e) => handleCustomizationChange(field.name, e.target.value)}
              min={field.min || 1}
              max={field.max || 100}
              placeholder={`Enter ${field.label || field.name}`}
              className="border px-4 py-2 w-full max-w-md"
            />
            {field.priceModifier > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                +{currency}{field.priceModifier} each
              </p>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  if (!productData) return <div className="opacity-0"></div>


  const handleWhatsAppRedirect = () => {
    if (!productData) return;

    const phoneNumber = "919004140139"; 
    let message = `Hello, I want to customize this product:\n\n`;
    message += `*Product Name*: ${productData.name}\n`;
    message += `*Price*: Starting from ${currency}${productData.price}\n`;
    
    if (size) {
        message += `*Selected Size*: ${size}\n`;
    }

    if (customizationPrice > 0) {
        message += `*Estimated Total Price*: ${currency}${productData.price + customizationPrice}\n`;
    }

    if (Object.keys(customization).length > 0) {
        message += `\n*Customization Details*:\n`;
        for (const [key, value] of Object.entries(customization)) {
            message += `- ${key}: ${value}\n`;
        }
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  }

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
                className="w-[24%] sm:w-full sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer"
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
            <img src={assets.star_icon} className="w-3.5 grayscale" />
            <img src={assets.star_icon} className="w-3.5 grayscale" />
            <img src={assets.star_icon} className="w-3.5 grayscale" />
            <img src={assets.star_icon} className="w-3.5 grayscale" />
            <img src={assets.star_dull_icon} className="w-3.5 grayscale" />
            <p className="pl-2 text-sm text-gray-500">(122)</p>
          </div>

          {/* Price */}
          <p className="mt-4 text-3xl font-medium">
            {currency}{productData.price + customizationPrice}
          </p>
          {customizationPrice > 0 && (
            <p className="text-sm text-gray-500">
              Base Price: {currency}{productData.price} + Customization: {currency}{customizationPrice}
            </p>
          )}

          {/* Description */}
          <p className="mt-4 text-gray-500">
            {productData.description}
          </p>

          {/* Sizes */}
          {productData.sizes && productData.sizes.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 font-medium">Select Size</p>
            <div className="flex gap-3 flex-wrap">
              {productData.sizes.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSize(item)}
                  className={`border px-4 py-2 transition-all duration-300 ${
                    size === item ? 'border-black bg-black text-white' : 'border-gray-300 bg-white hover:bg-gray-100'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Customization Section - NEW */}
          {productData.isCustomizable && productData.customizationFields && productData.customizationFields.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 font-medium text-lg">Customize Your Product</p>
              <div className="border-t border-gray-300 pt-4">
                {productData.customizationFields.map(field => renderCustomizationField(field))}
              </div>
            </div>
          )}

          {/* Customize on WhatsApp Button */}
          <button 
            onClick={handleWhatsAppRedirect} 
            className="mt-8 bg-black text-white px-8 py-3 text-sm active:bg-gray-800 hover:bg-gray-800 transition-colors flex items-center gap-2 uppercase tracking-wide"
          >
            <i className="fa-brands fa-whatsapp text-lg"></i>
            Customize via WhatsApp
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
          <p>Ecommerce com3rfhjbrfjyrfuvyrfuberjkc dummyDummy data is fake, simulated information used as a placeholder in software development, testing, and demonstrations, mimicking real data without privacy risks, helping developers build, test, and showcase apps efficiently with realistic scenarios, and can be generated using online tools or AI like ChatGPT. </p>
        </div>
      </div>

      {/* Display related products */}
      <RelatedProducts category={productData.category} subCategory={productData.subCategory}/>
    </div>
  )
}

export default Product
