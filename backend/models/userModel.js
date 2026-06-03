import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            // ✅ SECURITY: Never include password hash in query results by default.
            // Must explicitly request: userModel.findOne({}).select('+password')
            select: false,
        },
        // ✅ Optional phone — not required for existing users (no migration needed)
        phone: {
            type: String,
            default: "",
            match: [/^([6-9]\d{9})?$/, "Please enter a valid 10-digit Indian mobile number"],
            trim: true,
        },
        // ✅ Role-based access control
        role: {
            type: String,
            enum: ["customer", "admin"],
            default: "customer",
        },
        cartData: {
            type: Object,
            default: {},
        },
        // ✅ Account status — allows suspension without deletion
        isActive: {
            type: Boolean,
            default: true,
        },
        // ✅ Track when password was last changed (used to invalidate old sessions)
        passwordChangedAt: {
            type: Date,
            default: null,
        },
        // ✅ Brute-force protection fields
        loginAttempts: {
            type: Number,
            default: 0,
        },
        lockUntil: {
            type: Date,
            default: null,
        },
        // ✅ Audit trail
        lastLoginAt: {
            type: Date,
            default: null,
        },
    },
    {
        minimize: false,
        timestamps: true,
    }
);

// ── Virtual: is account currently locked? ──────────────────────────────────────
userSchema.virtual("isLocked").get(function () {
    return this.lockUntil && this.lockUntil > Date.now();
});

// ── Index ──────────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
