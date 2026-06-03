import React, { useState, useEffect, useCallback } from 'react'
import Navbar from './components/Navbar'
import SideBar from './components/SideBar.jsx'
import { Routes, Route, Navigate } from 'react-router-dom'
import Add from './pages/Add.jsx'
import List from './pages/List.jsx'
import AddCategory from './pages/AddCategory.jsx'
import ListCategory from './pages/ListCategory.jsx'
import AddSubCategory from './pages/AddSubCategory.jsx'
import ListSubCategory from './pages/ListSubCategory.jsx'
import Edit from './pages/Edit.jsx'
import Orders from './pages/Orders.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './components/Login.jsx'
import ReviewManagement from './pages/ReviewManagement.jsx'
import WhatsAppInquiries from './pages/WhatsAppInquiries.jsx'
import SessionWarningModal from './components/SessionWarningModal.jsx'
import useIdleTimer from './hooks/useIdleTimer.js'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
export const currency = '₹'

// BroadcastChannel for multi-tab session sync
const sessionChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('admin_session')
  : null

const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '')

  // Persist token (using 'adminToken' key — separate from user 'token')
  useEffect(() => {
    if (token) {
      localStorage.setItem('adminToken', token)
    } else {
      localStorage.removeItem('adminToken')
    }
  }, [token])

  // ── Logout handler ──────────────────────────────────────────
  const handleLogout = useCallback((reason = '') => {
    setToken('')
    localStorage.removeItem('adminToken')
    // Broadcast logout to all other admin tabs
    sessionChannel?.postMessage({ type: 'ADMIN_LOGOUT' })
    if (reason) toast.info(reason, { autoClose: 5000 })
  }, [])

  // ── Multi-tab session sync ────────────────────────────────
  useEffect(() => {
    if (!sessionChannel) return
    const handler = (event) => {
      if (event.data?.type === 'ADMIN_LOGOUT') {
        setToken('')
        localStorage.removeItem('adminToken')
      }
      if (event.data?.type === 'ADMIN_LOGIN' && event.data.token) {
        setToken(event.data.token)
        localStorage.setItem('adminToken', event.data.token)
      }
    }
    sessionChannel.addEventListener('message', handler)
    return () => sessionChannel.removeEventListener('message', handler)
  }, [])

  // ── Idle timer (only active when logged in) ───────────────
  const { showWarning, countdown, stayActive } = useIdleTimer({
    onIdle: () => handleLogout('Your session expired due to inactivity.'),
    idleTimeout: 15 * 60 * 1000,  // 15 min admin
    warningTime: 2 * 60 * 1000,   // warn 2 min before
  })

  // ── Token handler used by Login ──────────────────────────
  const handleSetToken = useCallback((newToken) => {
    setToken(newToken)
    // Notify other tabs of login
    sessionChannel?.postMessage({ type: 'ADMIN_LOGIN', token: newToken })
  }, [])

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer position='top-right' autoClose={3000} />

      {/* Session warning modal — only shows when warning active */}
      {token && showWarning && (
        <SessionWarningModal
          countdown={countdown}
          onStayLoggedIn={stayActive}
          onLogoutNow={() => handleLogout('Logged out.')}
        />
      )}

      {token === ''
        ? <Login setToken={handleSetToken} />
        : (
          <>
            <Navbar setToken={setToken} onLogout={handleLogout} />
            <hr />
            <div className='flex w-full'>
              <SideBar />
              <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
                <Routes>
                  <Route path='/' element={<Navigate to='/dashboard' replace />} />
                  <Route path='/dashboard' element={<Dashboard token={token} />} />
                  <Route path='/add' element={<Add token={token} />} />
                  <Route path='/list' element={<List token={token} />} />
                  <Route path='/edit/:id' element={<Edit token={token} />} />
                  <Route path='/orders' element={<Orders token={token} />} />
                  <Route path='/add-category' element={<AddCategory token={token} />} />
                  <Route path='/list-category' element={<ListCategory token={token} />} />
                  <Route path='/add-subcategory' element={<AddSubCategory token={token} />} />
                  <Route path='/list-subcategory' element={<ListSubCategory token={token} />} />
                  <Route path='/reviews' element={<ReviewManagement token={token} />} />
                  <Route path='/whatsapp-inquiries' element={<WhatsAppInquiries token={token} />} />
                </Routes>
              </div>
            </div>
          </>
        )
      }
    </div>
  )
}

export default App