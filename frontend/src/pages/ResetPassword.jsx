import React, { useState, useEffect, useCallback, useContext, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter'

// ── Password validation ───────────────────────────────────────────────────────
const validateNewPassword = (value) => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    if (value.length > 128) return 'Password is too long'
    if (!/[A-Z]/.test(value)) return 'Must include an uppercase letter'
    if (!/[a-z]/.test(value)) return 'Must include a lowercase letter'
    if (!/\d/.test(value)) return 'Must include a number'
    if (!/[@$!%*?&]/.test(value)) return 'Must include a special character (@$!%*?&)'
    return null
}

// ── Eye Icon ──────────────────────────────────────────────────────────────────
const EyeIcon = ({ open }) => open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
               -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
               a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878
               l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59
               3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025
               10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
)

// ── Animated Checkmark ────────────────────────────────────────────────────────
const AnimatedCheck = () => (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="36" cy="36" r="36" fill="#f0fdf4" />
        <circle cx="36" cy="36" r="24" fill="#22c55e" />
        <path d="M24 36l9 9 15-15" stroke="#fff" strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

// ── FieldError ────────────────────────────────────────────────────────────────
const FieldError = ({ error, id }) => {
    if (!error) return null
    return (
        <p className="auth-field-error" id={id} role="alert">
            <span aria-hidden="true">⚠</span> {error}
        </p>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESET PASSWORD PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const ResetPassword = () => {
    const { backendUrl } = useContext(ShopContext)
    const navigate        = useNavigate()
    const [searchParams]  = useSearchParams()
    const token           = searchParams.get('token')

    // view states: 'verifying' | 'invalid' | 'form' | 'success'
    const [view,           setView]           = useState('verifying')
    const [invalidReason,  setInvalidReason]  = useState('')
    const [maskedEmail,    setMaskedEmail]     = useState('')

    // Form fields
    const [newPassword,     setNewPassword]     = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNew,         setShowNew]         = useState(false)
    const [showConfirm,     setShowConfirm]     = useState(false)

    // Validation
    const [fieldErrors, setFieldErrors] = useState({})
    const [touched,     setTouched]     = useState({})

    // Submission
    const [loading,   setLoading]   = useState(false)
    const [apiError,  setApiError]  = useState(null)

    // Redirect countdown
    const [countdown, setCountdown] = useState(3)
    const countdownRef = useRef(null)

    // ── Step 1: Verify token on page load ───────────────────────────────────
    useEffect(() => {
        if (!token) {
            setView('invalid')
            setInvalidReason('No reset token found in URL. Please request a new link.')
            return
        }

        const verifyToken = async () => {
            try {
                const response = await axios.get(
                    `${backendUrl}/api/user/verify-reset-token?token=${encodeURIComponent(token)}`
                )

                if (response.data.valid) {
                    setMaskedEmail(response.data.maskedEmail || '')
                    setView('form')
                } else {
                    const reason = response.data.reason
                    setView('invalid')
                    if (reason === 'EXPIRED') {
                        setInvalidReason('This reset link has expired. Reset links are valid for 15 minutes only.')
                    } else if (reason === 'USED') {
                        setInvalidReason('This reset link has already been used. Request a new one.')
                    } else {
                        setInvalidReason('This reset link is invalid or has been revoked.')
                    }
                }
            } catch {
                setView('invalid')
                setInvalidReason('Unable to verify your reset link. Please try again or request a new one.')
            }
        }

        verifyToken()
    }, [token, backendUrl])

    // ── Redirect countdown after success ────────────────────────────────────
    useEffect(() => {
        if (view !== 'success') return

        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current)
                    navigate('/login?reset=success', { replace: true })
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(countdownRef.current)
    }, [view, navigate])

    // ── New password validation ──────────────────────────────────────────────
    const handleNewPasswordBlur = useCallback(() => {
        setTouched(t => ({ ...t, newPassword: true }))
        setFieldErrors(f => ({ ...f, newPassword: validateNewPassword(newPassword) }))
    }, [newPassword])

    const handleNewPasswordChange = useCallback((e) => {
        const val = e.target.value
        setNewPassword(val)
        setApiError(null)
        if (touched.newPassword) {
            setFieldErrors(f => ({ ...f, newPassword: validateNewPassword(val) }))
        }
        // Re-check confirm match if already touched
        if (touched.confirmPassword && confirmPassword) {
            setFieldErrors(f => ({
                ...f,
                confirmPassword: val !== confirmPassword ? 'Passwords do not match' : null,
            }))
        }
    }, [touched.newPassword, touched.confirmPassword, confirmPassword])

    // ── Confirm password validation ──────────────────────────────────────────
    const handleConfirmBlur = useCallback(() => {
        setTouched(t => ({ ...t, confirmPassword: true }))
        setFieldErrors(f => ({
            ...f,
            confirmPassword: confirmPassword !== newPassword ? 'Passwords do not match' : null,
        }))
    }, [confirmPassword, newPassword])

    const handleConfirmChange = useCallback((e) => {
        const val = e.target.value
        setConfirmPassword(val)
        if (touched.confirmPassword) {
            setFieldErrors(f => ({
                ...f,
                confirmPassword: val !== newPassword ? 'Passwords do not match' : null,
            }))
        }
    }, [touched.confirmPassword, newPassword])

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (loading) return

        // Validate all fields
        const newErrors = {}
        setTouched({ newPassword: true, confirmPassword: true })

        const pwErr = validateNewPassword(newPassword)
        if (pwErr) newErrors.newPassword = pwErr

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password'
        } else if (confirmPassword !== newPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        setFieldErrors(newErrors)
        if (Object.values(newErrors).some(Boolean)) return

        setLoading(true)
        setApiError(null)

        try {
            const response = await axios.post(`${backendUrl}/api/user/reset-password`, {
                token,
                newPassword,
                confirmPassword,
            })

            if (response.data.success) {
                setView('success')
            } else {
                setApiError(response.data.message || 'Failed to reset password.')
            }
        } catch (error) {
            if (!error.response) {
                setApiError('Connection error. Please check your internet.')
                return
            }

            const { status, data } = error.response

            if (status === 400) {
                const errorCode = data?.error
                if (errorCode === 'SAME_PASSWORD') {
                    setApiError('Your new password must be different from your current password.')
                } else if (errorCode === 'TOKEN_EXPIRED') {
                    setView('invalid')
                    setInvalidReason('This reset link has expired. Please request a new one.')
                } else if (errorCode === 'TOKEN_USED' || errorCode === 'INVALID_TOKEN') {
                    setView('invalid')
                    setInvalidReason('This reset link is invalid or has already been used.')
                } else {
                    setApiError(data?.message || 'Invalid request. Please try again.')
                }
            } else if (status === 429) {
                setApiError('Too many attempts. Please wait before trying again.')
            } else {
                setApiError('Something went wrong. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    // ── VERIFYING VIEW ───────────────────────────────────────────────────────
    if (view === 'verifying') {
        return (
            <div className="auth-page">
                <div className="auth-card auth-card--center" id="reset-verifying-card">
                    <div className="auth-spinner-large" aria-label="Verifying reset link…" />
                    <p className="auth-hint" style={{ marginTop: '1.5rem' }}>
                        Verifying your reset link…
                    </p>
                </div>
            </div>
        )
    }

    // ── INVALID TOKEN VIEW ───────────────────────────────────────────────────
    if (view === 'invalid') {
        return (
            <div className="auth-page">
                <div className="auth-card auth-card--center" id="reset-invalid-card">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                    <h1 className="auth-heading__title">Link Expired or Invalid</h1>
                    <p className="auth-heading__subtitle" style={{ color: '#6b7280' }}>
                        {invalidReason}
                    </p>
                    <div className="auth-info-box auth-info-box--warn" style={{ marginTop: '1.5rem' }}>
                        <span>⏱</span>
                        <span>Reset links are only valid for <strong>15 minutes</strong></span>
                    </div>

                    <Link
                        to="/forgot-password"
                        className="auth-submit-btn"
                        style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}
                        id="request-new-link-btn"
                    >
                        Request New Reset Link
                    </Link>
                    <Link to="/login" className="auth-back-link" style={{ marginTop: '1rem' }} id="back-to-login-invalid">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        )
    }

    // ── SUCCESS VIEW ─────────────────────────────────────────────────────────
    if (view === 'success') {
        return (
            <div className="auth-page">
                <div className="auth-card auth-card--center auth-card--success" id="reset-success-card">
                    <AnimatedCheck />

                    <h1 className="auth-heading__title" style={{ marginTop: '1.25rem' }}>
                        Password Reset Successfully!
                    </h1>
                    <p className="auth-heading__subtitle">
                        Your password has been updated. You can now log in with your new password.
                    </p>

                    <p className="auth-hint" style={{ marginTop: '1.5rem' }}>
                        Redirecting to login in{' '}
                        <strong aria-live="polite">{countdown}…</strong>
                    </p>

                    <Link
                        to="/login?reset=success"
                        className="auth-submit-btn"
                        style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1rem' }}
                        id="login-now-btn"
                        onClick={() => clearInterval(countdownRef.current)}
                    >
                        Login Now
                    </Link>
                </div>
            </div>
        )
    }

    // ── RESET FORM VIEW ──────────────────────────────────────────────────────
    const newPwError     = touched.newPassword     && fieldErrors.newPassword
    const confirmPwError = touched.confirmPassword && fieldErrors.confirmPassword

    return (
        <div className="auth-page">
            <div className="auth-card" id="reset-password-card">
                {/* Heading */}
                <div className="auth-heading">
                    <h1 className="auth-heading__title">Create New Password</h1>
                    <p className="auth-heading__subtitle">
                        Your new password must be different from your previous password.
                        {maskedEmail && (
                            <><br />Resetting for: <strong>{maskedEmail}</strong></>
                        )}
                    </p>
                </div>

                {/* API Error */}
                {apiError && (
                    <div className="auth-alert auth-alert--error" role="alert">
                        <span>⚠️</span>
                        <span>{apiError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate aria-label="Reset password form">
                    {/* New Password */}
                    <div className={`auth-field ${newPwError ? 'auth-field--error' : ''}`}>
                        <label htmlFor="new-password" className="auth-field__label">
                            New Password
                        </label>
                        <div className="auth-field__input-wrap">
                            <span className="auth-field__icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    strokeWidth={1.8} style={{ color: '#9ca3af' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </span>
                            <input
                                id="new-password"
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={handleNewPasswordChange}
                                onBlur={handleNewPasswordBlur}
                                placeholder="Create a strong password"
                                autoComplete="new-password"
                                disabled={loading}
                                className="auth-field__input auth-field__input--password"
                                aria-invalid={!!newPwError}
                                aria-describedby={newPwError ? 'new-pw-error' : undefined}
                                maxLength={128}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(v => !v)}
                                className="auth-field__eye-btn"
                                tabIndex={-1}
                                aria-label={showNew ? 'Hide new password' : 'Show new password'}
                            >
                                <EyeIcon open={showNew} />
                            </button>
                        </div>
                        <FieldError error={newPwError ? fieldErrors.newPassword : null} id="new-pw-error" />

                        {/* Strength meter */}
                        {newPassword && <PasswordStrengthMeter password={newPassword} />}
                    </div>

                    {/* Confirm Password */}
                    <div className={`auth-field ${confirmPwError ? 'auth-field--error' : ''}`}>
                        <label htmlFor="confirm-password" className="auth-field__label">
                            Confirm New Password
                        </label>
                        <div className="auth-field__input-wrap">
                            <span className="auth-field__icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    strokeWidth={1.8} style={{ color: '#9ca3af' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </span>
                            <input
                                id="confirm-password"
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={handleConfirmChange}
                                onBlur={handleConfirmBlur}
                                placeholder="Re-enter your new password"
                                autoComplete="new-password"
                                disabled={loading}
                                className="auth-field__input auth-field__input--password"
                                aria-invalid={!!confirmPwError}
                                aria-describedby={confirmPwError ? 'confirm-pw-error' : undefined}
                                maxLength={128}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(v => !v)}
                                className="auth-field__eye-btn"
                                tabIndex={-1}
                                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                            >
                                <EyeIcon open={showConfirm} />
                            </button>
                            {/* Live match indicator */}
                            {confirmPassword && !confirmPwError && confirmPassword === newPassword && (
                                <span className="auth-field__match-check" aria-label="Passwords match">✓</span>
                            )}
                        </div>
                        <FieldError
                            error={confirmPwError ? fieldErrors.confirmPassword : null}
                            id="confirm-pw-error"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-submit-btn"
                        id="reset-password-submit"
                    >
                        {loading ? (
                            <>
                                <span className="auth-submit-btn__spinner" aria-hidden="true" />
                                <span>Updating Password…</span>
                            </>
                        ) : (
                            <span>Reset Password</span>
                        )}
                    </button>
                </form>

                <Link to="/login" className="auth-back-link" style={{ marginTop: '1rem' }} id="back-to-login-form">
                    ← Back to Login
                </Link>
            </div>
        </div>
    )
}

export default ResetPassword
