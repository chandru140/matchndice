import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {

    const currency = '₹';
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
    const [search , setSearch] = useState('');
    const [showSearch , setShowSearch] = useState(false);
    const [products , setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const navigate = useNavigate();

    const getProductsData = async () => {
        try{
            const response = await axios.get(backendUrl + '/api/product/list')
            if(response.data.success){
                // Sort products: Featured first, then by date
                const sortedProducts = response.data.products.sort((a, b) => {
                    return (b.bestseller === true) - (a.bestseller === true) || new Date(b.date) - new Date(a.date);
                });
                setProducts(sortedProducts)
            }
        }catch(error){
            console.log(error)
            toast.error(error.message)
        }
    }

    const getCategoriesData = async () => {
        try{
            const response = await axios.get(backendUrl + '/api/category/list')
            if(response.data.success){
                setCategories(response.data.categories)
            }
            const subResponse = await axios.get(backendUrl + '/api/subcategory/list')
            if(subResponse.data.success){
                setSubCategories(subResponse.data.subCategories)
            }
        }catch(error){
            console.log(error)
            toast.error(error.message)
        }
    }

    useEffect(() => {
        getProductsData()
        getCategoriesData()
    },[])

    const value = {
        products , currency , search , setSearch , showSearch , setShowSearch ,
        navigate , backendUrl, categories, subCategories
    }

    return(
             <ShopContext.Provider value={value}>
                    {props.children}
             </ShopContext.Provider>
    )
}

export default ShopContextProvider;