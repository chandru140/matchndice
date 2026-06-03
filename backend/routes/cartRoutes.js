import express from "express";
import { addToCart, updateCart, getUserCart } from "../controllers/cartController.js";
import authUser from "../middleware/auth.js";

const cartRouter = express.Router();

// POST (not GET) so authUser can inject userId into req.body
cartRouter.post("/add", authUser, addToCart);
cartRouter.put("/update", authUser, updateCart);
cartRouter.post("/get", authUser, getUserCart); // Changed from GET to POST

export default cartRouter;