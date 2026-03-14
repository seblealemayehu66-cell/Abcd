import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { placeOrder } from "../controllers/order.controller.js";
import { getAllSellers, approveSeller, rejectSeller, loginAsSeller } from "../controllers/auth.controller.js";


const router = express.Router();

// Example: get admin info

// Admin places order as virtual buyer
router.post("/orders/place", authMiddleware, placeOrder);
// Get all sellers (pending or approved)
router.get("/sellers", authMiddleware, getAllSellers);
// Login as seller (admin impersonates)
router.get("/sellers/login-as/:userId", authMiddleware, loginAsSeller);


// Approve seller
router.put("/sellers/approve/:userId", authMiddleware, approveSeller);

// Reject seller
router.put("/sellers/reject/:userId", authMiddleware, rejectSeller);

router.get("/me", authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: "Unauthorized" });
  res.json({ message: "Admin authenticated", admin: req.user });
});



// Get all virtual buyers (admin only)
router.get("/virtual-buyers", authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: "Unauthorized" });
  try {
    const buyers = await User.find({ isVirtualBuyer: true, isAdmin: false });
    res.json(buyers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all customers (real users)
router.get("/customers", authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: "Unauthorized" });
  try {
    const customers = await User.find({ isAdmin: false, isVirtualBuyer: false });
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all products
router.get("/products", authMiddleware, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/users", authMiddleware, async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) return res.status(400).json([]);

    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    }).limit(5); // limit results

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



// Place order as admin using virtual buyer for a specific customer
router.post("/orders/place", authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: "Unauthorized" });

  const { buyerId, customerId, productId } = req.body;
  try {
    const buyer = await User.findById(buyerId);
    const customer = await User.findById(customerId);
    const product = await Product.findById(productId);

    if (!buyer || !customer || !product) return res.status(404).json({ message: "Invalid IDs" });

    const order = new Order({
      buyerId,
      customerId,
      productId,
      price: product.price,
      status: "pending",
    });

    await order.save();

    res.json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});













export default router;