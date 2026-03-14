import User from "../models/User.js";

export const sellerAuth = async (req, res, next) => {
  try {
    const sellerId = req.headers["x-seller-id"];

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID missing" });
    }

    const seller = await User.findById(sellerId);

    if (!seller) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!seller.isSeller) {
      return res.status(403).json({ error: "User is not a seller" });
    }

    if (!seller.isApproved) {
      return res.status(403).json({ error: "Seller not approved yet" });
    }

    req.seller = seller;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Seller authentication failed" });
  }
};
