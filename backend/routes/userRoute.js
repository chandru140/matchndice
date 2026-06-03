import express from "express"
import { adminLogin, registerUser, loginUser, logoutUser } from "../controllers/userController.js"
import { forgotPassword, verifyResetToken, resetPassword } from "../controllers/passwordResetController.js"
import { check } from "express-validator"
import validateRequest from "../middleware/validateRequest.js"
import {
    loginLimiter,
    registerLimiter,
    adminLoginLimiter,
    forgotPasswordLimiter,
    resetPasswordLimiter,
} from "../middleware/rateLimiters.js"

const userRouter = express.Router()

// ── Register ──────────────────────────────────────────────────────────────────
userRouter.post(
    "/register",
    registerLimiter,
    [
        check("name",     "Name is required and must be at least 2 characters").not().isEmpty().isLength({ min: 2 }),
        check("email",    "Please include a valid email").isEmail().normalizeEmail(),
        check("password", "Password must be at least 8 characters").isLength({ min: 8 }),
        check("password", "Password must contain uppercase, lowercase, number and special character")
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    ],
    validateRequest,
    registerUser
)

// ── Login ─────────────────────────────────────────────────────────────────────
userRouter.post(
    "/login",
    loginLimiter,
    [
        check("email",    "Please include a valid email").isEmail().normalizeEmail(),
        check("password", "Password is required").not().isEmpty(),
    ],
    validateRequest,
    loginUser
)

// ── Logout ────────────────────────────────────────────────────────────────────
userRouter.post("/logout", logoutUser)

// ── Admin Login ───────────────────────────────────────────────────────────────
userRouter.post(
    "/admin",
    adminLoginLimiter,
    [
        check("email",    "Email is required").isEmail(),
        check("password", "Password is required").not().isEmpty(),
    ],
    validateRequest,
    adminLogin
)

// ── Forgot Password ───────────────────────────────────────────────────────────
// POST /api/user/forgot-password
// Always returns 200 to prevent email enumeration attacks
userRouter.post(
    "/forgot-password",
    forgotPasswordLimiter,
    [
        check("email", "Please include a valid email address").isEmail().normalizeEmail(),
    ],
    validateRequest,
    forgotPassword
)

// ── Verify Reset Token ────────────────────────────────────────────────────────
// GET /api/user/verify-reset-token?token=xxx
// Called by ResetPassword page on mount to validate token before showing form
userRouter.get("/verify-reset-token", verifyResetToken)

// ── Reset Password ────────────────────────────────────────────────────────────
// POST /api/user/reset-password
userRouter.post(
    "/reset-password",
    resetPasswordLimiter,
    [
        check("token",           "Reset token is required").not().isEmpty(),
        check("newPassword",     "New password must be at least 8 characters").isLength({ min: 8 }),
        check("confirmPassword", "Confirm password is required").not().isEmpty(),
    ],
    validateRequest,
    resetPassword
)

export default userRouter
