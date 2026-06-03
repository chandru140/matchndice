import mongoose from 'mongoose'

const whatsAppInquirySchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        productName:  { type: String, required: true, trim: true },
        productPrice: { type: Number, required: true },
        productUrl:   { type: String, trim: true },
        userName:     { type: String, trim: true },
        userEmail:    { type: String, trim: true, lowercase: true },
        userPhone:    { type: String, trim: true, default: '' },
        message:      { type: String, trim: true }, // pre-filled message text
        status: {
            type: String,
            enum: ['initiated', 'responded', 'converted'],
            default: 'initiated',
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
