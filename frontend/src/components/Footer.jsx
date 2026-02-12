import React from 'react'
import { assets } from '../assets/frontend_assets/assets'

const Footer = () => {
  return (
    <div>

      <div className="grid grid-cols-1 sm:grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-20 text-sm">

        {/* Logo & Description */}
        <div>
          <img src={assets.logo} className="mb-5 w-32" alt="logo" />
          <p className="w-full md:w-2/3 text-gray-600">
            This is the dummy text according to the website. It will be changed.
          </p>
        </div>

        {/* Company Links */}
        <div>
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>Home</li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Privacy</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>+91 1234567890</li>
            <li>chandrugoundero@gmail.com</li>
          </ul>
        </div>

      </div>

      <div>
        <hr />
        <p className="py-5 text-sm text-center">
          © 2026 Match n Dice.com — All Rights Reserved
        </p>
      </div>

    </div>
  )
}

export default Footer
