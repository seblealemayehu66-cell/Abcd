import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

// Save shipping info in Cart temporarily
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
      return res.status(400).json({ message: "Cart is empty" });
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

    res.json({
      message: "Shipping info saved",
      shippingAddress: cart.shippingAddress,
    });
  } catch (err) {
    console.error("Shipping Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// PAYMENT CONTROLLER (FIXED)
// =========================
export const processPayment = async (req, res) => {
  try {
    const userId = req.user.id;

    let { paymentMethod } = req.body;

    paymentMethod = paymentMethod?.replace("-", "_");

    const cart = await Cart.findOne({ userId }).populate(
      "items.productId"
    );

    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!cart.shippingAddress) {
      return res.status(400).json({ message: "Shipping not set" });
    }

    const user = await User.findById(userId);

    if (!user.wallet) {
      user.wallet = { balances: {}, transactions: [] };
    }

    if (!user.wallet.balances) {
      user.wallet.balances = {};
    }

    if (!user.wallet.transactions) {
      user.wallet.transactions = [];
    }

    // =========================
    // TOTAL AMOUNT CALCULATION
    // =========================
    let totalAmount = 0;

    cart.items.forEach((item) => {
      totalAmount += item.productId.price * item.quantity;
    });

    // =========================
    // SAFE DEDUCT FUNCTION
    // =========================
    const deductCoin = (coin) => {
      const balance = user.wallet.balances[coin] || 0;

      if (balance < totalAmount) {
        return false;
      }

      user.wallet.balances[coin] = balance - totalAmount;

      user.wallet.transactions.push({
        coin,
        type: "debit",
        amount: totalAmount,
        note: `Order Payment (${coin})`,
      });

      return true;
    };

    // =========================
    // PAYMENT LOGIC
    // =========================

    if (paymentMethod === "wallet") {
      if (!deductCoin("USDT")) {
        return res.status(400).json({
          message: "Insufficient USDT balance",
        });
      }
    } 
    else if (paymentMethod === "BTC") {
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
      paymentMethod === "usdt_trc20" ||
      paymentMethod === "usdt_erc20"
    ) {
      // simulate success (no deduction)
    } 
    else {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    // =========================
    // CREATE ORDERS
    // =========================
    const orders = [];
    const shipping = cart.shippingAddress;

    for (let item of cart.items) {
      const product = await Product.findById(item.productId._id);

      if (!product) {
        return res.status(400).json({
          message: "Product not found",
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}`,
        });
      }

      product.stock -= item.quantity;
      await product.save();

      const order = new Order({
        buyerId: userId,
        customerId: userId,
        productId: product._id,
        sellerId: product.sellerId || null,
        quantity: item.quantity,
        price: product.price * item.quantity,
        buyPrice: product.price * 0.8 * item.quantity,
        status: "completed",
        isPaid: true,
        shippingAddress: shipping,
        paymentMethod,
      });

      await order.save();
      orders.push(order);
    }

    // =========================
    // FINAL SAVE (IMPORTANT)
    // =========================
    user.markModified("wallet");
    await user.save();

    cart.items = [];
    cart.shippingAddress = null;
    await cart.save();

    res.json({
      message: "Payment successful",
      orders,
    });
  } catch (err) {
    console.error("Payment Error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
