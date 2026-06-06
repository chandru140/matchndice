import React, { memo } from 'react'
import { isBusinessHours } from '../../utils/chatUtils'

/**
 * WhatsAppTooltip
 * Appears to the LEFT of the floating button on hover.
 * Content is context-aware: business hours + auth state.
 */
const WhatsAppTooltip = memo(({ isLoggedIn, isOpen, userName }) => {
    const open = isOpen ?? isBusinessHours()

    if (isLoggedIn) {
        return (
            <div className="wa-tooltip" role="tooltip" aria-live="polite">
                <p className="wa-tooltip__title">💬 Chat with us on WhatsApp</p>
                <p className="wa-tooltip__sub">
                    {open
                        ? '⚡ Typically replies in 30 minutes'
                        : "🌙 Offline — replies by 10 AM IST"}
                </p>
                <div className="wa-tooltip__arrow" aria-hidden="true" />
            </div>
        )
    }

    return (
        <div className="wa-tooltip" role="tooltip" aria-live="polite">
            <p className="wa-tooltip__title">🔒 Login to chat with us</p>
            <p className="wa-tooltip__sub">👤 Create a free account in 30 seconds</p>
            <div className="wa-tooltip__arrow" aria-hidden="true" />
        </div>
    )
})

WhatsAppTooltip.displayName = 'WhatsAppTooltip'
export default WhatsAppTooltip
