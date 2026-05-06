import React, { useState, useRef } from 'react';
import { HiPaperAirplane } from 'react-icons/hi';
import { useTheme } from '../../context/ThemeContext';

export default function MessageInput({ onSendMessage, onTyping }) {
  const { isDarkMode } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }

    // Emit typing indicator
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      onTyping?.(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 3000);
  };

  const handleSendMessage = () => {
    if (inputValue.trim().length === 0) return;

    onSendMessage(inputValue);
    setInputValue('');
    setIsTyping(false);
    onTyping?.(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex items-end gap-3 p-4 border-t ${
      isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
    }`}>
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="Type a message... (Shift+Enter for new line)"
        className={`flex-1 px-4 py-2.5 rounded-lg border resize-none focus:outline-none focus:ring-2 max-h-32 ${
          isDarkMode
            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:ring-cyan-500/20 focus:border-cyan-500'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500/20 focus:border-blue-500'
        }`}
        rows="1"
      />
      <button
        onClick={handleSendMessage}
        disabled={inputValue.trim().length === 0}
        className={`p-2.5 rounded-lg flex-shrink-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          isDarkMode
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg hover:shadow-cyan-500/30 text-white disabled:hover:shadow-none'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/30 text-white disabled:hover:shadow-none'
        }`}
        title="Send message (or press Enter)"
      >
        <HiPaperAirplane size={20} />
      </button>
    </div>
  );
}
