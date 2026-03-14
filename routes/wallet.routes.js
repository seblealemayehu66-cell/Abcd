import { getWallet } from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import express from "express";


const router = express.Router();

router.get("/", authMiddleware, getWallet);

export default router;