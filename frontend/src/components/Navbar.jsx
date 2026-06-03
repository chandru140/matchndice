import React, { useContext, useState } from "react";
import { assets } from "../assets/frontend_assets/assets.js";
import { NavLink, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext.jsx";

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  // ✅ Use ShopContext.logout() — it calls the backend, clears cart, clears localStorage
  // The old local logout() function bypassed all of this
  const { setShowSearch, navigate, token, logout, getCartCount } = useContext(ShopContext)
  const cartCount = getCartCount()

  // ✅ NavLink active class helper — applies to both desktop and mobile links
  const navLinkClass = ({ isActive }) =>
    `flex flex-col items-center gap-1 transition-colors ${isActive ? "text-black" : "text-gray-500 hover:text-black"}`

  const mobileNavLinkClass = ({ isActive }) =>
    `py-2 pl-6 border text-sm font-medium transition-colors ${isActive ? "text-black bg-gray-50 border-black" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  return (
    <header className="relative">
      <div className="flex items-center justify-between py-5 font-medium px-4">
        <Link to={"/"}>
          <img src={assets.match} className="w-36" alt="Match n Dice Logo" />
        </Link>

        {/* ── Desktop Nav ──────────────────────────────────────────── */}
        <ul className="hidden sm:flex gap-5 text-sm font-medium">
          <NavLink to="/" end className={navLinkClass}>
            {({ isActive }) => (
              <>
                <p>HOME</p>
                <hr className={`w-2/4 border-none h-[1.5px] bg-black transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
              </>
            )}
          </NavLink>

          <NavLink to="/collection" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <p>COLLECTION</p>
                <hr className={`w-2/4 border-none h-[1.5px] bg-black transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
              </>
            )}
          </NavLink>

          <NavLink to="/categories" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <p>CATEGORIES</p>
                <hr className={`w-2/4 border-none h-[1.5px] bg-black transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
              </>
            )}
          </NavLink>

          <NavLink to="/hamper-builder" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <p>BUILD HAMPER</p>
                <hr className={`w-2/4 border-none h-[1.5px] bg-black transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
              </>
            )}
          </NavLink>

          <NavLink to="/about" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <p>ABOUT</p>
                <hr className={`w-2/4 border-none h-[1.5px] bg-black transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
              </>
            )}
          </NavLink>

          <NavLink to="/contact" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <p>CONTACT</p>
                <hr className={`w-2/4 border-none h-[1.5px] bg-black transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
              </>
            )}
          </NavLink>
        </ul>

        {/* ── Icons ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-6">
          <img
            onClick={() => setShowSearch(true)}
            src={assets.search_icon}
            className="w-5 cursor-pointer"
            alt="Search"
          />

          {/* Profile / dropdown */}
          <div className="relative group">
            <img
              onClick={() => !token && navigate("/login")}
              className="w-5 cursor-pointer"
              src={assets.profile_icon}
              alt="Profile"
              title={token ? "My Account" : "Login"}
            />

            {token && (
              <div className="hidden group-hover:block absolute right-0 pt-4 z-50">
                <div className="flex flex-col gap-2 w-36 py-3 px-5 bg-black text-white rounded shadow-lg">
                  <p
                    onClick={() => navigate("/profile")}
                    className="cursor-pointer hover:text-gray-300 text-sm"
                  >
                    My Profile
                  </p>
                  <p
                    onClick={() => navigate("/orders")}
                    className="cursor-pointer hover:text-gray-300 text-sm"
                  >
                    My Orders
                  </p>
                  <hr className="border-gray-600" />
                  <p
                    onClick={handleLogout}
                    className="cursor-pointer hover:text-red-400 text-sm"
                  >
                    Logout
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Cart with badge */}
          <Link
            to="/cart"
            className="relative"
            aria-label={`Cart (${cartCount} items)`}
          >
            <img src={assets.cart_icon} className="w-5 min-w-5" alt="Cart" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full flex items-center justify-center leading-none">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* Mobile hamburger */}
          <img
            onClick={() => setVisible(true)}
            src={assets.menu_icon}
            className="w-5 cursor-pointer sm:hidden"
            alt="Menu"
          />
        </div>
      </div>

      {/* ── Mobile Drawer ──────────────────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 overflow-hidden bg-white transition-all duration-300 ${
          visible ? "w-full sm:w-80 shadow-2xl" : "w-0"
        }`}
        aria-hidden={!visible}
      >
        <div className="flex flex-col text-gray-600 h-full">
          <div className="flex items-center gap-4 p-3 justify-between border-b">
            <div className="flex items-center gap-4">
              <img className="h-4 rotate-180" src={assets.dropdown_icon} alt="back" />
              <p className="font-medium">Menu</p>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-2 px-4 mt-4 flex-1">
            <NavLink onClick={() => setVisible(false)} to="/"             end className={mobileNavLinkClass}>HOME</NavLink>
            <NavLink onClick={() => setVisible(false)} to="/collection"       className={mobileNavLinkClass}>COLLECTION</NavLink>
            <NavLink onClick={() => setVisible(false)} to="/categories"       className={mobileNavLinkClass}>CATEGORIES</NavLink>
            <NavLink onClick={() => setVisible(false)} to="/hamper-builder"   className={mobileNavLinkClass}>BUILD HAMPER</NavLink>
            <NavLink onClick={() => setVisible(false)} to="/about"            className={mobileNavLinkClass}>ABOUT</NavLink>
            <NavLink onClick={() => setVisible(false)} to="/contact"          className={mobileNavLinkClass}>CONTACT</NavLink>

            {token ? (
              <>
                <hr className="my-2 border-gray-200" />
                <NavLink onClick={() => setVisible(false)} to="/profile" className={mobileNavLinkClass}>MY PROFILE</NavLink>
                <NavLink onClick={() => setVisible(false)} to="/orders"  className={mobileNavLinkClass}>MY ORDERS</NavLink>
                <button
                  onClick={() => { setVisible(false); handleLogout() }}
                  className="py-2 pl-6 border border-gray-200 text-sm font-medium text-red-600 text-left hover:bg-red-50 transition-colors"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <>
                <hr className="my-2 border-gray-200" />
                <NavLink onClick={() => setVisible(false)} to="/login" className={mobileNavLinkClass}>LOGIN / SIGN UP</NavLink>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
