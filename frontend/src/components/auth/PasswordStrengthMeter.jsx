import React from 'react'

/**
 * getPasswordStrength
 * Returns strength level (0-4), label, and color for a given password.
 */
export const getPasswordStrength = (password) => {
    if (!password) return { level: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 8)         score++ // at least 8 chars
    if (/[A-Z]/.test(password))       score++ // uppercase
    if (/\d/.test(password))          score++ // number
    if (/[@$!%*?&]/.test(password))   score++ // special char

    if (score === 0) return { level: 0, label: '',       color: '#e5e7eb' }
    if (score === 1) return { level: 1, label: 'Weak',   color: '#ef4444' }
    if (score === 2) return { level: 2, label: 'Fair',   color: '#f97316' }
    if (score === 3) return { level: 3, label: 'Good',   color: '#eab308' }
    return              { level: 4, label: 'Strong', color: '#22c55e' }
}

const REQUIREMENTS = [
    { id: 'length',    label: 'At least 8 characters',             test: (p) => p.length >= 8 },
    { id: 'uppercase', label: 'At least one uppercase letter (A-Z)',test: (p) => /[A-Z]/.test(p) },
    { id: 'number',    label: 'At least one number (0-9)',          test: (p) => /\d/.test(p) },
    { id: 'special',   label: 'At least one special character (@$!%*?&)', test: (p) => /[@$!%*?&]/.test(p) },
]

/**
 * PasswordStrengthMeter
 * Shows a 4-bar strength indicator + a live requirements checklist.
 *
 * Props:
 *   password — string (the current password value)
 */
const PasswordStrengthMeter = ({ password }) => {
    if (!password) return null

    const strength = getPasswordStrength(password)

    return (
        <div className="password-strength" aria-label="Password strength indicator">
            {/* Strength bars */}
            <div className="password-strength__bars">
                {[1, 2, 3, 4].map((bar) => (
                    <div
                        key={bar}
                        className="password-strength__bar"
                        style={{
                            backgroundColor:
                                bar <= strength.level ? strength.color : '#e5e7eb',
                        }}
                    />
                ))}
            </div>

            {/* Label */}
            {strength.label && (
                <p className="password-strength__label" style={{ color: strength.color }}>
                    {strength.label} password
                </p>
            )}

            {/* Requirements checklist */}
            <ul className="password-strength__checklist" aria-label="Password requirements">
                {REQUIREMENTS.map((req) => {
                    const met = req.test(password)
                    return (
                        <li
                            key={req.id}
                            className={`password-strength__req ${met ? 'password-strength__req--met' : ''}`}
                        >
                            <span className="password-strength__req-icon" aria-hidden="true">
                                {met ? '✓' : '○'}
                            </span>
                            <span>{req.label}</span>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

export default PasswordStrengthMeter
