import React, { useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { X, MessageCircle } from 'lucide-react';
import { Notification } from '../../types';

export const NotificationToast: React.FC = () => {
  const { notifications } = useChat();
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read).slice(0, 3);
    setVisibleNotifications(unreadNotifications);

    // Auto-hide notifications after 5 seconds
    const timers = unreadNotifications.map(notification => 
      setTimeout(() => {
        setVisibleNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000)
    );

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications]);

  const hideNotification = (notificationId: string) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <MessageCircle className="w-4 h-4 text-blue-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {notification.message}
              </p>
            </div>

            <button
              onClick={() => hideNotification(notification.id)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};