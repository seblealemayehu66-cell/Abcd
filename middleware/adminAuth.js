import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function adminAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "No token",
    });
  }

  try {
    const token = header.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        message: "Admin access only",
      });
    }

    req.user = user;
    req.admin = user;

    next();

  } catch (err) {

    console.log(err);

    return res.status(401).json({
      message: "Invalid token",
    });

  }
}
