import express from "express";
import { addReview } from "../controllers/review.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addReview);
router.post("/:productId", authMiddleware, addReview);

export default router;
