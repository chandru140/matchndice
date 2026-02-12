import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        
        const user = await userModel.findById(userId).select('-password -cartData');
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const { userId, name, currentPassword, newPassword } = req.body;
        
        // Get user with password for verification
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Current password is incorrect" });
        }
        
        // Update name if provided
        if (name && name.trim() !== '') {
            user.name = name.trim();
        }
        
        // Update password if new password provided
        if (newPassword && newPassword.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }
        
        await user.save();
        
        res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { getUserProfile, updateUserProfile };
