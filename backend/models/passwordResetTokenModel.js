import mongoose from 'mongoose'

const passwordResetTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true,
    },
    tokenHash: {
        type: String,
        required: true,
        index: true,  // fast lookup by hash
    },
    expiresAt: {
        type: Date,
        required: true,
        // TTL index — MongoDB auto-deletes expired docs
        index: { expires: 0 },
    },
    used: {
        type: Boolean,
        default: false,
    },
    usedAt: {
        type: Date,
        default: null,
    },
    ipAddress: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

// Prevent returning tokenHash in default queries
passwordResetTokenSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.tokenHash
        return ret
    },
})

const PasswordResetToken =
    mongoose.models.PasswordResetToken ||
    mongoose.model('PasswordResetToken', passwordResetTokenSchema)

export default PasswordResetToken
