import express from "express";
import { adminLogin , registerUser , loginUser } from "../controllers/userController.js";
import { check } from "express-validator";
import validateRequest from "../middleware/validateRequest.js";
import { loginLimiter, registerLimiter, adminLoginLimiter } from "../middleware/rateLimiters.js";

const userRouter = express.Router();

userRouter.post("/register", registerLimiter, [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 8 characters").isLength({ min: 8 }),
    check("password", "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
], validateRequest, registerUser)

userRouter.post("/login", loginLimiter, [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists()
], validateRequest, loginUser)

userRouter.post("/admin", adminLoginLimiter, [
    check("email", "Email is required").isEmail(),
    check("password", "Password is required").exists()
], validateRequest, adminLogin)

export default userRouter
