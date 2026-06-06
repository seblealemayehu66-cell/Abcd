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
    } = req.body;

    const qty = quantity || 1;

    /* =========================
       ✅ VALIDATE BUYER
    ========================= */

    const buyer = await User.findById(buyerId);

    if (!buyer || !buyer.isVirtualBuyer) {
      return res.status(400).json({
        message: "Invalid virtual buyer",
      });
    }

    /* =========================
       ✅ VALIDATE CUSTOMER
    ========================= */

    const customer = await User.findById(customerId);

    if (!customer) {
      return res.status(400).json({
        message: "Customer not found",
      });
    }

    /* =========================
       ✅ VALIDATE PRODUCT
    ========================= */

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    /* =========================
       ✅ FIND SELLER PRODUCT
    ========================= */

    const sellerProduct = await SellerProduct.findOne({
      productId: productId,
    }).populate("sellerId");

    if (!sellerProduct) {
      return res.status(400).json({
        message: "Seller product not found",
      });
    }

    /* =========================
       ✅ STOCK CHECK
    ========================= */

    if (sellerProduct.stock < qty) {
      return res.status(400).json({
        message: "Not enough stock",
      });
    }

    /* =========================
       ✅ PRICE LOGIC
    ========================= */

    const sellPrice = sellerProduct.price * qty;

    // seller buying cost
    const buyPrice = sellerProduct.price * 0.8 * qty;

    /* =========================
       ✅ CREATE ORDER
    ========================= */

    const order = await Order.create({
      buyerId,
      customerId,
      productId,

      // 🔥 IMPORTANT FIX
      sellerId: sellerProduct.sellerId._id,

      quantity: qty,

      price: sellPrice,
      buyPrice,

      status: "pending",

      frozenAmount: 0,

      isPaid: false,

      paymentMethod: paymentMethod || "wallet",

      shippingAddress,
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });

  } catch (err) {
    console.error("PLACE ORDER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

/* =========================
   ✅ CUSTOMER ORDERS
========================= */

export const getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      customerId: req.user._id,
    })
      .populate("productId")
      .populate("sellerId", "name email")
      .populate("buyerId", "name email")
      .sort({ createdAt: -1 });

    return res.json(orders);

  } catch (err) {
    console.error("CUSTOMER ORDERS ERROR:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* =========================
   ✅ SELLER ORDERS
========================= */

export const getSellerOrders = async (req, res) => {
  try {
    const seller = req.seller;

    if (!seller) {
      return res.status(401).json({
        message: "Seller not authenticated",
      });
    }

    const orders = await Order.find({
      sellerId: seller._id,
    })
      .populate("productId")
      .populate("customerId", "name email")
      .populate("buyerId", "name email country phone")
      .sort({ createdAt: -1 });

    return res.json(orders);

  } catch (err) {
    console.error("SELLER ORDERS ERROR:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* =========================
   ✅ PURCHASE HISTORY
========================= */

export const getPurchaseHistory = async (req, res) => {
  try {
    const orders = await Order.find({
      customerId: req.user._id,
    })
      .populate("productId")
      .populate("sellerId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);

  } catch (err) {
    console.error("PURCHASE HISTORY ERROR:", err);

    return res.status(500).json({
      message: "Server error fetching purchase history",
    });
  }
};

/* =========================
   ✅ GET INVOICE
========================= */

export const getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("productId")
      .populate("customerId", "name email")
      .populate("sellerId", "name email");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json({
      orderId: order._id,

      product: order.productId?.name || "Deleted Product",

      image: order.productId?.images?.[0] || "",

      customer: order.customerId,

      seller: order.sellerId,

      quantity: order.quantity,

      sellPrice: order.price,

      buyPrice: order.buyPrice,

      profit: order.price - order.buyPrice,

      paymentMethod: order.paymentMethod,

      status: order.status,

      shippingAddress: order.shippingAddress,

      createdAt: order.createdAt,
    });

  } catch (err) {
    console.error("GET INVOICE ERROR:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* =========================
   ✅ PICK ORDER
========================= */

export const pickOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const seller = req.seller;

    if (!seller) {
      return res.status(401).json({
        message: "Seller not authenticated",
      });
    }

    /* =========================
       ✅ FIND ORDER
    ========================= */

    const order = await Order.findById(orderId)
      .populate("productId");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    /* =========================
       ✅ SECURITY CHECK
    ========================= */

    if (!order.sellerId) {
      return res.status(400).json({
        message: "No seller assigned",
      });
    }

    if (
      order.sellerId.toString() !==
      seller._id.toString()
    ) {
      return res.status(403).json({
        message: "This order is not yours",
      });
    }

    /* =========================
       ✅ STATUS CHECK
    ========================= */

    if (order.status !== "pending") {
      return res.status(400).json({
        message: "Order already picked",
      });
    }

    /* =========================
       ✅ FIND SELLER PRODUCT
    ========================= */

    const sellerProduct = await SellerProduct.findOne({
      sellerId: seller._id,
      productId: order.productId._id,
    });

    if (!sellerProduct) {
      return res.status(404).json({
        message: "Seller product not found",
      });
    }

    const quantity = order.quantity || 1;

    /* =========================
       ✅ STOCK CHECK
    ========================= */

    if (sellerProduct.stock < quantity) {
      return res.status(400).json({
        message: "Not enough seller stock",
      });
    }

    /* =========================
       ✅ WALLET CHECK
    ========================= */

    const usdtBalance =
      seller?.wallet?.balances?.USDT || 0;

    if (usdtBalance < order.buyPrice) {
      return res.status(400).json({
        message: "Insufficient USDT balance",
      });
    }

    /* =========================
       ✅ DEDUCT STOCK
    ========================= */

    sellerProduct.stock -= quantity;

    if (sellerProduct.stock < 0) {
      sellerProduct.stock = 0;
    }

    await sellerProduct.save();

    /* =========================
       ✅ DEDUCT PRODUCT STOCK
    ========================= */

    const product = await Product.findById(
      order.productId._id
    );

    if (product) {
      product.stock -= quantity;

      if (product.stock < 0) {
        product.stock = 0;
      }

      await product.save();
    }

    /* =========================
       ✅ DEDUCT SELLER WALLET
    ========================= */

    seller.wallet.balances.USDT -= order.buyPrice;

    if (!seller.wallet.transactions) {
      seller.wallet.transactions = [];
    }

    seller.wallet.transactions.push({
      type: "debit",
      currency: "USDT",
      amount: order.buyPrice,
      note: `Picked order for ${product?.name}`,
    });

    await seller.save();

    /* =========================
       ✅ UPDATE ORDER
    ========================= */

    order.status = "processing";

    order.frozenAmount = order.price;

    order.deliveryDate = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000
    );

    await order.save();

    return res.json({
      success: true,
      message: "Order picked successfully",
      order,
    });

  } catch (err) {
    console.error("PICK ORDER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error while picking order",
      error: err.message,
    });
  }
};
