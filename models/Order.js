import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // Buyer who places the order
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Customer (receiver), usually same as buyer but could be different for gifting
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Product ordered
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

    // Seller of the product
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Quantity of the product
    quantity: { type: Number, default: 1 },

    // Status of order
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "completed", "cancelled"],
      default: "pending",
    },

    // Pricing
    price: { type: Number, required: true },      // Product price at time of order
    buyPrice: { type: Number, required: true },   // Cost price or seller payout
    frozenAmount: { type: Number, default: 0 },   // For escrow/frozen fund system

    // Delivery
    deliveryDate: Date,
    isPaid: { type: Boolean, default: false },

    // Shipping & address info
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: String,
      city: { type: String, required: true },
      state: String,
      country: { type: String, required: true },
      postalCode: String,
    },

    // Payment info
    paymentMethod: {
      type: String,
      enum: ["COD", "Credit Card", "PayPal", "Stripe", "Other"],
      default: "COD",
    },

    // Additional notes (optional)
    notes: { type: String },
  },
  { timestamps: true }
);

// Populate product, buyer, seller by default for convenience
orderSchema.pre(/^find/, function (next) {
  this.populate("productId").populate("buyerId").populate("sellerId");
  next();
});

export default mongoose.model("Order", orderSchema);
