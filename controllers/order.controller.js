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
   ✅ SELLER ORDERS
========================= */
export const getSellerOrders = async (req, res) => {
  try {
    const seller = req.seller;

    if (!seller) {
      return res.status(401).json({ message: "Seller not authenticated" });
    }

    // ✅ Step 1: get seller products
    const sellerProducts = await SellerProduct.find({
      sellerId: seller._id,
    });

    const productIds = sellerProducts.map((sp) => sp.productId);

    // ✅ Step 2: get only orders related to those products
    const orders = await Order.find({
      productId: { $in: productIds },
    })
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
   🔥 PICK ORDER (SAFE)
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

    if (!seller) {
      return res.status(401).json({ message: "Seller not authenticated" });
    }

    // ✅ Get seller product
    const sellerProduct = await SellerProduct.findOne({
      sellerId: seller._id,
      productId: order.productId?._id,
    });

    if (!sellerProduct) {
      return res.status(404).json({ message: "Seller product not found" });
    }

    const quantity = order.quantity || 1;

    // ✅ Check seller stock
    if (sellerProduct.stock < quantity) {
      return res.status(400).json({ message: "Not enough seller stock" });
    }

    // ✅ Get GLOBAL product (IMPORTANT FIX 🔥)
    const product = await Product.findById(order.productId._id);

    if (!product) {
      return res.status(404).json({ message: "Global product not found" });
    }

    // ✅ Check global stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: "Not enough global stock" });
    }

    // ✅ Check wallet
    if ((seller.wallet?.balance || 0) < order.buyPrice) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    /* =========================
       🔥 UPDATE STOCKS
    ========================= */

    // 👉 Seller stock decrease
    sellerProduct.stock -= quantity;
    if (sellerProduct.stock < 0) sellerProduct.stock = 0;
    await sellerProduct.save();

    // 👉 Global stock decrease (FIXED 🔥)
    product.stock -= quantity;
    if (product.stock < 0) product.stock = 0;
    await product.save();

    /* =========================
       💰 WALLET DEDUCTION
    ========================= */

    seller.wallet.balance -= order.buyPrice;

    seller.wallet.transactions = seller.wallet.transactions || [];
    seller.wallet.transactions.push({
      type: "debit",
      amount: order.buyPrice,
      note: `Order pickup - ${product.name}`,
    });

    await seller.save();

    /* =========================
       📦 UPDATE ORDER
    ========================= */

    order.status = "delivery";
    order.sellerId = seller._id;
    order.frozenAmount = order.price;

    // ⏳ delivery after 3 days
    order.deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await order.save();

    res.json({
      message: "Order picked successfully",
      order,
    });

  } catch (err) {
    console.error("🔥 Pick Order Error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
