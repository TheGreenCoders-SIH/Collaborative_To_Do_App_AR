import React, { useState, useEffect } from 'react';
import { HiArrowLeft, HiPhone, HiInformationCircle } from 'react-icons/hi';
import { useTheme } from '../../context/ThemeContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import api from '../../utils/api';

export default function ChatWindow({
  conversation,
  currentUser,
  onConversationUpdate,
  onBack,
  socket
}) {
  const { isDarkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [presenceStatus, setPresenceStatus] = useState('offline');
  const [error, setError] = useState(null);
  // Remote user typing state (managed internally within ChatWindow)
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const [remoteTypingUserName, setRemoteTypingUserName] = useState(null);

  // Helper to generate random nonce
  const generateNonce = () => {
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    let binary = '';
    array.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  };

  // Fetch initial messages
  useEffect(() => {
    fetchMessages();
  }, [conversation?.id]);

  // Reset typing state when conversation changes
  useEffect(() => {
    setIsRemoteTyping(false);
    setRemoteTypingUserName(null);
  }, [conversation?.id]);

  // Listen for incoming messages and status updates
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (data) => {
      if (data.conversationId === conversation.id) {
        const newMessage = {
          id: data.messageId,
          conversation_id: data.conversationId,
          sender_id: data.senderId,
          encrypted_content: data.encryptedContent,
          status: 'delivered',
          created_at: data.timestamp,
          sender_name: conversation.other_user_name,
          sender_avatar: conversation.other_user_avatar
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    const handleMessageDelivered = (data) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === data.messageId ? { ...msg, status: 'delivered' } : msg
        )
      );
    };

    const handleMessageRead = (data) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === data.messageId ? { ...msg, status: 'read' } : msg
        )
      );
    };

    const handlePresenceUpdate = (data) => {
      if (data.userId === conversation.other_user_id) {
        setPresenceStatus(data.status);
      }
    };

    const handleTypingStatus = (data) => {
      if (data.conversationId === conversation.id) {
        setIsRemoteTyping(data.isTyping);
        setRemoteTypingUserName(data.isTyping ? conversation.other_user_name : null);
      }
    };

    socket.on('message:received', handleMessageReceived);
    socket.on('message:delivered', handleMessageDelivered);
    socket.on('message:read', handleMessageRead);
    socket.on('user:status', handlePresenceUpdate);
    socket.on('user:typing:status', handleTypingStatus);

    return () => {
      socket.off('message:received', handleMessageReceived);
      socket.off('message:delivered', handleMessageDelivered);
      socket.off('message:read', handleMessageRead);
      socket.off('user:status', handlePresenceUpdate);
      socket.off('user:typing:status', handleTypingStatus);
    };
  }, [socket, conversation]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/messages/conversations/${conversation.id}/messages?limit=50`
      );
      setMessages(response.data.messages.reverse());
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (plainText) => {
    if (!plainText.trim()) return;

    try {
      const response = await api.post('/messages/messages', {
        conversation_id: conversation.id,
        encrypted_content: plainText // TODO: Implement client-side encryption
      });

      const newMessage = response.data.message;
      newMessage.content = plainText;
      newMessage.sender_name = currentUser.name;
      newMessage.sender_avatar = currentUser.avatar_url;

      setMessages(prev => [...prev, newMessage]);
      onConversationUpdate?.();

      // Emit real-time message via Socket.io
      if (socket && socket.connected) {
        const nonce = generateNonce();
        socket.emit('message:send', {
          messageId: newMessage.id,
          conversationId: conversation.id,
          senderId: currentUser.id,
          recipientId: conversation.other_user_id,
          encryptedContent: plainText, // In production, encrypt this
          nonce
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
    }
  };

  const handleTyping = (typing) => {
    if (socket) {
      socket.emit(typing ? 'user:typing' : 'user:stop-typing', {
        userId: currentUser.id,
        conversationId: conversation.id
      });
    }
  };

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${
        isDarkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin`}></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${
      isDarkMode ? 'bg-slate-800' : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-all hidden sm:flex ${
                isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
              }`}
            >
              <HiArrowLeft size={20} className={isDarkMode ? 'text-slate-300' : 'text-gray-600'} />
            </button>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                conversation.other_user_avatar ? '' : 'bg-gradient-to-br from-cyan-500 to-blue-500'
              }`}>
                {conversation.other_user_avatar ? (
                  <img 
                    src={conversation.other_user_avatar} 
                    alt={conversation.other_user_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  conversation.other_user_name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h3 className={`font-semibold text-sm truncate ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {conversation.other_user_name}
                </h3>
                <p className={`text-xs ${
                  presenceStatus === 'online'
                    ? 'text-green-500'
                    : isDarkMode
                    ? 'text-slate-400'
                    : 'text-gray-500'
                }`}>
                  {presenceStatus === 'online' ? '● Online' : '● Offline'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className={`p-2 rounded-lg transition-all ${
            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
          }`}>
            <HiPhone size={20} className={isDarkMode ? 'text-slate-300' : 'text-gray-600'} />
          </button>
          <button className={`p-2 rounded-lg transition-all ${
            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
          }`}>
            <HiInformationCircle size={20} className={isDarkMode ? 'text-slate-300' : 'text-gray-600'} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`px-4 py-2 text-sm text-red-500 ${
          isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
        }`}>
          {error}
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUser.id}
        isTyping={isRemoteTyping}
        typingUserName={remoteTypingUserName}
      />

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
      />
    </div>
  );
}
