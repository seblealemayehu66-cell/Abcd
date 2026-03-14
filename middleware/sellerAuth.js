import Seller from "../models/Seller.js";

export const sellerAuth = async (req, res, next) => {
  const userId = req.user.id; // from your normal JWT auth middleware
  const seller = await Seller.findOne({ userId });
  if (!seller) return res.status(403).json({ error: "You are not a seller" });
  if (!seller.isApproved) return res.status(403).json({ error: "Seller not approved" });

  req.seller = seller; // attach seller info
  next();
};
