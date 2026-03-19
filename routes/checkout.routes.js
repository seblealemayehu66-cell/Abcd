import express from "express";
import { saveShipping, processPayment } from "../controllers/checkout.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Save shipping address
router.post("/shipping", authMiddleware, saveShipping);

// Process payment and complete order
router.post("/payment", authMiddleware, processPayment);

export default router;
