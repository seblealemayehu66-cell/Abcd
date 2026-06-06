import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // Virtual buyer / admin buyer
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Real customer
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Main product
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // 🔥 IMPORTANT NEW FIELD
    // Exact seller product selected
    sellerProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerProduct",
      required: true,
    },

    // Seller owner
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    // Customer selling price
    price: {
      type: Number,
      required: true,
    },

    // Seller purchase price
    buyPrice: {
      type: Number,
      required: true,
    },

    // Frozen seller money
    frozenAmount: {
      type: Number,
      default: 0,
    },

    deliveryDate: Date,

    isPaid: {
      type: Boolean,
      default: false,
    },

    shippingAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },

    paymentMethod: {
      type: String,
      enum: [
        "wallet",
        "usdt_trc20",
        "usdt_erc20",
        "Credit Card",
        "COD",
      ],
      default: "wallet",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", orderSchema);
