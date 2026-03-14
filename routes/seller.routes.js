import express from "express";
import User from "../models/User.js";
import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


// Register shop
router.post(
  "/register-shop",
  authMiddleware,
  upload.single("idDocument"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user as seller
      user.isSeller = true;
      user.isApproved = false;

      user.shop = {
        name: req.body.shopName,
        photo: "", // optional if you add shop photo later
        idDocument: req.file?.path,
        invitationCode: req.body.invitationCode,
        contact: req.body.emergencyContact,
        address: req.body.address
      };

      await user.save();

      res.json({
        message: "Shop registration submitted successfully. Waiting for admin approval."
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// Admin: Get pending sellers
router.get("/pending", authMiddleware, async (req, res) => {
  try {

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const pendingSellers = await User.find({
      isSeller: true,
      isApproved: false
    });

    res.json(pendingSellers);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// Admin: Approve seller
router.put("/approve/:id", authMiddleware, async (req, res) => {
  try {

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isApproved = true;

    await user.save();

    res.json({
      message: "Seller approved successfully",
      user
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


export default router;