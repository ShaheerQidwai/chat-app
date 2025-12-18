import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Message } from '../../types';
import { formatMessageTime, formatFullTimestamp } from '../../utils/dateUtils';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isConsecutive: boolean;
  showAvatar: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isConsecutive,
  showAvatar
}) => {
  const { user } = useAuth();
  const { users } = useChat();
  const [showFullTimestamp, setShowFullTimestamp] = useState(false);
  const isOwnMessage = message.senderId === user?.id;
  
  const sender = users.find(u => u._id === message.senderId);
  const senderInitial = sender?.username.charAt(0).toUpperCase() || 'U';

  return (
    <div className={`flex items-end space-x-2 mb-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-medium">
            {senderInitial}
          </span>
        </div>
      )}
      {showAvatar && isOwnMessage && <div className="w-8 h-8 flex-shrink-0" />}
      {!showAvatar && <div className="w-8 h-8 flex-shrink-0" />}

      {/* Message */}
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}>
        <div
          className={`
            px-4 py-2 rounded-2xl relative group cursor-pointer
            ${isOwnMessage 
              ? 'bg-blue-500 text-white rounded-br-md' 
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }
          `}
          onClick={() => setShowFullTimestamp(!showFullTimestamp)}
        >
          <p className="text-sm leading-relaxed break-words">{message.content}</p>
          
          {/* Message status and time */}
          <div className={`flex items-center justify-end mt-1 space-x-1`}>
            <span className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatMessageTime(message.timestamp)}
            </span>
            {isOwnMessage && (
              <div className="text-blue-100">
                {message.readBy.length > 1 ? (
                  <CheckCheck className="w-3 h-3" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Full timestamp tooltip */}
        {showFullTimestamp && (
          <div className="mt-1 px-3 py-1 bg-gray-800 text-white text-xs rounded-md opacity-90">
            {formatFullTimestamp(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};