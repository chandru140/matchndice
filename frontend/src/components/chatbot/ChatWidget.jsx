import React, { useEffect, useRef, useCallback } from 'react'
import { useChatbot } from '../../context/ChatbotContext'
import ChatHeader from './ChatHeader'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import QuickReplies from './QuickReplies'
import FloatingButton from './FloatingButton'

const ChatWidget = () => {
    const {
        isOpen, isMinimized, closeChat, minimizeChat,
        messages, isLoading, quickReplies, error,
    } = useChatbot()

    const windowRef = useRef(null)

    // Escape key to close
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && isOpen) closeChat()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [isOpen, closeChat])

    // Focus trap: move focus into chat window when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                windowRef.current?.querySelector('textarea')?.focus()
            }, 300)
        }
    }, [isOpen])

    return (
        <>
            {/* Floating trigger button (visible when chat is closed) */}
            <FloatingButton />

            {/* Chat window */}
            {isOpen && (
                <div
                    ref={windowRef}
                    className="dice-window"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Dice AI Gifting Assistant"
                    aria-live="polite"
                >
                    {/* Header */}
                    <ChatHeader
                        onClose={closeChat}
                        onMinimize={minimizeChat}
                    />

                    {/* Offline / error banner */}
                    {!navigator.onLine && (
                        <div className="dice-banner dice-banner--warn" role="alert">
                            📶 You're offline. Messages will send when connected.
                        </div>
                    )}

                    {/* Messages area */}
                    <ChatMessages messages={messages} isLoading={isLoading} />

                    {/* Quick reply chips */}
                    {quickReplies.length > 0 && (
                        <QuickReplies replies={quickReplies} />
                    )}

                    {/* Input area */}
                    <ChatInput disabled={isLoading} />

                    {/* Powered-by footer */}
                    <div className="dice-powered">
                        Powered by <strong>Gemini AI</strong> · Match n Dice
                    </div>
                </div>
            )}
        </>
    )
}

export default ChatWidget
