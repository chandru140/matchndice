import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import Stripe from "stripe";
import Razorpay from "razorpay";

// Global variables
const currency = "inr";
const deliveryCharge = 50;

// Payment gateway instances
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * ✅ SECURITY: Recalculate order total SERVER-SIDE from DB prices.
 * NEVER trust the amount sent from the frontend — it can be manipulated
 * (e.g. user sends { amount: 1 } to get free orders).
 */
const calculateServerTotal = async (items, charge) => {
    let subtotal = 0;
    for (const item of items) {
        const product = await productModel.findById(item._id).lean();
        if (!product) {
            const err = new Error(`Product not found: ${item.name || item._id}`);
            err.status = 400;
            throw err;
        }
        subtotal += product.price * item.quantity;
    }
    return Math.round((subtotal + charge) * 100) / 100;
};

/**
 * Validates cart items and checks stock availability.
 */
const validateAndCheckStock = async (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
        const err = new Error("Cart is empty. Please add items before placing an order.");
        err.status = 400;
        throw err;
    }

    for (const item of items) {
        const product = await productModel.findById(item._id);
        if (!product) {
            const err = new Error(`Product "${item.name}" is no longer available.`);
            err.status = 400;
            throw err;
        }
        if (product.stock < item.quantity) {
            const err = new Error(
                `Insufficient stock for "${item.name}". Available: ${product.stock}, Requested: ${item.quantity}.`
            );
            err.status = 400;
            throw err;
        }
    }
};

/**
 * Deducts stock for all items in the order.
 * Called ONLY after the order is successfully saved.
 */
const deductStock = async (items) => {
    await Promise.all(
        items.map((item) =>
            productModel.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } })
        )
    );
};

// POST /api/order/place — Cash on Delivery
const placeOrder = async (req, res, next) => {
    try {
        const userId = req.userId || req.body.userId;
        const { items, address } = req.body;

        if (!address || !address.firstName || !address.phone) {
            return res.status(400).json({ success: false, message: "Delivery address is incomplete." });
        }

        // Validate stock BEFORE saving order
        await validateAndCheckStock(items);

        // ✅ SECURITY: Recalculate total server-side — never trust frontend amount
        const verifiedAmount = await calculateServerTotal(items, deliveryCharge);

        const order = new orderModel({
            userId,
            items,
            amount: verifiedAmount,
            address,
            paymentMethod: "COD",
            payment: false,
            date: Date.now(),
        });
        await order.save();

        // Deduct stock after order is saved
        await deductStock(items);

        // Clear user cart
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        res.status(201).json({ success: true, message: "Order placed successfully.", orderId: order._id });
    } catch (error) {
        next(error);
    }
};

// POST /api/order/stripe — Stripe checkout session
const placeOrderStripe = async (req, res, next) => {
    try {
        const userId = req.userId || req.body.userId;
        const { items, address } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty." });
        }

        await validateAndCheckStock(items);

        // ✅ SECURITY: Always recalculate total from DB prices
        const verifiedAmount = await calculateServerTotal(items, deliveryCharge);

        const frontendUrl =
            process.env.FRONTEND_URL ||
            req.headers.origin ||
            "http://localhost:5173";

        const order = new orderModel({
            userId,
            items,
            amount: verifiedAmount,
            address,
            paymentMethod: "Stripe",
            payment: false,
            date: Date.now(),
        });
        await order.save();

        const line_items = items.map((item) => ({
            price_data: {
                currency,
                product_data: { name: item.name },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        line_items.push({
            price_data: {
                currency,
                product_data: { name: "Delivery Charge" },
                unit_amount: deliveryCharge * 100,
            },
            quantity: 1,
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items,
            mode: "payment",
            success_url: `${frontendUrl}/verify?success=true&orderId=${order._id}`,
            cancel_url: `${frontendUrl}/verify?success=false&orderId=${order._id}`,
        });

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        next(error);
    }
};

// POST /api/order/verifyStripe — Verify Stripe payment callback
const verifyStripe = async (req, res, next) => {
    try {
        const { success, orderId } = req.body;
        const userId = req.userId || req.body.userId;

        const isSuccess = success === true || success === "true";

        if (isSuccess) {
            const order = await orderModel.findById(orderId);
            if (!order) {
                return res.status(404).json({ success: false, message: "Order not found." });
            }

            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            await deductStock(order.items);
            await userModel.findByIdAndUpdate(userId, { cartData: {} });

            res.json({ success: true, message: "Payment verified successfully." });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "Payment was cancelled." });
        }
    } catch (error) {
        next(error);
    }
};

// POST /api/order/razorpay — Create Razorpay order
const placeOrderRazorpay = async (req, res, next) => {
    try {
        const userId = req.userId || req.body.userId;
        const { items, address } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty." });
        }

        await validateAndCheckStock(items);

        // ✅ SECURITY: Recalculate total from DB prices
        const verifiedAmount = await calculateServerTotal(items, deliveryCharge);

        const order = new orderModel({
            userId,
            items,
            amount: verifiedAmount,
            address,
            paymentMethod: "Razorpay",
            payment: false,
            date: Date.now(),
        });
        await order.save();

        const options = {
            amount: Math.round(verifiedAmount * 100), // Razorpay expects paise
            currency: currency.toUpperCase(),
            receipt: order._id.toString(),
        };

        razorpayInstance.orders.create(options, (error, razorpayOrder) => {
            if (error) {
                console.error("Razorpay order creation failed:", error);
                return res.status(500).json({ success: false, message: "Payment gateway error. Please try again." });
            }
            res.json({ success: true, order: razorpayOrder });
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/order/verifyRazorpay — Verify Razorpay payment
const verifyRazorpay = async (req, res, next) => {
    try {
        const { razorpay_order_id } = req.body;
        const userId = req.userId || req.body.userId;

        if (!razorpay_order_id) {
            return res.status(400).json({ success: false, message: "Razorpay order ID is required." });
        }

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        if (orderInfo.status === "paid") {
            const order = await orderModel.findById(orderInfo.receipt);
            if (!order) {
                return res.status(404).json({ success: false, message: "Order not found." });
            }

            await orderModel.findByIdAndUpdate(orderInfo.receipt, { payment: true });
            await deductStock(order.items);
            await userModel.findByIdAndUpdate(userId, { cartData: {} });

            res.json({ success: true, message: "Payment verified successfully." });
        } else {
            res.json({ success: false, message: "Payment not completed." });
        }
    } catch (error) {
        next(error);
    }
};

// POST /api/order/list — Admin: get all orders
const allOrders = async (req, res, next) => {
    try {
        const orders = await orderModel.find({}).sort({ date: -1 }).lean();
        res.json({ success: true, orders });
    } catch (error) {
        next(error);
    }
};

// POST /api/order/userorders — User: get own orders
const userOrders = async (req, res, next) => {
    try {
        const userId = req.userId || req.body.userId;
        const orders = await orderModel.find({ userId }).sort({ date: -1 }).lean();
        res.json({ success: true, orders });
    } catch (error) {
        next(error);
    }
};

// POST /api/order/status — Admin: update order status
const updateStatus = async (req, res, next) => {
    try {
        const { orderId, status } = req.body;

        const validStatuses = ["Order Placed", "Packing", "Shipped", "Out for Delivery", "Delivered"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid order status." });
        }

        await orderModel.findByIdAndUpdate(orderId, { status });
        res.json({ success: true, message: "Order status updated." });
    } catch (error) {
        next(error);
    }
};

// POST /api/order/cancel — User: cancel own order
const cancelOrder = async (req, res, next) => {
    try {
        const userId = req.userId || req.body.userId;
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required." });
        }

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Security: ensure user owns this order
        if (order.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to cancel this order." });
        }

        const cancellableStatuses = ["Order Placed", "Packing"];
        if (!cancellableStatuses.includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order at status: "${order.status}". Please contact support.`,
            });
        }

        // Restore stock for each item
        await Promise.all(
            order.items.map((item) =>
                productModel.findByIdAndUpdate(item._id, { $inc: { stock: item.quantity } })
            )
        );

        await orderModel.findByIdAndUpdate(orderId, { status: "Cancelled" });

        res.json({ success: true, message: "Order cancelled and stock restored." });
    } catch (error) {
        next(error);
    }
};

export {
    placeOrder,
    placeOrderStripe,
    placeOrderRazorpay,
    allOrders,
    userOrders,
    updateStatus,
    verifyStripe,
    verifyRazorpay,
    cancelOrder,
};