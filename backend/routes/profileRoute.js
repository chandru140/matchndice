import express from "express";
import { getUserProfile, updateUserProfile } from "../controllers/profileController.js";
import authUser from "../middleware/auth.js";

const profileRouter = express.Router();

profileRouter.post("/get", authUser, getUserProfile);
profileRouter.post("/update", authUser, updateUserProfile);

export default profileRouter;
