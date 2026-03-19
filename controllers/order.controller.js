import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import SellerProduct from "../models/SellerProduct.js";

/* =========================
   ✅ PLACE ORDER
========================= */
export const placeOrder = async (req, res) => {
  try {
    const {
      buyerId,
      customerId,
      productId,
      quantity,
      shippingAddress,
      paymentMethod,
      notes,
    } = req.body;

    // ✅ Validate buyer
    const buyer = await User.findById(buyerId);
    if (!buyer) return res.status(400).json({ message: "Buyer not found" });

    // ✅ Validate customer (receiver)
    const customer = await User.findById(customerId);
    if (!customer) return res.status(400).json({ message: "Customer not found" });

    // ✅ Validate product
    const product = await Product.findById(productId);
    if (!product) return res.status(400).json({ message: "Product not found" });

    const qty = quantity || 1;
    if (product.stock < qty)
      return res.status(400).json({ message: "Not enough product stock" });

    const buyPrice = product.price * 0.8; // Platform purchase price

    const order = new Order({
      buyerId,
      customerId,
      productId,
      sellerId: product.sellerId,
      quantity: qty,
      price: product.price * qty,
      buyPrice: buyPrice * qty,
      shippingAddress,
      paymentMethod,
      notes,
    });

    await order.save();

    res.json({
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.error("Place Order Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* =========================
   ✅ GET CUSTOMER ORDERS
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* =========================
   ✅ GET SELLER ORDERS
========================= */
export const getSellerOrders = async (req, res) => {
  try {
    const seller = req.seller;
    if (!seller) return res.status(401).json({ message: "Seller not authenticated" });

    // ✅ Seller products
    const sellerProducts = await SellerProduct.find({ sellerId: seller._id });
    const productIds = sellerProducts.map((sp) => sp.productId);

    // ✅ Orders for seller products
    const orders = await Order.find({ productId: { $in: productIds } })
      .populate("productId")
      .populate("customerId", "name email")
      .populate("buyerId", "name email country phone");

    res.json(orders);
  } catch (err) {
    console.error("Seller Orders Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* =========================
   ✅ GET ORDER INVOICE
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
      shippingAddress: order.shippingAddress || {},
      paymentMethod: order.paymentMethod || "COD",
      sellPrice: order.price || 0,
      buyPrice: order.buyPrice || 0,
      profit: (order.price || 0) - (order.buyPrice || 0),
      status: order.status,
      deliveryDate: order.deliveryDate,
    });
  } catch (err) {
    console.error("Get Invoice Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* =========================
   🔥 PICK ORDER (SELLER)
========================= */
export const pickOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate("productId");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order already picked" });
    }

    const seller = req.seller;
    if (!seller) return res.status(401).json({ message: "Seller not authenticated" });

    // ✅ Seller product
    const sellerProduct = await SellerProduct.findOne({
      sellerId: seller._id,
      productId: order.productId._id,
    });

    if (!sellerProduct) return res.status(404).json({ message: "Seller product not found" });

    const qty = order.quantity || 1;

    // ✅ Stock checks
    if (sellerProduct.stock < qty) return res.status(400).json({ message: "Not enough seller stock" });
    if (order.productId.stock < qty) return res.status(400).json({ message: "Not enough global stock" });

    // ✅ Wallet check
    if ((seller.wallet?.balance || 0) < order.buyPrice)
      return res.status(400).json({ message: "Insufficient wallet balance" });

    // ✅ Deduct stocks
    sellerProduct.stock -= qty;
    if (sellerProduct.stock < 0) sellerProduct.stock = 0;
    await sellerProduct.save();

    order.productId.stock -= qty;
    if (order.productId.stock < 0) order.productId.stock = 0;
    await order.productId.save();

    // ✅ Wallet deduction
    seller.wallet.balance -= order.buyPrice;
    seller.wallet.transactions = seller.wallet.transactions || [];
    seller.wallet.transactions.push({
      type: "debit",
      amount: order.buyPrice,
      note: `Order pickup - ${order.productId.name}`,
    });
    await seller.save();

    // ✅ Update order
    order.status = "delivery";
    order.sellerId = seller._id;
    order.frozenAmount = order.price;
    order.deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days delivery
    await order.save();

    res.json({ message: "Order picked successfully", order });
  } catch (err) {
    console.error("🔥 Pick Order Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
