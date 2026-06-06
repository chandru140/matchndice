import express from 'express'
import authUser  from '../middleware/auth.js'
import adminAuth from '../middleware/adminAuth.js'
import {
    logInquiry,
    logFloatingButtonClick,
    getBusinessStatus,
    adminGetAllInquiries,
    adminGetInquirySummary,
    adminUpdateInquiryStatus,
} from '../controllers/whatsAppInquiryController.js'

const whatsAppRouter = express.Router()

// ── Public ────────────────────────────────────────────────────────────────────
// Business hours status (no auth — used for tooltip text even for guests)
whatsAppRouter.get('/business-status', getBusinessStatus)

// ── Authenticated ─────────────────────────────────────────────────────────────
// Log product-page WhatsApp inquiry (existing)
whatsAppRouter.post('/', authUser, logInquiry)

// Log floating button click (new — auth required, button is login-gated)
whatsAppRouter.post('/floating-button-click', authUser, logFloatingButtonClick)

// ── Admin ─────────────────────────────────────────────────────────────────────
whatsAppRouter.get('/admin/all',               adminAuth, adminGetAllInquiries)
whatsAppRouter.get('/admin/summary',           adminAuth, adminGetInquirySummary)
whatsAppRouter.patch('/admin/:id/status',      adminAuth, adminUpdateInquiryStatus)

export default whatsAppRouter
