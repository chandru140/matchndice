import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";

// GET user profile — called via POST /api/profile/get (authUser sets req.body.userId)
const getUserProfile = async (req, res, next) => {
    try {
        const userId = req.userId || req.body.userId;

        const user = await userModel.findById(userId).select("-password -cartData");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// POST /api/profile/update — Update user name and/or password
const updateUserProfile = async (req, res, next) => {
    try {
        const userId = req.userId || req.body.userId;
        const { name, currentPassword, newPassword } = req.body;

        // ✅ CRITICAL: Must use .select('+password') — password field has select:false
        // Without this, user.password is undefined and bcrypt.compare always returns false
        const user = await userModel.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Current password is always required for profile updates
        if (!currentPassword) {
            return res.status(400).json({ success: false, message: "Current password is required." });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Current password is incorrect." });
        }

        // Update name if provided
        if (name && name.trim() !== "") {
            user.name = name.trim();
        }

        // Validate and update password if new password provided
        if (newPassword && newPassword.trim() !== "") {
            if (newPassword.length < 8) {
                return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });
            }
            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
                return res.status(400).json({
                    success: false,
                    message: "New password must contain uppercase, lowercase, a number, and a special character.",
                });
            }
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();
        res.json({ success: true, message: "Profile updated successfully." });
    } catch (error) {
        next(error);
    }
};

export { getUserProfile, updateUserProfile };
