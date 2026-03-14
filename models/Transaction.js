import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,
  type: { type: String, enum: ["deposit", "withdraw", "order"] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Transaction", transactionSchema);