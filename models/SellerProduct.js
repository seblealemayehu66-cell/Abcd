import mongoose from "mongoose";

const sellerProductSchema = new mongoose.Schema(
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

    stock: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// جلوگیری از duplicate (same seller + same product)
sellerProductSchema.index({ sellerId: 1, productId: 1 }, { unique: true });

export default mongoose.model("SellerProduct", sellerProductSchema);
