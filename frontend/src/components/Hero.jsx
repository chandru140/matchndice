import React from 'react'
import { assets } from '../assets/frontend_assets/assets'
import { Link } from 'react-router-dom'

const Hero = () => {
  return (
    <div className='flex flex-col sm:flex-row border border-gray-400'>
      {/* Hero left side */}
      <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'>
        <div className='text-black'>

          <div className='flex items-center gap-2'>
            <p className='w-8 md:w-11 h-[2px] bg-black'></p>
            <p className='font-medium text-sm md:text-base tracking-widest'>PERSONALIZED GIFTING</p>
          </div>

          <h1 className='prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed'>
            Create Gifts That<br />Speak for You
          </h1>

          <p className='text-gray-500 text-sm md:text-base mt-2 mb-6 max-w-xs'>
            Personalized bottles, hoodies, notebooks, and corporate gifts crafted just the way you want.
          </p>

          <Link to='/collection'>
            <div className='flex items-center gap-2 group cursor-pointer'>
              <p className='font-semibold text-sm md:text-base group-hover:underline underline-offset-4 transition-all'>
                EXPLORE COLLECTION
              </p>
              <p className='w-8 md:w-11 h-[1px] bg-black'></p>
            </div>
          </Link>

        </div>
      </div>

      {/* Hero right side */}
      <img className='w-full sm:w-1/2' src={assets.hero_img} alt="Match n Dice personalized gifts" />
    </div>
  )
}

export default Hero
