import React, {
    useState, useEffect, useCallback, useRef, useContext, memo
} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../../context/ShopContext'
import { saveRedirectIntent } from '../../utils/safeRedirect'
import { buildWhatsAppMessage, detectDevice } from '../../utils/whatsappMessageBuilder'
import WhatsAppTooltip from './WhatsAppTooltip'
import WhatsAppProactiveBubble, {
    isDismissedToday, markDismissedToday
} from './WhatsAppProactiveBubble'

// ── Official WhatsApp SVG icon ─────────────────────────────────────────────────
const WhatsAppIcon = memo(() => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="white" aria-hidden="true" focusable="false">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
))
WhatsAppIcon.displayName = 'WhatsAppIcon'

// ── Lock overlay badge ─────────────────────────────────────────────────────────
const LockBadge = () => (
    <span className="wa-lock-badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
        </svg>
    </span>
)

// ── Business hours cache ───────────────────────────────────────────────────────
let _businessStatusCache = null
let _businessStatusFetchedAt = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const fetchBusinessStatus = async (backendUrl) => {
    const now = Date.now()
    if (_businessStatusCache && now - _businessStatusFetchedAt < CACHE_TTL) {
        return _businessStatusCache
    }
    try {
        const res = await axios.get(`${backendUrl}/api/whatsapp-inquiry/business-status`, { timeout: 4000 })
        if (res.data.success) {
            _businessStatusCache = res.data
            _businessStatusFetchedAt = now
            return res.data
        }
    } catch {}
    return { isOpen: true } // fallback: assume open
}

// ── Proactive timing: 45s after page load (logged-in only) ────────────────────
const PROACTIVE_DELAY_MS = 45_000

// ── Debounce: ignore double-clicks within 2 seconds ───────────────────────────
const CLICK_DEBOUNCE_MS = 2_000

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const WhatsAppFloatingButton = () => {
    const { token, products, cartItems, backendUrl, navigate: ctxNavigate } = useContext(ShopContext)
    const navigate   = useNavigate()
    const location   = useLocation()
    const isLoggedIn = !!token

    // Local state
    const [showTooltip,       setShowTooltip]       = useState(false)
    const [showProactive,     setShowProactive]      = useState(false)
    const [isAnimating,       setIsAnimating]        = useState(false)
    const [businessStatus,    setBusinessStatus]     = useState(null)

    // Refs
    const debounceRef       = useRef(null)
    const proactiveTimerRef = useRef(null)
    const tooltipTimerRef   = useRef(null)

    // ── Fetch business status on mount ────────────────────────────────────────
    useEffect(() => {
        fetchBusinessStatus(backendUrl).then(setBusinessStatus)
        // Refetch when tab becomes active again
        const onVisible = () => {
            if (!document.hidden) fetchBusinessStatus(backendUrl).then(setBusinessStatus)
        }
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
    }, [backendUrl])

    // ── Proactive bubble: show after 45s if logged in and not dismissed today ──
    useEffect(() => {
        if (!isLoggedIn) {
            setShowProactive(false)
            clearTimeout(proactiveTimerRef.current)
            return
        }
        if (isDismissedToday()) return
        proactiveTimerRef.current = setTimeout(() => {
            setShowProactive(true)
        }, PROACTIVE_DELAY_MS)
        return () => clearTimeout(proactiveTimerRef.current)
    }, [isLoggedIn])

    // ── Auto-hide tooltip after 3 seconds ────────────────────────────────────
    const handleMouseEnter = useCallback(() => {
        setShowTooltip(true)
        clearTimeout(tooltipTimerRef.current)
        tooltipTimerRef.current = setTimeout(() => setShowTooltip(false), 3000)
    }, [])

    const handleMouseLeave = useCallback(() => {
        setShowTooltip(false)
        clearTimeout(tooltipTimerRef.current)
    }, [])

    // ── Guest click: save redirect intent → navigate to login ────────────────
    const handleGuestClick = useCallback(() => {
        toast.info('🔒 Please login to chat on WhatsApp. Redirecting…', {
            toastId:  'wa-login-redirect',
            autoClose: 1500,
        })
        // Save returnUrl + reason so Login.jsx shows context banner
        saveRedirectIntent(window.location.pathname + window.location.search, 'whatsapp_chat')
        setTimeout(() => navigate('/login'), 1500)
    }, [navigate])

    // ── Logged-in click: build message → open WhatsApp → log click ───────────
    const handleLoggedInClick = useCallback(async () => {
        // Dismiss proactive bubble on click
        if (showProactive) { setShowProactive(false); markDismissedToday() }

        // Determine current product (if on product page)
        const productIdMatch = location.pathname.match(/^\/product\/([^/]+)/)
        const currentProductId = productIdMatch?.[1] || null
        const currentProduct = currentProductId
            ? products.find(p => p._id === currentProductId) || null
            : null

        // Build the pre-filled WhatsApp message
        let user = { name: '', email: '', phone: '' }
        try {
            // Try to get user details from the token payload (name is not in JWT here,
            // so we use what we can extract; full profile is fetched in Profile page).
            // For now use sensible defaults — the user fills in the rest in WhatsApp.
            const payload = JSON.parse(atob(token.split('.')[1]))
            // Our JWT only has { id }; user details come from profile API
            // We'll use whatever is stored in sessionStorage from last profile load
            const cached = sessionStorage.getItem('wa_user_profile')
            if (cached) {
                const parsed = JSON.parse(cached)
                user = { name: parsed.name || '', email: parsed.email || '', phone: parsed.phone || '' }
            }
        } catch {}

        const { url, messageText, contextType } = buildWhatsAppMessage({
            user,
            pathname:       location.pathname,
            currentProduct,
            cartItems,
            products,
        })

        // Open WhatsApp immediately — don't block on logging
        window.open(url, '_blank', 'noopener,noreferrer')

        // Log click fire-and-forget (never blocks WA from opening)
        const preview = messageText.slice(0, 150)
        axios.post(
            `${backendUrl}/api/whatsapp-inquiry/floating-button-click`,
            {
                page:           location.pathname,
                pageTitle:      document.title,
                productId:      currentProductId,
                contextType,
                cartValue:      Object.keys(cartItems).length > 0
                    ? (() => {
                        let t = 0
                        for (const id in cartItems) {
                            const p = products.find(x => x._id === id)
                            if (!p) continue
                            for (const k in cartItems[id]) {
                                const e = cartItems[id][k]
                                t += p.price * (typeof e === 'number' ? e : (e?.quantity || 0))
                            }
                        }
                        return t
                    })()
                    : null,
                messagePreview: preview,
            },
            { headers: { token }, timeout: 5000 }
        ).catch(() => {}) // silent failure
    }, [token, location, products, cartItems, backendUrl, showProactive])

    // ── Unified click handler with 2s debounce ────────────────────────────────
    const handleClick = useCallback(() => {
        if (debounceRef.current) return
        debounceRef.current = setTimeout(() => { debounceRef.current = null }, CLICK_DEBOUNCE_MS)

        // Click animation
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 300)

        if (isLoggedIn) {
            handleLoggedInClick()
        } else {
            handleGuestClick()
        }
    }, [isLoggedIn, handleLoggedInClick, handleGuestClick])

    return (
        <div className="wa-float-outer">
            {/* Proactive bubble */}
            {showProactive && (
                <WhatsAppProactiveBubble
                    isLoggedIn={isLoggedIn}
                    onDismiss={() => { setShowProactive(false); markDismissedToday() }}
                />
            )}

            {/* Tooltip */}
            {showTooltip && (
                <WhatsAppTooltip
                    isLoggedIn={isLoggedIn}
                    isOpen={businessStatus?.isOpen}
                />
            )}

            {/* The button */}
            <button
                className={[
                    'wa-float-btn',
                    isLoggedIn  ? 'wa-float-btn--enabled' : 'wa-float-btn--locked',
                    isAnimating ? 'wa-float-btn--animating' : '',
                ].filter(Boolean).join(' ')}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                aria-label={isLoggedIn
                    ? 'Chat with Match n Dice on WhatsApp'
                    : 'Login to chat with us on WhatsApp'}
                title={isLoggedIn
                    ? 'Chat on WhatsApp'
                    : 'Login to chat on WhatsApp'}
                type="button"
            >
                <span className={`wa-icon-wrap ${!isLoggedIn ? 'wa-icon-wrap--muted' : ''}`}>
                    <WhatsAppIcon />
                </span>

                {/* Lock overlay for guest state */}
                {!isLoggedIn && <LockBadge />}
            </button>
        </div>
    )
}

export default memo(WhatsAppFloatingButton)
