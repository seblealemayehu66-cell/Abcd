import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import SellerProduct from "../models/SellerProduct.js";

/* =========================
   ✅ PLACE ORDER (ADMIN)
========================= */
export const placeOrder = async (req, res) => {
  try {
    const { buyerId, customerId, productId, quantity } = req.body;

    const buyer = await User.findById(buyerId);
    if (!buyer || !buyer.isVirtualBuyer)
      return res.status(400).json({ message: "Invalid virtual buyer" });

    const customer = await User.findById(customerId);
    if (!customer) return res.status(400).json({ message: "Customer not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(400).json({ message: "Product not found" });

    const qty = quantity || 1;
    if (product.stock < qty)
      return res.status(400).json({ message: "Not enough product stock" });

    const buyPrice = product.price * 0.8;

    const order = new Order({
      buyerId,
      customerId,
      productId,
      price: product.price * qty,
      buyPrice: buyPrice * qty,
      quantity: qty,
      status: "pending", // ensure default status
    });

    await order.save();

    res.json({
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.error("Place Order Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   ✅ CUSTOMER ORDERS
========================= */
export const getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id })
      .populate("productId")
      .populate("buyerId", "name email")
      .populate("customerId", "name email");

    res.json(orders);
  } catch (err) {
    console.error("Customer Orders Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   ✅ SELLER ORDERS
========================= */
export const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("productId")
      .populate("customerId", "name email")
      .populate("buyerId", "name email");

    res.json(orders);
  } catch (err) {
    console.error("Seller Orders Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   ✅ GET INVOICE
========================= */
export const getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("productId")
      .populate("customerId", "name email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({
      orderId: order._id,
      product: order.productId?.name || "Product removed",
      image: order.productId?.image || "",
      customer: order.customerId || {},
      sellPrice: order.price || 0,
      buyPrice: order.buyPrice || 0,
      profit: (order.price || 0) - (order.buyPrice || 0),
    });
  } catch (err) {
    console.error("Get Invoice Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* =========================
   🔥 PICK ORDER (MAIN LOGIC)
========================= */
export const pickOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate("productId")
      .populate("customerId")
      .populate("buyerId");

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "pending")
      return res.status(400).json({ message: "Order already processed" });

    const seller = req.seller;
    if (!seller) return res.status(401).json({ message: "Seller not authenticated" });

    const sellerProduct = await SellerProduct.findOne({
      sellerId: seller._id,
      productId: order.productId?._id,
    });

    if (!sellerProduct)
      return res.status(404).json({ message: "Seller product not found" });

    // ✅ Stock validation
    if ((sellerProduct.stock || 0) < order.quantity)
      return res.status(400).json({ message: "Not enough seller stock" });

    if ((order.productId?.stock || 0) < order.quantity)
      return res.status(400).json({ message: "Not enough global stock" });

    // ✅ Wallet validation
    if ((seller.wallet?.balance || 0) < order.buyPrice)
      return res.status(400).json({ message: "Insufficient wallet balance" });

    // =========================
    // ✅ DEDUCT STOCK
    // =========================
    sellerProduct.stock -= order.quantity;
    await sellerProduct.save();

    if (order.productId) {
      order.productId.stock -= order.quantity;
      await order.productId.save();
    }

    // =========================
    // 💰 DEDUCT WALLET (BUY COST)
    // =========================
    seller.wallet.balance -= order.buyPrice;
    seller.wallet.transactions = seller.wallet.transactions || [];
    seller.wallet.transactions.push({
      type: "debit",
      amount: order.buyPrice,
      note: `Order pickup - ${order.productId?.name || "Product"}`,
    });
    await seller.save();

    // =========================
    // 🔒 FREEZE CUSTOMER MONEY
    // =========================
    order.frozenAmount = order.price;

    // =========================
    // 🚚 UPDATE STATUS
    // =========================
    order.status = "delivery";
    order.sellerId = seller._id;
    await order.save();

    res.json({
      message: "Order picked successfully. Stock deducted, wallet updated, delivery started.",
    });
  } catch (err) {
    console.error("Pick Order Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* =========================
   🚚 CONFIRM DELIVERY
========================= */
export const confirmDelivery = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "delivery")
      return res.status(400).json({ message: "Order not in delivery stage" });

    const seller = await User.findById(order.sellerId);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    const profit = order.price - order.buyPrice;

    seller.wallet.balance += order.price;
    seller.wallet.transactions = seller.wallet.transactions || [];
    seller.wallet.transactions.push({
      type: "credit",
      amount: order.price,
      note: "Order delivered profit",
    });
    await seller.save();

    order.status = "delivered";
    await order.save();

    res.json({ message: "Order delivered successfully. Profit added to wallet." });
  } catch (err) {
    console.error("Confirm Delivery Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
