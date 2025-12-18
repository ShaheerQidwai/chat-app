import React, { useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, MessageCircle, Users, Settings, LogOut } from 'lucide-react';
import { formatMessageTime } from '../../utils/dateUtils';
import { socketService } from '../../services/socketService';
import { Message } from '../../types';

interface ChatSidebarProps {
  onCreateGroup: () => void;
  onShowUserList: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  onCreateGroup, 
  onShowUserList,
  isOpen,
  onClose 
}) => {
  const { chats, activeChat, setActiveChat, setMessages } = useChat();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants.some(p => 
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );


useEffect(() => {
  // Listen for incoming messages
  socketService.onMessageReceived((msg: Message) => {
    setMessages(prev => ({
      ...prev,
      [msg.chatId]: [...(prev[msg.chatId] || []), msg],
    }));
  });
  
  socketService.onMessageSent((msg: Message) => {
    setMessages(prev => ({
      ...prev,
      [msg.chatId]: [...(prev[msg.chatId] || []), msg],
    }));
  });

}, []);



  const getChatName = (chat: typeof chats[0]) => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    }
    const otherParticipant = chat.participants.find(p => p._id !== user?.id);
    return otherParticipant?.username || 'Unknown User';
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`
        fixed md:relative top-0 left-0 h-full w-80 bg-white border-r border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={onCreateGroup}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Create Group"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={onShowUserList}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="All Users"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a new chat or create a group</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = activeChat?.id === chat.id;
              const otherParticipant = chat.participants.find(p => p._id !== user?.id);
              
              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChat(chat);
                    onClose();
                  }}
                  className={`
                    p-4 border-b border-gray-100 cursor-pointer transition-colors
                    ${isActive ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {chat.type === 'group' ? (
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {otherParticipant?.username.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      {chat.type === 'direct' && otherParticipant?.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">
                          {getChatName(chat)}
                        </h3>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(chat.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{user?.username}</p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button className="p-1 text-gray-500 hover:text-gray-700 rounded">
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={logout}
                className="p-1 text-gray-500 hover:text-red-600 rounded"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};