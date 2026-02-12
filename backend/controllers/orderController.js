import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import Razorpay from "razorpay";

//global variables 
const currency = 'inr'
const deliveryCharge = 50

//GATEWAY INTEGRATION
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

//placing orders using cod 
const placeOrder = async (req, res) => {
    try {
        console.log("Received order data:", req.body)
        const { userId, items, amount, address, paymentMethod } = req.body
        
        if (!amount) {
            return res.status(400).json({ success: false, message: "Amount is required" })
        }
        
        const order = new orderModel({
            userId,
            items,
            amount,
            address,
            paymentMethod,
            payment: paymentMethod === 'COD' ? false : true ,
            date: Date.now()

           
        })
        await order.save()
        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        res.status(200).json({ success: true, message: "Order Placed", order })
    } catch (error) {

        console.log(error)
        res.status(500).json({ success: false, message: error.message })

    }
}

//placing order using stripe method 
const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body
        const {origin} = req.headers

        const orderData = {
            userId,
            items,
            amount,
            address,
            paymentMethod: 'Stripe',
            payment: false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()
        
        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price * 100,
            },
            quantity: item.quantity,
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: 'Delivery Charge',
                },
                unit_amount: deliveryCharge * 100,
            },
            quantity: 1,
        })

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${origin}/verify?succes=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?succes=false&orderId=${newOrder._id}`,
        })

        res.json({ success: true, session_url:session.url })
       
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

//verify stripe 
const verifyStripe = async (req, res) => {
    try {
        const {success, orderId , userId} = req.query
        if(success === 'true'){
            await orderModel.findByIdAndUpdate(orderId, {payment: true})
            await userModel.findByIdAndUpdate(userId, {cartData: {}})
            res.json({success: true})
        }else{
            await orderModel.findByIdAndDelete(orderId)
            res.json({success: false})
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

//placing order using razorpay method 
const placeOrderRazorpay = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body
        const order = new orderModel({
            userId,
            items,
            amount,
            address,
            paymentMethod: 'Razorpay',
            payment: false
        })
        await order.save()

        const options = {
            amount : amount * 100,
            currency : currency.toUpperCase(),
            receipt : order._id.toString()
        }
        await razorpayInstance.orders.create(options , (error , order) => {
            if(error){
                console.log(error)
                return res.json({success:false , message:"Error"})
            }
            else{
                res.json({success:true , order})
            }
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

//verify Razorpay 
const verifyRazorpay = async (req,res) => {
    try {
        const {razorpay_order_id} = req.body
        
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
        if(orderInfo.status === 'paid'){
            await orderModel.findByIdAndUpdate(orderInfo.receipt, {payment: true});
            const order = await orderModel.findById(orderInfo.receipt)
            await userModel.findByIdAndUpdate(order.userId, {cartData: {}})
            res.json({success: true, message: "Payment Successful"})
        }
        else{
            res.json({success: false, message: 'Payment Failed'})
        }
        
    }catch(error){
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

//All order data for admin panel 
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({}).sort({ date: -1 })
        res.status(200).json({ success: true, orders })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

//user order data for frontend 
const userOrders = async (req, res) => {
    try {

        const { userId } = req.body
        const orders = await orderModel.find({ userId }).sort({ date: -1 })
        res.status(200).json({ success: true, orders })

    } catch (error) {

        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    
    }
}

// update order status from admin panel 
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body
        await orderModel.findByIdAndUpdate(orderId, { status })
        res.status(200).json({ success: true, message: "Status Updated" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

export { placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, verifyStripe, verifyRazorpay }