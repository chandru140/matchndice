import React, { useContext, useState, useEffect, useMemo } from 'react'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/frontend_assets/assets'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

// ── Progress Indicator ────────────────────────────────────────────
const STEPS = ['Delivery', 'Review', 'Payment']

const StepIndicator = ({ current }) => (
  <div className='flex items-center justify-center mb-8 gap-0'>
    {STEPS.map((label, index) => {
      const done = index < current
      const active = index === current
      return (
        <React.Fragment key={label}>
          <div className='flex flex-col items-center gap-1'>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
              done ? 'bg-black border-black text-white'
                : active ? 'border-black text-black bg-white'
                : 'border-gray-300 text-gray-400 bg-white'
            }`}>
              {done ? '✓' : index + 1}
            </div>
            <p className={`text-xs font-medium ${active ? 'text-black' : done ? 'text-gray-600' : 'text-gray-400'}`}>
              {label}
            </p>
          </div>
          {index < STEPS.length - 1 && (
            <div className={`w-16 sm:w-24 h-[2px] mb-5 mx-1 transition-colors ${done ? 'bg-black' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      )
    })}
  </div>
)

// ── Input Component ───────────────────────────────────────────────
const FormInput = ({ label, name, value, onChange, type = 'text', required, pattern, title, placeholder }) => (
  <div className='flex flex-col gap-1'>
    <label className='text-xs text-gray-500 font-medium'>{label}{required && <span className='text-red-500 ml-0.5'>*</span>}</label>
    <input
      required={required}
      name={name}
      value={value}
      onChange={onChange}
      type={type}
      placeholder={placeholder || label}
      pattern={pattern}
      title={title}
      className='border border-gray-300 rounded py-2 px-3.5 w-full outline-none focus:border-black transition-colors text-sm'
    />
  </div>
)

// ── Main Component ────────────────────────────────────────────────
const PlaceOrder = () => {
  const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, products, delivery_fee, currency } = useContext(ShopContext)
  const [step, setStep] = useState(0)   // 0=Delivery, 1=Review, 2=Payment
  const [method, setMethod] = useState('cod')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    street: '', city: '', state: '', zipCode: '', country: 'India', phone: '',
  })

  // Redirect guards
  useEffect(() => {
    if (!token) navigate('/login', { state: { from: '/place-order' } })
  }, [token])

  useEffect(() => {
    if (products.length > 0 && Object.keys(cartItems).length === 0) {
      toast.info('Your cart is empty.')
      navigate('/collection')
    }
  }, [cartItems, products])

  const onChangeHandler = (e) => {
    const { name, value } = e.target
    setFormData(d => ({ ...d, [name]: value }))
  }

  // Build order items from cart
  const orderItems = useMemo(() => {
    const items = []
    for (const itemId in cartItems) {
      for (const cartKey in cartItems[itemId]) {
        const entry = cartItems[itemId][cartKey]
        const product = products.find(p => p._id === itemId)
        if (!product) continue
        if (typeof entry === 'number' && entry > 0) {
          items.push({ ...product, size: cartKey, quantity: entry, customization: null })
        } else if (typeof entry === 'object' && entry.quantity > 0) {
          items.push({ ...product, size: entry.size, quantity: entry.quantity, customization: entry.customization || null })
        }
      }
    }
    return items
  }, [cartItems, products])

  const subtotal = getCartAmount()
  const finalAmount = subtotal + delivery_fee

  // ✅ Indian mobile number: starts with 6-9, exactly 10 digits
  const isValidPhone = (p) => /^[6-9]\d{9}$/.test(p.replace(/\s|-/g, ''))

  const validateDelivery = () => {
    const { firstName, lastName, email, street, city, state, zipCode, phone } = formData
    if (!firstName || !lastName || !email || !street || !city || !state || !zipCode || !phone) {
      toast.error('Please fill in all required fields.')
      return false
    }
    if (!isValidPhone(phone)) {
      toast.error('Please enter a valid phone number.')
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (step === 0 && !validateDelivery()) return
    setStep(s => s + 1)
    window.scrollTo(0, 0)
  }

  // ── Payment Handlers ──────────────────────────────────────────
  const initRazorpay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Match N Dice',
      description: 'Order Payment',
      order_id: order.id,
      handler: async (response) => {
        try {
          const { data } = await axios.post(
            backendUrl + '/api/order/verifyRazorpay',
            response,
            { headers: { token } }
          )
          if (data.success) {
            setCartItems({})
            navigate('/order-success', { state: { orderId: data.orderId } })
          } else {
            toast.error(data.message || 'Payment verification failed.')
          }
        } catch (err) {
          toast.error('Payment verification failed. Please contact support.')
        }
      },
      modal: { ondismiss: () => toast.info('Payment cancelled.') },
    }
    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    const orderData = {
      address: formData,
      items: orderItems,
      amount: finalAmount,
      paymentMethod: method.toUpperCase(),
    }

    try {
      switch (method) {
        case 'cod': {
          const { data } = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } })
          if (data.success) {
            setCartItems({})
            navigate('/order-success', { state: { orderId: data.orderId } })
          } else toast.error(data.message)
          break
        }
        case 'stripe': {
          const { data } = await axios.post(backendUrl + '/api/order/stripe', orderData, { headers: { token } })
          if (data.success) window.location.href = data.session_url
          else toast.error(data.message)
          break
        }
        case 'razorpay': {
          const { data } = await axios.post(backendUrl + '/api/order/razorpay', orderData, { headers: { token } })
          if (data.success) initRazorpay(data.order)
          else toast.error(data.message)
          break
        }
        default: break
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='border-t pt-8 pb-20 min-h-[80vh]'>
      <StepIndicator current={step} />

      {/* ── STEP 0: Delivery ── */}
      {step === 0 && (
        <div className='max-w-lg mx-auto'>
          <h2 className='text-xl font-semibold mb-6'>Delivery Information</h2>
          <div className='flex flex-col gap-4'>
            <div className='flex gap-3'>
              <FormInput label='First Name' name='firstName' value={formData.firstName} onChange={onChangeHandler} required />
              <FormInput label='Last Name' name='lastName' value={formData.lastName} onChange={onChangeHandler} required />
            </div>
            <FormInput label='Email Address' name='email' value={formData.email} onChange={onChangeHandler} type='email' required />
            <FormInput label='Street Address' name='street' value={formData.street} onChange={onChangeHandler} required />
            <div className='flex gap-3'>
              <FormInput label='City' name='city' value={formData.city} onChange={onChangeHandler} required />
              <FormInput label='State' name='state' value={formData.state} onChange={onChangeHandler} required />
            </div>
            <div className='flex gap-3'>
              <FormInput label='Pin Code' name='zipCode' value={formData.zipCode} onChange={onChangeHandler} pattern='[0-9]{4,10}' title='Enter a valid pin code' required />
              <FormInput label='Country' name='country' value={formData.country} onChange={onChangeHandler} required />
            </div>
            <FormInput label='Phone Number' name='phone' value={formData.phone} onChange={onChangeHandler} type='tel' placeholder='+91 9000000000' required />
          </div>
          <button
            onClick={handleNextStep}
            className='mt-8 w-full bg-black text-white py-3 text-sm font-medium hover:bg-gray-800 transition-colors'
          >
            CONTINUE TO ORDER REVIEW →
          </button>
        </div>
      )}

      {/* ── STEP 1: Review ── */}
      {step === 1 && (
        <div className='max-w-2xl mx-auto'>
          <h2 className='text-xl font-semibold mb-6'>Order Review</h2>

          {/* Items */}
          <div className='border border-gray-200 rounded-lg overflow-hidden mb-6'>
            {orderItems.map((item, i) => {
              let price = item.price
              if (item.isCustomizable && item.customization && item.customizationFields) {
                price += item.customizationFields
                  .filter(f => item.customization[f.name])
                  .reduce((sum, f) => sum + (f.priceModifier || 0), 0)
              }
              return (
                <div key={i} className='flex items-center gap-4 p-4 border-b border-gray-100 last:border-0'>
                  <img src={item.image?.[0]} alt={item.name} className='w-16 h-16 object-contain border border-gray-100 rounded bg-gray-50 flex-shrink-0' loading='lazy' />
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>{item.name}</p>
                    <p className='text-xs text-gray-500 mt-0.5'>{currency}{price.toLocaleString('en-IN')} × {item.quantity}</p>
                    {item.customization && Object.keys(item.customization).length > 0 && (
                      <p className='text-xs text-blue-600 mt-0.5'>
                        {Object.entries(item.customization).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <p className='text-sm font-semibold flex-shrink-0'>{currency}{(price * item.quantity).toLocaleString('en-IN')}</p>
                </div>
              )
            })}
          </div>

          {/* Delivery Address Summary */}
          <div className='bg-gray-50 rounded-lg p-4 mb-6 text-sm'>
            <div className='flex justify-between items-start'>
              <div>
                <p className='font-semibold text-gray-800 mb-1'>Delivering to:</p>
                <p className='text-gray-600'>{formData.firstName} {formData.lastName}</p>
                <p className='text-gray-600'>{formData.street}, {formData.city}, {formData.state} – {formData.zipCode}</p>
                <p className='text-gray-600'>{formData.phone}</p>
              </div>
              <button onClick={() => setStep(0)} className='text-xs text-black underline hover:no-underline flex-shrink-0 ml-4'>Edit</button>
            </div>
          </div>

          {/* Pricing Summary */}
          <CartTotal />

          <div className='flex gap-3 mt-6'>
            <button onClick={() => setStep(0)} className='flex-1 border border-gray-300 py-3 text-sm hover:bg-gray-50 transition-colors'>
              ← BACK
            </button>
            <button onClick={handleNextStep} className='flex-1 bg-black text-white py-3 text-sm font-medium hover:bg-gray-800 transition-colors'>
              CONTINUE TO PAYMENT →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Payment ── */}
      {step === 2 && (
        <div className='max-w-lg mx-auto'>
          <h2 className='text-xl font-semibold mb-6'>Payment Method</h2>

          <div className='flex flex-col gap-3 mb-8'>
            {[
              { key: 'stripe',    label: 'Credit / Debit Card',  icon: <img className='h-5' src={assets.stripe_logo} alt='Stripe' /> },
              { key: 'razorpay', label: 'UPI / Net Banking',     icon: <img className='h-5' src={assets.razorpay_logo} alt='Razorpay' /> },
              { key: 'cod',      label: 'Cash on Delivery',      icon: <span className='text-sm font-medium text-gray-600'>COD</span> },
            ].map(({ key, label, icon }) => (
              <div
                key={key}
                onClick={() => setMethod(key)}
                className={`flex items-center gap-4 border-2 p-4 rounded-lg cursor-pointer transition-colors ${method === key ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${method === key ? 'bg-black border-black' : 'border-gray-400'}`} />
                <div className='flex items-center gap-3'>
                  {icon}
                  <span className='text-sm'>{label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Final amount summary */}
          <div className='bg-gray-50 rounded-lg p-4 text-sm mb-6'>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Subtotal</span>
              <span>{currency}{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className='flex justify-between mt-1'>
              <span className='text-gray-600'>Shipping</span>
              <span>{delivery_fee === 0 ? 'FREE' : `${currency}${delivery_fee}`}</span>
            </div>
            <hr className='my-2' />
            <div className='flex justify-between font-bold text-base'>
              <span>Total</span>
              <span>{currency}{finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className='flex gap-3'>
            <button onClick={() => setStep(1)} className='flex-1 border border-gray-300 py-3 text-sm hover:bg-gray-50 transition-colors'>
              ← BACK
            </button>
            <button
              onClick={onSubmitHandler}
              disabled={loading}
              className='flex-1 bg-black text-white py-3 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors flex items-center justify-center gap-2'
            >
              {loading ? (
                <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> Placing Order...</>
              ) : (
                `PLACE ORDER — ${currency}${finalAmount.toLocaleString('en-IN')}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaceOrder
