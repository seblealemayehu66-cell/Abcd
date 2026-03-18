// models/User.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ["credit", "debit"], required: true },
  amount: { type: Number, required: true },
  note: { type: String },
  date: { type: Date, default: Date.now },
});

const walletSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 },
  transactions: { type: [transactionSchema], default: [] },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "/avatar.png" },
    wallet: { type: walletSchema, default: () => ({}) }, // updated
    isAdmin: { type: Boolean, default: false },
    country: {
  type: String,
  default: "Unknown",
},

phone: {
  type: String,
  default: "",
},

    // Seller fields
    isSeller: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isVirtualBuyer: { type: Boolean, default: false },
    shop: {
      name: { type: String },
      photo: { type: String },
      idDocument: { type: String },
      invitationCode: { type: String },
      contact: { type: String },
      address: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
