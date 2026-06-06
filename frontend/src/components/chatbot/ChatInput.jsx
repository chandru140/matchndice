import React, { useState, useRef, useCallback } from 'react'
import { useChatbot } from '../../context/ChatbotContext'

const ChatInput = ({ disabled }) => {
    const [text, setText] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const fileRef = useRef(null)
    const textareaRef = useRef(null)
    const recognitionRef = useRef(null)
    const { sendMessage, sendImage, isLoading, conversationState } = useChatbot()

    // Dynamic placeholder
    const placeholder = isLoading ? 'Dice is thinking…'
        : conversationState === 'customization' ? 'Describe your customization…'
        : 'Type a message…'

    const handleSend = useCallback(() => {
        const trimmed = text.trim()
        if (!trimmed || isLoading) return
        sendMessage(trimmed)
        setText('')
        textareaRef.current?.focus()
    }, [text, isLoading, sendMessage])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Auto-resize textarea
    const handleChange = (e) => {
        setText(e.target.value)
        const ta = textareaRef.current
        if (ta) {
            ta.style.height = 'auto'
            ta.style.height = Math.min(ta.scrollHeight, 100) + 'px'
        }
    }

    // File attachment
    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) sendImage(file)
        e.target.value = ''
    }

    // Voice input (Web Speech API — graceful fallback)
    const handleVoice = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            alert('Voice input is not supported in your browser. Try Chrome!')
            return
        }
        if (isRecording) {
            recognitionRef.current?.stop()
            setIsRecording(false)
            return
        }
        const recognition = new SpeechRecognition()
        recognition.lang = 'en-IN'
        recognition.interimResults = false
        recognition.maxAlternatives = 1
        recognitionRef.current = recognition

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript
            setText(prev => prev + (prev ? ' ' : '') + transcript)
            setIsRecording(false)
        }
        recognition.onerror = () => setIsRecording(false)
        recognition.onend = () => setIsRecording(false)
        recognition.start()
        setIsRecording(true)
    }, [isRecording])

    const canSend = text.trim().length > 0 && !isLoading

    return (
        <div className="dice-input-area">
            {/* Attachment button */}
            <button
                className="dice-input-icon-btn"
                onClick={() => fileRef.current?.click()}
                aria-label="Send image"
                title="Attach image"
                disabled={isLoading}
                type="button"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
            </button>
            <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-hidden="true"
            />

            {/* Text input */}
            <textarea
                ref={textareaRef}
                className="dice-input"
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                disabled={isLoading}
                aria-label="Type your message"
                aria-multiline="true"
                style={{ resize: 'none', overflow: 'hidden' }}
            />

            {/* Voice button */}
            <button
                className={`dice-input-icon-btn ${isRecording ? 'dice-input-icon-btn--active' : ''}`}
                onClick={handleVoice}
                aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                title={isRecording ? 'Stop recording' : 'Voice input'}
                type="button"
            >
                {isRecording ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="8" />
                    </svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                    </svg>
                )}
            </button>

            {/* Send button */}
            <button
                className={`dice-send-btn ${canSend ? 'dice-send-btn--active' : ''}`}
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send message"
                title="Send (Enter)"
                type="button"
            >
                {isLoading ? (
                    <svg className="dice-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                )}
            </button>
        </div>
    )
}

export default ChatInput
