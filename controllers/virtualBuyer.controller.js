import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const createVirtualBuyer = async (req, res) => {
  try {
    const email = `buyer${Date.now()}@virtual.market`;
    const password = "virtual123";

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const virtualBuyer = new User({
      name: "Virtual Buyer",
      email,
      password: hashedPassword,
      isVirtualBuyer: true,
      wallet: 1000
    });

    await virtualBuyer.save();

    res.json({ message: "Virtual buyer created", virtualBuyer });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};