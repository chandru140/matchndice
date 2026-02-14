import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    items: {
        type: Array,
        required: true
        // items structure:
        // [{
        //   _id: String (product ID),
        //   name: String,
        //   size: String,
        //   quantity: Number,
        //   price: Number (including customization price),
        //   customization: Object (optional, e.g., {color: "Black", text: "John"})
        // }]
    },
    amount: {
        type: Number,
        required: true
    },
    address: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: "Order Placed"
    },
    paymentMethod: {
        type: String,
        required: true
    },
    payment: {
        type: Boolean,
        default: false
    },
    date: {
        type: Number,
        default: Date.now()
    }
})

const orderModel = mongoose.models.Order || mongoose.model("Order", orderSchema)
export default orderModel