import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export const ShopContext = createContext();

// Axios instance with 401 auto-logout interceptor
const createAxiosInstance = (backendUrl) => {
    const instance = axios.create({ baseURL: backendUrl });
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                window.dispatchEvent(new Event("auth:logout"));
            }
            return Promise.reject(error);
        }
    );
    return instance;
};

const ShopContextProvider = (props) => {
    const currency = "₹";
    const delivery_fee = 50;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

    const [search, setSearch] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [token, setToken] = useState(() => {
        const stored = localStorage.getItem("token")
        if (!stored) return ""
        try {
            // Validate expiry before using the stored token
            // This prevents expired tokens from triggering 401 loops on page load
            const payload = JSON.parse(atob(stored.split('.')[1]))
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                localStorage.removeItem("token")
                return ""
            }
            return stored
        } catch {
            localStorage.removeItem("token")
            return ""
        }
    })

    const navigate = useNavigate();
    const api = createAxiosInstance(backendUrl);
    const authHeaders = (userToken) => ({ headers: { token: userToken || token } });

    // Auto-logout listener
    useEffect(() => {
        const handleLogout = () => { setToken(""); setCartItems({}); localStorage.removeItem("token"); };
        window.addEventListener("auth:logout", handleLogout);
        return () => window.removeEventListener("auth:logout", handleLogout);
    }, []);

    // ─── Logout ─────────────────────────────────────────────────────────────
    const logout = async () => {
        try {
            // Notify backend (clears any server-side session flags / httpOnly cookies)
            await api.post("/api/user/logout", {}, authHeaders()).catch(() => {});
        } finally {
            // Always clear client-side state, even if backend call fails
            setToken("");
            setCartItems({});
            localStorage.removeItem("token");
        }
    };


    // ─── Product Data ────────────────────────────────────────────
    const getProductsData = async () => {
        try {
            const response = await api.get("/api/product/list");
            if (response.data.success) {
                const sorted = response.data.products.sort(
                    (a, b) =>
                        (b.bestseller === true) - (a.bestseller === true) ||
                        new Date(b.date) - new Date(a.date)
                );
                setProducts(sorted);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
            toast.error("Failed to load products. Please refresh.");
        }
    };

    const getCategoriesData = async () => {
        try {
            const [catRes, subCatRes] = await Promise.all([
                api.get("/api/category/list"),
                api.get("/api/subcategory/list"),
            ]);
            if (catRes.data.success) setCategories(catRes.data.categories);
            if (subCatRes.data.success) setSubCategories(subCatRes.data.subCategories);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    // ─── Cart Amount ─────────────────────────────────────────────
    const getCartAmount = () => {
        let total = 0;
        for (const itemId in cartItems) {
            const product = products.find((p) => p._id === itemId);
            if (!product) continue;
            for (const cartKey in cartItems[itemId]) {
                const entry = cartItems[itemId][cartKey];
                if (typeof entry === "number" && entry > 0) {
                    total += product.price * entry;
                } else if (typeof entry === "object" && entry.quantity > 0) {
                    let price = product.price;
                    if (product.isCustomizable && entry.customization && product.customizationFields) {
                        price += product.customizationFields
                            .filter((f) => entry.customization[f.name])
                            .reduce((sum, f) => sum + (f.priceModifier || 0), 0);
                    }
                    total += price * entry.quantity;
                }
            }
        }
        return total;
    };

    // ─── Cart Count (capped at 99) ────────────────────────────────
    const getCartCount = () => {
        let count = 0;
        for (const itemId in cartItems) {
            for (const cartKey in cartItems[itemId]) {
                const entry = cartItems[itemId][cartKey];
                count += typeof entry === "number" ? entry : (entry.quantity || 0);
            }
        }
        return Math.min(count, 99);
    };

    // ─── Add to Cart ─────────────────────────────────────────────
    /**
     * Adds an item to cart. If the same itemId+cartKey exists, increments quantity.
     * cartKey = size + optional customization hash (unique per variant).
     * @param {string} itemId - product._id
     * @param {string|null} size - selected size / "default"
     * @param {object} customization - customization fields map
     * @returns {boolean} - true if added successfully
     */
    const addToCart = async (itemId, size = null, customization = {}) => {
        if (!itemId) return false;

        // Build cart key
        let cartKey = size || "default";
        if (customization && Object.keys(customization).length > 0) {
            const hash = JSON.stringify(customization)
                .split("")
                .reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)
                .toString(36);
            cartKey = `${cartKey}_${hash}`;
        }

        const prevCart = structuredClone(cartItems);
        let cartData = structuredClone(cartItems);

        // Build new entry
        const hasCustomization = customization && Object.keys(customization).length > 0;
        const newEntry = hasCustomization
            ? { quantity: 1, size, customization }
            : 1;

        if (!cartData[itemId]) cartData[itemId] = {};

        if (cartData[itemId][cartKey] !== undefined) {
            // Increment existing
            if (typeof cartData[itemId][cartKey] === "number") {
                cartData[itemId][cartKey] = Math.min(cartData[itemId][cartKey] + 1, 99);
            } else {
                cartData[itemId][cartKey].quantity = Math.min(cartData[itemId][cartKey].quantity + 1, 99);
            }
        } else {
            cartData[itemId][cartKey] = newEntry;
        }

        setCartItems(cartData);

        if (token) {
            try {
                const response = await api.post(
                    "/api/cart/add",
                    { itemId, size, customization },
                    authHeaders()
                );
                if (!response.data.success) {
                    setCartItems(prevCart);
                    toast.error(response.data.message || "Failed to add item to cart.");
                    return false;
                }
            } catch (error) {
                setCartItems(prevCart);
                toast.error("Failed to add to cart. Please try again.");
                return false;
            }
        }

        return true;
    };

    // ─── Update / Remove Cart Item ────────────────────────────────
    const updateQuantity = async (itemId, cartKey, quantity) => {
        const prevCart = structuredClone(cartItems);
        let cartData = structuredClone(cartItems);

        if (quantity === 0) {
            if (cartData[itemId]) {
                delete cartData[itemId][cartKey];
                if (Object.keys(cartData[itemId]).length === 0) delete cartData[itemId];
            }
        } else if (cartData[itemId] && cartData[itemId][cartKey] !== undefined) {
            const capped = Math.min(quantity, 99);
            if (typeof cartData[itemId][cartKey] === "number") {
                cartData[itemId][cartKey] = capped;
            } else {
                cartData[itemId][cartKey].quantity = capped;
            }
        }

        setCartItems(cartData);

        if (token) {
            try {
                await api.put("/api/cart/update", { itemId, cartKey, quantity }, authHeaders());
            } catch (error) {
                setCartItems(prevCart);
                toast.error("Failed to update cart. Please try again.");
            }
        }
    };

    // ─── Load Cart from Backend ───────────────────────────────────
    const loadUserCart = async (userToken) => {
        try {
            const response = await api.post("/api/cart/get", {}, authHeaders(userToken));
            if (response.data.success) {
                setCartItems(response.data.cartData || {});
            }
        } catch (error) {
            console.error("Failed to load cart:", error);
        }
    };

    // ─── Init ─────────────────────────────────────────────────────
    useEffect(() => {
        getProductsData();
        getCategoriesData();
    }, []);

    useEffect(() => {
        if (token) {
            loadUserCart(token);
        } else {
            setCartItems({});
        }
    }, [token]);

    const value = {
        products,
        currency,
        search,
        setSearch,
        showSearch,
        setShowSearch,
        navigate,
        backendUrl,
        categories,
        subCategories,
        token,
        setToken,
        logout,             // ✅ Proper logout: clears token + cart + calls backend
        cartItems,
        setCartItems,
        getCartAmount,
        getCartCount,
        addToCart,
        updateQuantity,
        delivery_fee,
    };


    return <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>;
};

export default ShopContextProvider;