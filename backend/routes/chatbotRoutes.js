import express from 'express'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import {
    sendMessage,
    streamMessage,
    executeAction,
    getSession,
    rateSession,
} from '../controllers/chatbotController.js'

const chatbotRouter = express.Router()

// ── Per-route rate limiter ─────────────────────────────────────────────────────
const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,             // 30 msg/min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'CHAT_RATE_LIMITED',
        response: {
            text: "Whoa, slow down! 😄 I'm thinking as fast as I can. Try again in a moment!",
            quickReplies: ['Try Again', 'Chat on WhatsApp'],
        },
    },
    skip: (req) => req.method === 'GET',
})

// ── Optional auth middleware ───────────────────────────────────────────────────
// Attaches req.userId if a valid token is present; silently skips for guests.
// This enriches AI responses for logged-in users (name, order history, etc.)
const optionalAuth = (req, res, next) => {
    const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '')
    if (!token) return next()
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = decoded.id
    } catch {
        // Invalid/expired token for guests — just skip silently
    }
    next()
}

// ── Routes ────────────────────────────────────────────────────────────────────
// All routes work for guests; optionalAuth enriches responses for logged-in users
chatbotRouter.post('/message',            chatLimiter, optionalAuth, sendMessage)
chatbotRouter.post('/stream',             chatLimiter, optionalAuth, streamMessage)
chatbotRouter.post('/action',             optionalAuth, executeAction)
chatbotRouter.get( '/session/:sessionId', getSession)
chatbotRouter.post('/rate',               rateSession)

export default chatbotRouter
