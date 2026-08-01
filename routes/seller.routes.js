import express from "express";
import User from "../models/User.js";
import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

/* =====================================================
   REGISTER SHOP
===================================================== */

router.post(
  "/register-shop",
  authMiddleware,
  upload.single("idDocument"),
  async (req, res) => {
    try {
      const validInvitationCodes = [
        "MR40699rMReg",
        "MR7810Stt7yY",
        "MR6290Dd43M",
        "MR1845Rr92FM",
        "MR67018Hh623",
      ];

      // Validate invitation code
      if (!validInvitationCodes.includes(req.body.invitationCode)) {
        return res.status(400).json({
          message: "Wrong invitation code",
        });
      }

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Already waiting for approval
      if (user.sellerStatus === "pending") {
        return res.status(400).json({
          message: "Your seller application is already pending.",
        });
      }

      // Already approved
      if (user.sellerStatus === "approved") {
        return res.status(400).json({
          message: "You are already an approved seller.",
        });
      }

      // If previously rejected, allow a fresh application.
      // The new application will overwrite the old one.
      if (user.sellerStatus === "rejected") {
        user.isSeller = false;
        user.isApproved = false;
      }

      // Save new application
      user.isSeller = true;
      user.isApproved = false;
      user.sellerStatus = "pending";

      user.shop = {
        name: req.body.shopName,
        photo: "",
        idDocument: req.file?.path || "",
        invitationCode: req.body.invitationCode,
        contact: req.body.emergencyContact,
        address: req.body.address,
      };

      await user.save();

      res.json({
        message:
          "Shop registration submitted successfully. Waiting for admin approval.",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);
/* =====================================================
   ADMIN: GET PENDING SELLERS
===================================================== */

router.get("/pending", authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const pendingSellers = await User.find({
      sellerStatus: "pending",
    });

    res.json(pendingSellers);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

/* =====================================================
   ADMIN: APPROVE SELLER
===================================================== */

router.put("/approve/:id", authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.isSeller = true;
    user.isApproved = true;
    user.sellerStatus = "approved";

    await user.save();

    res.json({
      message: "Seller approved successfully",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

/* =====================================================
   ADMIN: REJECT SELLER
===================================================== */

router.put("/reject/:id", authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.isSeller = false;
    user.isApproved = false;
    user.sellerStatus = "rejected";

    // Keep the application information so the frontend
    // can show the rejected status. When the seller
    // applies again, register-shop will overwrite it.

    await user.save();

    res.json({
      message: "Seller rejected successfully.",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

export default router;
