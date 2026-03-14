// controllers/adminController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const createVirtualBuyer = async (req, res) => {
  try {
    const { name, email, balance } = req.body;

    // check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // generate password
    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user
    const virtualBuyer = new User({
      name: name || "Virtual Buyer",
      email,
      password: hashedPassword,
      isVirtualBuyer: true,
      wallet: {
        balance: balance || 1000, // default balance if not provided
      },
    });

    await virtualBuyer.save();

    // send response exactly in the shape frontend expects
    res.status(201).json({
      buyer: {
        id: virtualBuyer._id,
        email: virtualBuyer.email,
        wallet: virtualBuyer.wallet.balance,
        password,
      },
    });
  } catch (err) {
    console.error("Create virtual buyer error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
