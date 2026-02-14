import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema({
    name: {type: String, required: true},
    categoryId: {type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true},
    createdAt: {type: Date, default: Date.now}
})

const subCategoryModel = mongoose.models.subCategory || mongoose.model("subCategory", subCategorySchema)

export default subCategoryModel
