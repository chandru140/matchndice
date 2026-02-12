import express from "express";
import cors from "cors";
import 'dotenv/config.js';
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import profileRouter from "./routes/profileRoute.js";

//App config
const app = express();
const port = process.env.PORT || 4000;
connectDB()
connectCloudinary()

//middlewares
app.use(express.json());
app.use(cors()); 

//api endpoints 
app.use("/api/user" , userRouter)
app.use("/api/product" , productRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)
app.use("/api/profile", profileRouter)

app.get('/' , (req,res) => {
    res.send("API is running...")
})

app.listen(port , () => console.log(`server is running on port ${port}`))