import mongoose from 'mongoose'

// ── Embedded Message Schema ────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'quick_reply', 'product_card', 'whatsapp_handoff', 'customization_summary'],
        default: 'text',
    },
    imageUrl: { type: String, default: null },
    metadata: {
        products:             { type: Array,  default: null },
        quickReplies:         { type: Array,  default: null },
        customizationSummary: { type: Object, default: null },
        whatsappHandoff:      { type: Object, default: null },
        action:               { type: String, default: null },
    },
    timestamp: { type: Date, default: Date.now },
}, { _id: false })

// ── Chat Session Schema ────────────────────────────────────────────────────────
const chatSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null,
    },
    guestId: {
        type: String,
        default: null,
    },
    messages: [messageSchema],
    conversationState: {
        type: String,
        enum: ['greeting', 'recommendation', 'customization', 'order_query', 'faq', 'escalation', 'complete', 'handoff'],
        default: 'greeting',
    },
    // Accumulated customization data across conversation turns
    customizationData: {
        productId:   { type: String, default: null },
        productName: { type: String, default: null },
        requirements: {
            text:            String,
            logo:            Boolean,
            color:           String,
            quantity:        Number,
            deadline:        String,
            occasion:        String,
            additionalNotes: String,
        },
        userInfo: {
            name:  String,
            phone: String,
            email: String,
        },
        isComplete: { type: Boolean, default: false },
    },
    // Usage tracking for cost control
    tokenUsage: {
        inputTokens:  { type: Number, default: 0 },
        outputTokens: { type: Number, default: 0 },
    },
    // WhatsApp handoff
    whatsappMessageSent: { type: Boolean, default: false },
    handoffAt: { type: Date, default: null },
    // Post-chat satisfaction
    rating:   { type: Number, min: 1, max: 5, default: null },
    feedback: { type: String, default: null },
    // Lifecycle
    isActive:       { type: Boolean, default: true },
    totalMessages:  { type: Number,  default: 0 },
    startedAt:      { type: Date,    default: Date.now },
    lastMessageAt:  { type: Date,    default: Date.now },
}, {
    timestamps: true,
})

// ── TTL Index: auto-delete sessions inactive for 24 hours ──────────────────────
chatSessionSchema.index({ lastMessageAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 })
chatSessionSchema.index({ userId: 1 })
chatSessionSchema.index({ conversationState: 1 })

const ChatSession = mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema)
export default ChatSession
