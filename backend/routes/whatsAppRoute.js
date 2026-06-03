import express from 'express'
import authUser  from '../middleware/auth.js'
import adminAuth from '../middleware/adminAuth.js'
import {
    logInquiry,
    adminGetAllInquiries,
    adminGetInquirySummary,
    adminUpdateInquiryStatus,
} from '../controllers/whatsAppInquiryController.js'

const whatsAppRouter = express.Router()

// User: log a WhatsApp inquiry click (auth required — needs userId)
whatsAppRouter.post('/', authUser, logInquiry)

// Admin: all inquiries with pagination
whatsAppRouter.get('/admin/all', adminAuth, adminGetAllInquiries)

// Admin: per-product inquiry summary (for dashboard widget)
whatsAppRouter.get('/admin/summary', adminAuth, adminGetInquirySummary)

// Admin: update inquiry status
whatsAppRouter.patch('/admin/:id/status', adminAuth, adminUpdateInquiryStatus)

export default whatsAppRouter
