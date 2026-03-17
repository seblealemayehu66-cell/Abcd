import express from "express";
import {
  getProfile,
  updateProfile,
  updateShop,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/shop", authMiddleware, updateShop);

export default router;
