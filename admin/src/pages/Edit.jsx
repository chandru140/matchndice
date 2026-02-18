import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import ImageUpload from '../components/ImageUpload'
import CustomizationForm from '../components/CustomizationForm'
import { useNavigate, useParams } from 'react-router-dom'

const Edit = ({token}) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [image1, setImage1] = useState(false)
  const [image2, setImage2] = useState(false)
  const [image3, setImage3] = useState(false)
  const [image4, setImage4] = useState(false)

  const [existingImages, setExistingImages] = useState([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [subCategory, setSubCategory] = useState("")
  const [bestseller, setBestseller] = useState(false)
  
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])

  const [isCustomizable, setIsCustomizable] = useState(false)
  const [customizationFields, setCustomizationFields] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProductData = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/single/' + id);
      if (response.data.success) {
        const product = response.data.product;
        setName(product.name)
        setDescription(product.description)
        setPrice(product.price)
        
        // Handle category - check if it's populated or just an ID
        if (product.category) {
          setCategory(product.category._id || product.category)
        }
        
        // Handle subcategory - check if it's populated or just an ID
        if (product.subCategory) {
          setSubCategory(product.subCategory._id || product.subCategory)
        }
        
        setBestseller(product.bestseller)
        setExistingImages(product.image || [])
        setIsCustomizable(product.isCustomizable || false)
        setCustomizationFields(product.customizationFields || [])
        setLoading(false)
      } else {
        toast.error(response.data.message)
        navigate('/list')
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
      navigate('/list')
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/category/list')
      if (response.data.success) {
        setCategories(response.data.categories)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const fetchSubCategories = async (catId) => {
    try {
      if(!catId) return;
      const response = await axios.get(backendUrl + '/api/subcategory/list/' + catId)
      if (response.data.success) {
        setSubCategories(response.data.subCategories)
        if(response.data.subCategories.length > 0 && !subCategory) {
          setSubCategory(response.data.subCategories[0]._id)
        }
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchProductData()
    fetchCategories()
  }, [])

  useEffect(() => {
    if(category) {
      fetchSubCategories(category)
    }
  }, [category])

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    // Add images (new or existing)
    image1 && formData.append('image1', image1)
    image2 && formData.append('image2', image2)
    image3 && formData.append('image3', image3)
    image4 && formData.append('image4', image4)

    formData.append('name', name)
    formData.append('description', description)
    formData.append('price', price)
    formData.append('category', category)
    formData.append('subCategory', subCategory)
    formData.append('bestseller', bestseller)
    formData.append('isCustomizable', isCustomizable)
    formData.append('customizationFields', JSON.stringify(customizationFields))

    try {
      const response = await axios.put(backendUrl + '/api/product/update/' + id, formData, {headers:{token}})
      console.log(response.data)
      if(response.data.success) {
        toast.success(response.data.message)
        navigate('/list')
      } else {
        toast.error(response.data.message)
      }
    } catch(error) {
      console.log(error);
      toast.error(error.message);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
      <div className="w-full mb-4">
        <p className="text-xl font-semibold mb-2">Edit Product</p>
        <p className="text-sm text-gray-500">Update product information and images</p>
      </div>

      {/* Existing Images Preview */}
      {existingImages.length > 0 && (
        <div className='w-full'>
          <p className='mb-2'>Current Images</p>
          <div className='flex gap-2 mb-4'>
            {existingImages.map((img, index) => (
              <img key={index} className='w-20 h-20 object-cover border' src={img} alt={`Product ${index + 1}`} />
            ))}
          </div>
          <p className='text-sm text-gray-500 mb-2'>Upload new images below to replace existing ones</p>
        </div>
      )}

      <ImageUpload 
        image1={image1} setImage1={setImage1}
        image2={image2} setImage2={setImage2}
        image3={image3} setImage3={setImage3}
        image4={image4} setImage4={setImage4}
      />

      <div className='w-full'>
        <p className='mb-2'>Product Name</p>
        <input onChange={(e)=>setName(e.target.value)} value={name} className='w-full max-w-[500px] px-3 py-2 rounded-md border' type="text" placeholder='Enter product name' required/>
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product Description</p>
        <textarea onChange={(e)=>setDescription(e.target.value)} value={description} className='w-full max-w-[500px] px-3 py-2 rounded-md border' type="text" placeholder='Write Content Here' />
      </div>

      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <div>
          <p className='mb-2'>Product Category</p>
          <select onChange={(e) => setCategory(e.target.value)} value={category} className='w-full px-3 py-2 border' >
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <p className='mb-2'>Sub Category</p>
          <select onChange={(e) => setSubCategory(e.target.value)} value={subCategory} className='w-full px-3 py-2 border'>
            {subCategories.map(sub => (
              <option key={sub._id} value={sub._id}>{sub.name}</option>
            ))}
          </select>
        </div>

        <div>
          <p className='mb-2'>Product Price</p>
          <input onChange={(e)=>setPrice(e.target.value)} value={price} className='w-full max-w-[500px] sm:w-[120px] px-3 py-2 rounded-md border' type="number" placeholder='700' />
        </div>
      </div>



      <div className='flex gap-2 mt-2'>
        <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id='bestseller'/>
        <label className='cursor-pointer' htmlFor="bestseller">Add to bestseller</label>
      </div>

      <CustomizationForm 
        isCustomizable={isCustomizable}
        setIsCustomizable={setIsCustomizable}
        customizationFields={customizationFields}
        setCustomizationFields={setCustomizationFields}
      />

      <div className="flex gap-4 mt-4">
        <button type='submit' className='px-8 py-3 bg-black text-white'>
          UPDATE
        </button>
        <button type='button' onClick={() => navigate('/list')} className='px-8 py-3 bg-gray-300 text-black'>
          CANCEL
        </button>
      </div>
    </form>
  )
}

export default Edit
