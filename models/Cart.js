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
        // ORIGINAL PRODUCT
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        // SELLER
       sellerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

        // OPTIONAL
        // only exists if product came from SellerProduct
        sellerProductId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SellerProduct",
          default: null,
        },

        quantity: {
          type: Number,
          default: 1,
        },

        size: {
          type: String,
          default: "",
        },

        color: {
          type: String,
          default: "",
        },

        // PRICE SNAPSHOT
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
