import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  image: {
    type: String
  },

  description: {
    type: String
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isPublished: { type: Boolean, default: false },

}, { timestamps: true });

export default mongoose.model("Product", productSchema);