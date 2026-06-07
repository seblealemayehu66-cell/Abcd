import express from "express";
import Message from "../models/Message.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   ✅ SEND MESSAGE
========================= */
router.post("/send", authMiddleware, async (req, res) => {
  try {

    const sender = req.user.id;

    const { receiver, text } = req.body;

    /* =========================
       VALIDATION
    ========================= */

    if (!receiver || !text) {
      return res.status(400).json({
        message: "Receiver and text are required",
      });
    }

    /* =========================
       CREATE MESSAGE
    ========================= */

    const newMessage = await Message.create({
      sender,
      receiver,
      text,
    });

    /* =========================
       POPULATE
    ========================= */

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "name image")
      .populate("receiver", "name image");

    return res.status(201).json(populatedMessage);

  } catch (err) {

    console.log("SEND MESSAGE ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

/* =========================
   ✅ GET CHAT
========================= */
router.get("/:userId", authMiddleware, async (req, res) => {
  try {

    const currentUser = req.user.id;

    const otherUser = req.params.userId;

    const messages = await Message.find({
      $or: [
        {
          sender: currentUser,
          receiver: otherUser,
        },
        {
          sender: otherUser,
          receiver: currentUser,
        },
      ],
    })
      .populate("sender", "name image")
      .populate("receiver", "name image")
      .sort({ createdAt: 1 });

    return res.json(messages);

  } catch (err) {

    console.log("GET CHAT ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

/* =========================
   ✅ GET USER CONVERSATIONS
========================= */
router.get("/", authMiddleware, async (req, res) => {
  try {

    const currentUser = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUser },
        { receiver: currentUser },
      ],
    })
      .populate("sender", "name image")
      .populate("receiver", "name image")
      .sort({ updatedAt: -1 });

    /* =========================
       UNIQUE CONVERSATIONS
    ========================= */

    const conversationsMap = new Map();

    messages.forEach((msg) => {

      const otherUser =
        msg.sender._id.toString() === currentUser
          ? msg.receiver
          : msg.sender;

      if (!conversationsMap.has(otherUser._id.toString())) {
        conversationsMap.set(otherUser._id.toString(), {
          user: otherUser,
          lastMessage: msg,
        });
      }
    });

    return res.json(
      Array.from(conversationsMap.values())
    );

  } catch (err) {

    console.log("GET CONVERSATIONS ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

export default router;
