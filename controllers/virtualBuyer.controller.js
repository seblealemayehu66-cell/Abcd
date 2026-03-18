// controllers/adminController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// 🌍 Country list
const countries = [
  "USA",
  "UK",
  "Canada",
  "Germany",
  "France",
  "India",
  "Brazil",
  "UAE",
  "Ethiopia",
  "China",
];

// 📞 Phone generator
const generatePhone = () => {
  return "+1" + Math.floor(1000000000 + Math.random() * 9000000000);
};

// 🌍 Random country
const generateCountry = () => {
  return countries[Math.floor(Math.random() * countries.length)];
};

export const createVirtualBuyer = async (req, res) => {
  try {
    const { name, email, balance, country, phone } = req.body;

    // ✅ Check email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // 🔐 Generate password
    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    // 👤 Generate name from email if not provided
    const generatedName =
      name ||
      email
        .split("@")[0]
        .replace(/\./g, " ")
        .replace(/\d+/g, "")
        .replace(/^\w/, (c) => c.toUpperCase());

    // 🌍 Use provided OR random
    const finalCountry = country || generateCountry();
    const finalPhone = phone || generatePhone();

    // 🧾 Create user
    const virtualBuyer = new User({
      name: generatedName,
      email,
      password: hashedPassword,
      isVirtualBuyer: true,
      isSeller: true,
      isApproved: true,

      country: finalCountry,
      phone: finalPhone,

      wallet: {
        balance: balance || 1000,
      },
    });

    await virtualBuyer.save();

    // 📦 Response
    res.status(201).json({
      buyer: {
        id: virtualBuyer._id,
        name: virtualBuyer.name,
        email: virtualBuyer.email,
        password,
        wallet: virtualBuyer.wallet.balance,
        country: virtualBuyer.country,
        phone: virtualBuyer.phone,
      },
    });
  } catch (err) {
    console.error("Create virtual buyer error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
export const updateVirtualBuyer = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;

    const buyer = await User.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );

    if (!buyer) return res.status(404).json({ message: "Buyer not found" });

    res.json({ buyer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
