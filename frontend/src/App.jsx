import React, { Suspense, lazy } from 'react'
import { Routes, Route, Link } from 'react-router-dom'

import Navbar from './components/Navbar.jsx'
import SearchBar from './components/SearchBar.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

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

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/919004140139"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
        aria-label="Chat on WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
      </a>

    </div>
  )
}

export default App
