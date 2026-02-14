import userModel from "../models/userModel.js"


// add product to user cart 
const addToCart = async (req,res, next)=>{
    try {
        const {userId,itemId,size,customization} = req.body

        const userData = await userModel.findById(userId)
        let cartData = await userData.cartData

        // Generate unique key for this cart item
        let cartKey = size;
        if (customization && Object.keys(customization).length > 0) {
            const customizationStr = JSON.stringify(customization);
            const hash = customizationStr.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0).toString(36);
            cartKey = `${size}_${hash}`;
        }

        if(cartData[itemId]){
            if(cartData[itemId][cartKey]){
                // Handle both old format (number) and new format (object)
                if(typeof cartData[itemId][cartKey] === 'number'){
                    cartData[itemId][cartKey] += 1
                } else {
                    cartData[itemId][cartKey].quantity += 1
                }
            }else{
                cartData[itemId][cartKey] = customization && Object.keys(customization).length > 0 
                    ? { quantity: 1, size, customization } 
                    : 1
            } 
        }else{
            cartData[itemId] = {}
            cartData[itemId][cartKey] = customization && Object.keys(customization).length > 0 
                ? { quantity: 1, size, customization } 
                : 1
        }

        await userModel.findByIdAndUpdate(userId,{cartData})
        res.json({success:true,message:"Item added to cart"})

    } catch (error) {
        next(error);
    }
}

// update user cart 
const updateCart = async (req,res, next)=>{
    try {
        const {userId,itemId,cartKey,quantity} = req.body

        const userData = await userModel.findById(userId)
        let cartData = await userData.cartData

        // Handle both old format (number) and new format (object)
        if(cartData[itemId] && cartData[itemId][cartKey]){
            if(typeof cartData[itemId][cartKey] === 'number'){
                cartData[itemId][cartKey] = quantity
            } else {
                cartData[itemId][cartKey].quantity = quantity
            }
        }

        await userModel.findByIdAndUpdate(userId,{cartData})
        res.json({success:true,message:"Cart updated successfully"})

    } catch (error) {
        next(error);
    }
}

// get user cart data 
const getUserCart = async (req,res, next)=>{
    try {
        const {userId} = req.body

        const userData = await userModel.findById(userId)
        let cartData = await userData.cartData

        res.json({success:true,cartData })

    } catch (error) {
        next(error);
    }
}

export {addToCart,getUserCart,updateCart}
