import React, { useEffect, useRef, memo } from 'react'

// Proactive messages shown to logged-in users
const LOGGED_IN_MESSAGES = [
    "👋 Hi {name}! Need help with customization?",
    "🎁 Got questions about your order?",
    "✨ Want to discuss bulk corporate gifting?",
    "💬 Chat with us directly on WhatsApp!",
]

// Proactive messages shown to guest users
const GUEST_MESSAGES = [
    "👋 Login to chat with our gifting experts!",
    "🎁 Personalized gifting made easy — login now!",
]

// localStorage key to remember daily dismiss
const DISMISS_KEY = 'wa_proactive_dismissed'

const isDismissedToday = () => {
    try {
        const stored = localStorage.getItem(DISMISS_KEY)
        if (!stored) return false
        const date = new Date(stored)
        const today = new Date()
        return date.toDateString() === today.toDateString()
    } catch {
        return false
    }
}

export const markDismissedToday = () => {
    try { localStorage.setItem(DISMISS_KEY, new Date().toISOString()) } catch {}
}

export { isDismissedToday }

/**
 * WhatsAppProactiveBubble
 * Chat-bubble shape (border-radius: 12px 12px 0 12px) pointing toward button.
 * Auto-dismisses after 6 seconds.
 */
const WhatsAppProactiveBubble = memo(({ isLoggedIn, userName, onDismiss }) => {
    const timerRef = useRef(null)

    // Pick a random message for this session
    const messages = isLoggedIn ? LOGGED_IN_MESSAGES : GUEST_MESSAGES
    const rawMsg   = messages[Math.floor(Math.random() * messages.length)]
    const message  = rawMsg.replace('{name}', userName?.split(' ')[0] || 'there')

    // Auto-dismiss after 6 seconds
    useEffect(() => {
        timerRef.current = setTimeout(() => {
            onDismiss?.()
        }, 6000)
        return () => clearTimeout(timerRef.current)
    }, [onDismiss])

    return (
        <div
            className="wa-proactive"
            role="status"
            aria-label="WhatsApp greeting message"
        >
            <button
                className="wa-proactive__close"
                onClick={() => { markDismissedToday(); onDismiss?.() }}
                aria-label="Dismiss"
                type="button"
            >
                ×
            </button>
            <p className="wa-proactive__text">{message}</p>
        </div>
    )
})

WhatsAppProactiveBubble.displayName = 'WhatsAppProactiveBubble'
export default WhatsAppProactiveBubble
