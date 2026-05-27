import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

// Save shipping info in Cart temporarily
export const saveShipping = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, phone, addressLine1, addressLine2, city, state, country, postalCode } = req.body;

    if (!fullName || !phone || !addressLine1 || !city || !country)
      return res.status(400).json({ message: "Please fill required shipping fields" });

    const cart = await Cart.findOne({ userId });
    if (!cart || !cart.items.length) return res.status(400).json({ message: "Cart is empty" });

    cart.shippingAddress = { fullName, phone, addressLine1, addressLine2, city, state, country, postalCode };
    await cart.save();

    res.json({ message: "Shipping info saved", shippingAddress: cart.shippingAddress });
  } catch (err) {
    console.error("Shipping Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Process payment and create orders
export const processPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    let { paymentMethod } = req.body;

    // Normalize frontend '-' to '_'
    paymentMethod = paymentMethod.replace("-", "_");

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || !cart.items.length) return res.status(400).json({ message: "Cart is empty" });
    if (!cart.shippingAddress) return res.status(400).json({ message: "Shipping not set" });

    const user = await User.findById(userId);

    let totalAmount = 0;
    cart.items.forEach(item => {
      totalAmount += item.productId.price * item.quantity;
    });

    // Wallet payment
   // =========================
// WALLET + MULTI-COIN PAYMENT
// =========================
if (paymentMethod === "wallet") {
  const balance = user.wallet?.balances?.USDT || 0;

  if (balance < totalAmount) {
    return res.status(400).json({
      message: "Insufficient USDT balance",
    });
  }

  user.wallet.balances.USDT -= totalAmount;

  user.wallet.transactions.push({
    coin: "USDT",
    type: "debit",
    amount: totalAmount,
    note: "Order Payment (USDT)",
  });
}

// =========================
// BTC PAYMENT
// =========================
else if (paymentMethod === "btc") {
  const balance = user.wallet?.balances?.BTC || 0;

  if (balance < totalAmount) {
    return res.status(400).json({
      message: "Insufficient BTC balance",
    });
  }

  user.wallet.balances.BTC -= totalAmount;

  user.wallet.transactions.push({
    coin: "BTC",
    type: "debit",
    amount: totalAmount,
    note: "Order Payment (BTC)",
  });
}

// =========================
// ETH PAYMENT
// =========================
else if (paymentMethod === "eth") {
  const balance = user.wallet?.balances?.ETH || 0;

  if (balance < totalAmount) {
    return res.status(400).json({
      message: "Insufficient ETH balance",
    });
  }

  user.wallet.balances.ETH -= totalAmount;

  user.wallet.transactions.push({
    coin: "ETH",
    type: "debit",
    amount: totalAmount,
    note: "Order Payment (ETH)",
  });
}

// =========================
// SOL PAYMENT
// =========================
else if (paymentMethod === "sol") {
  const balance = user.wallet?.balances?.SOL || 0;

  if (balance < totalAmount) {
    return res.status(400).json({
      message: "Insufficient SOL balance",
    });
  }

  user.wallet.balances.SOL -= totalAmount;

  user.wallet.transactions.push({
    coin: "SOL",
    type: "debit",
    amount: totalAmount,
    note: "Order Payment (SOL)",
  });
}

// =========================
// OTHER CRYPTO (USDT NETWORKS)
// =========================
else if (
  ["usdt_trc20", "usdt_erc20"].includes(paymentMethod)
) {
  // simulate success (no deduction)
}
else {
  return res.status(400).json({
    message: "Invalid payment method",
  });
}

    // Create orders
    const orders = [];
    const shipping = cart.shippingAddress;

    for (let item of cart.items) {
      const product = await Product.findById(item.productId._id);
      if (!product) return res.status(400).json({ message: "Product not found" });
      if (product.stock < item.quantity) return res.status(400).json({ message: `Not enough stock for ${product.name}` });

      product.stock -= item.quantity;
      await product.save();

    const order = new Order({
  buyerId: userId,
  customerId: userId,
  productId: product._id, // ✅ FIXED
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

    // Clear cart
    cart.items = [];
    cart.shippingAddress = null;
    await cart.save();

    res.json({ message: "Payment successful", orders });
  } catch (err) {
    console.error("Payment Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
