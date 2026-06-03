import reviewModel    from '../models/reviewModel.js'
import orderModel     from '../models/orderModel.js'
import productModel   from '../models/productModel.js'
import userModel      from '../models/userModel.js'
import mongoose       from 'mongoose'

// ─── Helper: recalculate product average rating ─────────────────────────────
const recalcProductRating = async (productId) => {
    const result = await reviewModel.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'published' } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    const avg   = result[0]?.avg   ?? 0
    const count = result[0]?.count ?? 0
    await productModel.findByIdAndUpdate(productId, {
        avgRating:   Math.round(avg * 10) / 10,
        reviewCount: count,
    })
}

// ─── Helper: find delivered order containing productId for userId ────────────
const findDeliveredOrder = async (userId, productId) => {
    const pid = productId.toString()
    return orderModel.findOne({
        userId,
        status: 'Delivered',
        items: { $elemMatch: { _id: pid } },
    }).sort({ date: -1 })
}

// ─── Helper: find ANY order containing productId for userId ─────────────────
const findAnyOrder = async (userId, productId) => {
    const pid = productId.toString()
    return orderModel.findOne({
        userId,
        items: { $elemMatch: { _id: pid } },
    }).sort({ date: -1 })
}

// GET /api/reviews/eligibility/:productId
// Headers: token (JWT)  — req.userId set by authUser middleware
const checkEligibility = async (req, res, next) => {
    try {
        const userId    = req.userId
        const { productId } = req.params

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID.' })
        }

        // Case 4 — Already reviewed?
        const existingReview = await reviewModel.findOne({ userId, productId })
        if (existingReview) {
            return res.json({
                success: true,
                eligible: false,
                reason: 'ALREADY_REVIEWED',
                message: 'You have already reviewed this product.',
                existingReview: {
                    rating:    existingReview.rating,
                    title:     existingReview.title,
                    comment:   existingReview.comment,
                    createdAt: existingReview.createdAt,
                    _id:       existingReview._id,
                    // allow edit within 30 days
                    canEdit: (Date.now() - existingReview.createdAt) < 30 * 24 * 60 * 60 * 1000,
                },
            })
        }

        // Case 2 — Never ordered?
        const anyOrder = await findAnyOrder(userId, productId)
        if (!anyOrder) {
            return res.json({
                success: true,
                eligible: false,
                reason: 'NOT_PURCHASED',
                message: 'You can only review products you have purchased.',
            })
        }

        // Case 3 — Ordered but not delivered?
        const deliveredOrder = await findDeliveredOrder(userId, productId)
        if (!deliveredOrder) {
            return res.json({
                success: true,
                eligible: false,
                reason: 'NOT_DELIVERED',
                message: 'You can review this product once it is delivered.',
                orderStatus: anyOrder.status,
            })
        }

        // Case 5 — Eligible
        return res.json({
            success: true,
            eligible: true,
            reason: 'ELIGIBLE',
            orderId: deliveredOrder._id,
            message: 'Share your experience with this product!',
        })
    } catch (error) {
        next(error)
    }
}

// POST /api/reviews
// Body: { productId, orderId, rating, title, comment }
const submitReview = async (req, res, next) => {
    try {
        const userId = req.userId
        const { productId, orderId, rating, title, comment } = req.body

        // ── Validation ───────────────────────────────────────────
        if (!productId || !orderId || !rating || !comment) {
            return res.status(400).json({ success: false, message: 'productId, orderId, rating and comment are required.' })
        }

        const ratingNum = Number(rating)
        if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' })
        }

        const trimmedComment = comment.trim()
        if (trimmedComment.length < 20) {
            return res.status(400).json({ success: false, message: 'Review must be at least 20 characters.' })
        }
        if (trimmedComment.length > 500) {
            return res.status(400).json({ success: false, message: 'Review cannot exceed 500 characters.' })
        }

        // ── Verify order ownership ────────────────────────────────
        const order = await orderModel.findById(orderId)
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' })
        }
        if (order.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to review this order.' })
        }

        // ── Verify order contains this product ────────────────────
        const hasProduct = order.items.some(
            item => item._id?.toString() === productId?.toString()
        )
        if (!hasProduct) {
            return res.status(400).json({ success: false, message: 'This product is not in the specified order.' })
        }

        // ── Verify order is delivered ─────────────────────────────
        if (order.status !== 'Delivered') {
            return res.status(400).json({
                success: false,
                message: `You can only review delivered orders. Current status: ${order.status}.`,
            })
        }

        // ── Prevent duplicate reviews ─────────────────────────────
        const existing = await reviewModel.findOne({ userId, productId })
        if (existing) {
            return res.status(409).json({ success: false, message: 'You have already reviewed this product.' })
        }

        // ── Create review ─────────────────────────────────────────
        const review = await reviewModel.create({
            productId,
            userId,
            orderId,
            rating:   ratingNum,
            title:    (title || '').trim().slice(0, 100),
            comment:  trimmedComment,
            isVerifiedPurchase: true,
            status: 'published',
        })

        // ── Update product avg rating ─────────────────────────────
        await recalcProductRating(productId)

        // Populate user name for immediate return
        const user = await userModel.findById(userId).select('name')

        return res.status(201).json({
            success: true,
            message: 'Review submitted successfully!',
            review: {
                ...review.toObject(),
                userName: user?.name || 'Customer',
            },
        })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'You have already reviewed this product.' })
        }
        next(error)
    }
}

// GET /api/reviews/product/:productId
// Public — returns published reviews for a product
const getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params
        const { sort = 'recent', rating: filterRating, page = 1, limit = 10 } = req.query

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID.' })
        }

        const query = { productId, status: 'published' }
        if (filterRating) query.rating = Number(filterRating)

        const sortMap = {
            recent:  { createdAt: -1 },
            highest: { rating: -1, createdAt: -1 },
            lowest:  { rating: 1, createdAt: -1 },
            helpful: { 'helpfulVotes': -1, createdAt: -1 },
        }
        const sortQuery = sortMap[sort] || sortMap.recent

        const pageNum  = Math.max(1, Number(page))
        const limitNum = Math.min(20, Math.max(1, Number(limit)))
        const skip     = (pageNum - 1) * limitNum

        const [reviews, total] = await Promise.all([
            reviewModel.find(query)
                .sort(sortQuery)
                .skip(skip)
                .limit(limitNum)
                .populate('userId', 'name')
                .lean(),
            reviewModel.countDocuments(query),
        ])

        // Mask full name to "First L." format
        const masked = reviews.map(r => ({
            ...r,
            userName: r.userId
                ? `${r.userId.name.split(' ')[0]} ${(r.userId.name.split(' ')[1] || '').charAt(0)}.`.trim()
                : 'Customer',
            userId: undefined,  // never expose full user ID publicly
        }))

        // Star distribution for summary
        const distribution = await reviewModel.aggregate([
            { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'published' } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
        ])

        const distMap = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        distribution.forEach(d => { distMap[d._id] = d.count })

        const avgResult = await reviewModel.aggregate([
            { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'published' } },
            { $group: { _id: null, avg: { $avg: '$rating' } } },
        ])
        const avgRating = avgResult[0] ? Math.round(avgResult[0].avg * 10) / 10 : 0

        res.json({
            success: true,
            reviews: masked,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            summary: { avgRating, totalReviews: total, distribution: distMap },
        })
    } catch (error) {
        next(error)
    }
}

// PUT /api/reviews/:reviewId  — User edits own review (within 30 days)
const editReview = async (req, res, next) => {
    try {
        const userId     = req.userId
        const { reviewId } = req.params
        const { rating, title, comment } = req.body

        const review = await reviewModel.findById(reviewId)
        if (!review) return res.status(404).json({ success: false, message: 'Review not found.' })
        if (review.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this review.' })
        }

        const ageDays = (Date.now() - review.createdAt) / (1000 * 60 * 60 * 24)
        if (ageDays > 30) {
            return res.status(400).json({ success: false, message: 'Reviews can only be edited within 30 days of submission.' })
        }

        // Save edit history before modifying
        review.editHistory.push({
            editedAt: new Date(),
            previousComment: review.comment,
            previousRating:  review.rating,
        })

        if (rating)  review.rating  = Number(rating)
        if (title)   review.title   = title.trim().slice(0, 100)
        if (comment) review.comment = comment.trim().slice(0, 500)

        await review.save()
        await recalcProductRating(review.productId)

        res.json({ success: true, message: 'Review updated.', review })
    } catch (error) {
        next(error)
    }
}

// DELETE /api/reviews/:reviewId  — User deletes own review
const deleteReview = async (req, res, next) => {
    try {
        const userId     = req.userId
        const { reviewId } = req.params

        const review = await reviewModel.findById(reviewId)
        if (!review) return res.status(404).json({ success: false, message: 'Review not found.' })
        if (review.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' })
        }

        const { productId } = review
        await reviewModel.findByIdAndDelete(reviewId)
        await recalcProductRating(productId)

        res.json({ success: true, message: 'Review deleted.' })
    } catch (error) {
        next(error)
    }
}

// POST /api/reviews/:reviewId/vote  — Helpful vote (login required)
const voteReview = async (req, res, next) => {
    try {
        const userId     = req.userId
        const { reviewId } = req.params
        const { vote }     = req.body  // 'up' or 'down'

        if (!['up', 'down'].includes(vote)) {
            return res.status(400).json({ success: false, message: "Vote must be 'up' or 'down'." })
        }

        const review = await reviewModel.findById(reviewId)
        if (!review) return res.status(404).json({ success: false, message: 'Review not found.' })

        // Cannot vote on own review
        if (review.userId.toString() === userId.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot vote on your own review.' })
        }

        // Remove existing vote from this user, then add new
        review.helpfulVotes = review.helpfulVotes.filter(v => v.userId.toString() !== userId.toString())
        review.helpfulVotes.push({ userId, vote })
        await review.save()

        const upCount   = review.helpfulVotes.filter(v => v.vote === 'up').length
        const downCount = review.helpfulVotes.filter(v => v.vote === 'down').length

        res.json({ success: true, message: 'Vote recorded.', upCount, downCount })
    } catch (error) {
        next(error)
    }
}

// ── Admin controllers ────────────────────────────────────────────────────────

// GET /api/reviews/admin/all — Admin: list all reviews
const adminGetAllReviews = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query
        const query = status ? { status } : {}
        const pageNum  = Math.max(1, Number(page))
        const limitNum = Math.min(50, Math.max(1, Number(limit)))

        const [reviews, total] = await Promise.all([
            reviewModel.find(query)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate('userId',    'name email')
                .populate('productId', 'name image')
                .lean(),
            reviewModel.countDocuments(query),
        ])

        res.json({ success: true, reviews, total, page: pageNum, pages: Math.ceil(total / limitNum) })
    } catch (error) {
        next(error)
    }
}

// PATCH /api/reviews/admin/:reviewId/status — Admin: approve/reject
const adminUpdateReviewStatus = async (req, res, next) => {
    try {
        const { reviewId } = req.params
        const { status, rejectionReason } = req.body

        if (!['published', 'pending', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' })
        }

        const review = await reviewModel.findByIdAndUpdate(
            reviewId,
            { status },
            { new: true }
        )
        if (!review) return res.status(404).json({ success: false, message: 'Review not found.' })

        await recalcProductRating(review.productId)
        res.json({ success: true, message: `Review ${status}.`, review })
    } catch (error) {
        next(error)
    }
}

// POST /api/reviews/admin/:reviewId/reply — Admin reply to review
const adminReplyToReview = async (req, res, next) => {
    try {
        const { reviewId }   = req.params
        const { text }       = req.body

        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Reply text is required.' })
        }

        const review = await reviewModel.findByIdAndUpdate(
            reviewId,
            { adminReply: { text: text.trim(), repliedAt: new Date(), repliedBy: 'admin' } },
            { new: true }
        )
        if (!review) return res.status(404).json({ success: false, message: 'Review not found.' })

        res.json({ success: true, message: 'Reply posted.', review })
    } catch (error) {
        next(error)
    }
}

export {
    checkEligibility,
    submitReview,
    getProductReviews,
    editReview,
    deleteReview,
    voteReview,
    adminGetAllReviews,
    adminUpdateReviewStatus,
    adminReplyToReview,
}
