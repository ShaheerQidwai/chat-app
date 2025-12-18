export interface User {
  _id: string;
  username: string;
  email: string;
  isOnline: boolean;
  lastSeen?: string;
  avatar?: string;
}

export interface Message {
  id: string;
  senderId: string;
  chatId: string;
  content: string;
  timestamp: string;
  readBy: string[];
  type: 'text' | 'image' | 'file';
  replyTo?: string;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  token: string;
}

export type TypingUser = {
  userId: string;
  chatId?: string;   // ✅ now it matches string | undefined
  username?: string; // keep optional if not always present
};



export interface Notification {
  id: string;
  type: 'message' | 'typing' | 'user_joined' | 'user_left';
  title: string;
  message: string;
  timestamp: string;
  chatId?: string;
  read: boolean;
}