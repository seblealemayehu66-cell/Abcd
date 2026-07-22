import express from "express";
import Message from "../models/Message.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   SEND MESSAGE
========================= */
router.post("/send", authMiddleware, async (req, res) => {
  try {

    const sender = req.user.id;

    // ✅ ADD productId
    const { receiver, text, productId } = req.body;

    if (!receiver || !text || !productId) {
      return res.status(400).json({
        message: "Receiver, text and productId required",
      });
    }

    const newMessage = await Message.create({
      sender,
      receiver,
      text,
      productId, // ✅ SAVE PRODUCT
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "name image")
      .populate("receiver", "name image")
      .populate("productId", "name images");

    return res.status(201).json(populatedMessage);

  } catch (err) {

    console.log("SEND MESSAGE ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

/* =========================
   GET CHAT
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
      .populate("productId", "name images")
      .sort({ createdAt: -1 });

    const conversations = [];

    for (const msg of messages) {

      if (!msg.productId) continue;

      const otherUser =
        msg.sender._id.toString() === currentUser
          ? msg.receiver
          : msg.sender;

      if (!otherUser) continue;

      const exists = conversations.find((c) => {
        return (
          c.user._id.toString() === otherUser._id.toString() &&
          c.product._id.toString() === msg.productId._id.toString()
        );
      });

      if (!exists) {
        conversations.push({
          user: otherUser,
          product: msg.productId,
          lastMessage: msg,
        });
      }
    }

    res.json(conversations);

  } catch (err) {
    console.log("GET CONVERSATIONS ERROR");
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
});
router.get("/:userId/:productId", authMiddleware, async (req, res) => {
  try {

    const currentUser = req.user.id;

    const otherUser = req.params.userId;

    // ✅ GET PRODUCT
    const productId = req.params.productId;

    const messages = await Message.find({
      productId, // ✅ FILTER PRODUCT
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
      .populate("productId", "name images")
      .sort({ createdAt: 1 });

    return res.json(messages);

  } catch (err) {

    console.log("GET CHAT ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

export default router;
