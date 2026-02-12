import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import axios from 'axios'
import { toast } from 'react-toastify'

const Profile = () => {
  const { backendUrl, token, navigate } = useContext(ShopContext)
  const [userData, setUserData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      if (!token) {
        navigate('/login')
        return
      }
      
      const response = await axios.post(backendUrl + '/api/profile/get', {}, { headers: { token } })
      
      if (response.data.success) {
        setUserData(response.data.user)
        setFormData(prev => ({ ...prev, name: response.data.user.name }))
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [token])

  const onChangeHandler = (event) => {
    const { name, value } = event.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      name: userData?.name || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.currentPassword) {
      toast.error('Current password is required')
      return
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    try {
      const updateData = {
        name: formData.name,
        currentPassword: formData.currentPassword
      }

      if (formData.newPassword) {
        updateData.newPassword = formData.newPassword
      }

      const response = await axios.post(backendUrl + '/api/profile/update', updateData, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        setIsEditing(false)
        fetchUserProfile()
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  if (!userData) {
    return (
      <div className='border-t pt-16 min-h-[50vh] flex items-center justify-center'>
        <p className='text-gray-500'>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className='border-t pt-16'>
      <div className='text-2xl mb-8'>
        <Title text1={'MY'} text2={'PROFILE'} />
      </div>

      <div className='max-w-2xl mx-auto'>
        {!isEditing ? (
          // View Mode
          <div className='bg-white border rounded-lg p-6 shadow-sm'>
            <div className='space-y-4'>
              <div>
                <p className='text-sm text-gray-500 mb-1'>Full Name</p>
                <p className='text-base font-medium text-gray-800'>{userData.name}</p>
              </div>

              <div className='border-t pt-4'>
                <p className='text-sm text-gray-500 mb-1'>Email Address</p>
                <p className='text-base font-medium text-gray-800'>{userData.email}</p>
              </div>

              <div className='border-t pt-4'>
                <button
                  onClick={() => setIsEditing(true)}
                  className='bg-black text-white px-8 py-2.5 text-sm rounded hover:bg-gray-800 transition-colors'
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className='bg-white border rounded-lg p-6 shadow-sm'>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Full Name
                </label>
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={onChangeHandler}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-black'
                  required
                />
              </div>

              <div>
                <label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Email Address
                </label>
                <input
                  type='email'
                  value={userData.email}
                  className='w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed'
                  disabled
                />
                <p className='text-xs text-gray-500 mt-1'>Email cannot be changed</p>
              </div>

              <div className='border-t pt-4'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3'>Change Password (Optional)</h3>

                <div className='space-y-3'>
                  <div>
                    <label className='text-sm font-medium text-gray-700 mb-2 block'>
                      Current Password *
                    </label>
                    <input
                      type='password'
                      name='currentPassword'
                      value={formData.currentPassword}
                      onChange={onChangeHandler}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-black'
                      required
                      placeholder='Enter current password'
                    />
                  </div>

                  <div>
                    <label className='text-sm font-medium text-gray-700 mb-2 block'>
                      New Password
                    </label>
                    <input
                      type='password'
                      name='newPassword'
                      value={formData.newPassword}
                      onChange={onChangeHandler}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-black'
                      placeholder='Leave blank to keep current password'
                    />
                  </div>

                  <div>
                    <label className='text-sm font-medium text-gray-700 mb-2 block'>
                      Confirm New Password
                    </label>
                    <input
                      type='password'
                      name='confirmPassword'
                      value={formData.confirmPassword}
                      onChange={onChangeHandler}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-black'
                      placeholder='Confirm new password'
                    />
                  </div>
                </div>
              </div>

              <div className='flex gap-3 pt-4'>
                <button
                  type='submit'
                  className='bg-black text-white px-8 py-2.5 text-sm rounded hover:bg-gray-800 transition-colors'
                >
                  Save Changes
                </button>
                <button
                  type='button'
                  onClick={handleCancel}
                  className='border border-gray-300 text-gray-700 px-8 py-2.5 text-sm rounded hover:bg-gray-50 transition-colors'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recent Orders Section */}
        <div className='mt-8 bg-gray-50 border rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-800 mb-3'>Quick Links</h3>
          <div className='space-y-2'>
            <button
              onClick={() => navigate('/orders')}
              className='w-full text-left px-4 py-3 bg-white border rounded-md hover:bg-gray-50 transition-colors'
            >
              <span className='text-sm font-medium text-gray-800'>My Orders</span>
              <p className='text-xs text-gray-500 mt-1'>View your order history</p>
            </button>
            <button
              onClick={() => navigate('/cart')}
              className='w-full text-left px-4 py-3 bg-white border rounded-md hover:bg-gray-50 transition-colors'
            >
              <span className='text-sm font-medium text-gray-800'>Shopping Cart</span>
              <p className='text-xs text-gray-500 mt-1'>View items in your cart</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
