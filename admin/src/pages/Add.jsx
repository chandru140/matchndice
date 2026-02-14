import React from 'react'
import { assets } from '../assets/assets'
import { useEffect , useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

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
  const [sizes , setSizes] = useState([])
  
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

  const addCustomizationField = () => {
    setCustomizationFields([...customizationFields, {
      name: '',
      label: '',
      type: 'text',
      options: [],
      priceModifier: 0,
      maxLength: 50
    }])
  }

  const removeCustomizationField = (index) => {
    const newFields = customizationFields.filter((_, i) => i !== index)
    setCustomizationFields(newFields)
  }

  const updateCustomizationField = (index, field, value) => {
    const newFields = [...customizationFields]
    newFields[index][field] = value
    setCustomizationFields(newFields)
  }

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
    formData.append('sizes' , JSON.stringify(sizes))
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
        setSizes([])
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
      <div>
        <p className='mb-2'>Upload Image</p>

        <div className='flex gap-2 '>
          <label htmlFor="image1">
            <img className='w-20 ' src={!image1 ? assets.upload_area : URL.createObjectURL(image1)} alt="" />
            <input onChange={(e)=>setImage1(e.target.files[0])} type="file" id='image1' hidden/>
          </label>

          <label  className='w-20' htmlFor="image2">
            <img src={!image2 ? assets.upload_area : URL.createObjectURL(image2)} alt="" />
            <input onChange={(e)=>setImage2(e.target.files[0])} type="file" id='image2' hidden/>
          </label>

          <label className='w-20' htmlFor="image3">
            <img src={!image3 ? assets.upload_area : URL.createObjectURL(image3)} alt="" />
            <input onChange={(e)=>setImage3(e.target.files[0])} type="file" id='image3' hidden/>
          </label>

          <label className='w-20' htmlFor="image4">
            <img src={!image4 ? assets.upload_area : URL.createObjectURL(image4)} alt="" />
            <input onChange={(e)=>setImage4(e.target.files[0])} type="file" id='image4' hidden/>
          </label>
        </div>
      </div>

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

    <div>
      <p className='mb-2' >Product Sizes</p>
      <div className='flex gap-3'>
        <div onClick={() => setSizes(prev => prev.includes("S") ? prev.filter( item => item !== "S") : [...prev , 'S'] ) }>
          <p className={`${sizes.includes("S") ? "bg-pink-100" : "bg-slate-200"} px-3 py-1 cursor-pointer` }>S</p>
        </div>
        <div >
          <p onClick={() => setSizes(prev => prev.includes('M') ? prev.filter( item => item !== "M") : [...prev , 'M'] ) } 
          className={`${sizes.includes("M") ? "bg-pink-100" : "bg-slate-200"} px-3 py-1 cursor-pointer` }>M</p>
        </div>
        <div>
          <p onClick={() => setSizes(prev => prev.includes('L') ? prev.filter( item => item !== "L") : [...prev , 'L'] ) } 
          className={`${sizes.includes("L") ? "bg-pink-100" : "bg-slate-200"} px-3 py-1 cursor-pointer` }>L</p>
        </div>
        <div>
          <p onClick={() => setSizes(prev => prev.includes('XL') ? prev.filter( item => item !== "XL") : [...prev , 'XL'] ) } 
          className={`${sizes.includes("XL") ? "bg-pink-100" : "bg-slate-200"} px-3 py-1 cursor-pointer` }>XL</p>
        </div>
        <div>
          <p onClick={() => setSizes(prev => prev.includes('XXL') ? prev.filter( item => item !== "XXL") : [...prev , 'XXL'] ) } 
          className={`${sizes.includes("XXL") ? "bg-pink-100" : "bg-slate-200"} px-3 py-1 cursor-pointer` }>XXL</p>
        </div>
      </div>
    </div>

    <div className='flex gap-2 mt-2 '>
      <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id='bestseller'/>
      <label className='cursor-pointer ' htmlFor="bestseller">Add to bestseller</label>
    </div>

    {/* Customization Section */}
    <div className='w-full border-t pt-4 mt-4'>
      <div className='flex gap-2 items-center mb-3'>
        <input 
          onChange={() => setIsCustomizable(prev => !prev)} 
          checked={isCustomizable} 
          type="checkbox" 
          id='isCustomizable'
        />
        <label className='cursor-pointer font-medium' htmlFor="isCustomizable">
          Make this product customizable
        </label>
      </div>

      {isCustomizable && (
        <div className='bg-gray-50 p-4 rounded-md'>
          <p className='font-medium mb-3'>Customization Options</p>
          
          {customizationFields.map((field, index) => (
            <div key={index} className='border bg-white p-3 mb-3 rounded'>
              <div className='flex justify-between items-center mb-2'>
                <p className='font-medium text-sm'>Field #{index + 1}</p>
                <button 
                  type="button"
                  onClick={() => removeCustomizationField(index)}
                  className='text-red-500 text-sm'
                >
                  Remove
                </button>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                <div>
                  <label className='text-xs text-gray-600'>Field Name (identifier)</label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateCustomizationField(index, 'name', e.target.value)}
                    placeholder="e.g., color, text"
                    className='w-full px-2 py-1 border rounded text-sm'
                  />
                </div>

                <div>
                  <label className='text-xs text-gray-600'>Label (display name)</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateCustomizationField(index, 'label', e.target.value)}
                    placeholder="e.g., Choose Color"
                    className='w-full px-2 py-1 border rounded text-sm'
                  />
                </div>

                <div>
                  <label className='text-xs text-gray-600'>Input Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateCustomizationField(index, 'type', e.target.value)}
                    className='w-full px-2 py-1 border rounded text-sm'
                  >
                    <option value="text">Text</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="textarea">Textarea</option>
                    <option value="radio">Radio</option>
                    <option value="number">Number</option>
                  </select>
                </div>

                <div>
                  <label className='text-xs text-gray-600'>Price Modifier (₹)</label>
                  <input
                    type="number"
                    value={field.priceModifier}
                    onChange={(e) => updateCustomizationField(index, 'priceModifier', Number(e.target.value))}
                    placeholder="0"
                    className='w-full px-2 py-1 border rounded text-sm'
                  />
                </div>

                {(field.type === 'dropdown' || field.type === 'radio') && (
                  <div className='col-span-2'>
                    <label className='text-xs text-gray-600'>Options (comma separated)</label>
                    <input
                      type="text"
                      value={field.options.join(', ')}
                      onChange={(e) => updateCustomizationField(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="Black, White, Red"
                      className='w-full px-2 py-1 border rounded text-sm'
                    />
                  </div>
                )}

                {(field.type === 'text' || field.type === 'textarea') && (
                  <div>
                    <label className='text-xs text-gray-600'>Max Length</label>
                    <input
                      type="number"
                      value={field.maxLength}
                      onChange={(e) => updateCustomizationField(index, 'maxLength', Number(e.target.value))}
                      placeholder="50"
                      className='w-full px-2 py-1 border rounded text-sm'
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <button 
            type="button"
            onClick={addCustomizationField}
            className='bg-blue-500 text-white px-4 py-2 text-sm rounded'
          >
            + Add Customization Field
          </button>
        </div>
      )}
    </div>

    <button type='submit' className='w-28 py-3 mt-4 bg-black text-white '>
      ADD
    </button>

    </form>
  )
}

export default Add