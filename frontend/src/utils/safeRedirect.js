/**
 * safeRedirect.js
 * Validates that a redirect URL is safe (same origin, not admin, not a loop).
 */

const BLOCKED_PATHS = ['/login', '/signup', '/register']
const ADMIN_ORIGINS = [/admin/i]

/**
 * Returns the URL if it is safe to redirect to, otherwise returns null.
 * @param {string} url
 * @returns {string|null}
 */
export const getSafeRedirectUrl = (url) => {
  if (!url) return null

  try {
    // Must be a valid URL or absolute path
    const isAbsolute = url.startsWith('http://') || url.startsWith('https://')
    let parsed

    if (isAbsolute) {
      parsed = new URL(url)
      // Must be same origin
      if (parsed.origin !== window.location.origin) return null
    } else {
      // Relative path
      parsed = new URL(url, window.location.origin)
    }

    const pathname = parsed.pathname.toLowerCase()

    // Block redirect loops
    if (BLOCKED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return null

    // Block admin paths
    if (ADMIN_ORIGINS.some(r => r.test(pathname))) return null

    // Return relative path + search + hash (no origin leak)
    return parsed.pathname + parsed.search + parsed.hash
  } catch {
    return null
  }
}

const STORAGE_KEY_URL    = 'redirectAfterLogin'
const STORAGE_KEY_REASON = 'loginReason'

/** Persist returnUrl and reason to sessionStorage */
export const saveRedirectIntent = (url, reason = '') => {
  const safe = getSafeRedirectUrl(url)
  if (safe) {
    sessionStorage.setItem(STORAGE_KEY_URL, safe)
    if (reason) sessionStorage.setItem(STORAGE_KEY_REASON, reason)
  }
}

/** Read and clear the saved returnUrl */
export const popRedirectIntent = () => {
  const url    = sessionStorage.getItem(STORAGE_KEY_URL)    || null
  const reason = sessionStorage.getItem(STORAGE_KEY_REASON) || ''
  sessionStorage.removeItem(STORAGE_KEY_URL)
  sessionStorage.removeItem(STORAGE_KEY_REASON)
  return { url: getSafeRedirectUrl(url), reason }
}
