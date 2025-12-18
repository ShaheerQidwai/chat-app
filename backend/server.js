import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import createMessageRoutes from "./routes/messageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import Message from "./models/Message.js";
import groupRoutes from "./routes/groupRoutes.js";
import User from "./models/User.js";
import userRoutes from "./routes/userRoutes.js";
import GroupMessage from "./models/GroupMessage.js";
import jwt from "jsonwebtoken";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// --- REST routes that don't need io ---

app.use("/api/chats", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: `Hello, ${req.user.username}. You are authorized!` });
});

// --- MongoDB connection ---
await mongoose.connect(process.env.MONGO_URI);
console.log("MongoDB Connected ✅");

// --- HTTP + Socket.IO ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true, credentials: true, methods: ["GET", "POST"] },
});

async function sendMissedMessages(userId) {
  const messages = await Message.find({
    receiver: userId,
    read: false,
  }).populate([
    { path: "sender", select: "username email" },
    { path: "receiver", select: "username email" },
  ]);

  messages.forEach((msg) => io.to(userId).emit("message:receive", msg));
}

// --- Socket.IO authentication ---
io.use((socket, next) => {
  try {
    const tokenA = socket.handshake.auth?.token;
    const authHeader = socket.handshake.headers?.authorization;
    const tokenB = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    const token = tokenA || tokenB;
    if (!token) return next(new Error("No auth token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// --- Helper: set user presence ---
async function setPresence(userId, online) {
  await User.findByIdAndUpdate(
    userId,
    online ? { isOnline: true } : { isOnline: false, lastSeen: new Date() },
    { new: true }
  );
  io.emit("user:presence", { userId, isOnline: online });
}

// --- REST routes that require io ---
app.use("/api/messages", createMessageRoutes(io));
app.use("/api/groups", groupRoutes);

// --- Socket.IO events ---
io.on("connection", async (socket) => {
  const { id: userId, username } = socket.user;
  socket.join(userId);

  await setPresence(userId, true);
  await sendMissedMessages(userId);

  console.log(`🔌 ${username} connected (${userId})`);

  // Send message
  socket.on("message:send", async (payload, ack) => {
    try {
      const { to, content } = payload || {};
      if (!to || !content) throw new Error("to and content are required");

      const msg = await Message.create({
        sender: userId,
        receiver: to,
        content,
        read: false,
        readAt: null,
      });

      const doc = await msg.populate([
        { path: "sender", select: "username email" },
        { path: "receiver", select: "username email" },
      ]);

      io.to(to).emit("message:receive", doc);
      io.to(userId).emit("message:sent", doc);

      if (ack) ack({ ok: true, id: doc._id });
    } catch (err) {
      if (ack) ack({ ok: false, error: err.message });
    }
  });

  // Add reactions via socket
  socket.on("message:react", async ({ messageId, emoji }, ack) => {
    try {
      const msg = await Message.findByIdAndUpdate(
        messageId,
        { $push: { reactions: { user: userId, emoji } } },
        { new: true }
      ).populate([
        { path: "sender", select: "username email" },
        { path: "receiver", select: "username email" },
      ]);

      if (msg) {
        io.to(msg.sender.toString()).emit("message:reaction", msg);
        io.to(msg.receiver.toString()).emit("message:reaction", msg);
        if (ack) ack({ ok: true });
      } else {
        if (ack) ack({ ok: false, error: "Message not found" });
      }
    } catch (err) {
      if (ack) ack({ ok: false, error: err.message });
    }
  });

  // Mark as read
  socket.on("message:read", async ({ messageId }, ack) => {
    try {
      const msg = await Message.findByIdAndUpdate(
        messageId,
        { read: true, readAt: new Date() },
        { new: true }
      );

      if (msg) {
        io.to(msg.sender.toString()).emit("message:read", {
          messageId: msg._id,
          reader: userId,
          readAt: msg.readAt,
        });
        if (ack) ack({ ok: true });
      } else {
        if (ack) ack({ ok: false, error: "Message not found" });
      }
    } catch (err) {
      if (ack) ack({ ok: false, error: err.message });
    }
  });

  // Typing indicators
  socket.on("typing", ({ to }) => {
    if (to) io.to(to).emit("typing", { from: userId });
  });
  socket.on("stop_typing", ({ to }) => {
    if (to) io.to(to).emit("stop_typing", { from: userId });
  });

  // Join group room
  socket.on("group:join", ({ groupId }) => {
    socket.join(groupId);
  });

  // Send message to group
  socket.on("group:message:send", async ({ groupId, content }, ack) => {
    try {
      if (!groupId || !content) throw new Error("groupId and content required");

      const msg = await GroupMessage.create({
        group: groupId,
        sender: userId,
        content,
        readBy: [userId], // sender has read
      });

      const doc = await msg.populate([
        { path: "sender", select: "username email" },
        { path: "group", select: "name" },
      ]);

      // Emit to all group members
      io.to(groupId).emit("group:message:receive", doc);

      if (ack) ack({ ok: true, id: doc._id });
    } catch (err) {
      if (ack) ack({ ok: false, error: err.message });
    }
  });

  // Mark group message as read
  socket.on("group:message:read", async ({ messageId }, ack) => {
    try {
      const msg = await GroupMessage.findByIdAndUpdate(
        messageId,
        { $addToSet: { readBy: userId } },
        { new: true }
      );

      if (msg) {
        io.to(msg.group.toString()).emit("group:message:read", {
          messageId: msg._id,
          reader: userId,
        });

        if (ack) ack({ ok: true });
      } else {
        if (ack) ack({ ok: false, error: "Message not found" });
      }
    } catch (err) {
      if (ack) ack({ ok: false, error: err.message });
    }
  });

  // Disconnect
  socket.on("disconnect", async () => {
    await setPresence(userId, false);
    console.log(`❌ ${username} disconnected`);
  });
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
