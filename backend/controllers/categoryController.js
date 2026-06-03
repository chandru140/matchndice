import categoryModel from "../models/categoryModel.js";
import { v2 as cloudinary } from "cloudinary";

// POST /api/category/add — Admin: add a new category
const addCategory = async (req, res, next) => {
    try {
        const { name } = req.body;
        const imageFile = req.file;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: "Category name is required." });
        }
        if (!imageFile) {
            return res.status(400).json({ success: false, message: "Category image is required." });
        }

        // Check for duplicate category name (case-insensitive)
        const existing = await categoryModel.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
        if (existing) {
            return res.status(409).json({ success: false, message: "A category with this name already exists." });
        }

        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });

        const category = new categoryModel({
            name: name.trim(),
            image: imageUpload.secure_url,
        });

        await category.save();
        res.status(201).json({ success: true, message: "Category added successfully." });
    } catch (error) {
        next(error);
    }
};

// GET /api/category/list — Public: list all categories
const listCategory = async (req, res, next) => {
    try {
        const categories = await categoryModel.find({}).sort({ name: 1 });
        res.json({ success: true, categories });
    } catch (error) {
        next(error);
    }
};

// POST /api/category/remove — Admin: remove a category by ID
const removeCategory = async (req, res, next) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: "Category ID is required." });
        }

        const category = await categoryModel.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }

        res.json({ success: true, message: "Category removed successfully." });
    } catch (error) {
        next(error);
    }
};

export { addCategory, listCategory, removeCategory };
