import axios from 'axios'
import React, { useState } from 'react'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Login = ({ setToken }) => {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const response = await axios.post(backendUrl + '/api/user/admin', { email, password })
      if (response.data.success) {
        setToken(response.data.token)
        toast.success('Welcome back, Admin!')
      } else {
        toast.error(response.data.message || 'Invalid credentials.')
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center w-full bg-gray-50'>
      <div className='bg-white shadow-lg rounded-2xl px-10 py-10 max-w-md w-full mx-4'>
        {/* Logo / Branding */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Match n Dice</h1>
          <p className='text-sm text-gray-500 mt-1'>Admin Panel — Secure Access</p>
        </div>

        <form onSubmit={onSubmitHandler} className='flex flex-col gap-4'>
          <div>
            <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block'>
              Admin Email
            </label>
            <input
              onChange={e => setEmail(e.target.value)}
              value={email}
              className='rounded-lg w-full px-4 py-3 border border-gray-300 outline-none focus:border-black transition-colors text-sm'
              type='email'
              placeholder='admin@matchndice.com'
              required
              autoComplete='email'
            />
          </div>

          <div>
            <label className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block'>
              Password
            </label>
            <div className='relative'>
              <input
                onChange={e => setPassword(e.target.value)}
                value={password}
                className='rounded-lg w-full px-4 py-3 pr-12 border border-gray-300 outline-none focus:border-black transition-colors text-sm'
                type={showPass ? 'text' : 'password'}
                placeholder='••••••••'
                required
                autoComplete='current-password'
              />
              <button
                type='button'
                onClick={() => setShowPass(p => !p)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? (
                  <svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21' /></svg>
                ) : (
                  <svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /><path strokeLinecap='round' strokeLinejoin='round' d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='mt-2 w-full py-3 px-4 rounded-lg text-white bg-black hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2'
          >
            {loading ? (
              <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> Signing in...</>
            ) : 'Sign In to Admin'}
          </button>
        </form>

        <p className='text-xs text-gray-400 text-center mt-6'>
          Session auto-expires after 15 minutes of inactivity.
        </p>
      </div>
    </div>
  )
}

export default Login