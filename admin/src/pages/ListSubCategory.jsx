import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const ListSubCategory = ({token}) => {

  const [list, setList] = useState([])

  const fetchList = async () => {
    try {
        const response = await axios.get(backendUrl + '/api/subcategory/list')
        if (response.data.success) {
            setList(response.data.subCategories)
        } else {
            toast.error(response.data.message)
        }
    } catch (error) {
        console.log(error);
        toast.error(error.message)
    }
  }

  const removeSubCategory = async (id) => {
    try {
        const response = await axios.post(backendUrl + '/api/subcategory/remove', {id}, {headers: {token}})
        if (response.data.success) {
            toast.success(response.data.message)
            fetchList();
        } else {
            toast.error(response.data.message)
        }
    } catch (error) {
        console.log(error);
        toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  return (
    <>
      <p className='mb-2'>All SubCategories List</p>
      <div className='flex flex-col gap-2'>
        {/* List Table Title */}
        <div className='hidden md:grid grid-cols-[2fr_2fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm'>
            <b>Name</b>
            <b>Parent Category</b>
            <b className='text-center'>Action</b>
        </div>

        {/* List Items */}
        {list.map((item, index) => (
            <div className='grid grid-cols-[2fr_2fr_1fr] items-center gap-2 py-1 px-2 border text-sm' key={index}>
                <p>{item.name}</p>
                <p>{item.categoryId ? item.categoryId.name : 'N/A'}</p>
                <p onClick={()=>removeSubCategory(item._id)} className='text-right md:text-center cursor-pointer text-lg'>X</p>
            </div>
        ))}
      </div>
    </>
  )
}

export default ListSubCategory
