import subCategoryModel from "../models/subCategoryModel.js";

// POST /api/subcategory/add — Admin: add a new subcategory
const addSubCategory = async (req, res, next) => {
    try {
        const { name, categoryId } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: "Subcategory name is required." });
        }
        if (!categoryId) {
            return res.status(400).json({ success: false, message: "Parent category ID is required." });
        }

        // Check for duplicate subcategory under same category
        const existing = await subCategoryModel.findOne({
            categoryId,
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        });
        if (existing) {
            return res.status(409).json({ success: false, message: "A subcategory with this name already exists in this category." });
        }

        const subCategory = new subCategoryModel({ name: name.trim(), categoryId });
        await subCategory.save();
        res.status(201).json({ success: true, message: "Subcategory added successfully." });
    } catch (error) {
        next(error);
    }
};

// GET /api/subcategory/list — Public: list all subcategories with their parent category
const listSubCategory = async (req, res, next) => {
    try {
        const subCategories = await subCategoryModel.find({}).populate("categoryId", "name").sort({ name: 1 });
        res.json({ success: true, subCategories });
    } catch (error) {
        next(error);
    }
};

// GET /api/subcategory/by-category/:categoryId — Public: list subcategories by category
const listSubCategoryByCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const subCategories = await subCategoryModel.find({ categoryId }).sort({ name: 1 });
        res.json({ success: true, subCategories });
    } catch (error) {
        next(error);
    }
};

// POST /api/subcategory/remove — Admin: remove a subcategory by ID
const removeSubCategory = async (req, res, next) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: "Subcategory ID is required." });
        }

        const subCategory = await subCategoryModel.findByIdAndDelete(id);
        if (!subCategory) {
            return res.status(404).json({ success: false, message: "Subcategory not found." });
        }

        res.json({ success: true, message: "Subcategory removed successfully." });
    } catch (error) {
        next(error);
    }
};

export { addSubCategory, listSubCategory, listSubCategoryByCategory, removeSubCategory };
