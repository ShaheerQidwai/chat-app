import React, { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageInput } from './MessageInput';
import { Menu, Phone, Video, MoreVertical, Users } from 'lucide-react';

interface ChatWindowProps {
  onToggleSidebar: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onToggleSidebar }) => {
  const { activeChat, messages, typingUsers } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const chatMessages = activeChat ? (messages[activeChat.id] || []) : [];
  const chatTypingUsers = typingUsers.filter(tu => tu.chatId === activeChat?.id);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [chatMessages.length, chatTypingUsers.length]);

  const getChatName = () => {
    if (!activeChat) return '';
    if (activeChat.type === 'group') {
      return activeChat.name || 'Group Chat';
    }
    const otherParticipant = activeChat.participants.find(p => p._id !== user?.id);
    return otherParticipant?.username || 'Unknown User';
  };

  const getChatSubtitle = () => {
    if (!activeChat) return '';
    if (activeChat.type === 'group') {
      return `${activeChat.participants.length} members`;
    }
    const otherParticipant = activeChat.participants.find(p => p._id !== user?.id);
    return otherParticipant?.isOnline ? 'Online' : 'Offline';
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Chat</h2>
          <p className="text-gray-500 mb-4">Select a conversation to start messaging</p>
          <button
            onClick={onToggleSidebar}
            className="md:hidden bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            View Conversations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="relative">
              {activeChat.type === 'group' ? (
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {getChatName().charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {activeChat.type === 'direct' && 
                activeChat.participants.find(p => p._id !== user?.id)?.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            
            <div>
              <h2 className="font-semibold text-gray-900">{getChatName()}</h2>
              <p className="text-sm text-gray-500">{getChatSubtitle()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-1"
      >
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-2">No messages yet</p>
              <p className="text-sm text-gray-400">Start the conversation!</p>
            </div>
          </div>
        ) : (
          chatMessages.map((message, index) => {
            const prevMessage = chatMessages[index - 1];
            const isConsecutive = prevMessage && 
              prevMessage.senderId === message.senderId &&
              new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() < 60000; // 1 minute
            const showAvatar = !isConsecutive;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isConsecutive={isConsecutive}
                showAvatar={showAvatar}
              />
            );
          })
        )}
        
        {chatTypingUsers.length > 0 && (
          <TypingIndicator typingUsers={chatTypingUsers} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput chatId={activeChat.participants[1]._id} />
    </div>
  );
};