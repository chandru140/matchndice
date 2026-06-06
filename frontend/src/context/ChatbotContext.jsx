import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import axios from 'axios'
import { getOrCreateSessionId, formatWhatsAppMessage } from '../utils/chatUtils'
import { ShopContext } from './ShopContext'

export const ChatbotContext = createContext()

// ── Welcome message shown before any API call ─────────────────────────────────
const WELCOME_MESSAGE = {
    id: 'welcome',
    role: 'assistant',
    content: "Hey there! 🎲 I'm Dice, your AI gifting expert at Match n Dice! Whether you need a corporate gift, birthday surprise, or something totally unique — I've got you covered. What brings you here today? 😊",
    messageType: 'text',
    quickReplies: ['I need a gift idea 🎁', 'Customize a product ✏️', 'Track my order 📦', 'Ask a question ❓'],
    timestamp: new Date(),
}

const ChatbotProvider = ({ children }) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
    const shopCtx = useContext(ShopContext)
    const token = shopCtx?.token || ''
    const products = shopCtx?.products || []
    const cartCount = shopCtx?.getCartCount?.() || 0

    // ── State ──────────────────────────────────────────────────────────────────
    const [isOpen, setIsOpen]               = useState(false)
    const [isMinimized, setIsMinimized]     = useState(false)
    const [messages, setMessages]           = useState([WELCOME_MESSAGE])
    const [isLoading, setIsLoading]         = useState(false)
    const [quickReplies, setQuickReplies]   = useState(WELCOME_MESSAGE.quickReplies)
    const [conversationState, setConvState] = useState('greeting')
    const [unreadCount, setUnreadCount]     = useState(0)
    const [showProactive, setShowProactive] = useState(false)
    const [error, setError]                 = useState(null)
    const [sessionId]                       = useState(() => getOrCreateSessionId())

    // Streaming state
    const [isStreaming, setIsStreaming]   = useState(false)
    const [streamingText, setStreamText]  = useState('')

    const proactiveTimerRef = useRef(null)
    const proactiveDismissRef = useRef(null)

    // ── Proactive greeting after 30s on site ───────────────────────────────────
    useEffect(() => {
        const delay = parseInt(import.meta.env.VITE_CHAT_PROACTIVE_DELAY_MS || '30000')
        proactiveTimerRef.current = setTimeout(() => {
            if (!isOpen) {
                setShowProactive(true)
                proactiveDismissRef.current = setTimeout(() => setShowProactive(false), 8000)
            }
        }, delay)
        return () => {
            clearTimeout(proactiveTimerRef.current)
            clearTimeout(proactiveDismissRef.current)
        }
    }, [])

    // Track unread when closed
    useEffect(() => {
        if (!isOpen && messages.length > 1) {
            const assistantMsgs = messages.filter(m => m.role === 'assistant' && m.id !== 'welcome')
            setUnreadCount(assistantMsgs.length > 0 ? 1 : 0)
        } else {
            setUnreadCount(0)
        }
    }, [messages, isOpen])

    // ── Open / close / minimize ───────────────────────────────────────────────
    const openChat = useCallback(() => {
        setIsOpen(true)
        setIsMinimized(false)
        setShowProactive(false)
        setUnreadCount(0)
    }, [])

    const closeChat = useCallback(() => {
        setIsOpen(false)
        setIsMinimized(false)
    }, [])

    const minimizeChat = useCallback(() => {
        setIsMinimized(true)
        setIsOpen(false)
    }, [])

    // ── Send message ──────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (text, messageType = 'text', imageData = null) => {
        if (!text && !imageData) return
        setError(null)

        // Optimistically add user message
        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            content: text || '[Image]',
            messageType,
            imagePreview: imageData ? URL.createObjectURL : null,
            timestamp: new Date(),
        }
        setMessages(prev => [...prev, userMsg])
        setQuickReplies([])
        setIsLoading(true)

        // Build page context
        const context = {
            currentPage: window.location.pathname,
            currentProductId: new URLSearchParams(window.location.search).get('id') || null,
            cartItemCount: cartCount,
            isLoggedIn: !!token,
            userName: null,
        }

        try {
            const headers = token ? { token } : {}
            const response = await axios.post(
                `${backendUrl}/api/chatbot/message`,
                { sessionId, message: text, messageType, imageData, context },
                { headers, timeout: 20000 }
            )

            if (response.data.success) {
                const { text: botText, products: botProducts, quickReplies: botQRs,
                        customizationSummary, whatsappHandoff, action } = response.data.response

                const botMsg = {
                    id: response.data.messageId || Date.now().toString() + '_bot',
                    role: 'assistant',
                    content: botText,
                    messageType: whatsappHandoff ? 'whatsapp_handoff'
                        : customizationSummary ? 'customization_summary'
                        : botProducts ? 'product_cards'
                        : 'text',
                    products: botProducts?.items || null,
                    customizationSummary,
                    whatsappHandoff,
                    action,
                    timestamp: new Date(),
                }
                setMessages(prev => [...prev, botMsg])
                setQuickReplies(botQRs || [])
                setConvState(response.data.conversationState || 'greeting')

                // Auto-execute frontend action if needed
                if (action === 'open_whatsapp' && whatsappHandoff) {
                    // Let WhatsAppHandoffCard handle this — don't auto-open
                }
            } else {
                throw new Error(response.data.message || 'Unknown error')
            }
        } catch (err) {
            const isOffline = !navigator.onLine
            const errText = isOffline
                ? "You're offline! Please check your connection and try again. 📶"
                : err.code === 'ECONNABORTED'
                ? "I'm taking a bit longer than usual. 😅 Please try again!"
                : err.response?.data?.response?.text
                || "Oops! Something went wrong. Please try again or reach us on WhatsApp! 🙏"

            const errMsg = {
                id: Date.now().toString() + '_err',
                role: 'assistant',
                content: errText,
                messageType: 'text',
                isError: true,
                quickReplies: ['Try Again', 'Chat on WhatsApp'],
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, errMsg])
            setQuickReplies(['Try Again', 'Chat on WhatsApp'])
            setError(errText)
        } finally {
            setIsLoading(false)
        }
    }, [sessionId, token, backendUrl, cartCount])

    // ── Send image ────────────────────────────────────────────────────────────
    const sendImage = useCallback(async (file) => {
        if (!file) return
        const MAX = 5 * 1024 * 1024
        if (file.size > MAX) {
            setError('Image must be under 5MB')
            return
        }
        const reader = new FileReader()
        reader.onload = (e) => {
            const base64 = e.target.result
            // Add image preview message
            const imgMsg = {
                id: Date.now().toString() + '_img',
                role: 'user',
                content: '[Image]',
                messageType: 'image',
                imagePreview: base64,
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, imgMsg])
            // Send to AI with image data
            sendMessage('', 'image', base64)
        }
        reader.readAsDataURL(file)
    }, [sendMessage])

    // ── Execute action (add to cart, WhatsApp etc.) ───────────────────────────
    const executeAction = useCallback(async (action, payload = {}) => {
        switch (action) {
            case 'open_whatsapp': {
                const msg = payload.message || formatWhatsAppMessage(payload.customizationData, sessionId)
                const num = payload.number || '919004140139'
                window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')
                // Mark handoff in backend
                axios.post(`${backendUrl}/api/chatbot/action`, { sessionId, action: 'mark_handoff' })
                    .catch(() => {})
                break
            }
            case 'add_to_cart': {
                if (shopCtx?.addToCart) {
                    const ok = await shopCtx.addToCart(payload.productId, payload.size || null, {})
                    if (ok) {
                        const msg = {
                            id: Date.now().toString() + '_action',
                            role: 'assistant',
                            content: `Added to cart! 🛒 You now have ${cartCount + 1} item(s).`,
                            messageType: 'text',
                            timestamp: new Date(),
                        }
                        setMessages(prev => [...prev, msg])
                        setQuickReplies(['View Cart', 'Continue Shopping', 'Checkout'])
                    }
                }
                break
            }
            case 'view_product': {
                if (shopCtx?.navigate) {
                    shopCtx.navigate(`/product/${payload.productId}`)
                    closeChat()
                }
                break
            }
            case 'open_cart': {
                if (shopCtx?.navigate) {
                    shopCtx.navigate('/cart')
                    closeChat()
                }
                break
            }
            case 'redirect_login': {
                if (shopCtx?.navigate) {
                    shopCtx.navigate('/login')
                    closeChat()
                }
                break
            }
            case 'track_order': {
                if (shopCtx?.navigate) {
                    shopCtx.navigate('/orders')
                    closeChat()
                }
                break
            }
            default: break
        }
    }, [sessionId, backendUrl, shopCtx, cartCount, closeChat])

    // ── Clear chat ────────────────────────────────────────────────────────────
    const clearChat = useCallback(() => {
        setMessages([WELCOME_MESSAGE])
        setQuickReplies(WELCOME_MESSAGE.quickReplies)
        setConvState('greeting')
        setError(null)
    }, [])

    const value = {
        isOpen, isMinimized, messages, isLoading, isStreaming, streamingText,
        quickReplies, conversationState, unreadCount, showProactive, error, sessionId,
        openChat, closeChat, minimizeChat, sendMessage, sendImage, executeAction, clearChat,
        setShowProactive, setQuickReplies,
    }

    return (
        <ChatbotContext.Provider value={value}>
            {children}
        </ChatbotContext.Provider>
    )
}

export const useChatbot = () => {
    const ctx = useContext(ChatbotContext)
    if (!ctx) throw new Error('useChatbot must be used inside ChatbotProvider')
    return ctx
}

export default ChatbotProvider
