import React from 'react'
import { NavLink } from 'react-router-dom'
import {assets} from '../assets/assets'

const SideBar = () => {
  return (

    <div className='w-[18%] min-h-screen border-r-2 border-gray-300'>
        <div className='flex flex-col gap-4 pt-6 pl-[4%] text-[15px]'>
            
            <NavLink className={({isActive}) => `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l ${isActive ? 'bg-pink-100 border-pink-400' : ''}`} to='/add'>
                <img className='w-5 h-5' src={assets.add_icon} alt="" />
                <p className=' md:block'>Add Items</p>
            </NavLink>

            <NavLink className={({isActive}) => `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l ${isActive ? 'bg-pink-100 border-pink-400' : ''}`} to='/list'>
                <img className='w-5 h-5' src={assets.order_icon} alt="" />
                <p className=' md:block'>List Items</p>
            </NavLink>

            <NavLink className={({isActive}) => `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l ${isActive ? 'bg-pink-100 border-pink-400' : ''}`} to='/orders'>
                <img className='w-5 h-5' src={assets.order_icon} alt="" />
                <p className=' md:block'>Orders</p>
            </NavLink>

        </div>

     </div>
  )
}

export default SideBar