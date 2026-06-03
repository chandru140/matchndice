import React, { useState } from 'react'
import { toast } from 'react-toastify'

const NewsletterBox = () => {
  const [email, setEmail] = useState('')

  const onSubmitHandler = (event) => {
    event.preventDefault();
    if (email) {
      toast.success("Thanks for subscribing! We'll be in touch.");
      setEmail('');
    }
  }

  return (
    <div className='text-center'>
      <p className='text-2xl font-medium text-black'>Subscribe & get 10% OFF your first order</p>
      <p className='text-gray-500 mt-3'>
        Join the Match n Dice community and be the first to know about new products, seasonal deals, and corporate gifting packages.
      </p>
      <form onSubmit={onSubmitHandler} className='w-full sm:w-1/2 flex items-center gap-3 mx-auto my-6 border pl-3'>
        <input value={email} onChange={(e) => setEmail(e.target.value)} required className='w-full sm:flex outline-none' type='email' placeholder='Enter your email address' />
        <button type='submit' className='bg-black text-white text-xs px-10 py-4'>SUBSCRIBE</button>
      </form>
    </div>
  )
}

export default NewsletterBox
