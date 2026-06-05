import express from "express";
import Message from "../models/Message.js";

const router = express.Router();


// SEND MESSAGE
router.post("/send", async (req, res) => {
  try {

    const { sender, receiver, text } = req.body;

    const newMessage = await Message.create({
      sender,
      receiver,
      text,
    });

    const populatedMessage = await Message.findById(
      newMessage._id
    )
      .populate("sender", "name image")
      .populate("receiver", "name image");

    res.json(populatedMessage);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});


// GET CHAT MESSAGES
router.get("/:user1/:user2", async (req, res) => {
  try {

    const { user1, user2 } = req.params;

    const messages = await Message.find({
      $or: [
        {
          sender: user1,
          receiver: user2,
        },
        {
          sender: user2,
          receiver: user1,
        },
      ],
    })
      .populate("sender", "name image")
      .populate("receiver", "name image")
      .sort({ createdAt: 1 });

    res.json(messages);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

export default router;
