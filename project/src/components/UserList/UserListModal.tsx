import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { X, MessageCircle, UserPlus } from 'lucide-react';
import { Chat } from '../../types';

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserListModal: React.FC<UserListModalProps> = ({ isOpen, onClose }) => {
  const { users, chats,setChats, setActiveChat } = useChat();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const startDirectChat = async (otherUser: User) => {
    setLoading(true);
    
    try {
      // Check if chat already exists
      const existingChat = chats.find(chat => 
        chat.type === 'direct' && 
        chat.participants.some(p => p._id === otherUser._id)
      );

      if (existingChat) {
        setActiveChat(existingChat);
      } else {
        // Create new direct chat (demo mode)
        const newChat: Chat = {
          id: `chat_${Date.now()}`,
          type: 'direct',
          participants: [
            { _id: currentUser!.id, username: currentUser!.username, email: currentUser!.email, isOnline: true },
            otherUser
          ],
          unreadCount: 0,
          createdAt: new Date().toISOString()
        };
        
      setChats([...chats, newChat]);
      setActiveChat(newChat);
      }
      onClose();
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const otherUsers = users.filter(u => u._id !== currentUser?.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">All Users</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User List */}
        <div className="overflow-y-auto max-h-96">
          {otherUsers.length === 0 ? (
            <div className="p-6 text-center">
              <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No other users found</p>
            </div>
          ) : (
            otherUsers.map((user) => (
              <div
                key={user._id}
                className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900">{user.username}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">
                        {user.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => startDirectChat(user)}
                    disabled={loading}
                    className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
                    title="Start Chat"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};