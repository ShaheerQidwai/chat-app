import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const me = req.user.id;
    const users = await User.find({ _id: { $ne: me } }).select(
      "username email isOnline lastSeen"
    );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
