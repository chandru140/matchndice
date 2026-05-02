import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {

    const currency = '₹';
    const delivery_fee = 50;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
    const [search , setSearch] = useState('');
    const [showSearch , setShowSearch] = useState(false);
    const [products , setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [token, setToken] = useState(localStorage.getItem('token') || '');
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

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const itemId in cartItems) {
            const product = products.find(p => p._id === itemId);
            if (!product) continue;
            for (const cartKey in cartItems[itemId]) {
                const cartEntry = cartItems[itemId][cartKey];
                if (typeof cartEntry === 'number' && cartEntry > 0) {
                    totalAmount += product.price * cartEntry;
                } else if (typeof cartEntry === 'object' && cartEntry.quantity > 0) {
                    // Add base price + customization price modifiers
                    let itemPrice = product.price;
                    if (product.isCustomizable && cartEntry.customization && product.customizationFields) {
                        const customizationPrice = product.customizationFields
                            .filter(field => cartEntry.customization[field.name])
                            .reduce((sum, field) => sum + (field.priceModifier || 0), 0);
                        itemPrice += customizationPrice;
                    }
                    totalAmount += itemPrice * cartEntry.quantity;
                }
            }
        }
        return totalAmount;
    };

    const updateQuantity = async (itemId, cartKey, quantity) => {
        let cartData = structuredClone(cartItems);
        if (quantity === 0) {
            // Remove the item
            if (cartData[itemId]) {
                delete cartData[itemId][cartKey];
                if (Object.keys(cartData[itemId]).length === 0) {
                    delete cartData[itemId];
                }
            }
        } else {
            if (cartData[itemId] && cartData[itemId][cartKey] !== undefined) {
                if (typeof cartData[itemId][cartKey] === 'number') {
                    cartData[itemId][cartKey] = quantity;
                } else {
                    cartData[itemId][cartKey].quantity = quantity;
                }
            }
        }
        setCartItems(cartData);

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/update', { itemId, cartKey, quantity }, { headers: { token } });
            } catch (error) {
                console.log(error);
                toast.error(error.message);
            }
        }
    };

    const loadUserCart = async (userToken) => {
        try {
            const response = await axios.post(backendUrl + '/api/cart/get', {}, { headers: { token: userToken } });
            if (response.data.success) {
                setCartItems(response.data.cartData);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    useEffect(() => {
        getProductsData()
        getCategoriesData()
    },[])

    useEffect(() => {
        if (token) {
            loadUserCart(token);
        }
    }, [token]);

    const value = {
        products , currency , search , setSearch , showSearch , setShowSearch ,
        navigate , backendUrl, categories, subCategories,
        token, setToken,
        cartItems, setCartItems,
        getCartAmount, updateQuantity,
        delivery_fee
    }

    return(
             <ShopContext.Provider value={value}>
                    {props.children}
             </ShopContext.Provider>
    )
}

export default ShopContextProvider;