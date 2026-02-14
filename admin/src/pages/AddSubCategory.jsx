import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const AddSubCategory = ({token}) => {

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState([])

  const fetchCategories = async () => {
      try {
          const response = await axios.get(backendUrl + '/api/category/list')
          if (response.data.success) {
              setCategories(response.data.categories)
              if(response.data.categories.length > 0) {
                  setCategoryId(response.data.categories[0]._id)
              }
          }
      } catch (error) {
          toast.error(error.message)
      }
  }

  useEffect(() => {
      fetchCategories()
  }, [])

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(backendUrl + "/api/subcategory/add", {name, categoryId}, {headers: {token}})
      if (response.data.success) {
        toast.success(response.data.message)
        setName('')
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
        console.log(error);
        toast.error(error.message)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
        <div className='w-full'>
            <p className='mb-2'>SubCategory Name</p>
            <input onChange={(e)=>setName(e.target.value)} value={name} className='w-full max-w-[500px] px-3 py-2' type="text" placeholder='Type here' required />
        </div>

        <div className='w-full'>
            <p className='mb-2'>Parent Category</p>
            <select onChange={(e)=>setCategoryId(e.target.value)} value={categoryId} className='w-full max-w-[500px] px-3 py-2'>
                {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
            </select>
        </div>

        <button type='submit' className='w-28 py-3 mt-4 bg-black text-white'>ADD</button>
    </form>
  )
}

export default AddSubCategory
