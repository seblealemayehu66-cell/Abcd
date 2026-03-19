import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
{
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

  // ✅ FIX: NOT REQUIRED
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  quantity: { type: Number, default: 1 },

  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "completed", "cancelled"],
    default: "pending",
  },

  price: { type: Number, required: true },
  buyPrice: { type: Number, required: true },
  frozenAmount: { type: Number, default: 0 },

  deliveryDate: Date,
  isPaid: { type: Boolean, default: false },

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

  // ✅ FIX: ADD YOUR METHODS
  paymentMethod: {
    type: String,
    enum: [
      "wallet",
      "usdt_trc20",
      "usdt_erc20",
      "Credit Card",
      "COD"
    ],
    default: "wallet",
  },

},
{ timestamps: true }
);

// ✅ FIX: ADD next
orderSchema.pre(/^find/, function (next) {
  this.populate("productId")
      .populate("buyerId")
      .populate("sellerId");
  next();
});

export default mongoose.model("Order", orderSchema);
