import React from 'react'
import { Routes, Route } from 'react-router-dom'

import Home from './pages/Home.jsx'
import Collections from './pages/Collections.jsx'
import Contact from './pages/Contact.jsx'
import Product from './pages/Product.jsx'
import Cart from './pages/Cart.jsx'
import PlaceOrder from './pages/PlaceOrder.jsx'
import Orders from './pages/Orders.jsx'
import About from './pages/About.jsx'
import Login from './pages/Login.jsx'
import Verify from './pages/Verify.jsx'
import Profile from './pages/Profile.jsx'
import Navbar from './components/Navbar.jsx'
import SearchBar from './components/SearchBar.jsx'
import Footer from './components/Footer.jsx'

const App = () => {
  return (
    <div className="flex-grow px-4 sm:px-[5vw] md:px-[7vw] lg:px-[6vw]">

      {/* Top */}
      <Navbar />
      <SearchBar />

      {/* Page Content */}
      <main className="flex-grow px-4 sm:px-[5vw] md:px-[7vw] lg:px-[3vw]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Collections />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/place-order" element={<PlaceOrder />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>

      {/* Bottom */}
      <Footer />

    </div>
  )
}

export default App
