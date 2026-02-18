import React from 'react'
import { assets } from '../assets/assets'

const ImageUpload = ({ image1, setImage1, image2, setImage2, image3, setImage3, image4, setImage4 }) => {
  return (
    <div>
      <p className='mb-2'>Upload Image</p>

      <div className='flex gap-2 '>
        <label htmlFor="image1">
          <img className='w-20 ' src={!image1 ? assets.upload_area : URL.createObjectURL(image1)} alt="" />
          <input onChange={(e) => setImage1(e.target.files[0])} type="file" id='image1' hidden />
        </label>

        <label className='w-20' htmlFor="image2">
          <img src={!image2 ? assets.upload_area : URL.createObjectURL(image2)} alt="" />
          <input onChange={(e) => setImage2(e.target.files[0])} type="file" id='image2' hidden />
        </label>

        <label className='w-20' htmlFor="image3">
          <img src={!image3 ? assets.upload_area : URL.createObjectURL(image3)} alt="" />
          <input onChange={(e) => setImage3(e.target.files[0])} type="file" id='image3' hidden />
        </label>

        <label className='w-20' htmlFor="image4">
          <img src={!image4 ? assets.upload_area : URL.createObjectURL(image4)} alt="" />
          <input onChange={(e) => setImage4(e.target.files[0])} type="file" id='image4' hidden />
        </label>
      </div>
    </div>
  )
}

export default ImageUpload
