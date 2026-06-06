import React, { useEffect, useContext } from 'react'
import { useLocation } from 'react-router-dom'
import ChatWidget from '../chatbot/ChatWidget.jsx'
import WhatsAppFloatingButton from './WhatsAppFloatingButton.jsx'
import { ShopContext } from '../../context/ShopContext.jsx'

// Pages where NO floating buttons should appear
const HIDDEN_PATHS = new Set([
    '/login', '/signup', '/register',
    '/forgot-password', '/reset-password', '/verify',
])

const isHiddenPath = (pathname) => {
    if (HIDDEN_PATHS.has(pathname)) return true
    if (pathname.startsWith('/admin')) return true
    return false
}

/**
 * FloatingButtonStack
 * Master container for both floating buttons.
 * Renders them in correct stacked position, handles visibility.
 *
 * Stack layout (bottom-right, fixed):
 *   [WA Button]      ← bottom: 24px (rendered first in DOM)
 *   [Chatbot Btn]    ← bottom: 96px (handled in chatbot.css .dice-float-wrap)
 */
const FloatingButtonStack = () => {
    const location = useLocation()

    // Don't render on auth pages or admin
    if (isHiddenPath(location.pathname)) return null

    return (
        <>
            {/* Dice AI Chatbot — sits at bottom: 96px via .dice-float-wrap CSS */}
            <ChatWidget />

            {/* WhatsApp — sits at bottom: 24px via .wa-float-btn CSS */}
            <WhatsAppFloatingButton />
        </>
    )
}

export default FloatingButtonStack
