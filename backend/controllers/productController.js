import {v2 as cloudinary} from "cloudinary"
import productModel from "../models/productModel.js"

// function for add product 
const addProduct = async (req,res, next) => {
    try {
        const {name , description , price , category , subCategory , bestseller, isCustomizable, stock} = req.body
        
        let customizationFields = [];
        if(req.body.customizationFields){
            try{
                customizationFields = JSON.parse(req.body.customizationFields);
            } catch(e){
                // Invalid JSON, use empty array
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
            customizationFields,
            stock: stock ? Number(stock) : 0,
            sizes: [] // Always empty for corporate gifting
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

//function for update product
const updateProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const {name, description, price, category, subCategory, bestseller, isCustomizable, stock} = req.body;
        
        // Find existing product
        const existingProduct = await productModel.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({success: false, message: "Product not found"});
        }

        // Parse customization fields if present
        let customizationFields = [];
        if(req.body.customizationFields){
            try{
                customizationFields = JSON.parse(req.body.customizationFields);
            } catch(e){
                customizationFields = [];
            }
        }

        // Handle image updates
        let imagesUrl = [...existingProduct.image]; // Keep existing images by default
        
        if (req.files && Object.keys(req.files).length > 0) {
            const image1 = req.files.image1 && req.files.image1[0];
            const image2 = req.files.image2 && req.files.image2[0];
            const image3 = req.files.image3 && req.files.image3[0];
            const image4 = req.files.image4 && req.files.image4[0];

            const newImages = [image1, image2, image3, image4];
            
            // Upload new images and replace corresponding positions
            for (let i = 0; i < newImages.length; i++) {
                if (newImages[i]) {
                    const result = await cloudinary.uploader.upload(newImages[i].path, {resource_type: "image"});
                    imagesUrl[i] = result.secure_url;
                }
            }
        }



        // Prepare update data
        const updateData = {
            name: name || existingProduct.name,
            description: description || existingProduct.description,
            price: price ? Number(price) : existingProduct.price,
            category: category || existingProduct.category,
            subCategory: subCategory || existingProduct.subCategory,
            bestseller: bestseller !== undefined ? (bestseller === "true" || bestseller === true) : existingProduct.bestseller,
            image: imagesUrl,
            isCustomizable: isCustomizable !== undefined ? (isCustomizable === "true" || isCustomizable === true) : existingProduct.isCustomizable,
            customizationFields: customizationFields.length > 0 ? customizationFields : existingProduct.customizationFields,
            sizes: [], // Always empty for corporate gifting
            stock: stock ? Number(stock) : existingProduct.stock
        };

        const updatedProduct = await productModel.findByIdAndUpdate(productId, updateData, {new: true});
        
        res.json({success: true, message: "Product updated successfully", product: updatedProduct});

    } catch (error) {
        next(error);
    }
}

export {addProduct , listProduct , removeProduct , singleProduct, updateProduct}