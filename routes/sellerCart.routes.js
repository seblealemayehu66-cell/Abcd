// routes/sellerCart.routes.js
import express from "express";
import SellerCart from "../models/SellerCart.js";
import SellerProduct from "../models/SellerProduct.js";
import Product from "../models/Product.js";
import { sellerAuth } from "../middleware/sellerAuth.js";

const router = express.Router();

// 🔒 Protect all routes with sellerAuth
router.use(sellerAuth);

// GET seller cart
router.get("/", async (req, res) => {
  try {
    const cart = await SellerCart.find({ sellerId: req.seller._id }).populate("productId");
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching cart" });
  }
});

// ADD product to seller cart
router.post("/add", async (req, res) => {
  try {
    const { productId } = req.body;

    // Check product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Check if already in cart
    let existing = await SellerCart.findOne({
      sellerId: req.seller._id,
      productId,
    });

    if (existing) {
      existing.quantity += 1;
      await existing.save();
      return res.json(existing);
    }

    const cartItem = new SellerCart({
      sellerId: req.seller._id,
      productId,
      price: product.price,
      stock: product.stock,
      quantity: 1,
    });

    await cartItem.save();
    res.json(cartItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error adding to cart" });
  }
});

// REMOVE item from cart
router.delete("/:id", async (req, res) => {
  try {
    await SellerCart.findByIdAndDelete(req.params.id);
    res.json({ message: "Removed from cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error removing from cart" });
  }
});

// PUBLISH cart to store
router.post("/publish", async (req, res) => {
  try {
    const cartItems = await SellerCart.find({ sellerId: req.seller._id }).populate("productId");

    if (cartItems.length === 0)
      return res.status(400).json({ error: "Cart is empty" });

    for (const item of cartItems) {
      await SellerProduct.create({
        sellerId: req.seller._id,
        productId: item.productId._id,
        price: item.price,
        stock: item.stock,
        quantity: item.quantity,
      });
    }

    // Clear cart
    await SellerCart.deleteMany({ sellerId: req.seller._id });

    res.json({ message: "Products published to store" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error publishing cart" });
  }
});

export default router;
