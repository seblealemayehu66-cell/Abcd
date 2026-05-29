import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

import {
  register,
  login
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

// ================= GET CURRENT USER =================
router.get("/me", async (req, res) => {

  try {

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided"
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(user);

  } catch (error) {

    console.log(error);

    res.status(401).json({
      message: "Invalid token"
    });

  }

});

export default router;
