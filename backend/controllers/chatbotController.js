import { v4 as uuidv4 } from 'uuid'
import ChatSession from '../models/ChatSession.js'
import chatbotService from '../services/chatbotService.js'
import productModel from '../models/productModel.js'

// ── Helpers ────────────────────────────────────────────────────────────────────
const getOrCreateSession = async (sessionId, userId = null) => {
    if (!sessionId) return null

    let session = await ChatSession.findOne({ sessionId })
    if (!session) {
        session = new ChatSession({
            sessionId,
            userId: userId || null,
        })
        await session.save()
    } else if (userId && !session.userId) {
        // Link session to user if they just logged in
        session.userId = userId
        await session.save()
    }
    return session
}

const getProducts = async () => {
    try {
        return await productModel.find({ isDeleted: { $ne: true } })
            .populate('category', 'name')
            .populate('subCategory', 'name')
            .lean()
    } catch {
        return []
    }
}

// Determine conversation state from AI response
const inferState = (parsed, currentState) => {
    if (parsed.whatsappHandoff) return 'handoff'
    if (parsed.customizationComplete) return 'customization'
    if (parsed.products) return 'recommendation'
    return currentState || 'greeting'
}

// ── POST /api/chatbot/message ─────────────────────────────────────────────────
export const sendMessage = async (req, res, next) => {
    try {
        const userId = req.userId || null
        const {
            sessionId,
            message,
            messageType = 'text',
            imageData = null,
            context = {},
        } = req.body

        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'sessionId is required.' })
        }
        if (!message && !imageData) {
            return res.status(400).json({ success: false, message: 'message or imageData is required.' })
        }

        // Rate limit: check message count in last minute
        const session = await getOrCreateSession(sessionId, userId)
        const oneMinuteAgo = new Date(Date.now() - 60_000)
        const recentMessages = session.messages.filter(
            m => m.role === 'user' && new Date(m.timestamp) > oneMinuteAgo
        )
        if (recentMessages.length >= 20) {
            return res.status(429).json({
                success: false,
                error: 'RATE_LIMITED',
                message: "I'm getting a lot of messages right now! Please wait a moment. 😊",
            })
        }

        // Fetch live products for context injection
        const products = await getProducts()

        // Build conversation history (last 10 messages to control token cost)
        const history = session.messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
        }))

        // Call Gemini
        const aiResponse = await chatbotService.generateResponse({
            sessionId,
            userMessage: message,
            conversationHistory: history,
            context: { ...context, userId },
            products,
            imageData,
        })

        const messageId = uuidv4()
        const now = new Date()
        const newState = inferState(aiResponse, session.conversationState)

        // Persist user message + AI response
        session.messages.push({
            role: 'user',
            content: message || '[image]',
            messageType,
            imageUrl: null, // We don't store raw base64 in DB
            metadata: {},
            timestamp: now,
        })
        session.messages.push({
            role: 'assistant',
            content: aiResponse.text,
            messageType: aiResponse.whatsappHandoff ? 'whatsapp_handoff'
                : aiResponse.customizationComplete ? 'customization_summary'
                : aiResponse.products ? 'product_card'
                : 'text',
            metadata: {
                products:             aiResponse.products || null,
                quickReplies:         aiResponse.quickReplies || null,
                customizationSummary: aiResponse.customizationComplete || null,
                whatsappHandoff:      aiResponse.whatsappHandoff || null,
                action:               aiResponse.action || null,
            },
            timestamp: now,
        })

        // Update session state
        session.conversationState = newState
        session.lastMessageAt = now
        session.totalMessages = (session.totalMessages || 0) + 2
        session.tokenUsage.inputTokens += aiResponse.usage?.inputTokens || 0
        session.tokenUsage.outputTokens += aiResponse.usage?.outputTokens || 0

        // Merge customization data if present
        if (aiResponse.customizationComplete) {
            session.customizationData = {
                ...session.customizationData,
                ...aiResponse.customizationComplete,
                isComplete: true,
            }
        }

        await session.save()

        res.json({
            success: true,
            sessionId,
            messageId,
            response: {
                text:                 aiResponse.text,
                products:             aiResponse.products,
                quickReplies:         aiResponse.quickReplies,
                customizationSummary: aiResponse.customizationComplete,
                whatsappHandoff:      aiResponse.whatsappHandoff,
                action:               aiResponse.action,
            },
            conversationState: newState,
            timestamp: now.toISOString(),
        })
    } catch (error) {
        // Gemini API errors → graceful fallback
        if (error.message?.includes('API_KEY') || error.message?.includes('quota')) {
            return res.status(503).json({
                success: false,
                error: 'AI_UNAVAILABLE',
                response: {
                    text: "I'm having a little trouble right now 😅 Please try again or chat with our team on WhatsApp!",
                    quickReplies: ['Try Again', 'Chat on WhatsApp'],
                    action: null,
                },
            })
        }
        next(error)
    }
}

// ── POST /api/chatbot/stream — SSE streaming response ─────────────────────────
export const streamMessage = async (req, res, next) => {
    try {
        const userId = req.userId || null
        const { sessionId, message, messageType = 'text', imageData = null, context = {} } = req.body

        if (!sessionId || (!message && !imageData)) {
            return res.status(400).json({ success: false, message: 'sessionId and message are required.' })
        }

        const session = await getOrCreateSession(sessionId, userId)
        const products = await getProducts()
        const history = session.messages.slice(-10).map(m => ({ role: m.role, content: m.content }))

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.flushHeaders()

        let fullText = ''

        try {
            const stream = await chatbotService.generateStream({
                userMessage: message,
                conversationHistory: history,
                context: { ...context, userId },
                products,
                imageData,
            })

            for await (const chunk of stream) {
                const token = chunk.text || ''
                fullText += token
                res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`)
            }

            // Parse the complete response
            const parsed = chatbotService.parseResponse(fullText)
            const now = new Date()
            const newState = inferState(parsed, session.conversationState)

            // Save to DB
            session.messages.push({ role: 'user', content: message || '[image]', messageType, metadata: {}, timestamp: now })
            session.messages.push({
                role: 'assistant',
                content: parsed.text,
                messageType: parsed.whatsappHandoff ? 'whatsapp_handoff' : parsed.products ? 'product_card' : 'text',
                metadata: {
                    products:        parsed.products || null,
                    quickReplies:    parsed.quickReplies || null,
                    customizationSummary: parsed.customizationComplete || null,
                    whatsappHandoff: parsed.whatsappHandoff || null,
                    action:          parsed.action || null,
                },
                timestamp: now,
            })
            session.conversationState = newState
            session.lastMessageAt = now
            session.totalMessages = (session.totalMessages || 0) + 2
            if (parsed.customizationComplete) {
                session.customizationData = { ...parsed.customizationComplete, isComplete: true }
            }
            await session.save()

            // Send metadata as final event
            res.write(`data: ${JSON.stringify({
                type: 'done',
                metadata: {
                    text:                 parsed.text,
                    products:             parsed.products,
                    quickReplies:         parsed.quickReplies,
                    customizationSummary: parsed.customizationComplete,
                    whatsappHandoff:      parsed.whatsappHandoff,
                    action:               parsed.action,
                    conversationState:    newState,
                },
            })}\n\n`)
        } catch (streamError) {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                message: "I'm having trouble right now. Please try again! 😊",
                quickReplies: ['Try Again', 'Chat on WhatsApp'],
            })}\n\n`)
        }

        res.end()
    } catch (error) {
        if (!res.headersSent) next(error)
        else res.end()
    }
}

// ── POST /api/chatbot/action ───────────────────────────────────────────────────
export const executeAction = async (req, res, next) => {
    try {
        const { sessionId, action, payload } = req.body
        const userId = req.userId || null

        if (!sessionId || !action) {
            return res.status(400).json({ success: false, message: 'sessionId and action are required.' })
        }

        let data = null

        switch (action) {
            case 'get_products': {
                const products = await getProducts()
                const ids = payload?.ids || []
                data = ids.length > 0
                    ? products.filter(p => ids.includes(p._id?.toString()))
                    : products.slice(0, 6)
                break
            }
            case 'mark_handoff': {
                await ChatSession.findOneAndUpdate(
                    { sessionId },
                    { whatsappMessageSent: true, handoffAt: new Date(), conversationState: 'handoff' }
                )
                data = { marked: true }
                break
            }
            case 'save_rating': {
                const { rating, feedback } = payload || {}
                if (rating >= 1 && rating <= 5) {
                    await ChatSession.findOneAndUpdate({ sessionId }, { rating, feedback: feedback || '' })
                    data = { saved: true }
                }
                break
            }
            case 'get_orders': {
                if (!userId) {
                    return res.json({ success: false, message: 'Login required to view orders.', requiresLogin: true })
                }
                const orderModel = (await import('../models/orderModel.js')).default
                const orders = await orderModel.find({ userId }).sort({ date: -1 }).limit(5).lean()
                data = orders
                break
            }
            default:
                return res.status(400).json({ success: false, message: `Unknown action: ${action}` })
        }

        res.json({ success: true, action, data })
    } catch (error) {
        next(error)
    }
}

// ── GET /api/chatbot/session/:sessionId ───────────────────────────────────────
export const getSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params
        const session = await ChatSession.findOne({ sessionId }).lean()
        if (!session) {
            return res.json({ success: true, session: null })
        }
        // Return last 30 messages for restoration
        res.json({
            success: true,
            session: {
                sessionId: session.sessionId,
                conversationState: session.conversationState,
                messages: session.messages.slice(-30),
                customizationData: session.customizationData,
            },
        })
    } catch (error) {
        next(error)
    }
}

// ── POST /api/chatbot/rate ─────────────────────────────────────────────────────
export const rateSession = async (req, res, next) => {
    try {
        const { sessionId, rating, feedback } = req.body
        if (!sessionId || !rating) {
            return res.status(400).json({ success: false, message: 'sessionId and rating are required.' })
        }
        await ChatSession.findOneAndUpdate({ sessionId }, { rating: Math.min(5, Math.max(1, rating)), feedback })
        res.json({ success: true, message: 'Thank you for your feedback! 🙏' })
    } catch (error) {
        next(error)
    }
}
