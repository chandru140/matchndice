import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name:        { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price:       { type: Number, required: true, min: [0, "Price cannot be negative"] },
    image:       { type: Array, required: true },
    category:    { type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'subCategory', required: true },
    sizes:       { type: Array, default: [] },
    bestseller:  { type: Boolean, default: false },
    date:        { type: Number, default: Date.now },
    isCustomizable: { type: Boolean, default: false },
    customizationFields: [{
        name:          String,
        label:         String,
        type:          { type: String, enum: ['text', 'textarea', 'dropdown', 'radio', 'number'] },
        options:       [String],
        maxLength:     Number,
        min:           Number,
        max:           Number,
        required:      { type: Boolean, default: false },
        priceModifier: { type: Number, default: 0 },
    }],
    stock:             { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    avgRating:         { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:       { type: Number, default: 0, min: 0 },
    // ✅ Track sales for accurate best-seller ordering
    salesCount:        { type: Number, default: 0, min: 0 },
    // ✅ Soft-delete: never hard-delete products (breaks historical order references)
    isDeleted:         { type: Boolean, default: false },
}, { timestamps: true })

// ── Indexes ────────────────────────────────────────────────────────────────────
productSchema.index({ category: 1, subCategory: 1 })      // Filtering
productSchema.index({ bestseller: -1, date: -1 })         // Homepage featured
productSchema.index({ price: 1 })                         // Price sort
productSchema.index({ isDeleted: 1, bestseller: -1 })     // Active bestsellers
productSchema.index({ salesCount: -1 })                   // Best-seller by sales

const productModel = mongoose.models.product || mongoose.model("product", productSchema)

export default productModel
