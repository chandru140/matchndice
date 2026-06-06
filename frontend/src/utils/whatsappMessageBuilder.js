/**
 * whatsappMessageBuilder.js
 * Builds context-aware, pre-filled WhatsApp messages based on the current page,
 * user data, cart contents, and other available context.
 * All operations are synchronous — uses data already in stores.
 */

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919004140139'

// ── Detect context type from current path ─────────────────────────────────────
export const detectContextType = (pathname) => {
    if (!pathname) return 'general'
    if (pathname.startsWith('/product/'))  return 'product'
    if (pathname.startsWith('/orders'))    return 'order'
    if (pathname.startsWith('/cart'))      return 'cart'
    if (pathname.startsWith('/place-order')) return 'cart'
    return 'general'
}

// ── Detect device type ─────────────────────────────────────────────────────────
export const detectDevice = () => {
    const ua = navigator.userAgent || ''
    if (/mobile|android|iphone|ipad|ipod/i.test(ua)) return 'mobile'
    if (/tablet|ipad/i.test(ua)) return 'tablet'
    return 'desktop'
}

// ── Format line only if value exists ──────────────────────────────────────────
const line = (label, value) => value ? `${label}: ${value}` : ''

// ── Message Template 1: General (homepage, about, contact) ───────────────────
const buildGeneralMessage = ({ user }) => `Hi Match n Dice! 👋

I'm ${user.name || 'a customer'} and I'd like to learn more about your personalized gifting options.

My Details:
👤 Name: ${user.name || '—'}
📧 Email: ${user.email || '—'}
${user.phone ? `📱 Phone: ${user.phone}` : ''}

I'm interested in exploring your products. Could you help me find the perfect gift?

Thank you! 😊`

// ── Message Template 2: Product page ─────────────────────────────────────────
const buildProductMessage = ({ user, currentProduct }) => {
    const p = currentProduct || {}
    return `Hi Match n Dice! 👋

I'm interested in the following product:

🛍️ Product: ${p.name || 'Unknown'}
💰 Price: ₹${p.price?.toLocaleString('en-IN') || '—'}
${p.category ? `📂 Category: ${typeof p.category === 'object' ? p.category.name : p.category}` : ''}
🔗 Link: ${window.location.href}
${!p.stock || p.stock === 0 ? '⚠️ Note: This product appears to be out of stock. When will it be back?' : ''}

My Details:
👤 Name: ${user.name || '—'}
📧 Email: ${user.email || '—'}
${user.phone ? `📱 Phone: ${user.phone}` : ''}

I'd like to know more about:
• Customization options available
• Bulk order pricing (if applicable)
• Delivery timeline

Please guide me further!`
}

// ── Message Template 3: Cart page ─────────────────────────────────────────────
const buildCartMessage = ({ user, cartItems, products }) => {
    const currency = '₹'
    const cartLines = []
    let total = 0

    for (const itemId in cartItems) {
        const product = products.find(p => p._id === itemId)
        if (!product) continue
        for (const cartKey in cartItems[itemId]) {
            const entry = cartItems[itemId][cartKey]
            const qty = typeof entry === 'number' ? entry : (entry?.quantity || 0)
            if (qty <= 0) continue
            const price = product.price * qty
            total += price
            const size = cartKey !== 'default' ? ` (${cartKey.split('_')[0]})` : ''
            cartLines.push(`• ${product.name}${size} × ${qty} — ${currency}${price.toLocaleString('en-IN')}`)
        }
    }

    if (cartLines.length === 0) return buildGeneralMessage({ user })

    return `Hi Match n Dice! 👋

I have items in my cart and need some help:

🛒 MY CART:
${cartLines.join('\n')}
──────────────────────
Total: ${currency}${total.toLocaleString('en-IN')}

My Details:
👤 Name: ${user.name || '—'}
📧 Email: ${user.email || '—'}
${user.phone ? `📱 Phone: ${user.phone}` : ''}

I have questions about:
• Customization for items in my cart
• Delivery timeline
• Payment options

Please help me complete my order!`
}

// ── Message Template 4: Orders page ──────────────────────────────────────────
const buildOrderMessage = ({ user }) => `Hi Match n Dice! 👋

I have a query about my recent order.

My Details:
👤 Name: ${user.name || '—'}
📧 Email: ${user.email || '—'}
${user.phone ? `📱 Phone: ${user.phone}` : ''}

My query: 

Please help me resolve this. Thank you!`

// ── Message Template 5: After chatbot conversation ────────────────────────────
const buildAfterChatMessage = ({ user, chatSummary }) => `Hi Match n Dice! 👋

I was just chatting with Dice (your AI assistant) and would like to continue the conversation here.

${chatSummary ? `💬 CHAT SUMMARY:\n${chatSummary}\n` : ''}
My Details:
👤 Name: ${user.name || '—'}
📧 Email: ${user.email || '—'}
${user.phone ? `📱 Phone: ${user.phone}` : ''}

Could you pick up where Dice left off? Thank you! 🙏`

// ── Main builder ───────────────────────────────────────────────────────────────
/**
 * @param {object} options
 * @param {object} options.user            - { name, email, phone }
 * @param {string} [options.pathname]      - window.location.pathname
 * @param {object} [options.currentProduct]- product object if on product page
 * @param {object} [options.cartItems]     - from ShopContext
 * @param {Array}  [options.products]      - all products from ShopContext
 * @param {string} [options.chatSummary]   - last 2-3 chatbot points (string)
 * @param {string} [options.forceContext]  - override context detection
 * @returns {{ url: string, messageText: string, contextType: string }}
 */
export const buildWhatsAppMessage = ({
    user = {},
    pathname = window.location.pathname,
    currentProduct = null,
    cartItems = {},
    products = [],
    chatSummary = null,
    forceContext = null,
}) => {
    const contextType = forceContext || detectContextType(pathname)

    let messageText = ''

    switch (contextType) {
        case 'product':
            messageText = buildProductMessage({ user, currentProduct })
            break
        case 'cart':
            messageText = buildCartMessage({ user, cartItems, products })
            break
        case 'order':
            messageText = buildOrderMessage({ user })
            break
        case 'after_chat':
            messageText = buildAfterChatMessage({ user, chatSummary })
            break
        default:
            messageText = buildGeneralMessage({ user })
    }

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageText)}`

    return { url, messageText, contextType }
}

export default buildWhatsAppMessage
