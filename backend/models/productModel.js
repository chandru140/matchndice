import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {type: String , required: true},
    description: {type: String , required: true},
    price: {type: Number , required: true},
    image: {type: Array , required: true},
    category: {type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true},
    subCategory: {type: mongoose.Schema.Types.ObjectId, ref: 'subCategory', required: true},
    bestseller : {type: Boolean , default: false},
    date : {type: Number , default: Date.now},
    isCustomizable: {type: Boolean, default: false}
})

const productModel = mongoose.models.product || mongoose.model("product" , productSchema)

export default productModel

