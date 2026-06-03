import React, { useContext, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/frontend_assets/assets'
import RelatedProducts from '../components/RelatedProducts'
import NotifyMeButton from '../components/NotifyMeButton'
import CustomizeWhatsAppButton from '../components/CustomizeWhatsAppButton'
import ReviewSection from '../components/reviews/ReviewSection'
import { toast } from 'react-toastify'

// ── Sub-components ────────────────────────────────────────────────
const StarRating = ({ rating = 0, count = 0 }) => (
  <div className='flex items-center gap-1 mt-2'>
    {[1, 2, 3, 4, 5].map(star => (
      <img
        key={star}
        src={star <= Math.round(rating) ? assets.star_icon : assets.star_dull_icon}
        className='w-3.5'
        alt=''
      />
    ))}
    {count > 0 && <p className='pl-2 text-sm text-gray-500'>({count} reviews)</p>}
  </div>
)

const QuantitySelector = ({ quantity, onIncrease, onDecrease, stock, min = 1, max = 99 }) => (
  <div className='flex items-center gap-1 border border-gray-300 w-fit'>
    <button
      onClick={onDecrease}
      disabled={quantity <= min}
      className='w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
      aria-label='Decrease quantity'
    >
      −
    </button>
    <span className='w-12 text-center font-medium text-sm'>{quantity}</span>
    <button
      onClick={onIncrease}
      disabled={quantity >= Math.min(max, stock || max)}
      className='w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
      aria-label='Increase quantity'
    >
      +
    </button>
  </div>
)

// ── Main Component ────────────────────────────────────────────────
const Product = () => {
  const { productId } = useParams()
  const { products, currency, backendUrl, addToCart, navigate, token, cartItems } = useContext(ShopContext)

  const [productData, setProductData]   = useState(null)
  const [image, setImage]               = useState('')
  const [customization, setCustomization] = useState({})
  const [customizationPrice, setCustomizationPrice] = useState(0)
  const [quantity, setQuantity]         = useState(1)
  const [loading, setLoading]           = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [activeTab, setActiveTab]       = useState('description') // 'description' | 'reviews'

  const [searchParams] = useSearchParams()

  // Auto-switch to reviews tab when arriving with ?tab=reviews (from order page)
  useEffect(() => {
    if (searchParams.get('tab') === 'reviews') {
      setActiveTab('reviews')
      // Scroll to reviews section after a brief delay for rendering
      setTimeout(() => {
        document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 400)
    }
  }, [searchParams])

  // Check if this product is already in the cart
  const isInCart = productData && cartItems[productData._id] &&
    Object.keys(cartItems[productData._id]).length > 0

  useEffect(() => {
    const product = products.find(item => item._id === productId)
    if (product) {
      setProductData(product)
      setImage(product.image[0])
      setCustomization({})
      setCustomizationPrice(0)
      setQuantity(1)
      setLoading(false)
    } else if (products.length > 0) {
      setLoading(false)
    }
  }, [products, productId])

  useEffect(() => {
    if (productData?.isCustomizable && productData.customizationFields) {
      const total = productData.customizationFields
        .filter(f => customization[f.name])
        .reduce((sum, f) => sum + (f.priceModifier || 0), 0)
      setCustomizationPrice(total)
    }
  }, [customization, productData])

  // Update document title for SEO
  useEffect(() => {
    if (productData) {
      document.title = `${productData.name} | Match n Dice`
    }
    return () => { document.title = 'Match n Dice – Personalized Gifting' }
  }, [productData])

  const handleCustomizationChange = (fieldName, value) => {
    setCustomization(prev => ({ ...prev, [fieldName]: value }))
  }

  // ── Add to Cart Handler ───────────────────────────────────────
  const handleAddToCart = async () => {
    if (addingToCart || !productData) return
    setAddingToCart(true)
    try {
      // Add 'quantity' times
      let success = true
      for (let i = 0; i < quantity; i++) {
        const ok = await addToCart(productData._id, null, customization)
        if (!ok) { success = false; break }
      }
      if (success) {
        toast.success(`${productData.name} added to cart!`, { icon: '🛒' })
      }
    } finally {
      setAddingToCart(false)
    }
  }

  // ── Buy Now Handler ───────────────────────────────────────────
  const handleBuyNow = async () => {
    if (addingToCart || !productData) return
    setAddingToCart(true)
    try {
      for (let i = 0; i < quantity; i++) {
        await addToCart(productData._id, null, customization)
      }
      navigate('/place-order')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleWhatsAppRedirect = () => {
    if (!productData) return
    const link = generateWhatsAppLink(productData, currency, null, customization, customizationPrice)
    redirectToWhatsApp(link)
  }

  const renderCustomizationField = (field) => {
    const inputClass = 'border px-4 py-2 w-full max-w-md outline-none focus:border-black text-sm'
    const priceTag = field.priceModifier > 0 && (
      <p className='text-xs text-green-700 mt-1'>+ {currency}{field.priceModifier} for this option</p>
    )
    const label = <p className='mb-2 font-medium text-sm'>{field.label || field.name} {field.required && <span className='text-red-500'>*</span>}</p>

    switch (field.type) {
      case 'dropdown': return (
        <div key={field.name} className='mt-4'>
          {label}
          <select value={customization[field.name] || ''} onChange={e => handleCustomizationChange(field.name, e.target.value)} className={inputClass} required={field.required}>
            <option value=''>Select {field.label || field.name}</option>
            {field.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
          </select>
          {priceTag}
        </div>
      )
      case 'text': return (
        <div key={field.name} className='mt-4'>
          {label}
          <input type='text' value={customization[field.name] || ''} onChange={e => handleCustomizationChange(field.name, e.target.value)} maxLength={field.maxLength || 50} placeholder={`Enter ${field.label || field.name}`} className={inputClass} required={field.required} />
          {field.maxLength && <p className='text-xs text-gray-400 mt-1'>{(customization[field.name] || '').length}/{field.maxLength} characters</p>}
          {priceTag}
        </div>
      )
      case 'textarea': return (
        <div key={field.name} className='mt-4'>
          {label}
          <textarea value={customization[field.name] || ''} onChange={e => handleCustomizationChange(field.name, e.target.value)} maxLength={field.maxLength || 200} placeholder={`Enter ${field.label || field.name}`} className={`${inputClass} h-24 resize-none`} required={field.required} />
          {field.maxLength && <p className='text-xs text-gray-400 mt-1'>{(customization[field.name] || '').length}/{field.maxLength} characters</p>}
          {priceTag}
        </div>
      )
      case 'radio': return (
        <div key={field.name} className='mt-4'>
          {label}
          <div className='flex gap-3 flex-wrap'>
            {field.options?.map((opt, i) => (
              <label key={i} className='flex items-center gap-2 cursor-pointer text-sm'>
                <input type='radio' name={field.name} value={opt} checked={customization[field.name] === opt} onChange={e => handleCustomizationChange(field.name, e.target.value)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {priceTag}
        </div>
      )
      case 'number': return (
        <div key={field.name} className='mt-4'>
          {label}
          <input type='number' value={customization[field.name] || ''} onChange={e => handleCustomizationChange(field.name, e.target.value)} min={field.min || 1} max={field.max || 100} className={inputClass} required={field.required} />
          {priceTag}
        </div>
      )
      default: return null
    }
  }

  // ── Loading Skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div className='border-t-2 pt-10 animate-pulse'>
        <div className='flex flex-col sm:flex-row gap-12'>
          <div className='flex-1 bg-gray-200 aspect-square rounded' />
          <div className='flex-1 space-y-4 mt-4'>
            <div className='h-7 bg-gray-200 rounded w-3/4' />
            <div className='h-4 bg-gray-200 rounded w-1/4' />
            <div className='h-10 bg-gray-200 rounded w-1/3' />
            <div className='h-4 bg-gray-200 rounded w-full' />
            <div className='h-4 bg-gray-200 rounded w-5/6' />
            <div className='h-12 bg-gray-200 rounded w-full mt-6' />
          </div>
        </div>
      </div>
    )
  }

  // ── Not Found ─────────────────────────────────────────────────
  if (!productData) {
    return (
      <div className='border-t pt-16 min-h-[50vh] flex flex-col items-center justify-center gap-4 text-gray-500'>
        <p className='text-xl font-medium'>Product not found</p>
        <button onClick={() => navigate('/collection')} className='bg-black text-white px-8 py-3 text-sm hover:bg-gray-800'>
          Browse Products
        </button>
      </div>
    )
  }

  const isOutOfStock = productData.stock === 0
  const isLowStock = !isOutOfStock && productData.stock <= (productData.lowStockThreshold || 5)
  const totalPrice = productData.price + customizationPrice

  return (
    <div className='border-t-2 pt-10'>
      <div className='flex flex-col sm:flex-row gap-12 sm:gap-16'>

        {/* ── Images ── */}
        <div className='flex-1 flex flex-col-reverse sm:flex-row gap-3'>
          {/* Thumbnails */}
          <div className='flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-[500px] sm:w-[90px] w-full pb-2 sm:pb-0'>
            {productData.image.map((item, index) => (
              <div
                key={index}
                onClick={() => setImage(item)}
                className={`flex-shrink-0 sm:w-full w-16 h-16 sm:h-[90px] rounded border-2 cursor-pointer overflow-hidden transition-all duration-200 ${image === item ? 'border-black' : 'border-gray-200 hover:border-gray-400'}`}
              >
                <img src={item} alt={`${productData.name} view ${index + 1}`} className='w-full h-full object-contain p-1 bg-gray-50' loading={index === 0 ? 'eager' : 'lazy'} />
              </div>
            ))}
          </div>

          {/* Main Image */}
          <div className='flex-1 bg-white border border-gray-100 rounded-lg flex items-center justify-center p-6 relative group' style={{ maxHeight: '420px', minHeight: '280px' }}>
            <img
              src={image}
              alt={productData.name}
              className='max-w-full max-h-[360px] object-contain transition-transform duration-300 group-hover:scale-105'
              onError={e => { e.target.src = '/placeholder.png' }}
            />
          </div>
        </div>

        {/* ── Info ── */}
        <div className='flex-1'>
          {/* SEO: product name in H1 */}
          <h1 className='text-2xl font-medium mt-2'>{productData.name}</h1>

          {/* Rating */}
          {(productData.reviewCount > 0)
            ? <StarRating rating={productData.averageRating || 0} count={productData.reviewCount} />
            : <p className='text-sm text-gray-400 mt-2'>No reviews yet</p>
          }

          {/* Price */}
          <p className='mt-4 text-3xl font-medium'>{currency}{totalPrice.toLocaleString('en-IN')}</p>
          {customizationPrice > 0 && (
            <p className='text-sm text-gray-500'>
              Base: {currency}{productData.price} + Customization: {currency}{customizationPrice}
            </p>
          )}

          {/* Stock */}
          {isOutOfStock ? (
            <p className='text-red-500 font-medium mt-2 text-sm'>⚠ Out of Stock</p>
          ) : isLowStock ? (
            <p className='text-orange-500 text-sm mt-2'>🔥 Only {productData.stock} left!</p>
          ) : (
            <p className='text-green-600 text-sm mt-2'>✔ In Stock</p>
          )}

          {/* Description */}
          <p className='mt-4 text-gray-500 text-sm leading-relaxed'>{productData.description}</p>

          {/* Customization */}
          {productData.isCustomizable && productData.customizationFields?.length > 0 && (
            <div className='mt-6'>
              <p className='font-medium text-lg mb-1'>Customize Your Product</p>
              <p className='text-xs text-gray-400 mb-3'>Fields marked with <span className='text-red-500'>*</span> are required</p>
              <div className='border-t border-gray-200 pt-4'>
                {productData.customizationFields.map(field => renderCustomizationField(field))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className='mt-6'>
            <p className='text-sm font-medium mb-2'>Quantity</p>
            <QuantitySelector
              quantity={quantity}
              onIncrease={() => setQuantity(q => Math.min(q + 1, productData.stock || 99))}
              onDecrease={() => setQuantity(q => Math.max(q - 1, 1))}
              stock={productData.stock}
            />
          </div>

          {/* CTA Buttons */}
          <div className='mt-6 flex flex-col sm:flex-row gap-3'>
            {isOutOfStock ? (
              <button disabled className='flex-1 bg-gray-300 text-gray-500 py-3 text-sm cursor-not-allowed'>
                OUT OF STOCK
              </button>
            ) : isInCart ? (
              <button
                onClick={() => navigate('/cart')}
                className='flex-1 border-2 border-black text-black py-3 text-sm font-medium hover:bg-black hover:text-white transition-colors'
              >
                GO TO CART →
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className='flex-1 bg-black text-white py-3 text-sm font-medium hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
              >
                {addingToCart ? (
                  <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> Adding...</>
                ) : (
                  'ADD TO CART'
                )}
              </button>
            )}

            {!isOutOfStock && (
              <button
                onClick={handleBuyNow}
                disabled={addingToCart}
                className='flex-1 bg-gray-800 text-white py-3 text-sm font-medium hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed transition-colors'
              >
                BUY NOW
              </button>
            )}
          </div>

          {/* Notify Me — shown only when out of stock */}
          {isOutOfStock && (
            <NotifyMeButton productId={productData._id} productName={productData.name} />
          )}

          {/* WhatsApp Customize CTA */}
          <CustomizeWhatsAppButton
            product={productData}
            customization={customization}
            customizationPrice={customizationPrice}
          />

          <hr className='mt-8' />
          <div className='mt-4 text-sm text-gray-500 flex flex-col gap-1'>
            <p>✔ 100% Original Product</p>
            <p>✔ Cash on Delivery Available</p>
            <p>✔ Easy Return & Exchange within 7 Days</p>
          </div>
        </div>
      </div>

      {/* ── Description + Reviews Tabs ── */}
      <div id='reviews-section' className='mt-20'>
        <div className='flex border-b border-gray-200'>
          {[
            { key: 'description', label: 'Description' },
            { key: 'reviews',     label: `Reviews (${productData.reviewCount || 0})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm transition-colors ${
                activeTab === tab.key
                  ? 'font-semibold text-black border-b-2 border-black -mb-px'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className='mt-0 border border-t-0 px-6 py-6'>
          {activeTab === 'description' ? (
            <p className='text-sm text-gray-600 leading-relaxed'>
              {productData.description || 'No description available.'}
            </p>
          ) : (
            <ReviewSection
              productId={productData._id}
              productName={productData.name}
            />
          )}
        </div>
      </div>

      {/* ── Related Products ── */}
      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />

      {/* ── Mobile Sticky Bar ── */}
      <div className='fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 z-40 shadow-lg'>
        <div className='flex-1'>
          <p className='text-xs text-gray-500 leading-none'>{productData.name}</p>
          <p className='font-bold text-base'>{currency}{totalPrice.toLocaleString('en-IN')}</p>
        </div>
        {isOutOfStock ? (
          <button disabled className='px-6 py-3 bg-gray-300 text-gray-500 text-sm rounded cursor-not-allowed'>Out of Stock</button>
        ) : isInCart ? (
          <button onClick={() => navigate('/cart')} className='px-6 py-3 bg-black text-white text-sm rounded'>Go to Cart →</button>
        ) : (
          <button onClick={handleAddToCart} disabled={addingToCart} className='px-6 py-3 bg-black text-white text-sm rounded disabled:opacity-60 flex items-center gap-2'>
            {addingToCart ? <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> : '🛒'}
            Add to Cart
          </button>
        )}
      </div>

      {/* Bottom padding for mobile sticky bar */}
      <div className='h-20 sm:hidden' />
    </div>
  )
}

export default Product
