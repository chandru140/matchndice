import rateLimit from 'express-rate-limit'

// ── Helper: extract ms remaining from rate limit headers ──────────────────────
const retryAfterSeconds = (req, res) => {
    // express-rate-limit v7 sets this header automatically when standardHeaders: true
    const retryAfter = res.getHeader('Retry-After')
    return retryAfter ? parseInt(retryAfter, 10) : 900
}

// ── Login rate limiter ────────────────────────────────────────────────────────
// 5 failed attempts per 15 minutes per IP
// NOTE: For per-email limiting, the controller also tracks attempts in-memory
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window per IP (generous IP limit; per-email is 5 in controller)
    standardHeaders: true,   // Return `RateLimit-*` headers
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        const retryAfter = Math.ceil(options.windowMs / 1000)
        return res.status(429).json({
            success: false,
            error: 'TOO_MANY_ATTEMPTS',
            message: 'Too many login attempts from this device. Please try again later.',
            retryAfter, // seconds — frontend uses this for countdown
        })
    },
})

// ── Register rate limiter ─────────────────────────────────────────────────────
// 5 registrations per hour per IP
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        return res.status(429).json({
            success: false,
            error: 'TOO_MANY_ATTEMPTS',
            message: 'Too many registration attempts. Please try again in 1 hour.',
            retryAfter: Math.ceil(options.windowMs / 1000),
        })
    },
})

// ── Admin login rate limiter ──────────────────────────────────────────────────
// Stricter: 3 attempts per 30 minutes
export const adminLoginLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        return res.status(429).json({
            success: false,
            error: 'TOO_MANY_ATTEMPTS',
            message: 'Too many admin login attempts. Please try again in 30 minutes.',
            retryAfter: Math.ceil(options.windowMs / 1000),
        })
    },
})

// ── Forgot password rate limiter ──────────────────────────────────────────────
// 3 requests per hour per IP — prevents email spam abuse
export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        return res.status(429).json({
            success: false,
            error: 'TOO_MANY_REQUESTS',
            message: 'Too many password reset requests. Please try again in 1 hour.',
            retryAfter: Math.ceil(options.windowMs / 1000),
        })
    },
})

// ── Reset password rate limiter ───────────────────────────────────────────────
// 5 attempts per 15 minutes
export const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        return res.status(429).json({
            success: false,
            error: 'TOO_MANY_ATTEMPTS',
            message: 'Too many reset attempts. Please try again in 15 minutes.',
            retryAfter: Math.ceil(options.windowMs / 1000),
        })
    },
})
