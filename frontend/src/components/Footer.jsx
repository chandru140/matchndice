import React from 'react'
import { assets } from '../assets/frontend_assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <div className='bg-black text-white px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] w-full pt-10 mt-20'>

      <div className="grid grid-cols-1 sm:grid-cols-[3fr_1fr_1fr] gap-14 my-10 text-sm">

        {/* Logo & Description */}
        <div>
          <img src={assets.match} className="mb-5 w-32 rounded-full" alt="Match n Dice logo" />
          <p className="w-full md:w-2/3 text-gray-400">
            Match n Dice is a premium customized gifting brand offering personalized bottles, hoodies, notebooks, and corporate gifts. Where every gift tells a story.
          </p>
          <div className='flex gap-4 mt-5'>
            <a
              href='https://wa.me/919004140139'
              target='_blank'
              rel='noopener noreferrer'
              className='text-gray-400 hover:text-green-400 transition-colors'
              title='WhatsApp'
            >
              <i className="fa-brands fa-whatsapp text-xl"></i>
            </a>
          </div>
        </div>

        {/* Company Links */}
        <div>
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-2 text-gray-400">
            <li><Link to='/' className='hover:text-white transition-colors'>Home</Link></li>
            <li><Link to='/about' className='hover:text-white transition-colors'>About Us</Link></li>
            <li><Link to='/collection' className='hover:text-white transition-colors'>Corporate Orders</Link></li>
            <li><Link to='/contact' className='hover:text-white transition-colors'>Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-2 text-gray-400">
            <li>
              <a href='tel:+919004140139' className='hover:text-white transition-colors'>
                +91 9004140139
              </a>
            </li>
            <li>
              <a href='mailto:matchndice@gmail.com' className='hover:text-white transition-colors'>
                matchndice@gmail.com
              </a>
            </li>
            <li>
              <a
                href='https://wa.me/919004140139'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-green-400 transition-colors'
              >
                WhatsApp Us
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div>
        <hr className='border-gray-800' />
        <p className="py-5 text-sm text-center text-gray-500">
          © 2026 Match n Dice. All Rights Reserved.
        </p>
      </div>

    </div>
  )
}

export default Footer
