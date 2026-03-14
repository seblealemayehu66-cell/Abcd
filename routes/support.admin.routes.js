import express from "express";
import SupportTicket from "../models/SupportTicket.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// ===============================
// MULTER CONFIG
// ===============================
const upload = multer({ storage: multer.memoryStorage() });

/**
 * GET ALL TICKETS
 */
router.get("/tickets", verifyAdmin, async (req, res) => {
  const tickets = await SupportTicket.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json(tickets);
});

/**
 * GET SINGLE TICKET
 */
router.get("/tickets/:id", verifyAdmin, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ADMIN REPLY (TEXT + IMAGE)
 */
router.post(
  "/tickets/:id/reply",
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message && !req.file) {
        return res.status(400).json({ message: "Message or image required" });
      }

      const ticket = await SupportTicket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      let imageUrl = "";

      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "support-admin" }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(req.file.buffer);
        });

        imageUrl = result.secure_url;
      }

      const newMsg = {
        sender: "admin",
        message: message || "",
        image: imageUrl,
        createdAt: new Date(),
      };

      ticket.messages.push(newMsg);
      ticket.status = "Open";

      await ticket.save();

      res.json(newMsg);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to send reply" });
    }
  }
);

/**
 * CLOSE TICKET
 */
router.post("/tickets/:id/close", verifyAdmin, async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  ticket.status = "Closed";
  await ticket.save();

  res.json(ticket);
});

export default router;