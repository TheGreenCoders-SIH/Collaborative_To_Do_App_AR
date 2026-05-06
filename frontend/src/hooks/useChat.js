import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import api from '../utils/api';

export const useChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      setConversations(response.data.conversations);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId, limit = 50, offset = 0) => {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/messages`, {
        params: { limit, offset }
      });
      setMessages(response.data.messages);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch messages:', err);
    }
  }, []);

  // Create or get conversation
  const createConversation = useCallback(async (userId) => {
    try {
      const response = await api.post('/messages/conversations', {
        user_id_2: userId
      });
      const newConv = response.data.conversation;
      setSelectedConversation(newConv);
      setConversations(prev => {
        const exists = prev.find(c => c.id === newConv.id);
        return exists ? prev : [newConv, ...prev];
      });
      await fetchMessages(newConv.id);
      return newConv;
    } catch (err) {
      setError(err.message);
      console.error('Failed to create conversation:', err);
    }
  }, [fetchMessages]);

  // Send message
  const sendMessage = useCallback(async (conversationId, content) => {
    try {
      // For now, store as plain text. In production, encrypt here
      const response = await api.post('/messages/messages', {
        conversation_id: conversationId,
        encrypted_content: content // Will be encrypted on backend or here
      });
      
      const newMessage = response.data.message;
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversation's updated_at
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, updated_at: new Date().toISOString() }
            : conv
        ).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      );
      
      setError(null);
      return newMessage;
    } catch (err) {
      setError(err.message);
      console.error('Failed to send message:', err);
    }
  }, []);

  // Mark message as read
  const markAsRead = useCallback(async (messageId) => {
    try {
      await api.post(`/messages/messages/${messageId}/read`);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, status: 'read' } : msg
        )
      );
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }, []);

  // Get user presence
  const getUserPresence = useCallback(async (userId) => {
    try {
      const response = await api.get(`/messages/presence/${userId}`);
      return response.data.presence;
    } catch (err) {
      console.error('Failed to fetch presence:', err);
      return null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  return {
    conversations,
    messages,
    selectedConversation,
    setSelectedConversation,
    loading,
    error,
    clearError,
    onlineUsers,
    setOnlineUsers,
    typingUsers,
    setTypingUsers,
    fetchConversations,
    fetchMessages,
    createConversation,
    sendMessage,
    markAsRead,
    getUserPresence
  };
};

export default useChat;
