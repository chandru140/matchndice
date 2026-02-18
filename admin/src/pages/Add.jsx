import React from 'react'
import { assets } from '../assets/assets'
import { useEffect , useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import ImageUpload from '../components/ImageUpload'
import CustomizationForm from '../components/CustomizationForm'

const Add = ({token}) => {

  const [image1 , setImage1] = useState(false)
  const [image2 , setImage2] = useState(false)
  const [image3 , setImage3] = useState(false)
  const [image4 , setImage4] = useState(false)

  const [name , setName] = useState("")
  const [description , setDescription] = useState("")
  const [price , setPrice] = useState("")
  const [category , setCategory] = useState("")
  const [subCategory , setSubCategory] = useState("")
  const [bestseller , setBestseller] = useState(false)
  
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])

  const fetchCategories = async () => {
      try {
          const response = await axios.get(backendUrl + '/api/category/list')
          if (response.data.success) {
              setCategories(response.data.categories)
              if(response.data.categories.length > 0) {
                  setCategory(response.data.categories[0]._id)
              }
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
              if(response.data.subCategories.length > 0) {
                  setSubCategory(response.data.subCategories[0]._id)
              } else {
                  setSubCategory("")
              }
          }
      } catch (error) {
          toast.error(error.message)
      }
  }

  useEffect(() => {
      fetchCategories()
  }, [])

  useEffect(() => {
      if(category) {
          fetchSubCategories(category)
      }
  }, [category])
  
  // Customization states
  const [isCustomizable, setIsCustomizable] = useState(false)
  const [customizationFields, setCustomizationFields] = useState([])



  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    image1 && formData.append('image1' , image1)
    image2 && formData.append('image2' , image2)
    image3 && formData.append('image3' , image3)
    image4 && formData.append('image4' , image4)

    formData.append('name' , name)
    formData.append('description' , description)
    formData.append('price' , price)
    formData.append('category' , category)
    formData.append('subCategory' , subCategory)
    formData.append('bestseller' , bestseller)
    formData.append('isCustomizable', isCustomizable)
    formData.append('customizationFields', JSON.stringify(customizationFields))

    try{
      const response = await axios.post(backendUrl + '/api/product/add' , formData , {headers:{token}})
      console.log(response.data)
      if(response.data.success){
        toast.success(response.data.message)
        setName('')
        setDescription('')
        setPrice('')
        setImage1(false)
        setImage2(false)
        setImage3(false)
        setImage4(false)
        setIsCustomizable(false)
        setCustomizationFields([])
      }
      else{
        toast.error(response.data.message)
      }
    }catch(error){
      console.log(error);
      toast.error(error.message);
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
      <ImageUpload 
        image1={image1} setImage1={setImage1}
        image2={image2} setImage2={setImage2}
        image3={image3} setImage3={setImage3}
        image4={image4} setImage4={setImage4}
      />

      <div className='w-full'>
        <p className='mb-2'>Product Name</p>
        <input onChange={(e)=>setName(e.target.value)} value={name} className='w-full max-w-[500px] px-3 py-2 rounded-md' type="text" placeholder='Enter product name' required/>
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product Descriptions</p>
        <textarea onChange={(e)=>setDescription(e.target.value)} value={description} className='w-full max-w-[500px] px-3 py-2 rounded-md' type="text" placeholder='Write Content Here' />
      </div>

      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <div>
          <p className='mb-2'>Product Category</p>
          <select onChange={(e) => setCategory(e.target.value)} value={category} className='w-full px-3 py-2' >
            {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

         <div>
        <div>
          <p className='mb-2'>Sub Category</p>
          <select onChange={(e) => setSubCategory(e.target.value)} value={subCategory} className='w-full px-3 py-2'>
            {subCategories.map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className='mb-2'>Product Price</p>
        <input onChange={(e)=>setPrice(e.target.value)} value={price} className='w-full max-w-[500px] sm:w-[120px] px-3 py-2 rounded-md' type="number" placeholder='700' />
      </div>
   </div>



    <div className='flex gap-2 mt-2 '>
      <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id='bestseller'/>
      <label className='cursor-pointer ' htmlFor="bestseller">Add to bestseller</label>
    </div>

    {/* Customization Section */}
    <CustomizationForm 
      isCustomizable={isCustomizable}
      setIsCustomizable={setIsCustomizable}
      customizationFields={customizationFields}
      setCustomizationFields={setCustomizationFields}
    />

    <button type='submit' className='w-28 py-3 mt-4 bg-black text-white '>
      ADD
    </button>

    </form>
  )
}

export default Add