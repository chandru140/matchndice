import crypto from 'crypto'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import PasswordResetToken from '../models/passwordResetTokenModel.js'
import { sendPasswordResetEmail, sendPasswordChangedEmail, maskEmail } from '../services/emailService.js'

// ── Constants ─────────────────────────────────────────────────────────────────
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000   // 15 minutes
const BCRYPT_ROUNDS         = 12
const FRONTEND_URL          = process.env.FRONTEND_URL || 'http://localhost:5173'

// ── Helper: hash raw token with SHA-256 ───────────────────────────────────────
const hashToken = (rawToken) =>
    crypto.createHash('sha256').update(rawToken).digest('hex')

// ── POST /api/user/forgot-password ────────────────────────────────────────────
// Sends a reset link to the email if it exists in DB.
// Always returns 200 to prevent email enumeration attacks.
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body
        const normalizedEmail = (email || '').trim().toLowerCase()

        if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Please enter a valid email address.',
            })
        }

        // ── Always return the same response (prevent email enumeration) ────────
        const successResponse = {
            success: true,
            message: 'If an account with that email exists, a reset link has been sent.',
        }

        const user = await userModel.findOne({ email: normalizedEmail })
        if (!user) {
            // Log attempt for monitoring but don't reveal user doesn't exist
            console.warn(`[ForgotPassword] Attempt for unknown email: ${normalizedEmail} from IP: ${req.ip}`)
            return res.json(successResponse)
        }

        // ── Invalidate all previous unused tokens for this user ───────────────
        await PasswordResetToken.deleteMany({ userId: user._id, used: false })

        // ── Generate cryptographically secure token ────────────────────────────
        const rawToken  = crypto.randomBytes(32).toString('hex')
        const tokenHash = hashToken(rawToken)

        await PasswordResetToken.create({
            userId:    user._id,
            tokenHash,
            expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
            used:      false,
            ipAddress: req.ip || 'unknown',
        })

        // ── Build reset URL (raw token goes in URL, hash stays in DB) ─────────
        const resetUrl = `${FRONTEND_URL}/reset-password?token=${rawToken}`

        // ── Send email (non-blocking log on failure) ───────────────────────────
        try {
            await sendPasswordResetEmail({
                to:       user.email,
                name:     user.name,
                resetUrl,
            })
        } catch (emailErr) {
            console.error('[ForgotPassword] Email send failed:', emailErr.message)
            // Still return success to user — the token is saved, manual retry possible
            // In production: queue for retry
        }

        return res.json(successResponse)
    } catch (error) {
        next(error)
    }
}

// ── GET /api/user/verify-reset-token ─────────────────────────────────────────
// Called by ResetPassword page on mount to validate token before showing form.
const verifyResetToken = async (req, res, next) => {
    try {
        const { token } = req.query

        if (!token || typeof token !== 'string') {
            return res.json({ valid: false, reason: 'INVALID' })
        }

        const tokenHash = hashToken(token)
        const record    = await PasswordResetToken.findOne({ tokenHash })

        if (!record) {
            return res.json({ valid: false, reason: 'INVALID' })
        }
        if (record.used) {
            return res.json({ valid: false, reason: 'USED' })
        }
        if (record.expiresAt < new Date()) {
            return res.json({ valid: false, reason: 'EXPIRED' })
        }

        // Return masked email for UI display
        const user = await userModel.findById(record.userId).select('email')
        return res.json({
            valid:       true,
            maskedEmail: user ? maskEmail(user.email) : '',
        })
    } catch (error) {
        next(error)
    }
}

// ── POST /api/user/reset-password ─────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword, confirmPassword } = req.body

        // ── Input validation ──────────────────────────────────────────────────
        if (!token) {
            return res.status(400).json({ success: false, error: 'INVALID_TOKEN', message: 'Reset token is required.' })
        }
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters.' })
        }
        if (newPassword.length > 128) {
            return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Password is too long.' })
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Passwords do not match.' })
        }

        // ── Validate password strength ────────────────────────────────────────
        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword)
        if (!strongPassword) {
            return res.status(400).json({
                success: false,
                error: 'WEAK_PASSWORD',
                message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character (@$!%*?&).',
            })
        }

        // ── Find token record ─────────────────────────────────────────────────
        const tokenHash = hashToken(token)
        const record    = await PasswordResetToken.findOne({ tokenHash })

        if (!record) {
            return res.status(400).json({ success: false, error: 'INVALID_TOKEN', message: 'This reset link is invalid or has already been used.' })
        }
        if (record.used) {
            return res.status(400).json({ success: false, error: 'TOKEN_USED', message: 'This reset link has already been used. Request a new one.' })
        }
        if (record.expiresAt < new Date()) {
            return res.status(400).json({ success: false, error: 'TOKEN_EXPIRED', message: 'This reset link has expired (15 minutes). Request a new one.' })
        }

        // ── Fetch user (select password for comparison) ───────────────────────
        const user = await userModel.findById(record.userId).select('+password')
        if (!user) {
            return res.status(400).json({ success: false, error: 'USER_NOT_FOUND', message: 'User account not found.' })
        }

        // ── Prevent reusing the same password ─────────────────────────────────
        const isSamePassword = await bcrypt.compare(newPassword, user.password)
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                error: 'SAME_PASSWORD',
                message: 'Your new password must be different from your current password.',
            })
        }

        // ── Hash new password and save ────────────────────────────────────────
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
        user.password = hashedPassword
        await user.save()

        // ── Mark token as used (prevent replay attacks) ───────────────────────
        record.used   = true
        record.usedAt = new Date()
        await record.save()

        // ── Invalidate all other tokens for this user ─────────────────────────
        await PasswordResetToken.deleteMany({ userId: user._id, _id: { $ne: record._id } })

        // ── Send confirmation email ───────────────────────────────────────────
        try {
            await sendPasswordChangedEmail({ to: user.email, name: user.name })
        } catch (emailErr) {
            console.error('[ResetPassword] Confirmation email failed:', emailErr.message)
        }

        return res.json({
            success: true,
            message: 'Password reset successful. You can now log in with your new password.',
        })
    } catch (error) {
        next(error)
    }
}

export { forgotPassword, verifyResetToken, resetPassword }
