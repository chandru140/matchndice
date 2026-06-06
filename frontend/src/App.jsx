import React, { Suspense, lazy } from 'react'
import { Routes, Route, Link } from 'react-router-dom'

import Navbar from './components/Navbar.jsx'
import SearchBar from './components/SearchBar.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import FloatingButtonStack from './components/floating/FloatingButtonStack.jsx'

// Lazy load page components
const Home               = lazy(() => import('./pages/Home.jsx'))
const Collections        = lazy(() => import('./pages/Collections.jsx'))
const Contact            = lazy(() => import('./pages/Contact.jsx'))
const Product            = lazy(() => import('./pages/Product.jsx'))
const About              = lazy(() => import('./pages/About.jsx'))
const Login              = lazy(() => import('./pages/Login.jsx'))
const ForgotPassword     = lazy(() => import('./pages/ForgotPassword.jsx'))
const ResetPassword      = lazy(() => import('./pages/ResetPassword.jsx'))
const Verify             = lazy(() => import('./pages/Verify.jsx'))
const Profile            = lazy(() => import('./pages/Profile.jsx'))
const Cart               = lazy(() => import('./pages/Cart.jsx'))
const PlaceOrder         = lazy(() => import('./pages/PlaceOrder.jsx'))
const Orders             = lazy(() => import('./pages/Orders.jsx'))
const OrderSuccess       = lazy(() => import('./pages/OrderSuccess.jsx'))
const CategoryDistribution = lazy(() => import('./pages/CategoryDistribution.jsx'))
const HamperBuilder      = lazy(() => import('./pages/HamperBuilder.jsx'))

// ── 404 Page ───────────────────────────────────────────────────────────────────
// Extracted from inline JSX to a proper component for reusability and clean markup
const NotFound = () => (
  <div className="flex flex-col items-center py-24 gap-6" role="main">
    <p className="text-7xl font-bold text-gray-200 select-none">404</p>
    <div className="text-center">
      <p className="text-2xl font-semibold text-gray-800 mb-2">Page not found</p>
      <p className="text-gray-500 text-sm">The page you're looking for doesn't exist or has been moved.</p>
    </div>
    <Link
      to="/"
      className="bg-black text-white px-10 py-3 text-sm hover:bg-gray-800 transition-colors mt-2"
    >
      GO HOME
    </Link>
  </div>
)

const App = () => {
  return (
    <div className="flex-grow px-4 sm:px-[5vw] md:px-[7vw] lg:px-[6vw]">

      <ScrollToTop />
      {/* Top */}
      <Navbar />
      <SearchBar />

      {/* Page Content — wrapped in ErrorBoundary so a crash in one page
          doesn't take down the whole app with a blank white screen */}
      <main className="flex-grow">
        <ErrorBoundary>
          <Suspense fallback={
            <div className='flex justify-center items-center h-64'>
              <div className='w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin' />
            </div>
          }>
            <Routes>
              <Route path="/"                element={<Home />} />
              <Route path="/categories"      element={<CategoryDistribution />} />
              <Route path="/hamper-builder"  element={<HamperBuilder />} />
              <Route path="/collection"      element={<Collections />} />
              <Route path="/about"           element={<About />} />
              <Route path="/contact"         element={<Contact />} />
              <Route path="/product/:productId" element={<Product />} />
              <Route path="/cart"            element={<Cart />} />
              <Route path="/place-order"     element={<PlaceOrder />} />
              <Route path="/orders"          element={<Orders />} />
              <Route path="/order-success"   element={<OrderSuccess />} />
              {/* Auth routes */}
              <Route path="/login"           element={<Login />} />
              <Route path="/signup"          element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password"  element={<ResetPassword />} />
              <Route path="/verify"          element={<Verify />} />
              <Route path="/profile"         element={<Profile />} />
              {/* 404 */}
              <Route path="*"               element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Bottom */}
      <Footer />

      {/* Floating Button Stack — Dice AI chatbot (top) + WhatsApp (bottom) */}
      {/* Both hidden on /login, /signup, /forgot-password, /admin pages */}
      <FloatingButtonStack />

    </div>
  )
}

export default App
