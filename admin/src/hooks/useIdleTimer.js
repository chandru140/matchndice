import { useEffect, useRef, useState, useCallback } from 'react'

const IDLE_TIMEOUT_MS = 15 * 60 * 1000  // 15 min for admin
const WARNING_MS      = 2 * 60 * 1000   // warn 2 min before
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click']

/**
 * useIdleTimer — fires onIdle() after IDLE_TIMEOUT_MS of no activity.
 * Shows showWarning=true at (IDLE_TIMEOUT_MS - WARNING_MS) remaining.
 * countdown = seconds remaining when warning is active.
 */
const useIdleTimer = ({ onIdle, idleTimeout = IDLE_TIMEOUT_MS, warningTime = WARNING_MS } = {}) => {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(Math.floor(warningTime / 1000))

  const logoutTimer   = useRef(null)
  const warningTimer  = useRef(null)
  const countdownRef  = useRef(null)

  const clearTimers = useCallback(() => {
    clearTimeout(logoutTimer.current)
    clearTimeout(warningTimer.current)
    clearInterval(countdownRef.current)
  }, [])

  const startCountdown = useCallback((seconds) => {
    setCountdown(seconds)
    clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }, [])

  const resetTimer = useCallback(() => {
    clearTimers()
    setShowWarning(false)

    // Set warning timer
    warningTimer.current = setTimeout(() => {
      setShowWarning(true)
      startCountdown(Math.floor(warningTime / 1000))
    }, idleTimeout - warningTime)

    // Set actual logout timer
    logoutTimer.current = setTimeout(() => {
      clearTimers()
      setShowWarning(false)
      onIdle?.()
    }, idleTimeout)
  }, [clearTimers, idleTimeout, onIdle, startCountdown, warningTime])

  const stayActive = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetTimer))
      clearTimers()
    }
  }, [resetTimer, clearTimers])

  return { showWarning, countdown, stayActive }
}

export default useIdleTimer
