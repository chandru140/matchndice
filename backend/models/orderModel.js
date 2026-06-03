import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        items: {
            type: Array,
            required: true,
            // Each item snapshot: { _id, name, size, quantity, price, image, customization? }
            // Snapshot data is intentional — preserves order history even if product is later edited/deleted
        },
        amount: {
            type: Number,
            required: true,
            min: [0, "Order amount cannot be negative"],
            // ✅ This is now ALWAYS calculated server-side (orderController.calculateServerTotal)
            // Frontend-submitted amounts are IGNORED
        },
        address: {
            type: Object,
            required: true,
        },
        status: {
            type: String,
            required: true,
            default: "Order Placed",
            // ✅ Fixed: removed duplicate "Out for delivery" (lowercase d) — single canonical value
            enum: ["Order Placed", "Packing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ["COD", "Stripe", "Razorpay"],
        },
        payment: {
            type: Boolean,
            default: false,
        },
        // ✅ Tracks whether the user has submitted a review for this order
        // Used by the review eligibility system to prevent double reviews
        isReviewed: {
            type: Boolean,
            default: false,
        },
        date: {
            type: Number,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
orderSchema.index({ userId: 1, date: -1 });    // User order history
orderSchema.index({ status: 1, date: -1 });    // Admin order management
orderSchema.index({ date: -1 });               // Global order list

const orderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default orderModel;