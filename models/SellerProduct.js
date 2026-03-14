import mongoose from "mongoose";

const sellerProductSchema = new mongoose.Schema({

  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },

  price: Number,

  stock: Number,

}, { timestamps: true });

export default mongoose.model("SellerProduct", sellerProductSchema);