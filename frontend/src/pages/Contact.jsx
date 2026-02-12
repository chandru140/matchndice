import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/frontend_assets/assets'
import NewsletterBox from '../components/NewsletterBox'

const Contact = () => {
  return (
    <div>
      <div className='text-center text-2xl pt-10 border-t'>
        <Title text1={'CONTACT'} text2={'US'}/>
      </div>

      <div className='my-10 flex flex-col justify-center gap-10 mb-28 md:flex-row'>
        <img className='w-full md:max-w-[450px]' src={assets.contact_img} alt="" />

        <div className='flex flex-col gap-6 justify-center item-start'>
          <p className='font-semibold text-xl'> Our Store</p>
          <p className='text-gray-500'>$00056 Wills station <br /> Mumbai, Maharashtra</p>
          <p className='text-gray-500'>Tel : 828282 <br /> Email : chandru@gmail.com</p>
          <p className='font-semibold text-xl text-gray-600'>Careers at Forever</p>
          <p className='text-gray-500'>Learn more about career opportunities at Forever</p>
          <button className='text-black font-light mt-4 px-8 py-2 border border-gray-800 hover:bg-black hover:text-white transition-all duration-500'>Expore Jobs</button>
        </div>
      </div>

      <NewsletterBox/>
    </div>
  )
}

export default Contact
