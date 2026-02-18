import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/frontend_assets/assets'
import NewsletterBox from '../components/NewsletterBox'

const Contact = () => {
  return (
    <div>
      <div className='text-center text-2xl pt-10 border-t'>
        <Title text1={'CONTACT'} text2={'US'} />
      </div>

      <div className='my-10 flex flex-col justify-center gap-10 mb-28 md:flex-row'>
        <img className='w-full md:max-w-[450px]' src={assets.contact_img} alt="Contact Match n Dice" />

        <div className='flex flex-col gap-6 justify-center items-start'>
          <p className='font-semibold text-xl text-gray-800'>Get In Touch</p>
          <p className='text-gray-500'>
            Have a question or want to place a bulk order? <br />
            Reach out to us — we're happy to help!
          </p>

          <div className='flex flex-col gap-2 text-gray-600'>
            <p className='font-semibold text-gray-800'>📍 Location</p>
            <p className='text-gray-500'>India</p>
          </div>

          <div className='flex flex-col gap-2 text-gray-600'>
            <p className='font-semibold text-gray-800'>📞 Phone & WhatsApp</p>
            <p className='text-gray-500'>+91 9004140139</p>
          </div>

          <div className='flex flex-col gap-2 text-gray-600'>
            <p className='font-semibold text-gray-800'>📧 Email</p>
            <p className='text-gray-500'>matchndice@gmail.com</p>
          </div>

          <div className='flex flex-col gap-3 mt-2'>
            <p className='font-semibold text-xl text-gray-800'>Corporate & Bulk Orders</p>
            <p className='text-gray-500'>
              Looking for customized corporate gifts in bulk? We offer special pricing and branding solutions for businesses of all sizes.
            </p>
            <a
              href='https://wa.me/919004140139?text=Hello%20Match%20n%20Dice%20Team%20%F0%9F%91%8B%0A%0AI%20am%20interested%20in%20placing%20a%20bulk%20corporate%20order.%20Please%20guide%20me.'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block text-black font-light mt-2 px-8 py-3 border border-gray-800 hover:bg-black hover:text-white transition-all duration-500 text-center'
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      <NewsletterBox />
    </div>
  )
}

export default Contact
