import rateLimit from 'express-rate-limit';

// Login rate limiter - 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Register rate limiter - 3 attempts per hour
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per window
    message: {
        success: false,
        message: 'Too many registration attempts. Please try again after 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Admin login rate limiter - stricter (3 attempts per 30 minutes)
export const adminLoginLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 3, // 3 requests per window
    message: {
        success: false,
        message: 'Too many admin login attempts. Please try again after 30 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
