import whatsAppInquiryModel from '../models/whatsAppInquiryModel.js'
import userModel             from '../models/userModel.js'

// POST /api/whatsapp-inquiry  — Log an inquiry (auth required)
const logInquiry = async (req, res, next) => {
    try {
        const userId = req.userId
        const { productId, productName, productPrice, productUrl, message } = req.body

        if (!productId || !productName) {
            return res.status(400).json({ success: false, message: 'productId and productName are required.' })
        }

        const user = await userModel.findById(userId).select('name email')

        await whatsAppInquiryModel.create({
            productId,
            userId,
            productName,
            productPrice: Number(productPrice) || 0,
            productUrl:   productUrl || '',
            userName:     user?.name  || '',
            userEmail:    user?.email || '',
            message:      message     || '',
        })

        res.status(201).json({ success: true, message: 'Inquiry logged.' })
    } catch (error) {
        // Don't fail the WhatsApp open if logging fails — log and continue
        console.error('[WhatsApp Inquiry] Failed to log:', error.message)
        res.status(201).json({ success: true, message: 'WhatsApp opened.' })
    }
}

// GET /api/whatsapp-inquiry/admin/all  — Admin: all inquiries
const adminGetAllInquiries = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, productId } = req.query
        const query    = productId ? { productId } : {}
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

// GET /api/whatsapp-inquiry/admin/summary  — Admin: per-product counts
const adminGetInquirySummary = async (req, res, next) => {
    try {
        const summary = await whatsAppInquiryModel.aggregate([
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

// PATCH /api/whatsapp-inquiry/:id/status  — Admin: update inquiry status
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

export { logInquiry, adminGetAllInquiries, adminGetInquirySummary, adminUpdateInquiryStatus }
