import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {type: String , required: true},
    description: {type: String , required: true},
    price: {type: Number , required: true},
    image: {type: Array , required: true},
    category: {type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true},
    subCategory: {type: mongoose.Schema.Types.ObjectId, ref: 'subCategory', required: true},
    sizes: {type: Array, default: []},
    bestseller : {type: Boolean , default: false},
    date : {type: Number , default: Date.now},
    isCustomizable: {type: Boolean, default: false},
    customizationFields: [{
        name: String,
        label: String,
        type: {type: String, enum: ['text', 'textarea', 'dropdown', 'radio', 'number']},
        options: [String],
        maxLength: Number,
        min: Number,
        max: Number,
        priceModifier: {type: Number, default: 0}
    }],
    stock: {type: Number, default: 0},
    lowStockThreshold: {type: Number, default: 5}
})

// Indexes for performance
productSchema.index({ category: 1, subCategory: 1 }); // Compound index for filtering
productSchema.index({ bestseller: -1, date: -1 }); // For homepage featured products
productSchema.index({ price: 1 }); // For price sorting

const productModel = mongoose.models.product || mongoose.model("product" , productSchema)

export default productModel

