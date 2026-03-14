// orderController.js
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
      sellerId: product.seller, // save seller ID
      products: [
        {
          productId: product._id,
          quantity: 1,
          price: product.price, // selling price
        },
      ],
      totalAmount: product.price,
      status: "pending",
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
      .populate("products.productId")
      .populate("buyerId", "name email")
      .populate("sellerId", "name email");

    res.json(orders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Seller fetches orders
export const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.user.id, status: "pending" })
      .populate("products.productId")
      .populate("customerId", "name email")
      .populate("buyerId", "name email");

    res.json({ orders });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Seller picks an order and generates invoice
export const sellerPickOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const seller = await User.findById(req.user.id);

    const order = await Order.findById(orderId)
      .populate("customerId")
      .populate("products.productId");

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.sellerId.toString() !== seller._id.toString())
      return res.status(403).json({ message: "Unauthorized" });
    if (order.status !== "pending")
      return res.status(400).json({ message: "Order already picked" });

    // Calculate dynamic seller cost and profit per product
    let totalSellerCost = 0;
    let totalSellingPrice = 0;

    const invoiceProducts = order.products.map((item) => {
      const product = item.productId;
      const discountPercent = product.dynamicDiscount || 0; // dynamic per product
      const sellerCost = product.originalPrice * (1 - discountPercent / 100);
      const profit = item.price - sellerCost;

      totalSellerCost += sellerCost * item.quantity;
      totalSellingPrice += item.price * item.quantity;

      return {
        name: product.name,
        quantity: item.quantity,
        sellingPrice: item.price,
        sellerCost,
        profit,
      };
    });

    // Check seller wallet
    if (seller.wallet.balance < totalSellerCost)
      return res.status(400).json({ message: "Insufficient wallet balance" });

    // Deduct seller wallet
    seller.wallet.balance -= totalSellerCost;
    seller.wallet.transactions.push({
      type: "debit",
      amount: totalSellerCost,
      note: `Picked Order #${order._id}`,
    });
    await seller.save();

    // Update order with invoice
    order.status = "picked";
    order.invoice = {
      products: invoiceProducts,
      totalSellingPrice,
      totalSellerCost,
      totalProfit: totalSellingPrice - totalSellerCost,
      buyerInfo: {
        name: order.customerId.name,
        email: order.customerId.email,
      },
    };
    await order.save();

    res.json({ message: "Order picked successfully", invoice: order.invoice });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Seller marks order as delivered
export const sellerDeliverOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("sellerId");

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.sellerId._id.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });
    if (order.status !== "picked")
      return res.status(400).json({ message: "Order not ready for delivery" });

    // Credit profit to seller wallet
    const seller = order.sellerId;
    const profit = order.invoice.totalProfit;

    seller.wallet.balance += profit;
    seller.wallet.transactions.push({
      type: "credit",
      amount: profit,
      note: `Delivered Order #${order._id}`,
    });
    await seller.save();

    // Update order status
    order.status = "delivered";
    await order.save();

    res.json({ message: "Order delivered successfully", order });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
