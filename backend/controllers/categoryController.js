import categoryModel from "../models/categoryModel.js"
import {v2 as cloudinary} from "cloudinary"

const addCategory = async (req, res) => {
    try {
        const {name} = req.body;
        const imageFile = req.file;

        if (!name || !imageFile) {
            return res.json({success: false, message: "Name and Image are required"});
        }

        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: "image"});

        const category = new categoryModel({
            name,
            image: imageUpload.secure_url
        })

        await category.save();
        res.json({success: true, message: "Category Added"});

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

const listCategory = async (req, res) => {
    try {
        const categories = await categoryModel.find({});
        res.json({success: true, categories});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

const removeCategory = async (req, res) => {
    try {
        const {id} = req.body;
        await categoryModel.findByIdAndDelete(id);
        res.json({success: true, message: "Category Removed"});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

export {addCategory, listCategory, removeCategory}
