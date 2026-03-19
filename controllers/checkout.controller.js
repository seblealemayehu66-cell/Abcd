import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

/* =========================
   ✅ SAVE SHIPPING INFO
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

    // Required fields check
    if (!fullName || !phone || !addressLine1 || !city || !country)
      return res.status(400).json({ message: "Please fill all required shipping fields" });

    const cart = await Cart.findOne({ userId });
    if (!cart || !cart.items.length)
      return res.status(400).json({ message: "Cart is empty" });

    // Save shipping in cart temporarily
    cart.shippingAddress = { fullName, phone, addressLine1, addressLine2, city, state, country, postalCode };
    await cart.save();

    res.json({ message: "Shipping info saved", shippingAddress: cart.shippingAddress });
  } catch (err) {
    console.error("Shipping Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   ✅ PROCESS PAYMENT & PLACE ORDER
========================= */
export const processPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethod } = req.body; // wallet / usdt_trc20 / usdt_erc20 / credit card

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || !cart.items.length)
      return res.status(400).json({ message: "Cart is empty" });

    if (!cart.shippingAddress)
      return res.status(400).json({ message: "Shipping info not set" });

    const user = await User.findById(userId);

    // Calculate total amount
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );

    // Wallet payment
    if (paymentMethod === "wallet") {
      if ((user.wallet?.balance || 0) < totalAmount)
        return res.status(400).json({ message: "Insufficient wallet balance" });

      user.wallet.balance -= totalAmount;
      user.wallet.transactions = user.wallet.transactions || [];
      user.wallet.transactions.push({
        type: "debit",
        amount: totalAmount,
        note: "Order Payment",
      });

      await user.save();
    }

    // Other payment methods (simulate success for now)
    else if (
      paymentMethod === "usdt_trc20" ||
      paymentMethod === "usdt_erc20" ||
      paymentMethod === "credit_card"
    ) {
      // Integrate blockchain / payment gateway logic here
    } else {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // Create orders
    const orders = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.productId._id);

      if (!product) return res.status(400).json({ message: "Product not found" });

      if (product.stock < item.quantity)
        return res.status(400).json({ message: `Not enough stock for ${product.name}` });

      // Reduce stock
      product.stock -= item.quantity;
      await product.save();

      // Create order
      const order = new Order({
  buyerId: userId,
  customerId: userId,
  productId: product._id,
  sellerId: product.sellerId || userId, // fallback if missing
  quantity: item.quantity,
  price: product.price * item.quantity,
  buyPrice: product.price * 0.8 * item.quantity,
  status: "completed",
  isPaid: true,
  shippingAddress: {
    fullName: shipping.fullName,
    phone: shipping.phone,
    addressLine1: shipping.addressLine1,
    addressLine2: shipping.addressLine2 || "",
    city: shipping.city,
    state: shipping.state || "",
    country: shipping.country,
    postalCode: shipping.postalCode || "",
  },
  paymentMethod: paymentMethod,
});

      await order.save();
      orders.push(order);
    }

    // Clear cart
    cart.items = [];
    cart.shippingAddress = null;
    await cart.save();

    res.json({ message: "Payment successful", orders, totalAmount });
  } catch (err) {
    console.error("Payment Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
