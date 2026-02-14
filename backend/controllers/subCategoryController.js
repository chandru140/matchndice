import subCategoryModel from "../models/subCategoryModel.js"

const addSubCategory = async (req, res) => {
    try {
        const {name, categoryId} = req.body;

        if (!name || !categoryId) {
            return res.json({success: false, message: "Name and Category ID are required"});
        }

        const subCategory = new subCategoryModel({
            name,
            categoryId
        })

        await subCategory.save();
        res.json({success: true, message: "SubCategory Added"});

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

const listSubCategory = async (req, res) => {
    try {
        const subCategories = await subCategoryModel.find({}).populate('categoryId', 'name');
        res.json({success: true, subCategories});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

const listSubCategoryByCategory = async (req, res) => {
    try {
        const {categoryId} = req.params;
        const subCategories = await subCategoryModel.find({categoryId});
        res.json({success: true, subCategories});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

const removeSubCategory = async (req, res) => {
    try {
        const {id} = req.body;
        await subCategoryModel.findByIdAndDelete(id);
        res.json({success: true, message: "SubCategory Removed"});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

export {addSubCategory, listSubCategory, listSubCategoryByCategory, removeSubCategory}
