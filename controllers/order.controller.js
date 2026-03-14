import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

// Admin places order as virtual buyer
export const placeOrder = async (req, res) => {
  try {
    const { buyerId, customerId, productId } = req.body;

    const buyer = await User.findById(buyerId);
    if (!buyer || !buyer.isVirtualBuyer)
      return res.status(400).json({ message: "Invalid virtual buyer" });

    const customer = await User.findById(customerId);
    if (!customer) return res.status(400).json({ message: "Customer not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(400).json({ message: "Product not found" });

    const order = new Order({
      buyerId,
      customerId,
      productId,
      price: product.price,
    });

    await order.save();

    res.json({ message: "Order placed successfully", order });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Customer fetches their orders
export const getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id })
      .populate("productId")
      .populate("buyerId", "name email");

    res.json(orders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Customer picks an order
export const pickOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId")
      .populate("productId");

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.customerId._id.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    if (order.status !== "pending")
      return res.status(400).json({ message: "Order already picked" });

    // Check wallet balance
    if (req.user.wallet < order.price)
      return res.status(400).json({ message: "Insufficient wallet balance" });

    // Deduct wallet
    req.user.wallet -= order.price;
    await req.user.save();

    // Update order status
    order.status = "delivery";
    await order.save();

    res.json({ message: "Order picked successfully", order });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Seller sees orders
export const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ "productId.seller": req.user.id })
      .populate("productId")
      .populate("customerId", "name email")
      .populate("buyerId", "name email");

    res.json(orders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};