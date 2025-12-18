import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { Search, X, MessageSquare } from 'lucide-react';
import { Message } from '../../types';
import { formatMessageTime } from '../../utils/dateUtils';

interface MessageSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({ isOpen, onClose }) => {
  const { searchMessages, activeChat } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchGlobal, setSearchGlobal] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults = await searchMessages(
          query, 
          searchGlobal ? undefined : activeChat?.id
        );
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, searchGlobal, activeChat?.id, searchMessages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Search Messages</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="searchGlobal"
              checked={searchGlobal}
              onChange={(e) => setSearchGlobal(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="searchGlobal" className="text-sm text-gray-700">
              Search in all conversations
            </label>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              {query.trim() ? (
                <>
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No messages found</p>
                  <p className="text-sm text-gray-400">Try different keywords</p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Start typing to search messages</p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {results.map((message) => (
                <div
                  key={message.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    // In a real app, navigate to the message
                    console.log('Navigate to message:', message.id);
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-medium">
                        {/* In real app, get username from senderId */}
                        U
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {/* In real app, get username from senderId */}
                          User
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatMessageTime(message.timestamp)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};