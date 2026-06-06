import { GoogleGenAI } from '@google/genai'

// ── Base System Prompt ─────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `You are Dice 🎲, the AI gifting expert for Match n Dice — a premium personalized gifting brand in India.

YOUR PERSONALITY:
- Warm, friendly, and genuinely excited about gifting
- Creative and full of ideas
- Patient and thorough — never make the user feel rushed
- Use occasional emojis naturally (not excessively)
- Support both English and Hinglish naturally
  Examples: "Bilkul! Let me help you with that 😊", "Haan, great choice!"
- Never robotic or overly formal

YOUR EXPERTISE:
- Deep knowledge of all Match n Dice products
- Gifting psychology and occasion matching
- Corporate gifting requirements (bulk orders, logo branding)
- Customization possibilities for each product
- Pricing, bulk orders, delivery timelines
- Company policies (returns, cancellations, shipping)

COMPANY INFO:
- Name: Match n Dice
- WhatsApp: +91 9004140139
- Email: matchndice@gmail.com
- Based in India, ships pan-India
- Business hours: 9AM–6PM IST (Monday–Saturday)

CUSTOMIZATION CAPABILITIES:
- Name/text engraving: available on metal products (max 30 chars)
- Logo printing: available on notebooks, bottles, bags, hoodies
- Color customization: hoodies, bags, notebooks
- Custom packaging: all products
- Bulk orders: minimum 10 units for customized products
- Standard delivery: 5–7 business days
- Express delivery: 2–3 business days  
- Customized orders: 7–10 business days
- Free shipping above ₹999
- GST is included in all displayed prices

PRICING POLICY:
- Always mention GST is included
- For bulk orders (10+): always mention special pricing is available
- Approximate pricing only — final quote on WhatsApp

RETURN POLICY:
- Customized products: cannot be returned unless manufacturing defect
- Regular products: 7-day return policy

PAYMENT METHODS:
- UPI, Credit/Debit Card, Netbanking, COD (below ₹2000)

CONVERSATION RULES:
1. Always greet warmly on first message (use user's name if available)
2. Ask clarifying questions ONE AT A TIME — never fire multiple questions
3. When recommending products, show max 3 at a time
4. For customization: collect all requirements before suggesting WhatsApp handoff
5. Always confirm understanding before proceeding to next step
6. If user seems frustrated (negative sentiment, repeated questions): offer WhatsApp escalation
7. NEVER make up product details not in the catalog below
8. End every completed customization flow with a WhatsApp handoff

RESPONSE FORMAT RULES (CRITICAL — follow exactly):
- Keep responses concise: max 3–4 sentences normally
- Use bullet points for lists: render them as "• item"
- For product recommendations, append this JSON block:
  <product_recommendation>{"type":"products","items":[{"id":"PRODUCT_ID","reason":"why this fits the user"}]}</product_recommendation>
- When you want to suggest quick reply chips, append:
  <quick_replies>["Option 1","Option 2","Option 3"]</quick_replies>
- When customization is fully collected, append:
  <customization_complete>{"productId":"ID","productName":"NAME","requirements":{"text":"","logo":false,"color":"","quantity":1,"deadline":"","occasion":"","additionalNotes":""},"userInfo":{"name":"","phone":"","email":""}}</customization_complete>
- When ready for WhatsApp handoff, append:
  <whatsapp_handoff>{"message":"pre-filled WhatsApp message here","number":"919004140139"}</whatsapp_handoff>

INITIAL GREETING (use ONLY on very first message if no prior context):
"Hey there! 🎲 I'm Dice, your AI gifting expert at Match n Dice! Whether you need a corporate gift, birthday surprise, or something totally unique — I've got you covered. What brings you here today? 😊"

Then add: <quick_replies>["I need a gift idea 🎁","Customize a product ✏️","Track my order 📦","Ask a question ❓"]</quick_replies>`

class ChatbotService {
    constructor() {
        this.client = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        })
        this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
        this.maxOutputTokens = parseInt(process.env.CHAT_MAX_TOKENS || '800')
    }

    // ── Build dynamic system prompt injecting live product catalog ─────────────
    buildSystemPrompt(products = [], context = {}) {
        const productCatalog = products.length > 0
            ? products.slice(0, 50).map(p => {
                const stockStatus = p.stock > 0 ? `In Stock (${p.stock} units)` : 'Out of Stock'
                const catName = p.category?.name || p.category || 'General'
                const subCatName = p.subCategory?.name || p.subCategory || ''
                return `• ${p.name} (ID: ${p._id})
  Price: ₹${p.price} | Category: ${catName}${subCatName ? ' > ' + subCatName : ''} | ${stockStatus}
  ${p.description ? p.description.slice(0, 120) : ''}
  Customizable: ${p.isCustomizable ? 'Yes' : 'No'}${p.sizes?.length ? ' | Sizes: ' + p.sizes.join(', ') : ''}`
            }).join('\n')
            : 'Product catalog is loading...'

        let contextBlock = ''
        if (context.currentPage) contextBlock += `\nUser is currently on: ${context.currentPage}`
        if (context.currentProductId) {
            const viewedProduct = products.find(p => p._id?.toString() === context.currentProductId)
            if (viewedProduct) contextBlock += `\nUser is viewing: ${viewedProduct.name} (₹${viewedProduct.price})`
        }
        if (context.cartItemCount > 0) contextBlock += `\nUser has ${context.cartItemCount} item(s) in cart`
        if (context.isLoggedIn && context.userName) contextBlock += `\nUser's name: ${context.userName}`
        if (context.isLoggedIn) contextBlock += '\nUser is logged in'

        const hour = new Date().getHours()
        const timeGreeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
        contextBlock += `\nTime of day: ${timeGreeting}`

        return `${BASE_SYSTEM_PROMPT}\n\n${contextBlock ? 'CURRENT SESSION CONTEXT:' + contextBlock + '\n\n' : ''}LIVE PRODUCT CATALOG:\n${productCatalog}`
    }

    // ── Format conversation history for Gemini ─────────────────────────────────
    formatMessages(history = [], newMessage, imageData = null) {
        const contents = history.slice(-10).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }))

        // Add new user message (with optional image)
        const userParts = []
        if (imageData) {
            // Gemini vision: inline image data
            const matches = imageData.match(/^data:(.+);base64,(.+)$/)
            if (matches) {
                userParts.push({
                    inlineData: {
                        mimeType: matches[1],
                        data: matches[2],
                    },
                })
            }
        }
        userParts.push({ text: newMessage || (imageData ? 'What do you think of this image? Can you suggest matching products from your catalog?' : '') })

        contents.push({ role: 'user', parts: userParts })
        return contents
    }

    // ── Parse XML tags from AI response ───────────────────────────────────────
    parseResponse(rawText) {
        let text = rawText
        let products = null
        let quickReplies = null
        let customizationComplete = null
        let whatsappHandoff = null
        let action = null

        const extract = (tag, raw) => {
            const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`)
            const m = raw.match(re)
            if (m) {
                try {
                    return { data: JSON.parse(m[1].trim()), raw: m[0] }
                } catch {
                    return { data: null, raw: m[0] }
                }
            }
            return null
        }

        const productMatch = extract('product_recommendation', text)
        if (productMatch?.data) {
            products = productMatch.data
            text = text.replace(productMatch.raw, '').trim()
        }

        const qrMatch = extract('quick_replies', text)
        if (qrMatch?.data) {
            quickReplies = qrMatch.data
            text = text.replace(qrMatch.raw, '').trim()
        }

        const custMatch = extract('customization_complete', text)
        if (custMatch?.data) {
            customizationComplete = custMatch.data
            text = text.replace(custMatch.raw, '').trim()
            action = 'show_customization_summary'
        }

        const waMatch = extract('whatsapp_handoff', text)
        if (waMatch?.data) {
            whatsappHandoff = waMatch.data
            text = text.replace(waMatch.raw, '').trim()
            action = 'open_whatsapp'
        }

        return {
            text: text.trim(),
            products,
            quickReplies,
            customizationComplete,
            whatsappHandoff,
            action,
        }
    }

    // ── Main: generate response ────────────────────────────────────────────────
    async generateResponse({ sessionId, userMessage, conversationHistory, context, products, imageData }) {
        const systemPrompt = this.buildSystemPrompt(products, context)
        const contents = this.formatMessages(conversationHistory, userMessage, imageData)

        const response = await this.client.models.generateContent({
            model: this.model,
            contents,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.72,
                topP: 0.9,
                maxOutputTokens: this.maxOutputTokens,
            },
        })

        const rawText = response.text
        const parsed = this.parseResponse(rawText)

        return {
            ...parsed,
            rawResponse: rawText,
            usage: {
                inputTokens: response.usageMetadata?.promptTokenCount || 0,
                outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
            },
        }
    }

    // ── Streaming: generates SSE-compatible stream ─────────────────────────────
    async generateStream({ userMessage, conversationHistory, context, products, imageData }) {
        const systemPrompt = this.buildSystemPrompt(products, context)
        const contents = this.formatMessages(conversationHistory, userMessage, imageData)

        const stream = await this.client.models.generateContentStream({
            model: this.model,
            contents,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.72,
                topP: 0.9,
                maxOutputTokens: this.maxOutputTokens,
            },
        })

        return stream
    }
}

export default new ChatbotService()
