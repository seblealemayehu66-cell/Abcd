// middleware/sellerAuth.js
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const sellerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No token provided" });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const sellerId = decoded.id;

    const seller = await User.findById(sellerId);

    if (!seller) return res.status(404).json({ error: "User not found" });
    if (!seller.isSeller) return res.status(403).json({ error: "User is not a seller" });
    if (!seller.isApproved) return res.status(403).json({ error: "Seller not approved yet" });

    req.seller = seller; // attach seller to request
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: "Seller authentication failed" });
  }
};
