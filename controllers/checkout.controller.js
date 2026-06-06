import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import SellerProduct from "../models/SellerProduct.js";

/* =========================
   ✅ SAVE SHIPPING
========================= */

export const saveShipping = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
    } = req.body;

    /* =========================
       ✅ VALIDATION
    ========================= */

    if (
      !fullName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !country
    ) {
      return res.status(400).json({
        message: "Please fill required shipping fields",
      });
    }

    /* =========================
       ✅ FIND CART
    ========================= */

    const cart = await Cart.findOne({ userId });

    if (!cart || !cart.items.length) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    /* =========================
       ✅ SAVE SHIPPING
    ========================= */

    cart.shippingAddress = {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
    };

    await cart.save();

    return res.json({
      success: true,
      message: "Shipping info saved",
      shippingAddress: cart.shippingAddress,
    });

  } catch (err) {
    console.error("SAVE SHIPPING ERROR:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

/* =========================
   ✅ PROCESS PAYMENT
========================= */

export const processPayment = async (req, res) => {
  try {
    const userId = req.user.id;

    let { paymentMethod } = req.body;

    paymentMethod = paymentMethod?.replace("-", "_");

    /* =========================
       ✅ GET USER CART
    ========================= */

    const cart = await Cart.findOne({ userId })
      .populate("items.productId")
      .populate("items.sellerId")
      .populate("items.sellerProductId");

    if (!cart || !cart.items.length) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    /* =========================
       ✅ SHIPPING CHECK
    ========================= */

    if (!cart.shippingAddress) {
      return res.status(400).json({
        message: "Shipping address missing",
      });
    }

    /* =========================
       ✅ FIND USER
    ========================= */

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    /* =========================
       ✅ WALLET INIT
    ========================= */

    if (!user.wallet) {
      user.wallet = {
        balances: {},
        transactions: [],
      };
    }

    if (!user.wallet.balances) {
      user.wallet.balances = {};
    }

    if (!user.wallet.transactions) {
      user.wallet.transactions = [];
    }

    /* =========================
       ✅ TOTAL CALCULATION
    ========================= */

    let totalAmount = 0;

    cart.items.forEach((item) => {
      totalAmount += item.price * item.quantity;
    });

    /* =========================
       ✅ SAFE DEDUCT FUNCTION
    ========================= */

    const deductCoin = (coin) => {
      const balance =
        user.wallet.balances[coin] || 0;

      if (balance < totalAmount) {
        return false;
      }

      user.wallet.balances[coin] =
        balance - totalAmount;

      user.wallet.transactions.push({
        type: "debit",
        currency: coin,
        amount: totalAmount,
        note: `Order payment (${coin})`,
      });

      return true;
    };

    /* =========================
       ✅ PAYMENT LOGIC
    ========================= */

    if (paymentMethod === "wallet") {
      const success = deductCoin("USDT");

      if (!success) {
        return res.status(400).json({
          message: "Insufficient USDT balance",
        });
      }
    }

    else if (paymentMethod === "btc") {
      const success = deductCoin("BTC");

      if (!success) {
        return res.status(400).json({
          message: "Insufficient BTC balance",
        });
      }
    }

    else if (paymentMethod === "eth") {
      const success = deductCoin("ETH");

      if (!success) {
        return res.status(400).json({
          message: "Insufficient ETH balance",
        });
      }
    }

    else if (paymentMethod === "sol") {
      const success = deductCoin("SOL");

      if (!success) {
        return res.status(400).json({
          message: "Insufficient SOL balance",
        });
      }
    }

    else if (
      paymentMethod === "usdt_trc20" ||
      paymentMethod === "usdt_erc20"
    ) {
      // simulated external payment
    }

    else {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    /* =========================
       ✅ CREATE ORDERS
    ========================= */

    const orders = [];

    const shipping = cart.shippingAddress;

    for (const item of cart.items) {

      /* =========================
         ✅ FIND PRODUCT
      ========================= */

      const product = await Product.findById(
        item.productId._id
      );

      if (!product) {
        return res.status(400).json({
          message: "Product not found",
        });
      }

      /* =========================
         ✅ FIND SELLER PRODUCT
      ========================= */

      const sellerProduct =
        await SellerProduct.findById(
          item.sellerProductId
        );

      if (!sellerProduct) {
        return res.status(400).json({
          message: "Seller product not found",
        });
      }

      /* =========================
         ✅ STOCK CHECK
      ========================= */

      if (sellerProduct.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}`,
        });
      }

      /* =========================
         ✅ UPDATE STOCK
      ========================= */

      sellerProduct.stock -= item.quantity;

      if (sellerProduct.stock < 0) {
        sellerProduct.stock = 0;
      }

      await sellerProduct.save();

      /* =========================
         ✅ UPDATE MAIN PRODUCT STOCK
      ========================= */

      product.stock -= item.quantity;

      if (product.stock < 0) {
        product.stock = 0;
      }

      await product.save();

      /* =========================
         ✅ CREATE ORDER
      ========================= */

      const order = await Order.create({
        buyerId: userId,

        customerId: userId,

        productId: product._id,

        // 🔥 IMPORTANT FIX
        sellerId: item.sellerId,

        quantity: item.quantity,

        price: item.price * item.quantity,

        buyPrice:
          item.price * 0.8 * item.quantity,

        frozenAmount: 0,

        status: "pending",

        isPaid: true,

        paymentMethod,

        shippingAddress: shipping,
      });

      orders.push(order);
    }

    /* =========================
       ✅ SAVE USER WALLET
    ========================= */

    user.markModified("wallet");

    await user.save();

    /* =========================
       ✅ CLEAR CART
    ========================= */

    cart.items = [];

    cart.shippingAddress = null;

    await cart.save();

    /* =========================
       ✅ RESPONSE
    ========================= */

    return res.json({
      success: true,
      message: "Payment successful",
      totalAmount,
      orders,
    });

  } catch (err) {
    console.error("PAYMENT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
