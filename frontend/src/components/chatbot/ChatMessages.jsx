import React, { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { getDateLabel } from '../../utils/chatUtils'

const ChatMessages = ({ messages, isLoading }) => {
    const bottomRef = useRef(null)
    const containerRef = useRef(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    // Group messages by date for date separators
    const groups = []
    let currentDate = null
    messages.forEach((msg, i) => {
        const label = getDateLabel(msg.timestamp || new Date())
        if (label !== currentDate) {
            groups.push({ type: 'date', label, key: `date-${i}` })
            currentDate = label
        }
        groups.push({ type: 'message', msg, key: msg.id || i })
    })

    return (
        <div
            ref={containerRef}
            className="dice-messages"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
        >
            {/* Empty state */}
            {messages.length === 0 && (
                <div className="dice-empty-state">
                    <p className="dice-empty-emoji">🎲</p>
                    <p className="dice-empty-text">Start a conversation with Dice!</p>
                </div>
            )}

            {groups.map(item => {
                if (item.type === 'date') {
                    return (
                        <div key={item.key} className="dice-date-sep">
                            <span>{item.label}</span>
                        </div>
                    )
                }
                return <MessageBubble key={item.key} message={item.msg} />
            })}

            {/* Typing indicator */}
            {isLoading && <TypingIndicator />}

            {/* Scroll anchor */}
            <div ref={bottomRef} aria-hidden="true" />
        </div>
    )
}

export default ChatMessages
