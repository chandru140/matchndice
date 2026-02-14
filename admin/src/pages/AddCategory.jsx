import React, { useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const AddCategory = ({token}) => {

  const [image, setImage] = useState(false)
  const [name, setName] = useState('')

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("image", image)

      const response = await axios.post(backendUrl + "/api/category/add", formData, {headers: {token}})
      if (response.data.success) {
        toast.success(response.data.message)
        setName('')
        setImage(false)
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
        <div>
            <p className='mb-2'>Upload Image</p>
            <label htmlFor="image">
                <img className='w-20' src={!image ? assets.upload_area : URL.createObjectURL(image)} alt="" />
                <input onChange={(e)=>setImage(e.target.files[0])} type="file" id="image" hidden required />
            </label>
        </div>

        <div className='w-full'>
            <p className='mb-2'>Category Name</p>
            <input onChange={(e)=>setName(e.target.value)} value={name} className='w-full max-w-[500px] px-3 py-2' type="text" placeholder='Type here' required />
        </div>

        <button type='submit' className='w-28 py-3 mt-4 bg-black text-white'>ADD</button>
    </form>
  )
}

export default AddCategory
