import React from 'react'
import { useChatbot } from '../../context/ChatbotContext'

const FloatingButton = () => {
    const { isOpen, openChat, unreadCount, showProactive, setShowProactive } = useChatbot()

    if (isOpen) return null

    return (
        <div className="dice-float-wrap" aria-label="Open AI chat" role="complementary">
            {/* Proactive bubble */}
            {showProactive && (
                <div
                    className="dice-proactive"
                    onClick={openChat}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && openChat()}
                    aria-label="Open chat"
                >
                    <button
                        className="dice-proactive-close"
                        onClick={(e) => { e.stopPropagation(); setShowProactive(false) }}
                        aria-label="Dismiss"
                    >×</button>
                    👋 Need help finding the perfect gift?
                </div>
            )}

            {/* Main floating button */}
            <button
                className="dice-float-btn"
                onClick={openChat}
                aria-label="Chat with Dice — AI Gifting Expert"
                title="Chat with Dice — AI Gifting Expert"
            >
                {/* Brand gradient via CSS class */}
                <span className="dice-float-icon" aria-hidden="true">🎲</span>

                {/* Unread badge */}
                {unreadCount > 0 && (
                    <span className="dice-badge" aria-label={`${unreadCount} unread message`}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Tooltip */}
            <div className="dice-tooltip" aria-hidden="true">Chat with Dice ✨</div>
        </div>
    )
}

export default FloatingButton
