import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["direct", "group"],
    default: "direct",
  },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
