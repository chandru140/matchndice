import React, { useContext, useState } from "react";
import { assets } from "../assets/frontend_assets/assets.js";
import { NavLink , Link} from "react-router-dom";
import { ShopContext } from "../context/ShopContext.jsx";

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const {setShowSearch , getCartCount , navigate , token , setToken , setCartItems } = useContext(ShopContext)

  const logout = () => {
    navigate('/login');
    localStorage.removeItem('token');
    setToken('');
    setCartItems({});

  }

  return (
    <header className="relative">
      <div className="flex items-center justify-between py-5 font-medium px-4">
        <Link to={'/'}>
        <img src={assets.match} className="w-36" alt="logo" />
        </Link>
        

        <ul className="hidden sm:flex gap-5 text-sm text-gray-700">
          <NavLink to="/" className="flex flex-col items-center gap-1">
            <p>HOME</p>
            <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
          </NavLink>

          <NavLink to="/collection" className="flex flex-col items-center gap-1">
            <p>COLLECTION</p>
            <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
          </NavLink>

          <NavLink to="/about" className="flex flex-col items-center gap-1">
            <p>ABOUT</p>
            <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
          </NavLink>

          <NavLink to="/contact" className="flex flex-col items-center gap-1">
            <p>CONTACT</p>
            <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
          </NavLink>
        </ul>

        <div className="flex items-center gap-6">
          <img onClick={()=>setShowSearch(true)} src={assets.search_icon} className="w-5 cursor-pointer" alt="search" />

          <div className="relative group">
            <img onClick={()=> token ? null : navigate('/login')} className="w-5 cursor-pointer" src={assets.profile_icon} alt="profile" />

            {token && 
                 <div className="hidden group-hover:block absolute right-0 pt-4">
              <div className="flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded">
                <p onClick={()=>navigate('/profile')} className="cursor-pointer hover:text-black">My Profile</p>
                <p onClick={()=>navigate('/orders')} className="cursor-pointer hover:text-black">Orders</p>
                <p onClick={logout} className="cursor-pointer hover:text-black">Logout</p>
              </div>
            </div>
            }

          </div>

          <NavLink to="/cart" className="relative">
            <img src={assets.cart_icon} className="w-5" alt="cart" />
            <p className="absolute -right-1 -bottom-1 h-4 w-4 flex items-center justify-center bg-black text-white rounded-full text-[8px]">
              {getCartCount()}
            </p>
          </NavLink>

          {/* Mobile menu button (visible only on small screens) */}
          <img
            onClick={() => setVisible(true)}
            src={assets.menu_icon}
            className="w-5 cursor-pointer sm:hidden"
            alt="menu"
          />
        </div>
      </div>

      {/* Mobile drawer / overlay */}
      <div
        // using fixed so it covers the viewport on mobile
        className={`fixed top-0 right-0 bottom-0 z-50 overflow-hidden bg-white transition-all duration-300 ${
          visible ? "w-full sm:w-80" : "w-0"
        }`}
        aria-hidden={!visible}
      >
        <div className="flex flex-col text-gray-600 h-full">
          <div className="flex items-center gap-4 p-3 justify-between">
            <div className="flex items-center gap-4">
              <img className="h-4 rotate-180" src={assets.dropdown_icon} alt="back" />
              <p>Menu</p>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-4 px-4">
            <NavLink onClick={() => setVisible(false)} to="/" className="py-2 pl-6 border">HOME</NavLink>
            <NavLink onClick={() => setVisible(false)} to="/collection" className="py-2 pl-6 border">COLLECTION</NavLink>
            <NavLink onClick={() => setVisible(false)} to="/about" className="py-2 pl-6 border">ABOUT</NavLink>
            <NavLink onClick={() => setVisible(false)} to="/contact" className="py-2 pl-6 border">CONTACT</NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
