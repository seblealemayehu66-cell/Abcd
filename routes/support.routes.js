import express from "express";
import SupportTicket from "../models/SupportTicket.js";
import verifyToken from "../middleware/verifyToken.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// ===============================
// MULTER CONFIG
// ===============================
const upload = multer({ storage: multer.memoryStorage() });

// ===============================
// GET USER TICKETS
// ===============================
router.get("/my-tickets", verifyToken, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({
      user: req.user._id,
    }).sort({ updatedAt: -1 });

    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

// ===============================
// CREATE TICKET
// ===============================
router.post("/create", verifyToken, async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({
      message: "Subject and message required",
    });
  }

  try {
    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      status: "Open",
      messages: [
        {
          sender: "user",
          message,
          createdAt: new Date(),
        },
      ],
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create ticket" });
  }
});

// ===============================
// SEND MESSAGE (TEXT + IMAGE)
// ===============================
router.post(
  "/:id/message",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message && !req.file) {
        return res.status(400).json({ message: "Message or image required" });
      }

      const ticket = await SupportTicket.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      let imageUrl = "";

      // Upload image to Cloudinary
      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "support" }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(req.file.buffer);
        });

        imageUrl = result.secure_url;
      }

      const newMsg = {
        sender: "user",
        message: message || "",
        image: imageUrl,
        createdAt: new Date(),
      };

      ticket.messages.push(newMsg);
      ticket.status = "Open";
      ticket.updatedAt = new Date();

      await ticket.save();

      res.json(newMsg);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to send message" });
    }
  }
);

export default router;