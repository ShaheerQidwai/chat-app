import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import Group from "../models/Group.js";
import GroupMessage from "../models/GroupMessage.js";

const router = express.Router();

// Create a new group
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, members } = req.body;
    const createdBy = req.user.id;

    if (!name || !members || !members.length)
      return res.status(400).json({ error: "Name and members required" });

    const group = await Group.create({ name, members, createdBy });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get groups for user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get group messages
router.get("/:groupId/messages", authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await GroupMessage.find({ group: groupId })
      .sort({ createdAt: 1 })
      .populate("sender", "username email");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
