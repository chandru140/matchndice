import React from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'

const navItems = [
  { to: '/dashboard',          label: 'Dashboard',            icon: assets.order_icon },
  { to: '/orders',             label: 'Orders',               icon: assets.order_icon },
  { to: '/list',               label: 'Products',             icon: assets.order_icon },
  { to: '/add',                label: 'Add Product',          icon: assets.add_icon   },
  { to: '/list-category',      label: 'Categories',           icon: assets.order_icon },
  { to: '/add-category',       label: 'Add Category',         icon: assets.add_icon   },
  { to: '/list-subcategory',   label: 'Subcategories',        icon: assets.order_icon },
  { to: '/add-subcategory',    label: 'Add Subcategory',      icon: assets.add_icon   },
  { to: '/reviews',            label: 'Reviews',              icon: assets.order_icon },
  { to: '/whatsapp-inquiries', label: 'WhatsApp Inquiries',   icon: assets.order_icon },
]

const SideBar = () => (
  <div className='w-[18%] min-h-screen border-r-2 border-gray-200 bg-white'>
    <div className='flex flex-col gap-1 pt-6 px-2 text-sm'>
      {navItems.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-black text-white font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <img className='w-4 h-4' src={icon} alt='' style={{ filter: 'inherit' }} />
          <span className='hidden md:block'>{label}</span>
        </NavLink>
      ))}
    </div>
  </div>
)

export default SideBar