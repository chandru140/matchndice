import nodemailer from 'nodemailer'

// ── Transporter (lazy-created once) ───────────────────────────────────────────
let _transporter = null

const getTransporter = () => {
    if (_transporter) return _transporter

    const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS

    if (hasEmailConfig) {
        // Use configured SMTP (Gmail App Password, SendGrid SMTP, etc.)
        _transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, // Gmail App Password — NOT your login password
            },
        })
    } else {
        // ✅ DEV FALLBACK: No email config — use a null transporter that logs to console.
        // The reset URL will be printed directly to the server console.
        // To send real emails in dev, add EMAIL_USER and EMAIL_PASS to backend/.env
        _transporter = {
            sendMail: async (mailOptions) => {
                console.log('\n' + '═'.repeat(60))
                console.log('[EmailService] ⚠️  No EMAIL_USER configured — email NOT sent.')
                console.log('[EmailService] 📧 To:', mailOptions.to)
                console.log('[EmailService] 📌 Subject:', mailOptions.subject)
                // Extract reset URL from text body for easy copy-paste
                const urlMatch = mailOptions.text?.match(/https?:\/\/\S+/)
                if (urlMatch) {
                    console.log('[EmailService] 🔗 Reset URL:', urlMatch[0])
                }
                console.log('═'.repeat(60) + '\n')
                return { messageId: 'dev-console-log' }
            },
        }
    }

    return _transporter
}

// ── Mask email for security (r***@gmail.com) ──────────────────────────────────
export const maskEmail = (email) => {
    const [local, domain] = email.split('@')
    const masked = local.charAt(0) + '***'
    return `${masked}@${domain}`
}

// ── Send password reset email ─────────────────────────────────────────────────
export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
    const maskedEmail = maskEmail(to)
    const transporter = getTransporter()

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password — Match n Dice</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);" cellspacing="0" cellpadding="0">

          <!-- Header -->
          <tr>
            <td style="background:#0f0f0f;padding:28px 40px;text-align:center;">
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:-0.5px;">
                Match n Dice
              </h1>
              <p style="color:#9ca3af;font-size:13px;margin:4px 0 0;">Personalized Gifting</p>
            </td>
          </tr>

          <!-- Lock icon -->
          <tr>
            <td style="padding:36px 40px 0;text-align:center;">
              <div style="width:64px;height:64px;background:#f0fdf4;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin:0 auto;">
                <span style="font-size:32px;">🔐</span>
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:24px 40px 0;">
              <h2 style="color:#0f0f0f;font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;">
                Reset Your Password
              </h2>
              <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;text-align:center;">
                Hi <strong style="color:#0f0f0f;">${name || 'there'}</strong>,<br/>
                We received a request to reset the password for your<br/>
                Match n Dice account.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:0 0 28px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;background:#0f0f0f;color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                      Reset My Password →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin:0 0 24px;">
                <p style="margin:0;font-size:13px;color:#92400e;text-align:center;">
                  ⏱ This link expires in <strong>15 minutes</strong> and can only be used once.
                </p>
              </div>

              <!-- Security notice -->
              <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0 0 16px;text-align:center;">
                If you didn't request a password reset, you can safely ignore this email.<br/>
                Your password will remain unchanged.
              </p>

              <!-- Plain text URL fallback -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin:0 0 28px;">
                <p style="margin:0 0 6px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                  If the button doesn't work, copy this URL:
                </p>
                <p style="margin:0;font-size:12px;color:#3b82f6;word-break:break-all;">
                  <a href="${resetUrl}" style="color:#3b82f6;">${resetUrl}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} Match n Dice · Personalized Gifting
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">
                Questions? Email us at <a href="mailto:matchndice@gmail.com" style="color:#6b7280;">matchndice@gmail.com</a>
              </p>
            </td>
          </tr>

        </table>

        <!-- Extra security line -->
        <p style="text-align:center;font-size:12px;color:#9ca3af;margin:16px 0 0;padding:0 20px;">
          This email was sent to ${maskedEmail}.<br/>
          If this wasn't you, please contact us immediately.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`

    const mailOptions = {
        from: `"Match n Dice" <${process.env.EMAIL_USER || 'noreply@matchndice.com'}>`,
        to,
        subject: 'Reset Your Match n Dice Password 🔐',
        html,
        text: `Reset your Match n Dice password\n\nHi ${name},\n\nWe received a request to reset your password. Click the link below (expires in 15 minutes):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.\n\n© ${new Date().getFullYear()} Match n Dice`,
    }

    const info = await transporter.sendMail(mailOptions)

    // In development, log the Ethereal preview URL
    if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info)
        if (previewUrl) {
            console.log(`[Email] Preview URL: ${previewUrl}`)
        }
        console.log(`[Email] Password reset email sent to ${maskedEmail}`)
    }

    return info
}

// ── Send password changed confirmation email ──────────────────────────────────
export const sendPasswordChangedEmail = async ({ to, name }) => {
    const transporter = getTransporter()

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Password Changed — Match n Dice</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background:#0f0f0f;padding:28px 40px;text-align:center;">
              <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0;">Match n Dice</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">✅</div>
              <h2 style="color:#0f0f0f;font-size:20px;font-weight:700;margin:0 0 12px;">Password Changed Successfully</h2>
              <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
                Hi <strong style="color:#0f0f0f;">${name || 'there'}</strong>,<br/>
                Your Match n Dice account password was just changed.
              </p>
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin:0 0 24px;">
                <p style="margin:0;font-size:13px;color:#991b1b;">
                  ⚠️ If you didn't make this change, please contact us <strong>immediately</strong>:<br/>
                  <a href="mailto:matchndice@gmail.com" style="color:#dc2626;">matchndice@gmail.com</a>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Match n Dice</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    await transporter.sendMail({
        from: `"Match n Dice" <${process.env.EMAIL_USER || 'noreply@matchndice.com'}>`,
        to,
        subject: 'Your Match n Dice Password Was Changed',
        html,
        text: `Hi ${name},\n\nYour Match n Dice password was just changed.\n\nIf this wasn't you, contact us immediately at matchndice@gmail.com.\n\n© ${new Date().getFullYear()} Match n Dice`,
    })
}
