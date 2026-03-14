// routes/sellerCart.routes.js
import express from "express";
import SellerCart from "../models/SellerCart.js";
import Product from "../models/Product.js";
import { sellerAuth } from "../middleware/sellerAuth.js";

const router = express.Router();

// Protect all routes
router.use(sellerAuth);

// GET cart
router.get("/", async (req, res) => {
  try {
    const cart = await SellerCart.find({ sellerId: req.seller._id }).populate("productId");
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching cart" });
  }
});

// ADD to cart
router.post("/add", async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: "Product ID required" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    let existing = await SellerCart.findOne({ sellerId: req.seller._id, productId });
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

// DELETE cart item
router.delete("/:id", async (req, res) => {
  try {
    await SellerCart.findByIdAndDelete(req.params.id);
    res.json({ message: "Removed from cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error removing item" });
  }
});

// PUBLISH cart to store
router.post("/publish", async (req, res) => {
  try {
    const cartItems = await SellerCart.find({ sellerId: req.seller._id });
    if (!cartItems.length) return res.status(400).json({ error: "Cart is empty" });

    // Create SellerProduct (your published products)
    for (const item of cartItems) {
      await SellerProduct.create({
        sellerId: req.seller._id,
        productId: item.productId,
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
