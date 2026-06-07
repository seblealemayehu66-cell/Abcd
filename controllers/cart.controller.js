import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import SellerProduct from "../models/SellerProduct.js";

/* =========================
   ✅ ADD TO CART
========================= */

export const addToCart = async (req, res) => {
  try {

    const userId = req.user.id;

    const {
      productId,
      sellerProductId,
      quantity = 1,
      size = "",
      color = "",
    } = req.body;

    /* =========================
       ✅ VALIDATE PRODUCT
    ========================= */

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    /* =========================
       ✅ OPTIONAL SELLER PRODUCT
    ========================= */

    let sellerProduct = null;

    // ✅ ONLY CHECK IF EXISTS
    if (sellerProductId) {

      sellerProduct =
        await SellerProduct.findById(
          sellerProductId
        );

      if (!sellerProduct) {
        return res.status(404).json({
          message: "Seller product not found",
        });
      }

      /* =========================
         ✅ SELLER STOCK CHECK
      ========================= */

      if (sellerProduct.stock < quantity) {
        return res.status(400).json({
          message: "Not enough stock",
        });
      }
    }

    // ✅ GLOBAL PRODUCT STOCK CHECK
    else {

      if (product.stock < quantity) {
        return res.status(400).json({
          message: "Not enough stock",
        });
      }
    }

    /* =========================
       ✅ FIND OR CREATE CART
    ========================= */

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });
    }

    /* =========================
       ✅ CHECK EXISTING ITEM
    ========================= */

    const existingItem = cart.items.find(
      (item) =>
        item.productId.toString() ===
          productId &&

        item.size === size &&

        JSON.stringify(item.color) ===
          JSON.stringify(color) &&

        (
          item.sellerProductId?.toString() ||
          null
        ) === (
          sellerProductId || null
        )
    );

    /* =========================
       ✅ UPDATE ITEM
    ========================= */

    if (existingItem) {

      existingItem.quantity +=
        Number(quantity);
    }

    /* =========================
       ✅ ADD NEW ITEM
    ========================= */

    else {

      cart.items.push({

        productId,

        // ✅ NULL FOR GLOBAL PRODUCT
        sellerId:
          sellerProduct?.sellerId || null,

        // ✅ NULL FOR GLOBAL PRODUCT
        sellerProductId:
          sellerProduct?._id || null,

        quantity: Number(quantity),

        size,

        color,

        // ✅ GLOBAL OR SELLER PRICE
        price:
          sellerProduct?.price ||
          product.price,
      });
    }

    await cart.save();

    /* =========================
       ✅ RETURN UPDATED CART
    ========================= */

    const updatedCart =
      await Cart.findById(cart._id)

        .populate("items.productId")

        .populate(
          "items.sellerId",
          "name email"
        )

        .populate("items.sellerProductId");

    return res.json({
      success: true,
      message: "Added to cart",
      cart: updatedCart,
    });

  } catch (err) {

    console.error(
      "ADD TO CART ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

/* =========================
   ✅ GET USER CART
========================= */

export const getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId })
      .populate("items.productId")
      .populate("items.sellerId", "name email")
      .populate("items.sellerProductId");

    if (!cart) {
      return res.json({
        items: [],
      });
    }

    return res.json(cart);

  } catch (err) {
    console.error("GET CART ERROR:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* =========================
   ✅ REMOVE CART ITEM
========================= */

export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== id
    );

    await cart.save();

    return res.json({
      success: true,
      message: "Item removed from cart",
      cart,
    });

  } catch (err) {
    console.error("REMOVE CART ITEM ERROR:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* =========================
   ✅ CLEAR CART
========================= */

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.json({
        message: "Cart already empty",
      });
    }

    cart.items = [];

    await cart.save();

    return res.json({
      success: true,
      message: "Cart cleared",
    });

  } catch (err) {
    console.error("CLEAR CART ERROR:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
