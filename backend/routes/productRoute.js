import express from "express";
import upload from "../middleware/multer.js";
import { listProduct , addProduct , removeProduct , singleProduct, updateProduct } from "../controllers/productController.js";
import adminAuth from "../middleware/adminAuth.js";

import { check } from "express-validator";
import validateRequest from "../middleware/validateRequest.js";

const productRouter = express.Router();

productRouter.post("/add", adminAuth, upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }]), [
    check("name", "Product name is required").not().isEmpty(),
    check("price", "Price must be a number").isNumeric(),
    check("category", "Category is required").not().isEmpty(),
    check("subCategory", "SubCategory is required").not().isEmpty()
], validateRequest, addProduct)
productRouter.get("/list" , listProduct)
productRouter.get("/single/:id" , singleProduct)
productRouter.post("/remove/" , adminAuth , removeProduct)
productRouter.put("/update/:id", adminAuth, upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }]), updateProduct)

export default productRouter
