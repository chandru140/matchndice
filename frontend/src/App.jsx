import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

import Navbar from './components/Navbar.jsx'
import SearchBar from './components/SearchBar.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'

// Lazy load page components
const Home = lazy(() => import('./pages/Home.jsx'))
const Collections = lazy(() => import('./pages/Collections.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const Product = lazy(() => import('./pages/Product.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Verify = lazy(() => import('./pages/Verify.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Cart = lazy(() => import('./pages/Cart.jsx'))
const PlaceOrder = lazy(() => import('./pages/PlaceOrder.jsx'))
const Orders = lazy(() => import('./pages/Orders.jsx'))

const App = () => {
  return (
    <div className="flex-grow px-4 sm:px-[5vw] md:px-[7vw] lg:px-[6vw]">

      <ScrollToTop />
      {/* Top */}
      <Navbar />
      <SearchBar />

      {/* Page Content */}
      <main className="flex-grow px-4 sm:px-[5vw] md:px-[7vw] lg:px-[3vw]">
        <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="text-gray-400">Loading...</div></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/collection" element={<Collections />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/product/:productId" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/place-order" element={<PlaceOrder />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Suspense>
      </main>

      {/* Bottom */}
      <Footer />

    </div>
  )
}

export default App
