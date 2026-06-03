import mongoose from 'mongoose'

// ── Review Schema ─────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema(
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
            index: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
            validate: {
                validator: Number.isInteger,
                message: 'Rating must be a whole number',
            },
        },
        title: {
            type: String,
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
            default: '',
        },
        comment: {
            type: String,
            required: [true, 'Review comment is required'],
            trim: true,
            minlength: [20, 'Review must be at least 20 characters'],
            maxlength: [500, 'Review cannot exceed 500 characters'],
        },
        images: {
            type: [String],
            default: [],
            validate: {
                validator: (arr) => arr.length <= 3,
                message: 'Maximum 3 images allowed',
            },
        },
        isVerifiedPurchase: {
            type: Boolean,
            default: true, // Always true — we enforce purchase verification before saving
        },
        status: {
            type: String,
            enum: ['pending', 'published', 'rejected'],
            default: 'published', // Auto-publish verified purchase reviews
        },
        helpfulVotes: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
                vote: { type: String, enum: ['up', 'down'] },
            },
        ],
        adminReply: {
            text: { type: String, trim: true, default: '' },
            repliedAt: { type: Date },
            repliedBy: { type: String }, // Admin identifier
        },
        editHistory: [
            {
                editedAt: { type: Date, default: Date.now },
                previousComment: { type: String },
                previousRating: { type: Number },
            },
        ],
    },
    { timestamps: true }
)

// ── Compound unique index: one review per user per product ────────────────────
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true })

// ── Performance indexes ───────────────────────────────────────────────────────
reviewSchema.index({ productId: 1, status: 1, createdAt: -1 })
reviewSchema.index({ userId: 1, createdAt: -1 })

const reviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema)

export default reviewModel
