import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
{
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  quantity: { type: Number, default: 1 },

  status: {
    type: String,
    enum: ["pending", "delivery", "completed"],
    default: "pending"
  },

  price: { type: Number, required: true },
  buyPrice: { type: Number, required: true },

  frozenAmount: { type: Number, default: 0 },
  deliveryDate: Date,
  isPaid: { type: Boolean, default: false }

},
{ timestamps: true }
);

export default mongoose.model("Order", orderSchema);
