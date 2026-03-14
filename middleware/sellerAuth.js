// middleware/sellerAuth.js
import Seller from "../models/Seller.js";

export const sellerAuth = async (req, res, next) => {
  try {
    const sellerId = req.headers["x-seller-id"];
    if (!sellerId) return res.status(400).json({ error: "Seller ID missing" });

    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(403).json({ error: "Seller not found" });
    if (!seller.isApproved) return res.status(403).json({ error: "Seller not approved" });

    req.seller = seller;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error in sellerAuth" });
  }
};
