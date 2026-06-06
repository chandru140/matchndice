import React from 'react'
import { useChatbot } from '../../context/ChatbotContext'
import { isBusinessHours } from '../../utils/chatUtils'

const ChatHeader = ({ onClose, onMinimize }) => {
    const online = true // Could ping backend health
    const hours = isBusinessHours()

    return (
        <div className="dice-header">
            <div className="dice-header-left">
                {/* Bot avatar */}
                <div className="dice-avatar" aria-hidden="true">
                    <span className="dice-avatar-emoji">🎲</span>
                    <span className="dice-online-dot" title={hours ? 'Online' : 'Will reply by morning'} />
                </div>
                <div className="dice-header-info">
                    <p className="dice-bot-name">Dice</p>
                    <p className="dice-bot-status">
                        {hours ? '● Online · AI Gifting Expert' : '● Replies by 10 AM IST'}
                    </p>
                </div>
            </div>
            <div className="dice-header-actions">
                <button
                    onClick={onMinimize}
                    className="dice-icon-btn"
                    aria-label="Minimize chat"
                    title="Minimize"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14" />
                    </svg>
                </button>
                <button
                    onClick={onClose}
                    className="dice-icon-btn"
                    aria-label="Close chat"
                    title="Close"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default ChatHeader
