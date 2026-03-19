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

    // get user cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // check if same product+size+color exists
    const existingItem = cart.items.find(
      (item) =>
        item.productId.toString() === productId &&
        item.size === size &&
        item.color === color
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, size, color });
    }

    await cart.save();
    res.json({ message: "Added to cart", cart });
  } catch (err) {
    console.error("Add to Cart Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* =========================
   ✅ GET USER CART
========================= */
export const getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find ONE cart document per user
    let cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) {
      // if no cart exists, return empty array
      return res.json({ items: [] });
    }

    res.json(cart);
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
