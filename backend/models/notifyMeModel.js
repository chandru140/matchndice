import mongoose from 'mongoose'

const notifyMeSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product',
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
  notified: {
    type: Boolean,
    default: false,
  },
  notifiedAt: {
    type: Date,
  },
}, { timestamps: true })

// Unique: one email per product
notifyMeSchema.index({ productId: 1, email: 1 }, { unique: true })

const notifyMeModel = mongoose.models.NotifyMe || mongoose.model('NotifyMe', notifyMeSchema)
export default notifyMeModel
