import User from "../models/User.js";
 import jwt from "jsonwebtoken";

// Get all seller requests (pending & approved)
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

// Approve seller
export const approveSeller = async (req, res) => {
  try {
    if (!req.user.isAdmin)
      return res.status(403).json({ message: "Unauthorized" });

    const seller = await User.findById(req.params.id);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    seller.isApproved = true;
    await seller.save();

    res.json({ message: "Seller approved successfully", seller });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject seller
export const rejectSeller = async (req, res) => {
  try {
    if (!req.user.isAdmin)
      return res.status(403).json({ message: "Unauthorized" });

    const seller = await User.findById(req.params.id);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    seller.isSeller = false;
    seller.isApproved = false;
    seller.shop = {};
    await seller.save();

    res.json({ message: "Seller rejected successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Login as seller (admin)
export const loginAsSeller = async (req, res) => {
  try {
    if (!req.user.isAdmin)
      return res.status(403).json({ message: "Unauthorized" });

    const seller = await User.findById(req.params.id);
    if (!seller || !seller.isSeller)
      return res.status(404).json({ message: "Seller not found" });

    // Create JWT token for seller
   
    const token = jwt.sign(
      {
        id: seller._id,
        isSeller: seller.isSeller,
        isApproved: seller.isApproved,
        isAdmin: seller.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, seller });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};
