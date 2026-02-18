import React , {useState} from 'react'
import Navbar from './components/Navbar'
import SideBar from './components/SideBar.jsx'
import {Routes , Route, Navigate } from 'react-router-dom'
import Add from './pages/Add.jsx'
import List from './pages/List.jsx'
import AddCategory from './pages/AddCategory.jsx'
import ListCategory from './pages/ListCategory.jsx'
import AddSubCategory from './pages/AddSubCategory.jsx'
import ListSubCategory from './pages/ListSubCategory.jsx'
import Edit from './pages/Edit.jsx'
import Login from './components/Login.jsx'
import {ToastContainer} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from 'react'

export const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
export const currency = '₹'

const App = () => {

  const [token , setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):'');
  
  useEffect(() => {
    localStorage.setItem('token' , token)
  },[token])

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer/>
      {token === ''
      ? <Login setToken={setToken}/> 
      : <>
         <Navbar setToken={setToken}/>
         <hr />
          <div className='flex w-full'>
            <SideBar/>
            <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
              <Routes>
                <Route path='/' element={<Navigate to="/list" replace />}/>
                <Route path='/add' element={<Add token={token}/>}/>
                <Route path='/list' element={<List token={token}/>}/>
                <Route path='/edit/:id' element={<Edit token={token}/>}/>
                <Route path='/add-category' element={<AddCategory token={token}/>}/>
                <Route path='/list-category' element={<ListCategory token={token}/>}/>
                <Route path='/add-subcategory' element={<AddSubCategory token={token}/>}/>
                <Route path='/list-subcategory' element={<ListSubCategory token={token}/>}/>
              </Routes>
            </div>
          </div>
      </>
      }
    
    </div>
  )
}

export default App