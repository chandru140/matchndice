import express from 'express'
import authUser   from '../middleware/auth.js'
import adminAuth  from '../middleware/adminAuth.js'
import {
    checkEligibility,
    submitReview,
    getProductReviews,
    editReview,
    deleteReview,
    voteReview,
    adminGetAllReviews,
    adminUpdateReviewStatus,
    adminReplyToReview,
} from '../controllers/reviewController.js'

const reviewRouter = express.Router()

// ── Public ──────────────────────────────────────────────────────────────────
// GET all published reviews for a product (with pagination, sort, filter)
reviewRouter.get('/product/:productId', getProductReviews)

// ── Authenticated User ──────────────────────────────────────────────────────
// Check if current user can review a product
reviewRouter.get('/eligibility/:productId', authUser, checkEligibility)

// Submit a new review
reviewRouter.post('/', authUser, submitReview)

// Edit own review (within 30 days)
reviewRouter.put('/:reviewId', authUser, editReview)

// Delete own review
reviewRouter.delete('/:reviewId', authUser, deleteReview)

// Helpful vote on a review
reviewRouter.post('/:reviewId/vote', authUser, voteReview)

// ── Admin ───────────────────────────────────────────────────────────────────
// List all reviews (with optional status filter)
reviewRouter.get('/admin/all', adminAuth, adminGetAllReviews)

// Approve / reject a review
reviewRouter.patch('/admin/:reviewId/status', adminAuth, adminUpdateReviewStatus)

// Reply to a review
reviewRouter.post('/admin/:reviewId/reply', adminAuth, adminReplyToReview)

// Admin only: delete a review permanently
reviewRouter.delete('/admin/:reviewId', adminAuth, async (req, res, next) => {
  try {
    const review = await (await import('../models/reviewModel.js')).default.findByIdAndDelete(req.params.reviewId)
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' })

    // Recalculate product rating
    const mongoose = (await import('mongoose')).default
    const productModel = (await import('../models/productModel.js')).default
    const result = await (await import('../models/reviewModel.js')).default.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(review.productId), status: 'published' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    await productModel.findByIdAndUpdate(review.productId, {
      avgRating:   result[0] ? Math.round(result[0].avg * 10) / 10 : 0,
      reviewCount: result[0]?.count ?? 0,
    })

    res.json({ success: true, message: 'Review permanently deleted.' })
  } catch (error) { next(error) }
})

export default reviewRouter
