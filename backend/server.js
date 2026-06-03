import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import "dotenv/config.js";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import subCategoryRouter from "./routes/subCategoryRoute.js";
import profileRouter from "./routes/profileRoute.js";
import cartRouter from "./routes/cartRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import errorHandler from "./middleware/errorMiddleware.js";
import notifyMeRouter from "./routes/notifyMeRoute.js";
import reviewRouter from "./routes/reviewRoutes.js";
import whatsAppRouter from "./routes/whatsAppRoute.js";

// ─── App Config ───────────────────────────────────────────────────────────────
const app = express();
const port = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Connect to DB and Cloudinary
connectDB();
connectCloudinary();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

// ─── Request Logging (audit trail) ───────────────────────────────────────────
if (NODE_ENV !== "test") {
    app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
}

// ─── Global Rate Limiter (all routes) ────────────────────────────────────────
// Prevents abuse of any endpoint — auth endpoints have stricter per-route limits
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,                  // 200 requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "TOO_MANY_REQUESTS", message: "Too many requests. Please slow down." },
})
app.use(globalLimiter);

// CORS configuration — whitelist frontend domains
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : [
          "http://localhost:5173",
          "http://localhost:5174",
          "https://matchndice.vercel.app",
          "https://matchndiceadmin.vercel.app",
      ];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (Postman, mobile apps, etc.)
            if (!origin) return callback(null, true);

            // Allow any vercel.app subdomain
            if (origin.endsWith(".vercel.app")) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`[CORS] Blocked origin: ${origin}`);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// Global limit: 1mb (reasonable for product images via base64, etc.)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));


// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Match N Dice API is running.",
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

app.get("/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);
app.use("/api/subcategory", subCategoryRouter);
app.use("/api/profile", profileRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/notify-me", notifyMeRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/whatsapp-inquiry", whatsAppRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(port, () => {
    console.log(`[Server] Running on port ${port} in ${NODE_ENV} mode.`);
});