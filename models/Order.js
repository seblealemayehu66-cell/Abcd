// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // virtual buyer
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // real customer
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // seller of the product
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true }, // selling price per unit
      },
    ],
    totalAmount: { type: Number, required: true }, // total selling price
    status: { type: String, enum: ["pending", "picked", "delivered"], default: "pending" },
    invoice: { type: Object }, // filled when seller picks the order
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
