import React, { useContext, useEffect, useState, useCallback } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/frontend_assets/assets'
import { useLocation, useNavigate } from 'react-router-dom'

const SearchBar = () => {
  const { search, setSearch, showSearch, setShowSearch } = useContext(ShopContext)
  const [visible, setVisible] = useState(false)
  const [localSearch, setLocalSearch] = useState(search)
  const location = useLocation()
  const navigate = useNavigate()

  // Only show the expanded search bar on the /collection page
  useEffect(() => {
    setVisible(location.pathname.includes('collection'))
  }, [location])

  // Debounce: update global search 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(localSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, setSearch])

  // Keep local state in sync if context search is cleared externally
  useEffect(() => {
    if (search === '') setLocalSearch('')
  }, [search])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setSearch(localSearch)
      // Navigate to collection if not already there
      if (!location.pathname.includes('collection')) {
        navigate('/collection')
      }
    }
    if (e.key === 'Escape') {
      setShowSearch(false)
    }
  }

  const handleClose = () => {
    setShowSearch(false)
    setLocalSearch('')
    setSearch('')
  }

  return showSearch && visible ? (
    <div className='border-t border-b bg-gray-50 text-center'>
      <div className='inline-flex items-center justify-center border border-gray-400 px-5 py-2 my-5 mx-3 rounded-full w-3/4 sm:w-1/2'>
        <input
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className='flex-1 outline-none bg-inherit text-sm'
          type='search'
          placeholder='Search products...'
          autoFocus
          aria-label='Search products'
        />
        <img className='w-4' src={assets.search_icon} alt='search' />
      </div>

      <img
        onClick={handleClose}
        className='inline w-3 cursor-pointer'
        src={assets.cross_icon}
        alt='close search'
      />
    </div>
  ) : null
}

export default SearchBar
