// ── UUID v4 generator (no dependency needed in browser) ───────────────────────
export const generateSessionId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

// ── Session ID: persist across page refreshes ─────────────────────────────────
export const getOrCreateSessionId = () => {
    const KEY = 'dice_session_id'
    let id = localStorage.getItem(KEY)
    if (!id) {
        id = generateSessionId()
        localStorage.setItem(KEY, id)
    }
    return id
}

export const clearSessionId = () => localStorage.removeItem('dice_session_id')

// ── Time label ────────────────────────────────────────────────────────────────
export const getTimeLabel = (date) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export const getDateLabel = (date) => {
    const d = date instanceof Date ? date : new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Simple markdown renderer (bold, italic, bullets, line breaks) ──────────────
export const renderMarkdown = (text) => {
    if (!text) return ''
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:0.85em">$1</code>')
        .replace(/^• (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul style="margin:4px 0 4px 16px;padding:0">$1</ul>')
        .replace(/\n/g, '<br>')
}

// ── Generate WhatsApp pre-filled message ──────────────────────────────────────
export const formatWhatsAppMessage = (customizationData, sessionId) => {
    if (!customizationData) return ''
    const { productName, requirements = {}, userInfo = {} } = customizationData

    const lines = [
        `Hi Match n Dice! 👋`,
        ``,
        `I've been chatting with Dice (your AI assistant) and I'd like to proceed with my customization.`,
        ``,
        `📋 CUSTOMIZATION DETAILS:`,
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🛍️ Product: ${productName || 'Not specified'}`,
        ``,
        `✏️ CUSTOMIZATION REQUIREMENTS:`,
        requirements.text      ? `• Text/Engraving: "${requirements.text}"` : null,
        requirements.logo      ? `• Logo: Yes — will share file on WhatsApp` : `• Logo: No`,
        requirements.color     ? `• Color: ${requirements.color}` : null,
        requirements.quantity  ? `• Quantity: ${requirements.quantity} pieces` : null,
        requirements.deadline  ? `• Deadline: ${requirements.deadline}` : null,
        requirements.occasion  ? `• Occasion: ${requirements.occasion}` : null,
        requirements.additionalNotes ? `• Notes: ${requirements.additionalNotes}` : null,
        ``,
        userInfo.name || userInfo.phone || userInfo.email ? `👤 MY DETAILS:` : null,
        userInfo.name  ? `• Name: ${userInfo.name}` : null,
        userInfo.phone ? `• Phone: ${userInfo.phone}` : null,
        userInfo.email ? `• Email: ${userInfo.email}` : null,
        ``,
        `🔗 Session ID: ${sessionId} (for reference)`,
        ``,
        `Please confirm availability and next steps!`,
    ].filter(l => l !== null).join('\n')

    return lines
}

// ── Check if business hours (9AM–6PM IST, Mon–Sat) ───────────────────────────
export const isBusinessHours = () => {
    const now = new Date()
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000
    const ist = new Date(now.getTime() + istOffset)
    const hour = ist.getUTCHours()
    const day = ist.getUTCDay() // 0=Sun, 6=Sat
    return day >= 1 && day <= 6 && hour >= 9 && hour < 18
}

// ── Truncate text ─────────────────────────────────────────────────────────────
export const truncate = (str, max = 80) =>
    str && str.length > max ? str.slice(0, max) + '…' : str
