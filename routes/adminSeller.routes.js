import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getAllSellers,
  approveSeller,
  rejectSeller,
  loginAsSeller,
} from "../controllers/adminSeller.controller.js";

const router = express.Router();

// Get all sellers
router.get("/sellers", authMiddleware, getAllSellers);

// Approve seller
router.put("/sellers/approve/:id", authMiddleware, approveSeller);

// Reject seller
router.put("/sellers/reject/:id", authMiddleware, rejectSeller);

// Login as seller
router.post("/sellers/login-as/:id", authMiddleware, loginAsSeller);

export default router;
