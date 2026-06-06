import whatsAppInquiryModel from '../models/whatsAppInquiryModel.js'
import userModel             from '../models/userModel.js'
import rateLimit             from 'express-rate-limit'

// ── Rate limiter: max 10 floating-button click logs per user per hour ──────────
// (applied at route level, not here, but exported for use in routes)
export const floatingClickRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    keyGenerator: (req) => req.userId || req.ip,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => false,
    message: { success: true }, // Silently succeed — don't block WA from opening
})

// ── Detect device type from User-Agent ────────────────────────────────────────
const detectDevice = (ua = '') => {
    if (/mobile|android|iphone|ipad|ipod/i.test(ua)) return 'mobile'
    if (/tablet|ipad/i.test(ua)) return 'tablet'
    return 'desktop'
}

// ── Sanitize message preview ───────────────────────────────────────────────────
const sanitizePreview = (str) => {
    if (!str) return ''
    return String(str).replace(/[<>]/g, '').trim().slice(0, 200)
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/whatsapp-inquiry  — Log a product-page inquiry (auth required)
// ──────────────────────────────────────────────────────────────────────────────
const logInquiry = async (req, res, next) => {
    try {
        const userId = req.userId
        const { productId, productName, productPrice, productUrl, message } = req.body

        if (!productName) {
            return res.status(400).json({ success: false, message: 'productName is required.' })
        }

        const user = await userModel.findById(userId).select('name email phone')

        await whatsAppInquiryModel.create({
            source:       'product_page',
            userId,
            productId:    productId || null,
            productName:  productName || '',
            productPrice: Number(productPrice) || 0,
            productUrl:   productUrl || '',
            userName:     user?.name  || '',
            userEmail:    user?.email || '',
            userPhone:    user?.phone || '',
            message:      message || '',
        })

        res.status(201).json({ success: true, message: 'Inquiry logged.' })
    } catch (error) {
        // Don't fail WA open if logging fails
        console.error('[WhatsApp Inquiry] Failed to log:', error.message)
        res.status(201).json({ success: true, message: 'WhatsApp opened.' })
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/whatsapp-inquiry/floating-button-click  — Log floating btn click
// Auth required — button is login-gated
// ──────────────────────────────────────────────────────────────────────────────
const logFloatingButtonClick = async (req, res, next) => {
    try {
        const userId = req.userId
        const {
            page          = '',
            pageTitle     = '',
            productId     = null,
            contextType   = 'general',
            cartValue     = null,
            messagePreview = '',
        } = req.body

        const deviceType = detectDevice(req.headers['user-agent'])
        const user = await userModel.findById(userId).select('name email phone')

        // Fire and forget — don't await so WA opens instantly
        whatsAppInquiryModel.create({
            source:         'floating_button',
            userId,
            productId:      productId || null,
            page:           page.slice(0, 255),
            pageTitle:      pageTitle.slice(0, 255),
            contextType:    ['general','product','order','cart','after_chat'].includes(contextType) ? contextType : 'general',
            cartValue:      cartValue ? Number(cartValue) : null,
            messagePreview: sanitizePreview(messagePreview),
            deviceType,
            userName:       user?.name  || '',
            userEmail:      user?.email || '',
            userPhone:      user?.phone || '',
        }).catch(err => console.error('[WA FloatingBtn] Log failed:', err.message))

        res.json({ success: true })
    } catch (error) {
        // Silent success — never block WhatsApp from opening
        res.json({ success: true })
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/whatsapp-inquiry/business-status  — Public (no auth)
// Returns current business hours status for tooltip
// Business hours: Mon-Sat 9AM-6PM IST, Sun 10AM-2PM IST
// ──────────────────────────────────────────────────────────────────────────────
const getBusinessStatus = (req, res) => {
    try {
        // Get current time in IST (UTC+5:30)
        const now = new Date()
        const istOffset = 5.5 * 60 * 60 * 1000
        const ist = new Date(now.getTime() + istOffset)

        const hour    = ist.getUTCHours()          // 0-23
        const minutes = ist.getUTCMinutes()
        const day     = ist.getUTCDay()             // 0=Sun, 1=Mon … 6=Sat
        const timeStr = `${hour.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')} IST`

        // Business hours
        let isOpen = false
        let nextOpenTime = null

        if (day >= 1 && day <= 6) {
            // Mon–Sat: 9AM–6PM IST
            isOpen = hour >= 9 && hour < 18
            if (!isOpen) nextOpenTime = hour < 9 ? '9:00 AM IST' : '9:00 AM IST (tomorrow)'
        } else {
            // Sunday: 10AM–2PM IST
            isOpen = hour >= 10 && hour < 14
            if (!isOpen) nextOpenTime = hour < 10 ? '10:00 AM IST' : '9:00 AM IST (Monday)'
        }

        res.json({
            success: true,
            isOpen,
            message: isOpen
                ? 'We\'re online! Typically reply in 30 minutes'
                : `We're offline. Back at ${nextOpenTime}`,
            nextOpenTime,
            timezone:    'Asia/Kolkata',
            currentTime: timeStr,
        })
    } catch (error) {
        // Fallback — assume closed to be safe
        res.json({ success: true, isOpen: false, message: "We'll reply soon!", nextOpenTime: '9:00 AM IST', timezone: 'Asia/Kolkata', currentTime: '' })
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/whatsapp-inquiry/admin/all  — Admin: all inquiries
// ──────────────────────────────────────────────────────────────────────────────
const adminGetAllInquiries = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, productId, source } = req.query
        const query    = {}
        if (productId) query.productId = productId
        if (source) query.source = source
        const pageNum  = Math.max(1, Number(page))
        const limitNum = Math.min(50, Number(limit))

        const [inquiries, total] = await Promise.all([
            whatsAppInquiryModel.find(query)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate('productId', 'name image price')
                .lean(),
            whatsAppInquiryModel.countDocuments(query),
        ])

        res.json({ success: true, inquiries, total, page: pageNum })
    } catch (error) {
        next(error)
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/whatsapp-inquiry/admin/summary  — Admin: per-product inquiry counts
// ──────────────────────────────────────────────────────────────────────────────
const adminGetInquirySummary = async (req, res, next) => {
    try {
        const summary = await whatsAppInquiryModel.aggregate([
            { $match: { productId: { $ne: null } } },
            {
                $group: {
                    _id:   '$productId',
                    count: { $sum: 1 },
                    last:  { $max: '$createdAt' },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 50 },
            {
                $lookup: {
                    from:         'products',
                    localField:   '_id',
                    foreignField: '_id',
                    as:           'product',
                },
            },
            { $unwind: { path: '$product', preserveNullAndEmpty: true } },
            {
                $project: {
                    productName:  '$product.name',
                    productImage: { $arrayElemAt: ['$product.image', 0] },
                    count:        1,
                    last:         1,
                },
            },
        ])

        res.json({ success: true, summary })
    } catch (error) {
        next(error)
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /api/whatsapp-inquiry/admin/:id/status  — Admin: update status
// ──────────────────────────────────────────────────────────────────────────────
const adminUpdateInquiryStatus = async (req, res, next) => {
    try {
        const { id }     = req.params
        const { status } = req.body

        if (!['initiated', 'responded', 'converted'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' })
        }

        const inquiry = await whatsAppInquiryModel.findByIdAndUpdate(id, { status }, { new: true })
        if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found.' })

        res.json({ success: true, message: 'Status updated.', inquiry })
    } catch (error) {
        next(error)
    }
}

export {
    logInquiry,
    logFloatingButtonClick,
    getBusinessStatus,
    adminGetAllInquiries,
    adminGetInquirySummary,
    adminUpdateInquiryStatus,
}
