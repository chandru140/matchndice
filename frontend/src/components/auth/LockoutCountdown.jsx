import React, { useState, useEffect, useRef } from 'react'

/**
 * LockoutCountdown
 * Shows a real-time countdown timer for rate-limit lockouts.
 * Re-enables the form when the countdown reaches 0.
 *
 * Props:
 *   retryAfter    — number (seconds until retry is allowed)
 *   onExpired     — () => void (called when countdown reaches 0)
 */
const LockoutCountdown = ({ retryAfter, onExpired }) => {
    const [secondsLeft, setSecondsLeft] = useState(retryAfter || 900)
    const intervalRef = useRef(null)

    useEffect(() => {
        setSecondsLeft(retryAfter || 900)
    }, [retryAfter])

    useEffect(() => {
        if (secondsLeft <= 0) {
            clearInterval(intervalRef.current)
            onExpired?.()
            return
        }

        intervalRef.current = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current)
                    onExpired?.()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(intervalRef.current)
    }, [retryAfter]) // restart timer when retryAfter changes

    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60
    const display  = `${minutes}:${String(seconds).padStart(2, '0')}`

    const progress = retryAfter > 0 ? (secondsLeft / retryAfter) * 100 : 0

    return (
        <div className="auth-alert auth-alert--error" role="alert" aria-live="polite">
            <div className="auth-alert__icon">🔒</div>
            <div className="auth-alert__body" style={{ flex: 1 }}>
                <p className="auth-alert__title">Too Many Failed Attempts</p>
                <p className="auth-alert__text">
                    Please wait before trying again.
                </p>
                {/* Countdown display */}
                <div className="lockout-timer">
                    <span className="lockout-timer__label">Try again in</span>
                    <span className="lockout-timer__time" aria-label={`${minutes} minutes and ${seconds} seconds`}>
                        {display}
                    </span>
                </div>
                {/* Progress bar */}
                <div className="lockout-progress">
                    <div
                        className="lockout-progress__bar"
                        style={{ width: `${progress}%` }}
                        role="progressbar"
                        aria-valuenow={secondsLeft}
                        aria-valuemax={retryAfter}
                        aria-label="Lockout time remaining"
                    />
                </div>
            </div>
        </div>
    )
}

export default LockoutCountdown
