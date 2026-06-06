import React, { useContext, useState, useEffect, useRef, useCallback } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { popRedirectIntent } from '../utils/safeRedirect'
import LoginErrorAlert from '../components/auth/LoginErrorAlert'
import LockoutCountdown from '../components/auth/LockoutCountdown'
import { getPasswordStrength } from '../components/auth/PasswordStrengthMeter'
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter'

// ── Validation helpers ────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateEmail = (value) => {
    if (!value || !value.trim()) return 'Email address is required'
    if (value.trim().length > 255) return 'Email address is too long'
    if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address'
    return null
}

const validateLoginPassword = (value) => {
    if (!value) return 'Password is required'
    if (value.length < 6) return 'Password must be at least 6 characters'
    if (value.length > 128) return 'Password is too long'
    return null
}

const validateSignupPassword = (value) => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    if (value.length > 128) return 'Password is too long'
    if (!/[A-Z]/.test(value)) return 'Password must include an uppercase letter'
    if (!/[a-z]/.test(value)) return 'Password must include a lowercase letter'
    if (!/\d/.test(value)) return 'Password must include a number'
    if (!/[@$!%*?&]/.test(value)) return 'Password must include a special character (@$!%*?&)'
    return null
}

// ── Context-aware banner ──────────────────────────────────────────────────────
const REASON_MESSAGES = {
    whatsapp_customize: { icon: '💬', text: 'Login to customize your product via WhatsApp' },
    whatsapp_chat:      { icon: '💬', text: 'Login to chat with Match n Dice on WhatsApp. Our team is ready to help you with personalization and orders!' },
    write_review:       { icon: '⭐', text: 'Login to write a review for your purchase' },
    checkout:           { icon: '🛒', text: 'Login to complete your checkout' },
    default:            { icon: '🔐', text: 'Login to continue' },
}

// ── Eye icon SVG ──────────────────────────────────────────────────────────────
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

// ── Mail icon ─────────────────────────────────────────────────────────────────
const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
        style={{ color: '#9ca3af', flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7
               a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
)

// ── Lock icon ─────────────────────────────────────────────────────────────────
const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
        style={{ color: '#9ca3af', flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2
               2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
)

// ── User icon ─────────────────────────────────────────────────────────────────
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
        style={{ color: '#9ca3af', flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
)

// ── FieldError component ──────────────────────────────────────────────────────
const FieldError = ({ error }) => {
    if (!error) return null
    return (
        <p className="auth-field-error" role="alert">
            <span aria-hidden="true">⚠</span> {error}
        </p>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Login = () => {
    const [mode, setMode] = useState('Login') // 'Login' | 'Sign Up'
    const { token, setToken, navigate, backendUrl } = useContext(ShopContext)

    // Form fields
    const [name,     setName]     = useState('')
    const [email,    setEmail]    = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)

    // UI states
    const [showPassword, setShowPassword] = useState(false)
    const [loading,      setLoading]      = useState(false)
    const [apiError,     setApiError]     = useState(null)  // { code, message, retryAfter? }
    const [isLockedOut,  setIsLockedOut]  = useState(false)
    const [retryAfter,   setRetryAfter]   = useState(0)

    // Field-level validation
    const [fieldErrors,  setFieldErrors]  = useState({})
    const [touched,      setTouched]      = useState({}) // which fields have been blurred

    // Redirect intent
    const [redirectUrl,  setRedirectUrl]  = useState(null)
    const [loginReason,  setLoginReason]  = useState('default')

    const formRef = useRef(null)

    // ── Read redirect intent once on mount ──────────────────────────────────
    useEffect(() => {
        const { url, reason } = popRedirectIntent()
        if (url)    setRedirectUrl(url)
        if (reason) setLoginReason(reason in REASON_MESSAGES ? reason : 'default')
    }, [])

    // ── If already logged in, redirect ──────────────────────────────────────
    useEffect(() => {
        if (token) {
            if (redirectUrl) {
                if (loginReason === 'whatsapp_customize') {
                    toast.success("You're logged in! You can now customize via WhatsApp.", { icon: '💬' })
                }
                navigate(redirectUrl, { replace: true })
            } else {
                navigate('/', { replace: true })
            }
        }
    }, [token])

    // ── Switch between Login / Sign Up ──────────────────────────────────────
    const switchMode = (newMode) => {
        setMode(newMode)
        setName(''); setEmail(''); setPassword('')
        setFieldErrors({}); setTouched({}); setApiError(null)
        setShowPassword(false)
    }

    // ── Real-time email validation ───────────────────────────────────────────
    const handleEmailBlur = useCallback(() => {
        // Auto-trim email silently on blur
        setEmail(e => e.trim())
        setTouched(t => ({ ...t, email: true }))
        const err = validateEmail(email.trim())
        setFieldErrors(f => ({ ...f, email: err }))
    }, [email])

    const handleEmailChange = useCallback((e) => {
        const val = e.target.value
        setEmail(val)
        setApiError(null) // clear server error when user types
        if (touched.email) {
            const err = validateEmail(val.trim())
            setFieldErrors(f => ({ ...f, email: err }))
        }
    }, [touched.email])

    // ── Real-time password validation ────────────────────────────────────────
    const handlePasswordBlur = useCallback(() => {
        setTouched(t => ({ ...t, password: true }))
        const validator = mode === 'Login' ? validateLoginPassword : validateSignupPassword
        const err = validator(password)
        setFieldErrors(f => ({ ...f, password: err }))
    }, [password, mode])

    const handlePasswordChange = useCallback((e) => {
        const val = e.target.value
        setPassword(val)
        setApiError(null)
        if (touched.password) {
            const validator = mode === 'Login' ? validateLoginPassword : validateSignupPassword
            const err = validator(val)
            setFieldErrors(f => ({ ...f, password: err }))
        }
    }, [touched.password, mode])

    // ── Name validation (sign up only) ───────────────────────────────────────
    const handleNameBlur = useCallback(() => {
        setTouched(t => ({ ...t, name: true }))
        if (!name.trim() || name.trim().length < 2) {
            setFieldErrors(f => ({ ...f, name: 'Name must be at least 2 characters' }))
        } else {
            setFieldErrors(f => ({ ...f, name: null }))
        }
    }, [name])

    // ── Form submit ──────────────────────────────────────────────────────────
    const onSubmitHandler = async (e) => {
        e.preventDefault()
        if (loading || isLockedOut) return

        // ── Validate all fields before submitting ────────────────────────────
        const newErrors = {}
        const newTouched = {}

        if (mode === 'Sign Up') {
            newTouched.name = true
            if (!name.trim() || name.trim().length < 2) {
                newErrors.name = 'Name must be at least 2 characters'
            }
        }

        newTouched.email    = true
        newTouched.password = true

        const emailErr = validateEmail(email)
        if (emailErr) newErrors.email = emailErr

        const pwValidator = mode === 'Login' ? validateLoginPassword : validateSignupPassword
        const pwErr = pwValidator(password)
        if (pwErr) newErrors.password = pwErr

        setTouched(t => ({ ...t, ...newTouched }))
        setFieldErrors(f => ({ ...f, ...newErrors }))

        // If any errors, focus first errored field and abort
        if (Object.values(newErrors).some(Boolean)) {
            const firstErrorField = formRef.current?.querySelector('.auth-field--error input, .auth-field--error textarea')
            firstErrorField?.focus()
            return
        }

        // ── Submit ───────────────────────────────────────────────────────────
        setLoading(true)
        setApiError(null)

        try {
            const endpoint = mode === 'Sign Up'
                ? `${backendUrl}/api/user/register`
                : `${backendUrl}/api/user/login`

            const payload = mode === 'Sign Up'
                ? { name: name.trim(), email: email.trim().toLowerCase(), password }
                : { email: email.trim().toLowerCase(), password, rememberMe }

            const response = await axios.post(endpoint, payload)

            if (response.data.success) {
                // ✅ Store token in memory (via context), NOT localStorage
                // This prevents XSS-based token theft
                setToken(response.data.token)

                // Cache minimal user info for WhatsApp message builder
                // (JWT only contains userId, not name/email)
                try {
                    const u = response.data.user || {}
                    sessionStorage.setItem('wa_user_profile', JSON.stringify({
                        name:  u.name  || name.trim() || '',
                        email: u.email || email.trim().toLowerCase() || '',
                        phone: u.phone || '',
                    }))
                } catch {}

                if (mode === 'Sign Up') {
                    toast.success('Account created! Welcome to Match n Dice 🎁')
                }
            } else {
                setApiError({
                    code:    response.data.error || 'SERVER_ERROR',
                    message: response.data.message,
                })
                if (mode === 'Login') {
                    setPassword('') // Clear password on failed login (don't clear email)
                }
            }
        } catch (error) {
            // Network error
            if (!error.response) {
                setApiError({ code: 'NETWORK_ERROR', message: 'Connection error. Please check your internet.' })
                return
            }

            const { status, data } = error.response
            const errorCode = data?.error || 'SERVER_ERROR'

            if (status === 429) {
                // Rate limited — show lockout countdown
                setIsLockedOut(true)
                setRetryAfter(data?.retryAfter || 900)
                setApiError({
                    code:       'TOO_MANY_ATTEMPTS',
                    message:    data?.message || 'Too many attempts. Please wait.',
                    retryAfter: data?.retryAfter || 900,
                })
            } else if (status === 401 || status === 400) {
                setApiError({
                    code:    errorCode,
                    message: data?.message || 'Invalid email or password.',
                })
                if (mode === 'Login') setPassword('') // clear password on failed login
            } else if (status === 403) {
                setApiError({
                    code:    errorCode,
                    message: data?.message,
                })
            } else if (status === 409) {
                // Email already registered — highlight the email field too
                setFieldErrors(f => ({
                    ...f,
                    email: data?.message || 'An account with this email already exists.',
                }))
                setTouched(t => ({ ...t, email: true }))
                setApiError({
                    code:    'EMAIL_TAKEN',
                    message: (data?.message || 'An account with this email already exists.') +
                             ' Try logging in or use Forgot Password.',
                })
            } else {
                setApiError({ code: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' })
            }

        } finally {
            setLoading(false)
        }
    }

    // ── Lockout expired ──────────────────────────────────────────────────────
    const handleLockoutExpired = () => {
        setIsLockedOut(false)
        setRetryAfter(0)
        setApiError(null)
    }

    const contextMsg = REASON_MESSAGES[loginReason] || REASON_MESSAGES.default
    const isSignUp   = mode === 'Sign Up'
    const formDisabled = loading || isLockedOut

    const emailHasError    = touched.email    && fieldErrors.email
    const passwordHasError = touched.password && fieldErrors.password
    const nameHasError     = touched.name     && fieldErrors.name

    // Password strength (sign up only)
    const passwordStrength = isSignUp ? getPasswordStrength(password) : null

    return (
        <div className="auth-page">
            <div className="auth-card" id="login-card">
                {/* Logo / Brand */}
                <div className="auth-brand">
                    <div className="auth-brand__logo">
                        <span>🎁</span>
                    </div>
                    <h1 className="auth-brand__name">Match n Dice</h1>
                </div>

                {/* Heading */}
                <div className="auth-heading">
                    <h2 className="auth-heading__title">
                        {isSignUp ? 'Create Account' : 'Welcome Back 👋'}
                    </h2>
                    <p className="auth-heading__subtitle">
                        {isSignUp
                            ? 'Join Match n Dice and start gifting'
                            : 'Login to continue shopping'
                        }
                    </p>
                </div>

                {/* Context banner (shown when user was redirected from a specific action) */}
                {loginReason !== 'default' && (
                    <div className="auth-context-banner">
                        <span>{contextMsg.icon}</span>
                        <span>{contextMsg.text}</span>
                    </div>
                )}

                {/* API Error / Lockout */}
                {isLockedOut ? (
                    <LockoutCountdown retryAfter={retryAfter} onExpired={handleLockoutExpired} />
                ) : apiError && apiError.code !== 'VALIDATION_ERROR' ? (
                    <LoginErrorAlert
                        error={apiError}
                        onDismiss={() => setApiError(null)}
                        onResendVerification={() => {
                            // TODO: call /api/user/resend-verification
                            toast.info('Verification email sent!')
                        }}
                    />
                ) : null}

                {/* Form */}
                <form
                    ref={formRef}
                    onSubmit={onSubmitHandler}
                    noValidate
                    aria-label={`${mode} form`}
                >
                    {/* Name (Sign Up only) */}
                    {isSignUp && (
                        <div className={`auth-field ${nameHasError ? 'auth-field--error' : ''}`}>
                            <label htmlFor="auth-name" className="auth-field__label">
                                Full Name
                            </label>
                            <div className="auth-field__input-wrap">
                                <span className="auth-field__icon"><UserIcon /></span>
                                <input
                                    id="auth-name"
                                    type="text"
                                    value={name}
                                    onChange={e => {
                                        setName(e.target.value)
                                        if (touched.name) {
                                            setFieldErrors(f => ({
                                                ...f,
                                                name: e.target.value.trim().length >= 2 ? null : 'Name must be at least 2 characters'
                                            }))
                                        }
                                    }}
                                    onBlur={handleNameBlur}
                                    placeholder="Enter your full name"
                                    autoComplete="name"
                                    disabled={formDisabled}
                                    className="auth-field__input"
                                    aria-describedby={nameHasError ? 'name-error' : undefined}
                                    aria-invalid={!!nameHasError}
                                    minLength={2}
                                    maxLength={100}
                                />
                            </div>
                            <FieldError error={nameHasError ? fieldErrors.name : null} />
                        </div>
                    )}

                    {/* Email */}
                    <div className={`auth-field ${emailHasError ? 'auth-field--error' : ''}`}>
                        <label htmlFor="auth-email" className="auth-field__label">
                            Email Address
                        </label>
                        <div className="auth-field__input-wrap">
                            <span className="auth-field__icon"><MailIcon /></span>
                            <input
                                id="auth-email"
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                onBlur={handleEmailBlur}
                                placeholder="Enter your email"
                                autoComplete="email"
                                disabled={formDisabled}
                                className="auth-field__input"
                                aria-describedby={emailHasError ? 'email-error' : undefined}
                                aria-invalid={!!emailHasError}
                                maxLength={255}
                            />
                        </div>
                        <FieldError error={emailHasError ? fieldErrors.email : null} />
                    </div>

                    {/* Password + Forgot link row */}
                    <div className={`auth-field ${passwordHasError ? 'auth-field--error' : ''}`}>
                        <div className="auth-field__label-row">
                            <label htmlFor="auth-password" className="auth-field__label">
                                Password
                            </label>
                            {!isSignUp && (
                                <Link
                                    to="/forgot-password"
                                    className="auth-forgot-link"
                                    tabIndex={formDisabled ? -1 : 0}
                                >
                                    Forgot Password?
                                </Link>
                            )}
                        </div>
                        <div className="auth-field__input-wrap">
                            <span className="auth-field__icon"><LockIcon /></span>
                            <input
                                id="auth-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={handlePasswordChange}
                                onBlur={handlePasswordBlur}
                                placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
                                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                disabled={formDisabled}
                                className="auth-field__input auth-field__input--password"
                                aria-describedby={passwordHasError ? 'password-error' : undefined}
                                aria-invalid={!!passwordHasError}
                                maxLength={128}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="auth-field__eye-btn"
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <EyeIcon open={showPassword} />
                            </button>
                        </div>
                        <FieldError error={passwordHasError ? fieldErrors.password : null} />

                        {/* Password strength meter (Sign Up only) */}
                        {isSignUp && password && (
                            <PasswordStrengthMeter password={password} />
                        )}
                    </div>

                    {/* Remember Me (Login only) */}
                    {!isSignUp && (
                        <div className="auth-remember">
                            <label className="auth-remember__label" htmlFor="remember-me">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={e => setRememberMe(e.target.checked)}
                                    disabled={formDisabled}
                                    className="auth-remember__checkbox"
                                />
                                <span>Remember me for 30 days</span>
                            </label>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={formDisabled}
                        className="auth-submit-btn"
                        id="auth-submit"
                    >
                        {loading ? (
                            <>
                                <span className="auth-submit-btn__spinner" aria-hidden="true" />
                                <span>{isSignUp ? 'Creating account…' : 'Signing in…'}</span>
                            </>
                        ) : (
                            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="auth-divider">
                    <span>or</span>
                </div>

                {/* Switch mode */}
                <p className="auth-switch">
                    {isSignUp ? (
                        <>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => switchMode('Login')}
                                className="auth-switch__link"
                                id="switch-to-login"
                            >
                                Sign In
                            </button>
                        </>
                    ) : (
                        <>
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={() => switchMode('Sign Up')}
                                className="auth-switch__link"
                                id="switch-to-signup"
                            >
                                Sign Up
                            </button>
                        </>
                    )}
                </p>
            </div>
        </div>
    )
}

export default Login
