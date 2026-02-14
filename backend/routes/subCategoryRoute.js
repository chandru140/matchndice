import express from "express";
import {addSubCategory, listSubCategory, listSubCategoryByCategory, removeSubCategory} from "../controllers/subCategoryController.js";
import adminAuth from "../middleware/adminAuth.js";

const subCategoryRouter = express.Router();

subCategoryRouter.post("/add", adminAuth, addSubCategory);
subCategoryRouter.get("/list", listSubCategory);
subCategoryRouter.get("/list/:categoryId", listSubCategoryByCategory);
subCategoryRouter.post("/remove", adminAuth, removeSubCategory);

export default subCategoryRouter;
