import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

/* =========================
   ✅ ADD TO CART
========================= */
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1, size = "", color = "" } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // check if already in cart
    let cartItem = await Cart.findOne({ userId, productId, size, color });

    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      cartItem = new Cart({ userId, productId, quantity, size, color });
    }

    await cartItem.save();
    res.json({ message: "Added to cart", cartItem });
  } catch (err) {
    console.error("Add to Cart Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   ✅ GET USER CART
========================= */
export const getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await Cart.find({ userId })
      .populate("productId");
    res.json(cartItems);
  } catch (err) {
    console.error("Get Cart Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   ✅ REMOVE ITEM
========================= */
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // cart item id

    const deleted = await Cart.findOneAndDelete({ _id: id, userId });
    if (!deleted) return res.status(404).json({ message: "Cart item not found" });

    res.json({ message: "Item removed from cart" });
  } catch (err) {
    console.error("Remove Cart Item Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   ✅ CLEAR CART (optional)
========================= */
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await Cart.deleteMany({ userId });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    console.error("Clear Cart Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
