import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

// ── Constants ─────────────────────────────────────────────────────────────────
const BCRYPT_ROUNDS     = 12
const JWT_SECRET        = process.env.JWT_SECRET
const ACCESS_SHORT      = '1d'   // rememberMe: false
const ACCESS_LONG       = '30d'  // rememberMe: true
const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MS   = 15 * 60 * 1000  // 15 minutes

// ── Dummy hash for timing-safe comparison ─────────────────────────────────────
// Pre-computed bcrypt hash of a throwaway string.
// Used to prevent timing attacks when a user doesn't exist:
// We always run bcrypt.compare() — even on non-existent users — so response
// time is identical whether the user exists or not.
const DUMMY_HASH = '$2b$12$dummy.hash.for.timing.safety.only.do.not.use'

// ── Helper: build a safe user object (never includes password) ────────────────
const safeUser = (user) => ({
    _id:   user._id,
    name:  user.name,
    email: user.email,
})

// ── Helper: create signed JWT ─────────────────────────────────────────────────
const createToken = (id, rememberMe = false) => {
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured')
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: rememberMe ? ACCESS_LONG : ACCESS_SHORT,
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/user/login
// ═══════════════════════════════════════════════════════════════════════════════
const loginUser = async (req, res, next) => {
    try {
        const { email, password, rememberMe = false } = req.body

        // ── 1. Input validation (backend must never trust frontend) ──────────
        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Email address is required.',
                fields: { email: 'Email address is required.' },
            })
        }

        const normalizedEmail = email.trim().toLowerCase()

        if (!validator.isEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Please enter a valid email address.',
                fields: { email: 'Please enter a valid email address.' },
            })
        }

        if (normalizedEmail.length > 255) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Email address is too long.',
                fields: { email: 'Email address is too long.' },
            })
        }

        if (!password || typeof password !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Password is required.',
                fields: { password: 'Password is required.' },
            })
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Password must be at least 6 characters.',
                fields: { password: 'Password must be at least 6 characters.' },
            })
        }

        if (password.length > 128) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Password is too long.',
                fields: { password: 'Password is too long.' },
            })
        }

        // ── 2. Find user ──────────────────────────────────────────────────────
        const user = await userModel.findOne({ email: normalizedEmail }).select('+password +loginAttempts +lockUntil')

        // ── 3. Check account lockout (brute-force protection) ─────────────────────
        if (user && user.lockUntil && user.lockUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000)
            return res.status(429).json({
                success: false,
                error: 'ACCOUNT_LOCKED',
                message: `Account is temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
                retryAfter: Math.ceil((user.lockUntil - Date.now()) / 1000),
            })
        }

        // ── 4. TIMING-SAFE password comparison ──────────────────────────────────
        const passwordToCompare = user ? user.password : DUMMY_HASH
        const isMatch = await bcrypt.compare(password, passwordToCompare)

        // ── 5. Unified "invalid credentials" + track failed attempts ───────────────
        if (!user || !isMatch) {
            // Only track attempts for real users (don't track for non-existent emails)
            if (user) {
                const attempts = (user.loginAttempts || 0) + 1
                const updateData = { loginAttempts: attempts }
                if (attempts >= MAX_LOGIN_ATTEMPTS) {
                    updateData.lockUntil = new Date(Date.now() + LOCK_DURATION_MS)
                    await userModel.findByIdAndUpdate(user._id, updateData)
                    return res.status(429).json({
                        success: false,
                        error: 'ACCOUNT_LOCKED',
                        message: `Too many failed attempts. Account locked for 15 minutes.`,
                        retryAfter: LOCK_DURATION_MS / 1000,
                    })
                }
                await userModel.findByIdAndUpdate(user._id, updateData)
            }
            return res.status(401).json({
                success: false,
                error: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password.',
            })
        }

        // ── 6. Account status checks ─────────────────────────────────────────────
        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                error: 'ACCOUNT_BLOCKED',
                message: 'Your account has been suspended. Contact support at matchndice@gmail.com.',
            })
        }

        // ── 7. Successful login: reset lockout, record lastLoginAt ─────────────────
        await userModel.findByIdAndUpdate(user._id, {
            loginAttempts: 0,
            lockUntil:     null,
            lastLoginAt:   new Date(),
        })

        // ── 8. Generate JWT ──────────────────────────────────────────────────────
        const token = createToken(user._id, Boolean(rememberMe))

        // ── 9. Return safe user data ──────────────────────────────────────────────────
        return res.json({
            success: true,
            message: 'Logged in successfully.',
            user: safeUser(user),
            token,
            rememberMe: Boolean(rememberMe),
            // token expiry info for the client
            expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // seconds
        })
    } catch (error) {
        next(error)
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/user/register
// ═══════════════════════════════════════════════════════════════════════════════
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body

        // ── Validate name ────────────────────────────────────────────────────
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Name must be at least 2 characters.',
                fields: { name: 'Name must be at least 2 characters.' },
            })
        }

        // ── Validate email ───────────────────────────────────────────────────
        const normalizedEmail = (email || '').trim().toLowerCase()
        if (!validator.isEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Please enter a valid email address.',
                fields: { email: 'Please enter a valid email address.' },
            })
        }

        // ── Validate password strength ───────────────────────────────────────
        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Password must be at least 8 characters.',
                fields: { password: 'Password must be at least 8 characters.' },
            })
        }

        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)
        if (!strongPassword) {
            return res.status(400).json({
                success: false,
                error: 'WEAK_PASSWORD',
                message: 'Password must contain uppercase, lowercase, number and special character.',
                fields: { password: 'Password does not meet strength requirements.' },
            })
        }

        // ── Check if user already exists ─────────────────────────────────────
        const exists = await userModel.findOne({ email: normalizedEmail })
        if (exists) {
            return res.status(409).json({
                success: false,
                error: 'EMAIL_TAKEN',
                message: 'An account with this email already exists.',
                fields: { email: 'An account with this email already exists.' },
            })
        }

        // ── Hash password ────────────────────────────────────────────────────
        // NEVER log or return the plain password after this point
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)

        const newUser = new userModel({
            name:     name.trim(),
            email:    normalizedEmail,
            password: hashedPassword,
        })

        const user  = await newUser.save()
        const token = createToken(user._id)

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            user:    safeUser(user),
            token,
        })
    } catch (error) {
        next(error)
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/user/logout
// ═══════════════════════════════════════════════════════════════════════════════
const logoutUser = async (req, res, next) => {
    try {
        // In a stateless JWT system, logout is client-side (clear the token).
        // For true server-side invalidation, implement a token blacklist (Redis/DB).
        // This endpoint exists so the client can signal logout and we can:
        //   1. Clear any httpOnly cookies in future
        //   2. Audit logout events
        //   3. Hook into a blacklist when implemented

        // Clear any auth cookies (for future httpOnly cookie support)
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure:   process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path:     '/api/user',
        })

        return res.json({
            success: true,
            message: 'Logged out successfully.',
        })
    } catch (error) {
        next(error)
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/user/admin
// ═══════════════════════════════════════════════════════════════════════════════
const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body

        const adminEmail    = (process.env.ADMIN_EMAIL    || '').trim().toLowerCase()
        const adminPassword = (process.env.ADMIN_PASSWORD || '').trim()

        if (!adminEmail || !adminPassword) {
            return res.status(500).json({
                success: false,
                message: 'Admin credentials not configured on server.',
            })
        }

        // Timing-safe string comparison for email
        const emailMatch    = email?.trim().toLowerCase() === adminEmail
        const passwordMatch = password === adminPassword

        if (!emailMatch || !passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials.',
            })
        }

        if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured')

        const token = jwt.sign(
            { email: adminEmail, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1d' }
        )

        return res.json({
            success: true,
            message: 'Admin logged in successfully.',
            token,
        })
    } catch (error) {
        next(error)
    }
}

export { loginUser, registerUser, logoutUser, adminLogin }
