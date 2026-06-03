import notifyMeModel from '../models/notifyMeModel.js'
import productModel   from '../models/productModel.js'
import validator       from 'validator'

// POST /api/notify-me — Subscribe to back-in-stock notification
const subscribe = async (req, res, next) => {
    try {
        const { productId, email } = req.body

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' })
        }
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required.' })
        }

        const product = await productModel.findById(productId)
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' })
        }
        if (product.stock > 0) {
            return res.status(400).json({ success: false, message: 'This product is currently in stock. No need to subscribe.' })
        }

        // Upsert — prevent duplicate subscriptions
        await notifyMeModel.updateOne(
            { productId, email: email.toLowerCase() },
            { $setOnInsert: { productId, email: email.toLowerCase(), subscribedAt: new Date(), notified: false } },
            { upsert: true }
        )

        res.json({ success: true, message: "You're on the list! We'll notify you when it's back in stock." })
    } catch (error) {
        if (error.code === 11000) {
            return res.json({ success: true, message: "You're already subscribed for this product!" })
        }
        next(error)
    }
}

// GET /api/notify-me/subscribers/:productId — Admin: get subscriber count
const getSubscribers = async (req, res, next) => {
    try {
        const { productId } = req.params
        const count       = await notifyMeModel.countDocuments({ productId, notified: false })
        const subscribers = await notifyMeModel.find({ productId, notified: false })
            .select('email subscribedAt').sort({ subscribedAt: -1 }).limit(100)

        res.json({ success: true, count, subscribers })
    } catch (error) {
        next(error)
    }
}

// POST /api/notify-me/notify/:productId — Admin: notify all subscribers (called on restock)
const notifySubscribers = async (req, res, next) => {
    try {
        const { productId } = req.params

        const product = await productModel.findById(productId)
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' })
        }

        const subscribers = await notifyMeModel.find({ productId, notified: false })
        if (subscribers.length === 0) {
            return res.json({ success: true, message: 'No subscribers to notify.', count: 0 })
        }

        // In a real app: send emails via Nodemailer/SendGrid/Resend here
        // For now: log and mark as notified
        const emails = subscribers.map(s => s.email)
        console.log(`[NotifyMe] Sending restock emails for "${product.name}" to:`, emails)

        // Mark all as notified
        await notifyMeModel.updateMany(
            { productId, notified: false },
            { $set: { notified: true, notifiedAt: new Date() } }
        )

        res.json({
            success: true,
            message: `Notified ${subscribers.length} subscriber(s) for "${product.name}".`,
            count: subscribers.length,
            emails,
        })
    } catch (error) {
        next(error)
    }
}

export { subscribe, getSubscribers, notifySubscribers }
