import React from 'react'
import { assets } from '../assets/frontend_assets/assets'

const Footer = () => {
  return (
    <div className='bg-black text-white px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] w-full pt-10 mt-20'>

      <div className="grid grid-cols-1 sm:grid-cols-[3fr_1fr_1fr] gap-14 my-10 text-sm">

        {/* Logo & Description */}
        <div>
          <img src={assets.match} className="mb-5 w-32 rounded-full" alt="logo" />
          <p className="w-full md:w-2/3 text-gray-400">
            Match n Dice is a one-stop destination for all your gaming needs. From board games to card games, we have it all.
          </p>
        </div>

        {/* Company Links */}
        <div>
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-1 text-gray-400">
            <li>Home</li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Privacy</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-1 text-gray-400">
            <li>+91 828282828</li>
            <li>yashram@gmail.com</li>
          </ul>
        </div>

      </div>

      <div>
        <hr className='border-gray-800'/>
        <p className="py-5 text-sm text-center text-gray-500">
          © 2026 Match n Dice.com — All Rights Reserved
        </p>
      </div>

    </div>
  )
}

export default Footer
