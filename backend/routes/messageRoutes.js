import express from "express";
import Message from "../models/Message.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// We'll export a function that takes `io`
export default function (io) {
  // GET messages with a user
  router.get("/:otherUserId", authMiddleware, async (req, res) => {
    try {
      const me = req.user.id;
      const { otherUserId } = req.params;
      const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);
      let before = new Date();

      if (req.query.before) {
        const parsed = new Date(req.query.before);
        if (!isNaN(parsed.getTime())) {
          before = parsed;
        }
      }

      const messages = await Message.find({
        $or: [
          { sender: me, receiver: otherUserId },
          { sender: otherUserId, receiver: me },
        ],
        createdAt: { $lte: before },
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate([
          { path: "sender", select: "username email" },
          { path: "receiver", select: "username email" },
        ]);

      res.json({ messages: messages.reverse() }); // oldest -> newest
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/messages - send a message
  router.post("/", authMiddleware, async (req, res) => {
    try {
      const sender = req.user.id;
      const { receiver, content } = req.body;
      if (!receiver || !content) {
        return res
          .status(400)
          .json({ error: "Receiver and content are required" });
      }

      const msg = await Message.create({
        sender,
        receiver,
        content,
        read: false,
        readAt: null,
      });

      const doc = await msg.populate([
        { path: "sender", select: "username email" },
        { path: "receiver", select: "username email" },
      ]);

      // Emit real-time event
      io.to(receiver).emit("message:receive", doc);
      io.to(sender).emit("message:sent", doc); // optional echo back

      res.status(201).json(doc);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/messages/:id/read - mark message as read via REST
  router.patch("/:id/read", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const msg = await Message.findByIdAndUpdate(
        req.params.id,
        { read: true, readAt: new Date() },
        { new: true }
      );

      if (!msg) return res.status(404).json({ error: "Message not found" });

      // Emit read receipt
      io.to(msg.sender.toString()).emit("message:read", {
        messageId: msg._id,
        reader: userId,
        readAt: msg.readAt,
      });

      res.json({ ok: true, message: msg });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/messages/:id/react
  router.post("/:id/react", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
      const { emoji } = req.body;
      const msg = await Message.findByIdAndUpdate(
        req.params.id,
        { $push: { reactions: { user: userId, emoji } } },
        { new: true }
      ).populate([
        { path: "sender", select: "username email" },
        { path: "receiver", select: "username email" },
      ]);

      if (!msg) return res.status(404).json({ error: "Message not found" });

      io.to(msg.sender.toString()).emit("message:reaction", msg);
      io.to(msg.receiver.toString()).emit("message:reaction", msg);

      res.json({ ok: true, message: msg });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
