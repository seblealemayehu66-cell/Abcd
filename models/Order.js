import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // virtual buyer
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // real customer
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    status: { type: String, default: "pending" }, // pending, picked, delivery, completed
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);