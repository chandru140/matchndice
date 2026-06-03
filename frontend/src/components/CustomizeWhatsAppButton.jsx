import React, { useContext, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { saveRedirectIntent } from '../utils/safeRedirect'
import { toast } from 'react-toastify'
import axios from 'axios'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919004140139'

/**
 * CustomizeWhatsAppButton — 4 states:
 *  STATE 1 (not logged in) : redirect to login → on return, WA opens
 *  STATE 2 (logged in)     : generate pre-filled message → open WA
 *  STATE 3 (loading)       : spinner
 *  STATE 4 (out of stock)  : disabled grey
 *
 * Props:
 *  product (object)       — full product object from ShopContext
 *  customization (object) — current customization selections
 *  customizationPrice (number) — extra price from customization
 */
const CustomizeWhatsAppButton = ({ product, customization = {}, customizationPrice = 0 }) => {
  const { token, currency, backendUrl, navigate } = useContext(ShopContext)
  const [loading, setLoading] = useState(false)

  const isLoggedIn   = Boolean(token)
  const isOutOfStock = product?.stock === 0

  // ── Build the pre-filled WhatsApp message ─────────────────────────────
  const buildMessage = (userData) => {
    const productUrl = window.location.href
    const totalPrice = (product.price + customizationPrice).toLocaleString('en-IN')

    let msg = `Hi Match n Dice! 👋\n`
    msg += `I'm interested in customizing the following product:\n\n`
    msg += `🛍️ *Product*: ${product.name}\n`
    if (product.category?.name) msg += `📂 *Category*: ${product.category.name}\n`
    msg += `💰 *Price*: ${currency}${product.price.toLocaleString('en-IN')}`
    if (customizationPrice > 0) msg += ` + ${currency}${customizationPrice} customization = *${currency}${totalPrice}*`
    msg += `\n🔗 *Link*: ${productUrl}\n`

    if (Object.keys(customization).length > 0) {
      msg += `\n*Customization Details:*\n`
      Object.entries(customization).forEach(([k, v]) => {
        if (v) msg += `  - ${k}: ${v}\n`
      })
    }

    msg += `\n*My Details:*\n`
    msg += `👤 Name: ${userData?.name || '(please add your name)'}\n`
    msg += `📧 Email: ${userData?.email || ''}\n`

    msg += `\nPlease guide me with customization options and delivery details.`
    return msg
  }

  // ── Fetch user profile data (name, email) ─────────────────────────────
  const getUserData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/profile', {
        headers: { token },
      })
      return data.success ? data.user : null
    } catch {
      return null
    }
  }

  // ── Main click handler ─────────────────────────────────────────────────
  const handleClick = async () => {
    if (loading || isOutOfStock) return

    // STATE 1 — Not logged in
    if (!isLoggedIn) {
      saveRedirectIntent(window.location.href, 'whatsapp_customize')
      toast.info('Please login to customize via WhatsApp.', { icon: '🔐' })
      navigate('/login')
      return
    }

    // STATE 2 — Logged in: open WhatsApp
    setLoading(true)
    try {
      const userData = await getUserData()
      const message  = buildMessage(userData)

      // Log inquiry to backend (non-blocking — don't await result)
      axios.post(
        backendUrl + '/api/whatsapp-inquiry',
        {
          productId:    product._id,
          productName:  product.name,
          productPrice: product.price,
          productUrl:   window.location.href,
          message,
        },
        { headers: { token } }
      ).catch(() => {}) // silently fail — never block WA from opening

      // Open WhatsApp
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error('Could not open WhatsApp. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── STATE 4 — Out of Stock ─────────────────────────────────────────────
  if (isOutOfStock) {
    return (
      <button
        disabled
        className='mt-4 w-full border border-gray-200 text-gray-400 py-3 text-sm cursor-not-allowed flex items-center justify-center gap-2 bg-gray-50'
      >
        <WhatsAppIcon muted />
        Currently Unavailable
      </button>
    )
  }

  // ── STATE 3 — Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <button
        disabled
        className='mt-4 w-full py-3 text-sm text-white flex items-center justify-center gap-2 bg-[#25D366] opacity-70 cursor-not-allowed'
      >
        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
        Opening WhatsApp...
      </button>
    )
  }

  // ── STATE 1 — Not logged in ────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <button
        onClick={handleClick}
        className='mt-4 w-full border border-[#25D366] text-[#128C7E] py-3 text-sm hover:bg-green-50 transition-colors flex items-center justify-center gap-2'
      >
        <WhatsAppIcon />
        Customize via WhatsApp
        <LockIcon />
      </button>
    )
  }

  // ── STATE 2 — Logged in ────────────────────────────────────────────────
  return (
    <button
      onClick={handleClick}
      className='mt-4 w-full bg-[#25D366] text-white py-3 text-sm font-medium hover:bg-[#1ebe5d] transition-colors flex items-center justify-center gap-2'
    >
      <WhatsAppIcon white />
      Customize via WhatsApp
    </button>
  )
}

// ── Icon helpers (no extra lib deps) ──────────────────────────────────────────
const WhatsAppIcon = ({ white, muted }) => (
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
    className='w-5 h-5 flex-shrink-0'
    fill={white ? '#ffffff' : muted ? '#9ca3af' : '#25D366'}
  >
    <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'/>
  </svg>
)

const LockIcon = () => (
  <svg xmlns='http://www.w3.org/2000/svg' className='w-3.5 h-3.5 text-gray-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
  </svg>
)

export default CustomizeWhatsAppButton
