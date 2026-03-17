import mongoose from "mongoose";

const sellerCartSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    quantity: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

export default mongoose.model("SellerCart", sellerCartSchema);
