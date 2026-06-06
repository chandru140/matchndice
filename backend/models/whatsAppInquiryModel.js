import mongoose from 'mongoose'

const whatsAppInquirySchema = new mongoose.Schema(
    {
        // ── Shared fields (product inquiry + floating button) ─────────────────────
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        userName:  { type: String, trim: true },
        userEmail: { type: String, trim: true, lowercase: true },
        userPhone: { type: String, trim: true, default: '' },
        message:   { type: String, trim: true },
        status: {
            type: String,
            enum: ['initiated', 'responded', 'converted'],
            default: 'initiated',
        },

        // ── Source discriminator ──────────────────────────────────────────────────
        source: {
            type: String,
            enum: ['product_page', 'floating_button'],
            default: 'product_page',
            index: true,
        },

        // ── Product inquiry fields (source = product_page) ───────────────────────
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            default: null,
            index: true,
        },
        productName:  { type: String, trim: true, default: '' },
        productPrice: { type: Number, default: 0 },
        productUrl:   { type: String, trim: true, default: '' },

        // ── Floating button fields (source = floating_button) ────────────────────
        page:           { type: String, trim: true, default: '' },
        pageTitle:      { type: String, trim: true, default: '' },
        contextType: {
            type: String,
            enum: ['general', 'product', 'order', 'cart', 'after_chat'],
            default: 'general',
        },
        cartValue:      { type: Number, default: null },
        messagePreview: { type: String, trim: true, maxlength: 200, default: '' },
        deviceType: {
            type: String,
            enum: ['mobile', 'desktop', 'tablet'],
            default: 'desktop',
        },
    },
    { timestamps: true }
)

// Perf indexes
whatsAppInquirySchema.index({ productId: 1, createdAt: -1 })
whatsAppInquirySchema.index({ userId: 1, createdAt: -1 })

const whatsAppInquiryModel =
    mongoose.models.WhatsAppInquiry ||
    mongoose.model('WhatsAppInquiry', whatsAppInquirySchema)

export default whatsAppInquiryModel
