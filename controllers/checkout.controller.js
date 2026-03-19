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

    // Save shipping info in cart temporarily
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
    const { paymentMethod } = req.body; // wallet / usdt / credit card etc.

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || !cart.items.length) return res.status(400).json({ message: "Cart is empty" });
    if (!cart.shippingAddress) return res.status(400).json({ message: "Shipping not set" });

    const user = await User.findById(userId);

    let totalAmount = 0;
    cart.items.forEach(item => {
      totalAmount += item.productId.price * item.quantity;
    });

    // Wallet payment example
    if (paymentMethod === "wallet") {
      if ((user.wallet?.balance || 0) < totalAmount) return res.status(400).json({ message: "Insufficient wallet balance" });
      user.wallet.balance -= totalAmount;
      user.wallet.transactions.push({ type: "debit", amount: totalAmount, note: "Order Payment" });
      await user.save();
    }

    // Other payment methods (USDT TRC20/ ERC20, Credit Card, etc.) → simulate success
    else if (paymentMethod === "usdt_trc20" || paymentMethod === "usdt_erc20" || paymentMethod === "Credit Card") {
      // Integrate blockchain or payment gateway logic here
    } else {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // ✅ Create orders from cart items
    const orders = [];
    for (let item of cart.items) {
      const product = await Product.findById(item.productId._id);
      if (product.stock < item.quantity) return res.status(400).json({ message: `Not enough stock for ${product.name}` });

      product.stock -= item.quantity;
      await product.save();

      const order = new Order({
        buyerId: userId,
        customerId: userId,
        productId: product._id,
        sellerId: product.sellerId,
        quantity: item.quantity,
        price: product.price * item.quantity,
        buyPrice: product.price * 0.8 * item.quantity,
        status: "completed",
        isPaid: true,
        shippingAddress: cart.shippingAddress,
        paymentMethod: paymentMethod,
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
    res.status(500).json({ message: "Server error" });
  }
};
