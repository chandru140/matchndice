import express from "express";
import cors from "cors";
import helmet from "helmet";
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
app.use(helmet());

// CORS configuration - whitelist frontend domains
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : [
        'http://localhost:5173', 
        'http://localhost:5174',
        'https://matchndice.vercel.app',
        'https://matchndiceadmin.vercel.app'
      ];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Allow any vercel.app subdomain in production
        if (origin.endsWith('.vercel.app')) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

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