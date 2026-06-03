import React, { useState, useCallback, useContext, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateEmail = (value) => {
    if (!value || !value.trim()) return 'Email address is required'
    if (value.trim().length > 255) return 'Email address is too long'
    if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address'
    return null
}

const maskEmail = (email) => {
    if (!email) return ''
    const [local, domain] = email.split('@')
    return `${local.charAt(0)}***@${domain}`
}

// ── Lock SVG illustration ─────────────────────────────────────────────────────
const LockIllustration = () => (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="36" cy="36" r="36" fill="#f0fdf4" />
        <rect x="22" y="34" width="28" height="20" rx="4" fill="#0f0f0f" />
        <path d="M27 34V27a9 9 0 1118 0v7" stroke="#0f0f0f" strokeWidth="3.5"
            strokeLinecap="round" fill="none" />
        <circle cx="36" cy="44" r="3" fill="#fff" />
        <rect x="35" y="44" width="2" height="5" rx="1" fill="#fff" />
    </svg>
)

// ── Success email illustration ─────────────────────────────────────────────────
const EmailSentIllustration = () => (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="36" cy="36" r="36" fill="#f0fdf4" />
        <rect x="14" y="22" width="44" height="30" rx="5" fill="#0f0f0f" />
        <path d="M14 27l22 15 22-15" stroke="#fff" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="54" cy="20" r="9" fill="#22c55e" />
        <path d="M50 20l3 3 5-5" stroke="#fff" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

// ═══════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const ForgotPassword = () => {
    const { backendUrl } = useContext(ShopContext)

    // View states: 'form' | 'success'
    const [view,      setView]      = useState('form')
    const [email,     setEmail]     = useState('')
    const [emailErr,  setEmailErr]  = useState(null)
    const [touched,   setTouched]   = useState(false)
    const [loading,   setLoading]   = useState(false)
    const [apiError,  setApiError]  = useState(null)

    // Success state
    const [sentEmail, setSentEmail] = useState('')

    // Resend cooldown (60s)
    const [resendCooldown, setResendCooldown] = useState(0)
    const resendIntervalRef = useRef(null)

    // ── Resend countdown timer ───────────────────────────────────────────────
    const startResendCooldown = useCallback(() => {
        setResendCooldown(60)
        clearInterval(resendIntervalRef.current)
        resendIntervalRef.current = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(resendIntervalRef.current)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }, [])

    useEffect(() => () => clearInterval(resendIntervalRef.current), [])

    // ── Email validation ─────────────────────────────────────────────────────
    const handleEmailBlur = useCallback(() => {
        setTouched(true)
        setEmailErr(validateEmail(email.trim()))
    }, [email])

    const handleEmailChange = useCallback((e) => {
        setEmail(e.target.value)
        setApiError(null)
        if (touched) {
            setEmailErr(validateEmail(e.target.value.trim()))
        }
    }, [touched])

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (loading) return

        // Validate before submit
        setTouched(true)
        const err = validateEmail(email.trim())
        setEmailErr(err)
        if (err) return

        setLoading(true)
        setApiError(null)

        try {
            await axios.post(`${backendUrl}/api/user/forgot-password`, {
                email: email.trim().toLowerCase(),
            })

            // SECURITY: Always show success regardless of whether email exists.
            // This prevents email enumeration attacks.
            setSentEmail(email.trim())
            setView('success')
            startResendCooldown()
        } catch (error) {
            if (!error.response) {
                setApiError('Connection error. Please check your internet connection.')
                return
            }

            const { status, data } = error.response

            if (status === 429) {
                setApiError(data?.message || 'Too many requests. Please try again in 1 hour.')
            } else if (status === 400) {
                setEmailErr(data?.message || 'Please enter a valid email address.')
            } else {
                setApiError('Something went wrong. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    // ── Resend email ─────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (resendCooldown > 0 || loading) return

        setLoading(true)
        try {
            await axios.post(`${backendUrl}/api/user/forgot-password`, {
                email: sentEmail.trim().toLowerCase(),
            })
            startResendCooldown()
        } catch {
            // Silently fail on resend — user already saw the success message
        } finally {
            setLoading(false)
        }
    }

    // ── SUCCESS VIEW ─────────────────────────────────────────────────────────
    if (view === 'success') {
        return (
            <div className="auth-page">
                <div className="auth-card auth-card--success" id="forgot-success-card">
                    <EmailSentIllustration />

                    <h1 className="auth-heading__title" style={{ marginTop: '1rem' }}>
                        Check your inbox!
                    </h1>
                    <p className="auth-heading__subtitle">
                        We've sent a password reset link to:
                    </p>

                    <div className="auth-masked-email">
                        <strong>{maskEmail(sentEmail)}</strong>
                    </div>

                    <div className="auth-info-box">
                        <span>⏱</span>
                        <span>This link expires in <strong>15 minutes</strong></span>
                    </div>

                    <p className="auth-hint">
                        Didn't receive it? Check your spam folder or
                    </p>

                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendCooldown > 0 || loading}
                        className="auth-resend-btn"
                        id="resend-email-btn"
                    >
                        {resendCooldown > 0
                            ? `Resend available in 0:${String(resendCooldown).padStart(2, '0')}`
                            : loading ? 'Sending…' : 'Resend Email'
                        }
                    </button>

                    <Link to="/login" className="auth-back-link" id="back-to-login-success">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        )
    }

    // ── FORM VIEW ────────────────────────────────────────────────────────────
    return (
        <div className="auth-page">
            <div className="auth-card" id="forgot-password-card">
                {/* Back link */}
                <Link to="/login" className="auth-back-link auth-back-link--top" id="back-to-login">
                    ← Back to Login
                </Link>

                {/* Illustration */}
                <div className="auth-illustration">
                    <LockIllustration />
                </div>

                {/* Heading */}
                <div className="auth-heading">
                    <h1 className="auth-heading__title">Forgot Password?</h1>
                    <p className="auth-heading__subtitle">
                        No worries! Enter your email and we'll send you a reset link.
                    </p>
                </div>

                {/* API Error */}
                {apiError && (
                    <div className="auth-alert auth-alert--error" role="alert">
                        <span>⚠️</span>
                        <span>{apiError}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate aria-label="Forgot password form">
                    <div className={`auth-field ${touched && emailErr ? 'auth-field--error' : ''}`}>
                        <label htmlFor="forgot-email" className="auth-field__label">
                            Email Address
                        </label>
                        <div className="auth-field__input-wrap">
                            <span className="auth-field__icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    strokeWidth={1.8} style={{ color: '#9ca3af' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </span>
                            <input
                                id="forgot-email"
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                onBlur={handleEmailBlur}
                                placeholder="Enter your email address"
                                autoComplete="email"
                                disabled={loading}
                                className="auth-field__input"
                                aria-invalid={!!(touched && emailErr)}
                                aria-describedby={touched && emailErr ? 'forgot-email-error' : undefined}
                                maxLength={255}
                            />
                        </div>
                        {touched && emailErr && (
                            <p className="auth-field-error" id="forgot-email-error" role="alert">
                                <span aria-hidden="true">⚠</span> {emailErr}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-submit-btn"
                        id="send-reset-link-btn"
                    >
                        {loading ? (
                            <>
                                <span className="auth-submit-btn__spinner" aria-hidden="true" />
                                <span>Sending…</span>
                            </>
                        ) : (
                            <span>Send Reset Link</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ForgotPassword
