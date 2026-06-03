import express from 'express'
import { subscribe, getSubscribers, notifySubscribers } from '../controllers/notifyMeController.js'
import adminAuth from '../middleware/adminAuth.js'

const notifyMeRouter = express.Router()

// Public: subscribe to back-in-stock alert
notifyMeRouter.post('/', subscribe)

// Admin only: view subscribers per product
notifyMeRouter.get('/subscribers/:productId', adminAuth, getSubscribers)

// Admin only: trigger email notifications for a restocked product
notifyMeRouter.post('/notify/:productId', adminAuth, notifySubscribers)

export default notifyMeRouter
