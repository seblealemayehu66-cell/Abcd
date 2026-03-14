import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../config/cloudinary.js";

// --------------------------
// REGISTER USER
// --------------------------
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword });

    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------------
// LOGIN USER / ADMIN
// --------------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isSeller: user.isSeller,
        isApproved: user.isApproved,
        isVirtualBuyer: user.isVirtualBuyer || false,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------------
// REGISTER SHOP (Seller Request)
// --------------------------
export const registerShop = async (req, res) => {
  try {
    const { userId, shopName, invitationCode, contact, address } = req.body;

    // Upload shop photo to Cloudinary
    const shopPhoto = req.body.photo; // base64 or URL
    const uploadedPhoto = await cloudinary.uploader.upload(shopPhoto, {
      folder: "shops",
    });

    // Upload ID document to Cloudinary
    const idDoc = req.body.idDocument; // base64 or URL
    const uploadedIdDoc = await cloudinary.uploader.upload(idDoc, {
      folder: "shops",
    });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isSeller = true;
    user.isApproved = false; // pending admin approval
    user.shop = {
      name: shopName,
      photo: uploadedPhoto.secure_url,
      idDocument: uploadedIdDoc.secure_url,
      invitationCode,
      contact,
      address,
    };

    await user.save();
    res.json({
      message: "Shop registration submitted, waiting for admin approval",
      shop: user.shop,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// --------------------------
// GET ALL PENDING SELLER REQUESTS (Admin)
// --------------------------
export const getAllSellers = async (req, res) => {
  try {
    if (!req.user.isAdmin)
      return res.status(403).json({ message: "Unauthorized" });

    const sellers = await User.find({ isSeller: true }).select(
      "name email isApproved shop"
    );
    res.json(sellers);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------------
// APPROVE SELLER (Admin)
// --------------------------
export const approveSeller = async (req, res) => {
  try {
    if (!req.user.isAdmin)
      return res.status(403).json({ message: "Unauthorized" });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isApproved = true;
    await user.save();
    res.json({ message: "Seller approved", seller: user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const rejectSeller = async (req, res) => {
  try {
    if (!req.user.isAdmin)
      return res.status(403).json({ message: "Unauthorized" });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.remove(); // delete seller
    res.json({ message: "Seller rejected and removed" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};
// Admin login as seller
export const loginAsSeller = async (req, res) => {
  try {
    if (!req.user.isAdmin)
      return res.status(403).json({ message: "Unauthorized" });

    const sellerId = req.params.userId;
    const seller = await User.findById(sellerId);
    if (!seller || !seller.isSeller)
      return res.status(404).json({ message: "Seller not found" });

    // Create a JWT token for seller session
    const token = jwt.sign(
      { id: seller._id, isAdmin: seller.isAdmin, isSeller: seller.isSeller },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        isAdmin: seller.isAdmin,
        isSeller: seller.isSeller,
        isApproved: seller.isApproved,
        shop: seller.shop,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ wallet: user.wallet });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------------
// CREATE VIRTUAL BUYER (Admin)
// --------------------------
export const createVirtualBuyer = async (req, res) => {
  try {
    const { name, email, balance } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const password = Math.random().toString(36).slice(-8); // auto generate password
    const hashedPassword = await bcrypt.hash(password, 10);

    const virtualBuyer = new User({
      name,
      email,
      password: hashedPassword,
      isVirtualBuyer: true,
      wallet: {
  balance: balance || 0,
  transactions: []
},
    });

    await virtualBuyer.save();

    res.json({
      message: "Virtual buyer created",
      buyer: { id: virtualBuyer._id, email: virtualBuyer.email, wallet: virtualBuyer.wallet, password },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};