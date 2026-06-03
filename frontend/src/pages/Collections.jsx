import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/frontend_assets/assets'
import ProductItem from '../components/ProductItem'
import Title from '../components/Title'
import { useSearchParams } from 'react-router-dom'

const Collections = () => {
  const { products, search, showSearch, categories, subCategories } = useContext(ShopContext)
  const [searchParams, setSearchParams] = useSearchParams()

  const [showFilter, setShowFilter] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterProducts, setFilterProducts] = useState([])

  // Read filter state from URL params (enables bookmarking & sharing)
  const [category, setCategory] = useState(() => {
    const c = searchParams.get('category')
    return c ? c.split(',') : []
  })
  const [subCategory, setSubCategory] = useState(() => {
    const sc = searchParams.get('subCategory')
    return sc ? sc.split(',') : []
  })
  const [sortType, setSortType] = useState(searchParams.get('sort') || 'relevant')
  const [filteredSubCategories, setFilteredSubCategories] = useState([])

  // Sync state → URL params
  useEffect(() => {
    const params = {}
    if (category.length > 0) params.category = category.join(',')
    if (subCategory.length > 0) params.subCategory = subCategory.join(',')
    if (sortType !== 'relevant') params.sort = sortType
    setSearchParams(params, { replace: true })
  }, [category, subCategory, sortType])

  const toggleCategory = e => {
    const value = e.target.value
    setCategory(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value])
  }

  const toggleSubCategory = e => {
    const value = e.target.value
    setSubCategory(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value])
  }

  // Filter subcategories based on selected categories
  useEffect(() => {
    if (category.length > 0) {
      const filtered = subCategories.filter(subCat => {
        const parentCatId = subCat.categoryId?._id || subCat.categoryId
        return parentCatId && category.includes(parentCatId)
      })
      setFilteredSubCategories(filtered)
      setSubCategory(prev => prev.filter(id => filtered.some(sc => sc._id === id)))
    } else {
      setFilteredSubCategories(subCategories)
    }
  }, [category, subCategories])

  // Apply filters + search + sort
  useEffect(() => {
    let temp = [...products]

    if (search) {
      temp = temp.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
    }
    if (category.length > 0) {
      temp = temp.filter(item => item.category && category.includes(item.category._id))
    }
    if (subCategory.length > 0) {
      temp = temp.filter(item => item.subCategory && subCategory.includes(item.subCategory._id))
    }
    if (sortType === 'low-high') temp.sort((a, b) => a.price - b.price)
    else if (sortType === 'high-low') temp.sort((a, b) => b.price - a.price)

    setFilterProducts(temp)
    setLoading(false)
  }, [products, search, category, subCategory, sortType])

  const clearFilters = () => {
    setCategory([])
    setSubCategory([])
    setSortType('relevant')
  }

  const hasActiveFilters = category.length > 0 || subCategory.length > 0 || sortType !== 'relevant'

  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t'>

      {/* Filter Sidebar */}
      <div className='min-w-60'>
        <div className='flex items-center justify-between mb-2'>
          <p
            className='text-xl flex items-center cursor-pointer gap-2'
            onClick={() => setShowFilter(!showFilter)}
          >
            FILTERS
            <img
              className={`h-3 sm:hidden transition-transform ${showFilter ? 'rotate-90' : ''}`}
              src={assets.dropdown_icon}
              alt='toggle filters'
            />
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className='text-xs text-red-500 hover:underline sm:block hidden'
            >
              Clear all
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? 'block' : 'hidden'} sm:block`}>
          <p className='mb-2 font-medium'>Categories</p>
          {categories.length === 0 ? (
            <p className='text-sm text-gray-400'>Loading...</p>
          ) : categories.map(item => (
            <label key={item._id} className='flex gap-2 text-sm text-gray-700 mb-1 cursor-pointer'>
              <input
                type='checkbox'
                value={item._id}
                className='w-3'
                onChange={toggleCategory}
                checked={category.includes(item._id)}
              />
              {item.name}
            </label>
          ))}
        </div>

        {/* SubCategory Filter */}
        <div className={`border border-gray-300 pl-5 py-3 mt-6 my-5 ${showFilter ? 'block' : 'hidden'} sm:block`}>
          <p className='mb-2 font-medium'>Types</p>
          {filteredSubCategories.length > 0 ? (
            filteredSubCategories.map(item => (
              <label key={item._id} className='flex gap-2 text-sm text-gray-700 mb-1 cursor-pointer'>
                <input
                  type='checkbox'
                  value={item._id}
                  className='w-3'
                  onChange={toggleSubCategory}
                  checked={subCategory.includes(item._id)}
                />
                {item.name}
              </label>
            ))
          ) : (
            <p className='text-sm text-gray-400'>
              {category.length > 0 ? 'No types for selected category' : 'Select a category first'}
            </p>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className={`text-xs text-red-500 hover:underline sm:hidden block mt-2 ${showFilter ? 'block' : 'hidden'}`}
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Products Section */}
      <div className='flex-1'>
        <div className='flex justify-between text-base sm:text-2xl mb-4'>
          <Title text1='ALL' text2='COLLECTIONS' />
          <select
            value={sortType}
            onChange={e => setSortType(e.target.value)}
            className='border-2 border-gray-300 text-sm px-2'
            aria-label='Sort products'
          >
            <option value='relevant'>Sort by: Relevant</option>
            <option value='low-high'>Sort by: Price Low → High</option>
            <option value='high-low'>Sort by: Price High → Low</option>
          </select>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className='animate-pulse'>
                <div className='bg-gray-200 aspect-square rounded-sm mb-2' />
                <div className='h-3 bg-gray-200 rounded w-3/4 mb-1' />
                <div className='h-3 bg-gray-200 rounded w-1/2' />
              </div>
            ))
          ) : filterProducts.length > 0 ? (
            filterProducts.map(item => (
              <ProductItem
                key={item._id}
                id={item._id}
                name={item.name}
                image={item.image}
                price={item.price}
                stock={item.stock}
              />
            ))
          ) : (
            <div className='col-span-full flex flex-col items-center py-16 gap-3 text-gray-400'>
              <svg xmlns='http://www.w3.org/2000/svg' className='w-12 h-12' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z' />
              </svg>
              <p className='text-lg font-medium text-gray-600'>No products found</p>
              <p className='text-sm'>Try adjusting your filters or search term</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className='mt-2 bg-black text-white px-6 py-2 text-sm hover:bg-gray-800 transition-colors'>
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Collections
