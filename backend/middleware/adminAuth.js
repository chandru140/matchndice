import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET

/**
 * ✅ RBAC Middleware — Admin Only
 *
 * Verifies the request carries a valid JWT that was issued for the admin
 * (contains role: 'admin' OR email matching ADMIN_EMAIL env var).
 *
 * Usage:
 *   router.post('/list', requireAdmin, allOrders)
 *
 * Without this, ANY valid user JWT can call admin endpoints if they know the URL.
 */
export const requireAdmin = (req, res, next) => {
    try {
        const token = req.headers.token || req.headers.authorization?.replace("Bearer ", "")

        if (!token) {
            return res.status(401).json({
                success: false,
                error: "UNAUTHORIZED",
                message: "Authentication token is required.",
            })
        }

        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured on the server.")
        }

        const decoded = jwt.verify(token, JWT_SECRET)

        const adminEmail  = (process.env.ADMIN_EMAIL || "").trim().toLowerCase()
        const isAdminRole  = decoded.role  === "admin"
        const isAdminEmail = decoded.email === adminEmail

        if (!isAdminRole && !isAdminEmail) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "Admin access required.",
            })
        }

        req.adminEmail = decoded.email
        next()
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                error: "TOKEN_EXPIRED",
                message: "Session expired. Please log in again.",
            })
        }
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                error: "INVALID_TOKEN",
                message: "Invalid authentication token.",
            })
        }
        next(error)
    }
}

/**
 * requireAuth — Verifies any valid user JWT (customer or admin).
 * Sets req.userId from the token payload.
 */
export const requireAuth = (req, res, next) => {
    try {
        const token = req.headers.token || req.headers.authorization?.replace("Bearer ", "")

        if (!token) {
            return res.status(401).json({
                success: false,
                error: "UNAUTHORIZED",
                message: "Authentication token is required.",
            })
        }

        const decoded = jwt.verify(token, JWT_SECRET)
        req.userId = decoded.id
        next()
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                error: "TOKEN_EXPIRED",
                message: "Session expired. Please log in again.",
            })
        }
        return res.status(401).json({
            success: false,
            error: "INVALID_TOKEN",
            message: "Invalid authentication token.",
        })
    }
}

// ✅ Default export = requireAdmin for backward compatibility with existing routes
// that use: import adminAuth from '../middleware/adminAuth.js'
export default requireAdmin
