import express from "express";
import { updateUserBalance } from "../controllers/adminWallet.controller.js";

const router = express.Router();

router.put("/update-balance", updateUserBalance);

export default router;
