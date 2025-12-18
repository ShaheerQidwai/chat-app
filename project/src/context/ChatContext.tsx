import React, { createContext, useContext, useEffect, useState } from 'react';
import { Chat, Message, User, TypingUser, Notification } from '../types';
import { useAuth } from './AuthContext';
import { socketService } from '../services/socketService';

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  messages: { [chatId: string]: Message[] };
  setMessages: React.Dispatch<React.SetStateAction<{ [chatId: string]: Message[] }>>;
  users: User[];
  typingUsers: TypingUser[];
  notifications: Notification[];
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (chatId: string, content: string, type?: 'text' | 'image' | 'file') => void;
  markMessageAsRead: (messageId: string) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  searchMessages: (query: string, chatId?: string) => Promise<Message[]>;
  createGroupChat: (name: string, participants: string[]) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  clearNotifications: () => void;
  loadChats: () => Promise<void>;
  loadUsers: () => Promise<void>;
  setChats: (chats : Chat[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user,token } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>({});
  const [users, setUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);


useEffect(() => {
  if (!user) return;

  const initialize = async () => {
    // Load chats and users from API
    await loadChats();
    await loadUsers();

    // Connect to socket
    try {
      socketService.connect(user.token);

      // New message listener
      socketService.onMessageReceived((message: Message) => {
        setMessages(prev => ({
          ...prev,
          [message.chatId]: [...(prev[message.chatId] || []), message],
        }));
  
        // Update chat's last message
        setChats(prev => prev.map(chat => 
          chat.id === message.chatId 
            ? { ...chat, lastMessage: message, unreadCount: chat.unreadCount + 1 }
            : chat
        ));

        // Add notification
        setUsers((currentUsers) => {
          const sender = currentUsers.find(u => u._id === message.senderId);
          if (message.senderId !== user.id && (!activeChat || activeChat.id !== message.chatId)) {
            addNotification({
              type: 'message',
              title: sender?.username || 'Unknown User',
              message: message.content,
              chatId: message.chatId,
              read: false
            });
          }
          return currentUsers;
        });
      });

      // Online/offline status
      socketService.onUserOnline((userId) => {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, isOnline: true } : u));
      });
      socketService.onUserOffline((userId) => {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, isOnline: false } : u));
      });

      // Typing events
      socketService.onUserTyping((data) => {
        // data: { userId: string, chatId?: string }
        if (!data?.userId) return;
        if (!user) return;
        // ignore our own typing events
        if (data.userId === user.id) return;

        setTypingUsers(prev => {
          const exists = prev.find(u => u.userId === data.userId && u.chatId === data.chatId);
          if (exists) return prev;
          return [...prev, { userId: data.userId, chatId: data.chatId }];
        });
      });
        socketService.onUserStoppedTyping((data) => {
          if (!data?.userId) return;
          setTypingUsers(prev => prev.filter(u => !(u.userId === data.userId && u.chatId === data.chatId)));
        });


    } catch (err) {
      console.log('Socket connection failed - running in demo mode');
    }
  };

  initialize();

  return () => {
    socketService.disconnect();
  };
}, [user]);

  const loadChats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/chats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const chatsData = await response.json();
        setChats(chatsData.chats);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const usersData = await response.json();
        console.log(usersData.users)
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

const sendMessage = async (
  receiverId: string,
  content: string
) => {
  if (!user) return;

  try {
    const response = await fetch("http://localhost:5000/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        receiver: receiverId,
        content,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    const savedMessage: Message = await response.json();

    // update local state (optimistic or from backend response)
    setMessages(prev => ({
      ...prev,
      [receiverId]: [...(prev[receiverId] || []), savedMessage],
    }));

    // update chat list with last message
    setChats(prev =>
      prev.map(chat =>
        chat.participants[0]._id === user.id && chat.participants[1]
          ? { ...chat, lastMessage: savedMessage }
          : chat
      )
    );

  } catch (err) {
    console.error("Error sending message:", err);
  }
};

  const markMessageAsRead = (messageId: string) => {
  if (!user) return;

  socketService.socket?.emit("message:read", { messageId }, (ack: { ok: boolean; error?: string }) => {
    if (!ack.ok) {
      console.error("Failed to mark message as read:", ack.error);
    }
  });
};


  const startTyping = (chatId: string) => {
    if (!user) return;
    socketService.startTyping(chatId);
  };

  const stopTyping = (chatId: string) => {
    if (!user) return;
    socketService.stopTyping(chatId);
  };

  const searchMessages = async (query: string, chatId?: string): Promise<Message[]> => {
    try {
      const params = new URLSearchParams({ query });
      if (chatId) params.append('chatId', chatId);
      
      const response = await fetch(`/api/messages/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  };

  const createGroupChat = async (name: string, participants: string[]) => {
    if (!user) return;
    
    // Create group chat (demo mode)
    const selectedUsers = users.filter(u => participants.includes(u._id));
    const allParticipants = [
      { _id: user.id, username: user.username, email: user.email, isOnline: true },
      ...selectedUsers
    ];
    
    const newChat: Chat = {
      id: `group_${Date.now()}`,
      type: 'group',
      name,
      participants: allParticipants,
      unreadCount: 0,
      createdAt: new Date().toISOString()
    };
    
    setChats(prev => [...prev, newChat]);
    
    // Initialize empty messages for the new chat
    setMessages(prev => ({
      ...prev,
      [newChat.id]: []
    }));
    
    try {
      // Try API call (will fail gracefully in demo mode)
      const response = await fetch('/api/chats/group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ name, participants }),
      });
    } catch (error) {
      console.log('API call failed - running in demo mode');
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    chats,
    activeChat,
    messages,
    users,
    typingUsers,
    notifications,
    setActiveChat,
    sendMessage,
    markMessageAsRead,
    startTyping,
    stopTyping,
    searchMessages,
    createGroupChat,
    addNotification,
    clearNotifications,
    loadChats,
    loadUsers,
    setMessages,
    setChats
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};