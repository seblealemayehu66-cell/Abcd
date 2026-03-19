import express from "express";
import { addToCart, getCart, removeFromCart } from "../controllers/cart.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);
router.post("/", addToCart);
router.get("/", getCart);
router.delete("/:itemId", removeFromCart);

export default router;
