// routes/virtualBuyer.routes.js
import express from "express";
import { createVirtualBuyer , updateVirtualBuyer} from "../controllers/virtualBuyer.controller.js";
import { placeOrder, pickOrder, getSellerOrders } from "../controllers/order.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin creates virtual buyer
router.post("/virtual-buyer", authMiddleware, createVirtualBuyer);
router.put("/virtual-buyer/:id", authMiddleware, updateVirtualBuyer);

// Admin places order as virtual buyer
router.post("/orders/place", authMiddleware, placeOrder);

// Customer picks order
router.post("/orders/pick/:id", authMiddleware, pickOrder);

// Seller views orders
router.get("/orders/seller", authMiddleware, getSellerOrders);
// Get all virtual buyers (admin only)
router.get("/virtual-buyers", authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: "Unauthorized" });

  try {
    const buyers = await User.find({ isVirtualBuyer: true }); // assuming you mark virtual buyers in your User model
    res.json(buyers);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
