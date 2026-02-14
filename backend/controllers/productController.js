import {v2 as cloudinary} from "cloudinary"
import productModel from "../models/productModel.js"

// function for add product 
const addProduct = async (req,res, next) => {
    try {
        const {name , description , price , category , subCategory , bestseller, isCustomizable} = req.body
        
        let customizationFields = [];
        if(req.body.customizationFields){
            try{
                customizationFields = JSON.parse(req.body.customizationFields);
            } catch(e){
                console.log("Error parsing customizationFields:", e);
                customizationFields = [];
            }
        }

        const image1  = req.files.image1 && req.files.image1[0];
        const image2  = req.files.image2 && req.files.image2[0];
        const image3  = req.files.image3 && req.files.image3[0];
        const image4  = req.files.image4 && req.files.image4[0];

        const images = [image1 , image2 , image3 , image4].filter((item)=> item !== undefined)

        let imagesUrl = await Promise.all(
            images.map(async (image) => {
                const result = await cloudinary.uploader.upload(image.path , {resource_type : "image"})
                return result.secure_url
            }))

        const productData = {
            name, 
            description, 
            price: Number(price), 
            category, 
            subCategory, 
            bestseller: bestseller === "true" ? true : false, 
            image: imagesUrl, 
            date: Date.now(),
            isCustomizable: isCustomizable === "true" ? true : false,
            customizationFields
        }

        const product = new productModel(productData);
        await product.save();

        res.json({success:true , message:"Product added successfully"})
        
    } catch (error) {
        next(error);   
    }
}

//fuction for list Product
const listProduct = async (req,res, next) => {
    try {
        
        const products = await productModel.find()
            .populate('category', 'name')
            .populate('subCategory', 'name');
        res.json({success:true , message:"Product listed successfully" , products})

    } catch (error) {
        next(error);
    }
}

//function for remove product 
const removeProduct = async (req,res, next) => {
    try {
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true , message:"Product removed successfully"})

    } catch (error) {
        next(error);
    }
}

//function for single product 
const singleProduct = async (req,res, next) => {
    try {

        const productId = req.params.id
        const product = await productModel.findById(productId)
            .populate('category', 'name')
            .populate('subCategory', 'name');
        res.json({success:true , message:"Product fetched successfully" , product})

    } catch (error) {
        next(error);
    }
}

export {addProduct , listProduct , removeProduct , singleProduct}