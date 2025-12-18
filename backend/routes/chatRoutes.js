import express from "express";
import Chat from "../models/Chats.js";
import protect from "../middleware/authMiddleware.js";
const router = express.Router();

// Get all chats for logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({ participants: userId })
      .populate("participants", "_id username email isOnline")
      .sort({ createdAt: -1 });

    res.json({ chats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// Create or get existing direct chat
router.post("/direct/:otherUserId", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.otherUserId;

    // Check if chat already exists
    let chat = await Chat.findOne({
      type: "direct",
      participants: { $all: [userId, otherUserId] },
    }).populate("participants", "_id username email isOnline");

    if (!chat) {
      chat = new Chat({
        type: "direct",
        participants: [userId, otherUserId],
      });
      await chat.save();
      chat = await chat.populate("participants", "_id username email isOnline");
    }

    res.json({ chat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create chat" });
  }
});

export default router;
