import express from "express";
import cors from "cors";
import 'dotenv/config.js';
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import subCategoryRouter from "./routes/subCategoryRoute.js";
import profileRouter from "./routes/profileRoute.js";
import errorHandler from "./middleware/errorMiddleware.js";

import cartRouter from "./routes/cartRoutes.js";
import orderRouter from "./routes/orderRoutes.js";

//App config
const app = express();
const port = process.env.PORT || 4000;
connectDB()
connectCloudinary()

//middlewares
app.use(express.json());
app.use(cors()); 
app.use(express.urlencoded({extended:true}))

//api endpoints 
app.use("/api/user" , userRouter)
app.use("/api/product" , productRouter)
app.use("/api/category", categoryRouter)
app.use("/api/subcategory", subCategoryRouter)
app.use("/api/profile", profileRouter)
app.use("/api/cart", cartRouter)
app.use("/api/order", orderRouter)

app.get('/' , (req,res) => {
    res.send("API is running...")
})

app.use(errorHandler);

app.listen(port , () => console.log(`server is running on port ${port}`))