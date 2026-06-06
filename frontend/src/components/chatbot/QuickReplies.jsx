import React from 'react'
import { useChatbot } from '../../context/ChatbotContext'

const QuickReplies = ({ replies = [] }) => {
    const { sendMessage, setQuickReplies, executeAction } = useChatbot()

    if (!replies || replies.length === 0) return null

    const handleClick = (reply) => {
        // Clear chips immediately for snappy UX
        setQuickReplies([])

        // Special action chips
        if (reply === 'Chat on WhatsApp') {
            executeAction('open_whatsapp', { message: "Hi! I'd like to get some help with gifting. 🎁" })
            return
        }
        if (reply === 'View Cart') {
            executeAction('open_cart')
            return
        }
        if (reply === 'Checkout') {
            executeAction('open_cart')
            return
        }
        if (reply === 'Track my order 📦') {
            executeAction('track_order')
            return
        }

        sendMessage(reply, 'quick_reply')
    }

    return (
        <div className="dice-quick-replies" role="group" aria-label="Quick reply options">
            {replies.map((reply, i) => (
                <button
                    key={i}
                    className="dice-chip"
                    onClick={() => handleClick(reply)}
                    aria-label={`Quick reply: ${reply}`}
                >
                    {reply}
                </button>
            ))}
        </div>
    )
}

export default QuickReplies
