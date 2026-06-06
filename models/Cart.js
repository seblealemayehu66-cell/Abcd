import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        // 🔥 ORIGINAL PRODUCT
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        // 🔥 IMPORTANT FIX
        sellerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        // 🔥 IMPORTANT FIX
        sellerProductId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SellerProduct",
          required: true,
        },

        quantity: {
          type: Number,
          default: 1,
        },

        size: String,

        color: String,

        // 🔥 SAVE PRICE SNAPSHOT
        price: {
          type: Number,
          default: 0,
        },
      },
    ],

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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Cart", cartSchema);
