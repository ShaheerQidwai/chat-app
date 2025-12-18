import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    attachments: [{ url: String, type: String }],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String,
      },
    ],
  },
  { timestamps: true } // <-- THIS
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
