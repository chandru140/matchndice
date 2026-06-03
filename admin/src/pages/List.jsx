import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

// Stock badge based on qty
const StockBadge = ({ stock, threshold = 5 }) => {
  if (stock === 0)        return <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700'>Out of Stock</span>
  if (stock <= threshold) return <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700'>Low ({stock})</span>
  return                         <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700'>In Stock ({stock})</span>
}

const List = ({ token }) => {
  const [list,         setList]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [stockFilter,  setStockFilter]  = useState('all') // all | low | out
  const [editingStock, setEditingStock] = useState({})    // {productId: newQty}
  const [savingStock,  setSavingStock]  = useState(null)

  const fetchList = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(backendUrl + '/api/product/list')
      if (data.success) setList(data.products)
      else toast.error(data.message)
    } catch {
      toast.error('Failed to load products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  const removeProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      const { data } = await axios.post(backendUrl + '/api/product/remove', { id }, { headers: { token } })
      if (data.success) { toast.success(data.message); fetchList() }
      else toast.error(data.message)
    } catch {
      toast.error('Failed to delete product.')
    }
  }

  // Inline stock update
  const saveStock = async (productId) => {
    const newQty = Number(editingStock[productId])
    if (isNaN(newQty) || newQty < 0) {
      toast.error('Stock must be a non-negative number.')
      return
    }
    setSavingStock(productId)
    try {
      const { data } = await axios.patch(
        backendUrl + '/api/product/stock/' + productId,
        { stock: newQty },
        { headers: { token } }
      )
      if (data.success) {
        toast.success('Stock updated!')
        setEditingStock(prev => { const n = { ...prev }; delete n[productId]; return n })
        fetchList()
      } else {
        toast.error(data.message || 'Failed to update stock.')
      }
    } catch {
      toast.error('Failed to update stock.')
    } finally {
      setSavingStock(null)
    }
  }

  // ── Filtered products ─────────────────────────────────────
  const filtered = list.filter(p => {
    const matchSearch = !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchStock =
      stockFilter === 'all' ? true :
      stockFilter === 'out' ? p.stock === 0 :
      stockFilter === 'low' ? (p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)) :
      true
    return matchSearch && matchStock
  })

  const outCount = list.filter(p => p.stock === 0).length
  const lowCount = list.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)).length

  return (
    <div className='max-w-6xl'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-3 mb-5'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Products</h1>
          <p className='text-sm text-gray-500'>{filtered.length} of {list.length} products</p>
        </div>
        <Link to='/add' className='bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors'>
          + Add Product
        </Link>
      </div>

      {/* Stock alerts */}
      {(outCount > 0 || lowCount > 0) && (
        <div className='flex gap-3 mb-4 flex-wrap'>
          {outCount > 0 && (
            <button onClick={() => setStockFilter('out')} className='bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors'>
              ⚠ {outCount} Out of Stock
            </button>
          )}
          {lowCount > 0 && (
            <button onClick={() => setStockFilter('low')} className='bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-yellow-100 transition-colors'>
              ⚡ {lowCount} Low Stock
            </button>
          )}
          {stockFilter !== 'all' && (
            <button onClick={() => setStockFilter('all')} className='text-xs text-gray-500 hover:text-black underline'>
              Show all
            </button>
          )}
        </div>
      )}

      {/* Search + Filter */}
      <div className='flex gap-3 mb-4 flex-wrap'>
        <input
          type='text'
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder='Search by name or category...'
          className='border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black flex-1 min-w-[200px]'
        />
        <select
          value={stockFilter}
          onChange={e => setStockFilter(e.target.value)}
          className='border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-black'
        >
          <option value='all'>All Stock</option>
          <option value='out'>Out of Stock</option>
          <option value='low'>Low Stock</option>
        </select>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className='space-y-2'>
          {[1, 2, 3].map(i => (
            <div key={i} className='animate-pulse grid grid-cols-[48px_1fr_1fr_1fr_1fr_auto] gap-3 items-center border p-3 rounded-lg'>
              <div className='w-12 h-12 bg-gray-200 rounded' />
              <div className='h-4 bg-gray-200 rounded' />
              <div className='h-4 bg-gray-200 rounded' />
              <div className='h-4 bg-gray-200 rounded' />
              <div className='h-4 bg-gray-200 rounded' />
              <div className='h-4 bg-gray-200 rounded w-16' />
            </div>
          ))}
        </div>
      )}

      {/* Table header */}
      {!loading && (
        <>
          <div className='hidden md:grid grid-cols-[60px_2fr_1fr_1fr_1fr_auto] items-center py-2 px-3 bg-gray-100 rounded-t-lg text-xs font-semibold text-gray-500 uppercase tracking-wider gap-3'>
            <span>Image</span>
            <span>Name</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock</span>
            <span className='text-center'>Actions</span>
          </div>

          <div className='border border-t-0 rounded-b-lg divide-y divide-gray-100'>
            {filtered.length === 0 && (
              <p className='text-center text-gray-400 py-10 text-sm'>No products found.</p>
            )}
            {filtered.map(item => (
              <div
                key={item._id}
                className={`grid grid-cols-[60px_1fr] md:grid-cols-[60px_2fr_1fr_1fr_1fr_auto] gap-3 items-center py-3 px-3 hover:bg-gray-50 transition-colors ${item.stock === 0 ? 'opacity-70' : ''}`}
              >
                <img className='w-12 h-12 object-contain rounded border bg-gray-50' src={item.image?.[0]} alt={item.name} loading='lazy' />

                <div>
                  <p className='font-medium text-gray-900 text-sm truncate'>{item.name}</p>
                  <p className='text-xs text-gray-400'>{item.bestseller ? '⭐ Bestseller' : ''}</p>
                </div>

                <p className='text-sm text-gray-600'>{item.category?.name || '–'}</p>

                <p className='text-sm font-medium'>{currency}{Number(item.price).toLocaleString('en-IN')}</p>

                {/* Inline Stock Editor */}
                <div className='flex items-center gap-1'>
                  {editingStock[item._id] !== undefined ? (
                    <>
                      <input
                        type='number'
                        min={0}
                        value={editingStock[item._id]}
                        onChange={e => setEditingStock(prev => ({ ...prev, [item._id]: e.target.value }))}
                        className='w-16 border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-black'
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveStock(item._id)
                          if (e.key === 'Escape') setEditingStock(prev => { const n = { ...prev }; delete n[item._id]; return n })
                        }}
                      />
                      <button
                        onClick={() => saveStock(item._id)}
                        disabled={savingStock === item._id}
                        className='text-xs bg-black text-white px-2 py-1 rounded hover:bg-gray-800 disabled:opacity-50'
                      >
                        {savingStock === item._id ? '…' : '✓'}
                      </button>
                      <button
                        onClick={() => setEditingStock(prev => { const n = { ...prev }; delete n[item._id]; return n })}
                        className='text-xs text-gray-400 hover:text-gray-600 px-1'
                      >✕</button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingStock(prev => ({ ...prev, [item._id]: item.stock }))}
                      className='flex items-center gap-1 group'
                      title='Click to edit stock'
                    >
                      <StockBadge stock={item.stock} threshold={item.lowStockThreshold || 5} />
                      <svg xmlns='http://www.w3.org/2000/svg' className='w-3 h-3 text-gray-300 group-hover:text-gray-600 transition-colors' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' /></svg>
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className='flex items-center gap-2 justify-end'>
                  <Link
                    to={`/edit/${item._id}`}
                    className='text-xs border border-gray-300 px-2.5 py-1.5 rounded hover:bg-gray-100 transition-colors'
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => removeProduct(item._id, item.name)}
                    className='text-xs border border-red-200 text-red-600 px-2.5 py-1.5 rounded hover:bg-red-50 transition-colors'
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default List