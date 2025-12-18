import { io, Socket } from "socket.io-client";
import { Message } from "../types";

class SocketService {
  public socket: Socket | null = null;

  connect(token: string) {
    this.socket = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("✅ Connected to server");
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
    });

    this.socket.on("error", (error) => {
      console.error("⚠️ Socket error:", error);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  // --- MESSAGES ---
  // --- SEND / READ ---
  sendMessage(message: Omit<Message, "id" | "timestamp">) {
    this.socket?.emit("send_message", message);
  }

  markAsRead(messageId: string, userId: string) {
    this.socket?.emit("mark_as_read", { messageId, userId });
  }

  onMessageReceived(callback: (message: Message) => void) {
    this.socket?.on("message:receive", callback);
  }

  onMessageSent(callback: (message: Message) => void) {
    this.socket?.on("message:sent", callback);
  }

  onMessageRead(callback: (data: { messageId: string; reader: string; readAt: string }) => void) {
    this.socket?.on("message:read", callback);
  }

  onMessageReaction(callback: (message: Message) => void) {
    this.socket?.on("message:reaction", callback);
  }

  // --- TYPING ---
  startTyping(chatId: string) {
    this.socket?.emit("start_typing", { chatId });
  }

  stopTyping(chatId: string) {
    this.socket?.emit("stop_typing", { chatId });
  }

// inside socketService class (TypeScript)

  // Normalized typing listener: accepts multiple backend shapes
  onUserTyping(callback: (data: { userId: string; chatId?: string }) => void) {
    const handler = (payload: any) => {
      if (!payload) return;
      // payload might be: { userId, chatId }, or { from }, or { sender }, etc.
      const userId = payload.userId ?? payload.from ?? payload.sender ?? payload.user ?? null;
      const chatId = payload.chatId ?? payload.chat ?? payload.room ?? null;
      if (!userId) return;
      callback({ userId, chatId: chatId ?? undefined });
    };

    this.socket?.on("user_typing", handler);
    this.socket?.on("typing", handler);
  }

  onUserStoppedTyping(callback: (data: { userId: string; chatId?: string }) => void) {
    const handler = (payload: any) => {
      if (!payload) return;
      const userId = payload.userId ?? payload.from ?? payload.sender ?? payload.user ?? null;
      const chatId = payload.chatId ?? payload.chat ?? payload.room ?? null;
      if (!userId) return;
      callback({ userId, chatId: chatId ?? undefined });
    };

    this.socket?.on("user_stopped_typing", handler);
    this.socket?.on("stop_typing", handler); // listen for legacy name too
  }

  // --- PRESENCE ---
  onUserOnline(callback: (userId: string) => void) {
    this.socket?.on("user_online", callback);
  }

  onUserOffline(callback: (userId: string) => void) {
    this.socket?.on("user_offline", callback);
  }

  joinChat(chatId: string) {
    this.socket?.emit("join_chat", { chatId });
  }

  leaveChat(chatId: string) {
    this.socket?.emit("leave_chat", { chatId });
  }
}

export const socketService = new SocketService();
