import userModel from "../models/userModel.js";

// POST /api/cart/add — Add item to cart
const addToCart = async (req, res, next) => {
    try {
        const userId = req.userId || req.body.userId;
        const { itemId, size, customization } = req.body;

        if (!itemId) {
            return res.status(400).json({ success: false, message: "Item ID is required." });
        }

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        let cartData = userData.cartData || {};

        // Generate unique key for this cart item (size + optional customization hash)
        let cartKey = size || "default";
        if (customization && Object.keys(customization).length > 0) {
            const customizationStr = JSON.stringify(customization);
            const hash = customizationStr.split("").reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0).toString(36);
            cartKey = `${cartKey}_${hash}`;
        }

        if (cartData[itemId]) {
            if (cartData[itemId][cartKey]) {
                if (typeof cartData[itemId][cartKey] === "number") {
                    cartData[itemId][cartKey] += 1;
                } else {
                    cartData[itemId][cartKey].quantity += 1;
                }
            } else {
                cartData[itemId][cartKey] =
                    customization && Object.keys(customization).length > 0
                        ? { quantity: 1, size, customization }
                        : 1;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][cartKey] =
                customization && Object.keys(customization).length > 0
                    ? { quantity: 1, size, customization }
                    : 1;
        }

        await userModel.findByIdAndUpdate(userId, { cartData });
        res.json({ success: true, message: "Item added to cart." });
    } catch (error) {
        next(error);
    }
};

// PUT /api/cart/update — Update item quantity in cart
const updateCart = async (req, res, next) => {
    try {
        const userId = req.userId || req.body.userId;
        const { itemId, cartKey, quantity } = req.body;

        if (!itemId || !cartKey) {
            return res.status(400).json({ success: false, message: "Item ID and cart key are required." });
        }

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        let cartData = userData.cartData || {};

        if (cartData[itemId] && cartData[itemId][cartKey] !== undefined) {
            if (quantity <= 0) {
                // Remove item from cart
                delete cartData[itemId][cartKey];
                if (Object.keys(cartData[itemId]).length === 0) {
                    delete cartData[itemId];
                }
            } else if (typeof cartData[itemId][cartKey] === "number") {
                cartData[itemId][cartKey] = quantity;
            } else {
                cartData[itemId][cartKey].quantity = quantity;
            }
        }

        await userModel.findByIdAndUpdate(userId, { cartData });
        res.json({ success: true, message: "Cart updated successfully." });
    } catch (error) {
        next(error);
    }
};

// POST /api/cart/get — Get user's cart data
// NOTE: Uses POST (not GET) so authUser middleware can inject userId via req.body
const getUserCart = async (req, res, next) => {
    try {
        const userId = req.userId || req.body.userId;

        const userData = await userModel.findById(userId).select("cartData");
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, cartData: userData.cartData || {} });
    } catch (error) {
        next(error);
    }
};

export { addToCart, getUserCart, updateCart };
