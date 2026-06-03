import React from 'react'

/**
 * LoginErrorAlert
 * Renders the correct alert UI for each API error code returned by /api/user/login.
 *
 * Props:
 *   error       — { code, message, retryAfter? } | null
 *   onResendVerification — () => void (called when user clicks "Resend Verification Email")
 *   onDismiss   — () => void
 */
const LoginErrorAlert = ({ error, onResendVerification, onDismiss }) => {
    if (!error) return null

    const { code, message, retryAfter } = error

    // ── ACCOUNT_BLOCKED ───────────────────────────────────────────────────────
    if (code === 'ACCOUNT_BLOCKED') {
        return (
            <div className="auth-alert auth-alert--error" role="alert">
                <div className="auth-alert__icon">🚫</div>
                <div className="auth-alert__body">
                    <p className="auth-alert__title">Account Suspended</p>
                    <p className="auth-alert__text">
                        Your account has been suspended.{' '}
                        <a
                            href="mailto:matchndice@gmail.com"
                            className="auth-alert__link"
                        >
                            Contact support
                        </a>
                    </p>
                </div>
            </div>
        )
    }

    // ── EMAIL_NOT_VERIFIED ────────────────────────────────────────────────────
    if (code === 'EMAIL_NOT_VERIFIED') {
        return (
            <div className="auth-alert auth-alert--warning" role="alert">
                <div className="auth-alert__icon">📧</div>
                <div className="auth-alert__body">
                    <p className="auth-alert__title">Email Not Verified</p>
                    <p className="auth-alert__text">
                        Please verify your email address before logging in.
                    </p>
                    {onResendVerification && (
                        <button
                            type="button"
                            onClick={onResendVerification}
                            className="auth-alert__action-btn"
                        >
                            Resend Verification Email
                        </button>
                    )}
                </div>
            </div>
        )
    }

    // ── NETWORK_ERROR ─────────────────────────────────────────────────────────
    if (code === 'NETWORK_ERROR') {
        return (
            <div className="auth-alert auth-alert--warning" role="alert">
                <div className="auth-alert__icon">📡</div>
                <div className="auth-alert__body">
                    <p className="auth-alert__title">Connection Error</p>
                    <p className="auth-alert__text">
                        Please check your internet connection and try again.
                    </p>
                </div>
                {onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="auth-alert__dismiss"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                )}
            </div>
        )
    }

    // ── SERVER_ERROR ──────────────────────────────────────────────────────────
    if (code === 'SERVER_ERROR') {
        return (
            <div className="auth-alert auth-alert--error" role="alert">
                <div className="auth-alert__icon">⚠️</div>
                <div className="auth-alert__body">
                    <p className="auth-alert__title">Something Went Wrong</p>
                    <p className="auth-alert__text">
                        {message || 'An unexpected error occurred. Please try again.'}
                    </p>
                </div>
                {onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="auth-alert__dismiss"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                )}
            </div>
        )
    }

    // ── INVALID_CREDENTIALS (default for any auth error) ─────────────────────
    return (
        <div className="auth-alert auth-alert--error" role="alert">
            <div className="auth-alert__icon">🔒</div>
            <div className="auth-alert__body">
                <p className="auth-alert__title">Login Failed</p>
                <p className="auth-alert__text">
                    {message || 'Invalid email or password. Please try again.'}
                </p>
            </div>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="auth-alert__dismiss"
                    aria-label="Dismiss"
                >
                    ×
                </button>
            )}
        </div>
    )
}

export default LoginErrorAlert
