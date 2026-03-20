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
    if (!customer)
      return res.status(400).json({ message: "Customer not found" });

    const product = await Product.findById(productId);
    if (!product)
      return res.status(400).json({ message: "Product not found" });

    const qty = quantity || 1;

    if (product.stock < qty)
      return res.status(400).json({ message: "Not enough product stock" });

    // ✅ GET SELLER FROM SellerProduct 🔥
    const sellerProduct = await SellerProduct.findOne({
      productId: productId,
    });

    if (!sellerProduct) {
      return res.status(400).json({
        message: "No seller assigned to this product",
      });
    }

    const buyPrice = product.price * 0.8;

    const order = new Order({
      buyerId,
      customerId,
      productId,
      sellerId: sellerProduct.sellerId, // ✅ FIXED
      price: product.price * qty,
      buyPrice: buyPrice * qty,
      quantity: qty,
      status: "pending",
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
   ✅ SELLER ORDERS (FIXED 🔥)
========================= */
export const getSellerOrders = async (req, res) => {
  try {
    const seller = req.seller;

    if (!seller) {
      return res.status(401).json({ message: "Seller not authenticated" });
    }

    // ✅ SIMPLE + STRONG LOGIC 🔥
    const orders = await Order.find({
      sellerId: seller._id,
    })
      .populate("productId")
      .populate("customerId", "name email")
      .populate("buyerId", "name email country phone");

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

    if (!order)
      return res.status(404).json({ message: "Order not found" });

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
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   🔥 PICK ORDER (FIXED)
========================= */
export const pickOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId).populate("productId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ Prevent double pick
    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order already picked" });
    }

    const seller = req.seller;

    if (!seller) {
      return res.status(401).json({ message: "Seller not authenticated" });
    }

    // ✅ SAFETY: sellerId must exist
    if (!order.sellerId) {
      return res.status(400).json({
        message: "Order has no seller assigned (old/broken order)",
      });
    }

    // ✅ SAFETY: correct seller
    if (order.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({ message: "This is not your order" });
    }

    // ✅ Get seller product
    const sellerProduct = await SellerProduct.findOne({
      sellerId: seller._id,
      productId: order.productId._id,
    });

    if (!sellerProduct) {
      return res.status(404).json({ message: "Seller product not found" });
    }

    const quantity = order.quantity || 1;

    // ✅ Check seller stock FIRST
    if (sellerProduct.stock < quantity) {
      return res.status(400).json({ message: "Not enough seller stock" });
    }

    // ✅ Check global product
    const product = await Product.findById(order.productId._id);

    if (!product) {
      return res.status(404).json({ message: "Global product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: "Not enough global stock" });
    }

    // ✅ Check wallet BEFORE deduction
    if ((seller.wallet?.balance || 0) < order.buyPrice) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    /* =========================
       🔥 ALL CHECKS PASSED
       NOW UPDATE (SAFE ZONE)
    ========================= */

    // 👉 Deduct seller stock
    sellerProduct.stock -= quantity;
    if (sellerProduct.stock < 0) sellerProduct.stock = 0;
    await sellerProduct.save();

    // 👉 Deduct global stock
    product.stock -= quantity;
    if (product.stock < 0) product.stock = 0;
    await product.save();

    // 👉 Deduct wallet
    seller.wallet.balance -= order.buyPrice;

    seller.wallet.transactions = seller.wallet.transactions || [];
    seller.wallet.transactions.push({
      type: "debit",
      amount: order.buyPrice,
      note: `Order pickup - ${product.name}`,
    });

    await seller.save();

    // 👉 Update order LAST (VERY IMPORTANT)
    order.status = "processing";
    order.frozenAmount = order.price;
    order.deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await order.save();

    return res.json({
      message: "Order picked successfully",
      order,
    });

  } catch (err) {
    console.error("🔥 Pick Order Crash:", err);

    return res.status(500).json({
      message: "Server error while picking order",
      error: err.message,
    });
  }
};
