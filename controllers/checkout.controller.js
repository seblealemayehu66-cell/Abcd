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

    if (!fullName || !phone || !addressLine1 || !city || !country) {
      return res.status(400).json({
        message: "Please fill required shipping fields",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart || !cart.items.length) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

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
       ✅ GET CART
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

    if (!cart.shippingAddress) {
      return res.status(400).json({
        message: "Shipping address missing",
      });
    }

    /* =========================
       ✅ USER
    ========================= */

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.wallet) {
      user.wallet = { balances: {}, transactions: [] };
    }

    if (!user.wallet.balances) {
      user.wallet.balances = {};
    }

    if (!user.wallet.transactions) {
      user.wallet.transactions = [];
    }

    /* =========================
       ✅ TOTAL
    ========================= */

    let totalAmount = 0;

    cart.items.forEach((item) => {
      totalAmount += item.price * item.quantity;
    });

    /* =========================
       ✅ WALLET DEDUCT
    ========================= */

    const deductCoin = (coin) => {
      const balance = user.wallet.balances[coin] || 0;

      if (balance < totalAmount) return false;

      user.wallet.balances[coin] = balance - totalAmount;

      user.wallet.transactions.push({
        type: "debit",
        currency: coin,
        amount: totalAmount,
        note: `Order payment (${coin})`,
      });

      return true;
    };

    if (paymentMethod === "wallet") {
      if (!deductCoin("USDT")) {
        return res.status(400).json({
          message: "Insufficient USDT balance",
        });
      }
    }

    else if (paymentMethod === "btc") {
      if (!deductCoin("BTC")) {
        return res.status(400).json({
          message: "Insufficient BTC balance",
        });
      }
    }

    else if (paymentMethod === "eth") {
      if (!deductCoin("ETH")) {
        return res.status(400).json({
          message: "Insufficient ETH balance",
        });
      }
    }

    else if (paymentMethod === "sol") {
      if (!deductCoin("SOL")) {
        return res.status(400).json({
          message: "Insufficient SOL balance",
        });
      }
    }

    else if (
      paymentMethod !== "usdt_trc20" &&
      paymentMethod !== "usdt_erc20"
    ) {
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

      const product = await Product.findById(
        item.productId?._id || item.productId
      );

      if (!product) {
        return res.status(400).json({
          message: "Product not found",
        });
      }

      let finalSellerId = null;
      let finalPrice = item.price;

      /* =========================
         🔥 FIXED SELLER PRODUCT HANDLING
      ========================= */

      if (item.sellerProductId) {

        const sellerProductId =
          typeof item.sellerProductId === "object"
            ? item.sellerProductId._id
            : item.sellerProductId;

        const sellerProduct =
          await SellerProduct.findById(sellerProductId);

        if (!sellerProduct) {
          return res.status(400).json({
            message: "Invalid sellerProductId in cart",
          });
        }

        if (sellerProduct.stock < item.quantity) {
          return res.status(400).json({
            message: `Not enough stock for ${product.name}`,
          });
        }

        sellerProduct.stock -= item.quantity;
        if (sellerProduct.stock < 0) sellerProduct.stock = 0;
        await sellerProduct.save();

        finalSellerId = sellerProduct.sellerId;
        finalPrice = sellerProduct.price;
      }

      /* =========================
         GLOBAL PRODUCT STOCK
      ========================= */

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}`,
        });
      }

      product.stock -= item.quantity;
      if (product.stock < 0) product.stock = 0;
      await product.save();

      /* =========================
         CREATE ORDER
      ========================= */

     const order = await Order.create({
  buyerId: userId,

  customerId: userId,

  productId: product._id,

  // ✅ IMPORTANT
  sellerProductId:
    item.sellerProductId?._id ||
    item.sellerProductId ||
    null,

  sellerId: finalSellerId,

  quantity: item.quantity,

  price: finalPrice * item.quantity,

  buyPrice:
    finalPrice * 0.8 * item.quantity,

  frozenAmount: 0,

  status: "pending",

  isPaid: true,

  paymentMethod,

  shippingAddress: shipping,
});

      orders.push(order);
    }

    /* =========================
       SAVE USER WALLET
    ========================= */

    user.markModified("wallet");
    await user.save();

    /* =========================
       CLEAR CART
    ========================= */

    cart.items = [];
    cart.shippingAddress = null;
    await cart.save();

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
