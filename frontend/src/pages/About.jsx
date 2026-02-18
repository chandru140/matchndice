import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/frontend_assets/assets'
import NewsletterBox from '../components/NewsletterBox'

const About = () => {
  return (
    <div>
      <div className='text-2xl text-center pt-8 border-t'>
        <Title text1={'ABOUT'} text2={'US'} />
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-16'>
        <img className='w-full md:max-w-[450px]' src={assets.about_img} alt="About Match n Dice" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600'>
          <p>
            <strong className='text-gray-800'>Match n Dice</strong> is a premium customized gifting brand dedicated to turning simple products into meaningful memories. We specialize in personalized gifts such as bottles, hoodies, notebooks, and corporate merchandise that reflect individuality and creativity.
          </p>
          <p>
            Our goal is to make gifting more personal, thoughtful, and memorable. Whether it's a birthday surprise, corporate event, anniversary gift, or festival celebration, Match n Dice helps you design products that truly represent your emotions.
          </p>
          <p>We believe every gift should tell a story — and we are here to help you create that story.</p>
          <b className='text-gray-800'>Our Mission</b>
          <p>
            To provide high-quality personalized gifting solutions that help people express emotions through thoughtfully designed products.
          </p>
          <b className='text-gray-800'>Our Vision</b>
          <p>
            To become a trusted and innovative customized gifting brand known for creativity, quality, and customer satisfaction.
          </p>
        </div>
      </div>

      <div className='text-2xl py-4'>
        <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>

      <div className='flex flex-col md:flex-row text-sm mb-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>High-Quality Materials</b>
          <p className='text-gray-600'>
            We use only premium materials for all our personalized products — from stainless steel bottles to soft-touch hoodies and premium notebooks. Every product is crafted to last and impress.
          </p>
        </div>

        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Unique Personalization</b>
          <p className='text-gray-600'>
            From custom name engravings and logo prints to personalized text and color choices, we offer a wide range of customization options to make every gift truly one-of-a-kind.
          </p>
        </div>

        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Fast WhatsApp Support</b>
          <p className='text-gray-600'>
            Our team is always just a WhatsApp message away. Get quick responses, design previews, and order confirmations — all through a simple and convenient chat experience.
          </p>
        </div>
      </div>

      {/* Customization Process */}
      <div className='text-2xl py-4'>
        <Title text1={'HOW IT'} text2={'WORKS'} />
      </div>

      <div className='flex flex-col md:flex-row gap-6 mb-20 text-sm'>
        {[
          { step: '01', title: 'Browse Products', desc: 'Explore our collection of customizable bottles, hoodies, notebooks, and corporate gifts.' },
          { step: '02', title: 'Click Customize', desc: 'Hit the "Customize via WhatsApp" button on any product page.' },
          { step: '03', title: 'Share Your Design', desc: 'Tell our team your customization details — name, logo, color, text, and more.' },
          { step: '04', title: 'Get a Preview', desc: 'We send you a design preview for approval before production begins.' },
          { step: '05', title: 'Receive Your Gift', desc: 'Your personalized product is crafted and delivered right to your doorstep.' },
        ].map(({ step, title, desc }) => (
          <div key={step} className='border px-6 py-8 flex flex-col gap-3 flex-1 text-center'>
            <p className='text-3xl font-bold text-gray-200'>{step}</p>
            <b className='text-gray-800'>{title}</b>
            <p className='text-gray-500'>{desc}</p>
          </div>
        ))}
      </div>

      <NewsletterBox />
    </div>
  )
}

export default About
