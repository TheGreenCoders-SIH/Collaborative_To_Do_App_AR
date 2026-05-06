import React, { useState } from 'react';
import { HiPlus } from 'react-icons/hi';
import { useTheme } from '../../context/ThemeContext';
import UserSearch from './UserSearch';
import api from '../../utils/api';

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  onConversationUpdate,
  onlineUsers = new Set()
}) {
  const { isDarkMode } = useTheme();
  const [showSearch, setShowSearch] = useState(false);

  const handleCreateConversation = async (userId) => {
    try {
      const response = await api.post('/messages/conversations', {
        user_id_2: userId
      });
      const conversation = response.data.conversation;
      onSelectConversation(conversation);
      if (onConversationUpdate) {
        await onConversationUpdate();
      }
      setShowSearch(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <div className={`flex flex-col h-full ${
      isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
    } border-r`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        isDarkMode ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Messages</h2>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-all ${
              isDarkMode
                ? 'hover:bg-slate-800 text-cyan-400'
                : 'hover:bg-gray-100 text-blue-600'
            }`}
            title="New message"
          >
            <HiPlus size={20} />
          </button>
        </div>

        {showSearch && (
          <UserSearch 
            onSelectUser={handleCreateConversation}
            onCancel={() => setShowSearch(false)}
          />
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {conversations.length === 0 ? (
          <div className={`flex items-center justify-center h-full text-center p-4 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}>
            <p className="text-sm">No conversations yet. Start a new chat!</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conv) => {
              const isOnline = onlineUsers.has(conv.other_user_id);
              const isSelected = selectedConversation?.id === conv.id;
              
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-slate-700 text-white'
                        : 'bg-blue-50 text-blue-900'
                      : isDarkMode
                      ? 'hover:bg-slate-800 text-slate-200'
                      : 'hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  {/* Avatar with Online Status */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      conv.other_user_avatar ? '' : 'bg-gradient-to-br from-cyan-500 to-blue-500'
                    }`}>
                      {conv.other_user_avatar ? (
                        <img 
                          src={conv.other_user_avatar} 
                          alt={conv.other_user_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        conv.other_user_name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {conv.other_user_name}
                      </h4>
                      {conv.last_message_time && (
                        <span className={`text-xs flex-shrink-0 ml-2 ${
                          isSelected
                            ? isDarkMode ? 'text-slate-300' : 'text-blue-700'
                            : isDarkMode ? 'text-slate-500' : 'text-gray-500'
                        }`}>
                          {new Date(conv.last_message_time).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${
                      isSelected
                        ? isDarkMode ? 'text-slate-300' : 'text-blue-700'
                        : isDarkMode ? 'text-slate-500' : 'text-gray-500'
                    }`}>
                      {conv.last_message || 'No messages yet'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
