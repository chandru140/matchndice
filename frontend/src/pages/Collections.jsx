import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/frontend_assets/assets'
import ProductItem from '../components/ProductItem'
import Title from '../components/Title'

const Collections = () => {

  const { products, search, showSearch } = useContext(ShopContext)

  const [showFilter, setShowFilter] = useState(false)
  const [filterProducts, setFilterProducts] = useState([])
  const [category, setCategory] = useState([])
  const [subCategory, setSubCategory] = useState([])
  const [sortType, setSortType] = useState('relevant')

  // Toggle category
  const toggleCategory = (e) => {
    const value = e.target.value
    setCategory(prev =>
      prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value]
    )
  }

  // Toggle sub-category
  const toggleSubCategory = (e) => {
    const value = e.target.value
    setSubCategory(prev =>
      prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value]
    )
  }

  // APPLY FILTER + SEARCH + SORT (single source of truth)
  useEffect(() => {
    let tempProducts = [...products]

    // 🔍 Search filter
    if (showSearch && search) {
      tempProducts = tempProducts.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    // 📦 Category filter
    if (category.length > 0) {
      tempProducts = tempProducts.filter(item =>
        category.includes(item.category)
      )
    }

    // 🧥 SubCategory filter
    if (subCategory.length > 0) {
      tempProducts = tempProducts.filter(item =>
        subCategory.includes(item.subCategory)
      )
    }

    // 🔃 Sorting
    if (sortType === 'low-high') {
      tempProducts.sort((a, b) => a.price - b.price)
    } 
    else if (sortType === 'high-low') {
      tempProducts.sort((a, b) => b.price - a.price)
    }

    setFilterProducts(tempProducts)

  }, [products, search, showSearch, category, subCategory, sortType])

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">

      {/* Filter Section */}
      <div className="min-w-60">

        <p
          className="my-2 text-xl flex items-center cursor-pointer gap-2"
          onClick={() => setShowFilter(!showFilter)}
        >
          FILTERS
          <img
            className={`h-3 sm:hidden transition-transform ${
              showFilter ? 'rotate-90' : ''
            }`}
            src={assets.dropdown_icon}
            alt="toggle"
          />
        </p>

        {/* Category Filter */}
        <div className={`border border-gray-300 pl-5 py-3 mt-6 ${
          showFilter ? 'block' : 'hidden'
        } sm:block`}>
          <p className="mb-2 font-medium">Categories</p>

          {['Men', 'Women', 'Kids'].map(item => (
            <label key={item} className="flex gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                value={item}
                className="w-3"
                onChange={toggleCategory}
              />
              {item}
            </label>
          ))}
        </div>

        {/* SubCategory Filter */}
        <div className={`border border-gray-300 pl-5 py-3 mt-6 my-5 ${
          showFilter ? 'block' : 'hidden'
        } sm:block`}>
          <p className="mb-2 font-medium">Types</p>

          {['Topwear', 'Bottomwear', 'Winterwear'].map(item => (
            <label key={item} className="flex gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                value={item}
                className="w-3"
                onChange={toggleSubCategory}
              />
              {item}
            </label>
          ))}
        </div>

      </div>

      {/* Products Section */}
      <div className="flex-1">

        <div className="flex justify-between text-base sm:text-2xl mb-4">
          <Title text1="ALL" text2="COLLECTIONS" />

          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            className="border-2 border-gray-300 text-sm px-2"
          >
            <option value="relevant">Sort by : Relevant</option>
            <option value="low-high">Sort by : Low to High</option>
            <option value="high-low">Sort by : High to Low</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {filterProducts.length > 0 ? (
            filterProducts.map((item, index) => (
              <ProductItem
                key={index}
                id={item._id}
                name={item.name}
                image={item.image}
                price={item.price}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No products found
            </p>
          )}
        </div>

      </div>
    </div>
  )
}

export default Collections
