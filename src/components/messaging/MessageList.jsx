import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { HiCheck, HiCheckCircle } from 'react-icons/hi';

const parseLinks = (text) => {
  if (!text) return '';
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 underline hover:text-cyan-300 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function MessageList({ messages, currentUserId, isTyping = false, typingUserName = null }) {
  const { isDarkMode } = useTheme();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <HiCheckCircle className="w-4 h-4" />;
      case 'read':
        return <HiCheckCircle className="w-4 h-4 text-cyan-500" />;
      case 'sent':
        return <HiCheck className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin ${
      isDarkMode ? 'bg-slate-800' : 'bg-white'
    }`}>
      {messages.length === 0 && (
        <div className={`flex items-center justify-center h-full text-center ${
          isDarkMode ? 'text-slate-400' : 'text-gray-500'
        }`}>
          <div>
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-2">Start the conversation!</p>
          </div>
        </div>
      )}

      {messages.map((msg) => {
        const isSender = msg.sender_id === currentUserId;
        
        return (
          <div
            key={msg.id}
            className={`flex gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}
          >
            {!isSender && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                msg.sender_avatar ? '' : 'bg-gradient-to-br from-cyan-500 to-blue-500'
              }`}>
                {msg.sender_avatar ? (
                  <img 
                    src={msg.sender_avatar} 
                    alt={msg.sender_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  msg.sender_name?.charAt(0).toUpperCase()
                )}
              </div>
            )}

            <div className={`flex flex-col gap-1 max-w-xs ${isSender ? 'items-end' : 'items-start'}`}>
              {!isSender && (
                <p className={`text-xs font-medium ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  {msg.sender_name}
                </p>
              )}

              <div className={`px-4 py-2 rounded-2xl break-words ${
                isSender
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-none'
                  : isDarkMode
                  ? 'bg-slate-700 text-slate-200 rounded-bl-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              }`}>
                <p className="text-sm whitespace-pre-wrap">
                  {parseLinks(msg.content || msg.encrypted_content)}
                </p>
              </div>

              <div className={`flex items-center gap-1 text-xs ${
                isDarkMode ? 'text-slate-500' : 'text-gray-500'
              } px-2`}>
                <span>
                  {new Date(msg.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                {isSender && msg.status && (
                  <span className={`flex items-center ${
                    msg.status === 'read' ? 'text-cyan-500' : ''
                  }`}>
                    {getStatusIcon(msg.status)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {isTyping && (
        <div className="flex gap-2 justify-start">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-cyan-500 to-blue-500`}>
            {typingUserName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className={`px-4 py-2 rounded-2xl rounded-bl-none ${
            isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
          }`}>
            <div className="flex gap-1 items-center h-5">
              <div className={`w-2 h-2 rounded-full animate-bounce ${
                isDarkMode ? 'bg-slate-400' : 'bg-gray-400'
              }`}></div>
              <div className={`w-2 h-2 rounded-full animate-bounce ${
                isDarkMode ? 'bg-slate-400' : 'bg-gray-400'
              }`} style={{ animationDelay: '0.1s' }}></div>
              <div className={`w-2 h-2 rounded-full animate-bounce ${
                isDarkMode ? 'bg-slate-400' : 'bg-gray-400'
              }`} style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
