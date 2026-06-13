import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import { messaging } from '../../utils/api';
import { HiPaperClip, HiPhotograph, HiEmojiHappy, HiPaperAirplane, HiSearch, HiPhone, HiVideoCamera, HiUserGroup, HiChevronLeft, HiX } from 'react-icons/hi';
import { Modal } from '../common';
import EmojiPicker from 'emoji-picker-react';
import { encryptMessage, decryptMessage } from '../../utils/encryption';
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

export default function ChatArea({ activeChat, currentUser, socket, onBack, showRightSidebar, onToggleRightSidebar }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [remoteTypingName, setRemoteTypingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState('audio');
  const [aliasName, setAliasName] = useState('');
  const [conversationPublicKey, setConversationPublicKey] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeout = useRef(null);
  const messagesContainerRef = useRef(null);
  const activeChatIdRef = useRef(null);
  const fileInputRef = useRef(null);

  const getDecryptedContent = (msg) => {
    if (msg.content) return msg.content;
    if (!msg.encrypted_content) return '';
    if (activeChat?.type === 'team') return msg.encrypted_content;
    
    try {
      const mySecretKey = localStorage.getItem('secretKey');
      const otherUserPublicKey = activeChat?.publicKey || activeChat?.public_key || conversationPublicKey || msg.sender_public_key;
      
      if (mySecretKey && otherUserPublicKey && msg.nonce) {
        return decryptMessage(msg.nonce, msg.encrypted_content, otherUserPublicKey, mySecretKey);
      }
    } catch (e) {
      console.error('Decryption failed for msg', msg.id, e.message);
      return '[Decryption Failed]';
    }
    return msg.encrypted_content;
  };

  // Keep activeChat.id in ref
  useEffect(() => {
    activeChatIdRef.current = activeChat?.id;
    // Load alias
    if (activeChat?.id) {
      const saved = localStorage.getItem(`alias_${activeChat.id}`);
      setAliasName(saved || '');
    }
  }, [activeChat?.id]);

  // Listen for alias updates
  useEffect(() => {
    const handleAliasUpdate = () => {
      if (activeChat?.id) {
        const saved = localStorage.getItem(`alias_${activeChat.id}`);
        setAliasName(saved || '');
      }
    };
    window.addEventListener('alias-updated', handleAliasUpdate);
    return () => window.removeEventListener('alias-updated', handleAliasUpdate);
  }, [activeChat?.id]);

  // Load history when chat changes
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      setConversationId(null);
      setError('');
      return;
    }

    if (activeChat.type === 'team') {
      loadTeamHistory(activeChat.id);
    } else if (activeChat.type === 'dm') {
      loadDMHistory(activeChat.id);
    }
  }, [activeChat?.id, activeChat?.type]);

  const loadDMHistory = async (userId) => {
    setLoading(true);
    setMessages([]);
    setError('');
    setConversationPublicKey(null);
    try {
      const { data: convData } = await messaging.createConversation(userId);
      const convId = convData.conversation.id;
      setConversationId(convId);
      setConversationPublicKey(convData.conversation.other_user_public_key);

      const { data: msgsData } = await messaging.getMessages(convId);
      const sorted = msgsData.messages.sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
      );
      setMessages(sorted);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load DM history:', err);
      if (err.response?.status === 403) {
        setError(err.response.data.error || 'You can only message friends.');
      }
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamHistory = async (teamId) => {
    setLoading(true);
    setMessages([]);
    setError('');
    setConversationId(null);
    try {
      const { data } = await messaging.getTeamMessages(teamId);
      const sorted = (data.messages || []).sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
      );
      setMessages(sorted);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load team messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };

  // Scroll only if near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (wasNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Socket listeners for DMs
  useEffect(() => {
    if (!socket || !activeChat || activeChat.type !== 'dm' || !conversationId) return;

    const onReceived = (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.messageId)) return prev;
          return [...prev, {
            id: data.messageId,
            sender_id: data.senderId,
            encrypted_content: data.encryptedContent,
            nonce: data.nonce,
            created_at: data.timestamp,
            status: 'delivered'
          }];
        });
        // Mark as read
        setTimeout(() => {
          if (activeChatIdRef.current === activeChat.id) {
            messaging.markRead(data.messageId).catch(() => { });
          }
        }, 300);
      }
    };

    const onDelivered = (data) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === data.messageId ? { ...msg, status: 'delivered' } : msg
        )
      );
    };

    const onRead = (data) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === data.messageId ? { ...msg, status: 'read' } : msg
        )
      );
    };

    const onTyping = (data) => {
      if (data.conversationId === conversationId) {
        setRemoteTyping(data.isTyping);
        setRemoteTypingName(data.isTyping ? (aliasName || activeChat.name || 'User') : '');
      }
    };

    socket.on('message:received', onReceived);
    socket.on('message:delivered', onDelivered);
    socket.on('message:read', onRead);
    socket.on('user:typing:status', onTyping);
    return () => {
      socket.off('message:received', onReceived);
      socket.off('message:delivered', onDelivered);
      socket.off('message:read', onRead);
      socket.off('user:typing:status', onTyping);
    };
  }, [socket, activeChat, conversationId, aliasName]);

  // Socket listeners for Team chat
  useEffect(() => {
    if (!socket || !activeChat || activeChat.type !== 'team') return;

    const onTeamMessage = (data) => {
      if (String(data.teamId) === String(activeChat.id)) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.messageId)) return prev;
          return [...prev, {
            id: data.messageId,
            team_id: data.teamId,
            sender_id: data.senderId,
            content: data.content,
            sender_name: data.senderName,
            sender_avatar: data.senderAvatar,
            created_at: data.timestamp,
            status: 'sent'
          }];
        });
      }
    };

    const onTeamTyping = (data) => {
      if (String(data.teamId) === String(activeChat.id)) {
        setRemoteTyping(data.isTyping);
        setRemoteTypingName(data.isTyping ? (data.userName || 'Someone') : '');
      }
    };

    // Join team room
    socket.emit('team:join', { teamId: activeChat.id });

    socket.on('team:message:received', onTeamMessage);
    socket.on('team:typing:status', onTeamTyping);
    return () => {
      socket.off('team:message:received', onTeamMessage);
      socket.off('team:typing:status', onTeamTyping);
    };
  }, [socket, activeChat?.id, activeChat?.type]);

  // Polling fallback when socket is disconnected or not present (useful on Vercel deployment)
  useEffect(() => {
    if (!activeChat) return;

    const pollForMessages = async () => {
      try {
        if (activeChat.type === 'team') {
          const { data } = await messaging.getTeamMessages(activeChat.id);
          const sorted = (data.messages || []).sort((a, b) =>
            new Date(a.created_at) - new Date(b.created_at)
          );
          setMessages(prev => {
            const hasNew = prev.length !== sorted.length || prev.some((m, idx) => sorted[idx] && m.id !== sorted[idx].id);
            if (hasNew) {
              return sorted;
            }
            return prev;
          });
        } else if (activeChat.type === 'dm' && conversationId) {
          const { data } = await messaging.getMessages(conversationId);
          const sorted = (data.messages || []).sort((a, b) =>
            new Date(a.created_at) - new Date(b.created_at)
          );
          setMessages(prev => {
            const hasNew = prev.length !== sorted.length || prev.some((m, idx) => sorted[idx] && m.id !== sorted[idx].id);
            const hasStatusChange = prev.some((m, idx) => sorted[idx] && m.status !== sorted[idx].status);
            if (hasNew || hasStatusChange) {
              return sorted;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Run immediately when activeChat/conversationId changes
    const isSocketConnected = socket && socket.connected;
    if (!isSocketConnected) {
      pollForMessages();
    }

    const pollInterval = setInterval(() => {
      const isSocketConnected = socket && socket.connected;
      if (!isSocketConnected) {
        pollForMessages();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [activeChat?.id, activeChat?.type, conversationId, socket, socket?.connected]);

  const handleSend = async () => {
    if (!input.trim() || !activeChat) return;
    const text = input.trim();

    if (activeChat.type === 'team') {
      // Team message
      const tempId = `temp-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: tempId,
        sender_id: currentUser.id,
        content: text,
        sender_name: currentUser.name,
        sender_avatar: currentUser.avatar_url,
        created_at: new Date().toISOString(),
        status: 'sent'
      }]);

      try {
        const { data } = await messaging.sendTeamMessage(activeChat.id, text);
        setMessages(prev => prev.map(m => m.id === tempId ? { ...data.message, content: text } : m));
        socket?.emit('team:message:send', {
          teamId: activeChat.id,
          senderId: currentUser.id,
          content: text,
          messageId: data.message.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar_url
        });
      } catch (err) {
        console.error('Failed to send team message:', err);
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    } else if (activeChat.type === 'dm') {
      // DM message
      if (!conversationId) {
        try {
          const { data: convData } = await messaging.createConversation(activeChat.id);
          setConversationId(convData.conversation.id);
          await sendDM(convData.conversation.id, text);
        } catch (err) {
          if (err.response?.status === 403) {
            setError(err.response.data.error || 'You can only message friends.');
          }
          return;
        }
      } else {
        await sendDM(conversationId, text);
      }
    }

    setInput('');
    setIsTyping(false);
    setShowEmojiPicker(false);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const sendDM = async (convId, text) => {
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      sender_id: currentUser.id,
      content: text,
      created_at: new Date().toISOString(),
      status: 'sending'
    }]);

    let ciphertext = text;
    let nonce = '';

    try {
      const mySecretKey = localStorage.getItem('secretKey');
      const otherUserPublicKey = activeChat.publicKey || activeChat.public_key || conversationPublicKey;

      if (mySecretKey && otherUserPublicKey) {
        const encrypted = encryptMessage(text, otherUserPublicKey, mySecretKey);
        ciphertext = encrypted.ciphertext;
        nonce = encrypted.nonce;
      } else {
        console.warn('🔑 E2EE keys missing. Sending message in plaintext.');
      }
    } catch (err) {
      console.error('Encryption failed, falling back to plaintext:', err);
    }

    try {
      const { data } = await messaging.sendMessage(convId, ciphertext, nonce);
      setMessages(prev => prev.map(m => m.id === tempId ? { 
        ...data.message, 
        content: text,
        nonce,
        sender_public_key: currentUser.public_key
      } : m));

      socket?.emit('message:send', {
        messageId: data.message.id,
        conversationId: convId,
        senderId: currentUser.id,
        recipientId: activeChat.id,
        encryptedContent: ciphertext,
        nonce: nonce
      });
    } catch (err) {
      console.error('Send DM failed:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setError('Failed to send message.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }

    // Typing indicators
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      if (activeChat?.type === 'dm') {
        socket?.emit('user:typing', { userId: currentUser?.id, conversationId });
      } else if (activeChat?.type === 'team') {
        socket?.emit('team:typing', { teamId: activeChat.id, userId: currentUser?.id, userName: currentUser?.name });
      }
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      if (activeChat?.type === 'dm') {
        socket?.emit('user:stop-typing', { userId: currentUser?.id, conversationId });
      } else if (activeChat?.type === 'team') {
        socket?.emit('team:stop-typing', { teamId: activeChat.id, userId: currentUser?.id });
      }
    }, 2000);
  };

  const startCall = (type) => {
    setCallType(type);
    setShowCallModal(true);
    socket.emit('call:initiate', {
      recipientId: activeChat.id,
      callerId: currentUser.id,
      callerName: currentUser.name,
      type
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset file input so the same file can be re-uploaded
    e.target.value = '';

    if (file.size > 2 * 1024 * 1024) {
      setError('File is too large. Please select a file smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      const fileTag = `[FILE|*|${file.name}|*|${base64}]`;

      // Auto-send immediately — do NOT put base64 into the textarea
      if (!activeChat) return;
      if (activeChat.type === 'team') {
        const tempId = `temp-${Date.now()}`;
        setMessages(prev => [...prev, {
          id: tempId,
          sender_id: currentUser.id,
          content: fileTag,
          sender_name: currentUser.name,
          sender_avatar: currentUser.avatar_url,
          created_at: new Date().toISOString(),
          status: 'sent'
        }]);
        try {
          const { data } = await messaging.sendTeamMessage(activeChat.id, fileTag);
          setMessages(prev => prev.map(m => m.id === tempId ? { ...data.message, content: fileTag } : m));
          socket?.emit('team:message:send', {
            teamId: activeChat.id,
            senderId: currentUser.id,
            content: fileTag,
            messageId: data.message.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar_url
          });
        } catch (err) {
          console.error('Failed to send file to team:', err);
          setMessages(prev => prev.filter(m => m.id !== tempId));
          setError('Failed to send file.');
        }
      } else if (activeChat.type === 'dm') {
        let convId = conversationId;
        if (!convId) {
          try {
            const { data: convData } = await messaging.createConversation(activeChat.id);
            convId = convData.conversation.id;
            setConversationId(convId);
          } catch (err) {
            if (err.response?.status === 403) setError(err.response.data.error || 'You can only message friends.');
            return;
          }
        }
        await sendDM(convId, fileTag);
      }
    };
    reader.readAsDataURL(file);
  };

  const onEmojiClick = (emojiObject) => {
    setInput(prev => prev + emojiObject.emoji);
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Search Filtering
  const filteredMessages = messages.filter(msg => {
    if (!searchQuery.trim()) return true;
    const content = getDecryptedContent(msg);
    return content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Group messages by date
  const groupedMessages = [];
  let lastDate = '';
  for (const msg of filteredMessages) {
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: 'date', date: msg.created_at });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: 'message', ...msg });
  }

  if (!activeChat) {
    return (
      <div className="chat-column" style={{ alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        <div style={{ textAlign: 'center', margin: 'auto' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <h3>Select a conversation</h3>
          <p style={{ fontSize: 13, marginTop: 4 }}>Choose a team or friend to start chatting</p>
        </div>
      </div>
    );
  }

  const chatTitle = activeChat.type === 'team' ? `# ${activeChat.name}` : (aliasName || activeChat.name);
  const chatSubtitle = activeChat.type === 'team' ? 'Team Chat' : 'Direct Message';

  return (
    <div className="chat-column">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            {onBack && (
              <button className="md:hidden p-2 -ml-2 mr-1 rounded-lg text-gray-500 hover:bg-gray-800" onClick={onBack}>
                <HiChevronLeft size={24} />
              </button>
            )}
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1, minWidth: 0 }}
              onClick={onToggleRightSidebar}
              title={showRightSidebar ? 'Hide panel' : 'Show panel'}
              className="hover:opacity-80 transition-opacity"
            >
              {activeChat.type === 'dm' && (
                <img
                  src={activeChat.avatar || `https://api.dicebear.com/9.x/lorelei/svg?seed=${activeChat.name}`}
                  alt="" className="chat-header-avatar"
                  onError={(e) => { e.target.src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${activeChat.name}`; }}
                  style={{ flexShrink: 0 }}
                />
              )}
              {activeChat.type === 'team' && (
                <div className="chat-header-team-icon" style={{ flexShrink: 0 }}><HiUserGroup size={20} /></div>
              )}
              <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <h3 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{chatTitle}</h3>
                <span className="hidden md:block text-xs opacity-60 truncate" style={{ marginTop: 2 }}>{chatSubtitle}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="chat-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showSearch && (
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search..." 
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '4px 12px', fontSize: '13px', color: '#fff', width: '150px' }}
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><HiX size={14}/></button>
            </div>
          )}
          {!showSearch && <button className="icon-btn" onClick={() => setShowSearch(true)} title="Search"><HiSearch size={18} /></button>}
          <button className="icon-btn" onClick={() => startCall('audio')} title="Call"><HiPhone size={18} /></button>
          <button className="icon-btn" onClick={() => startCall('video')} title="Video"><HiVideoCamera size={18} /></button>
          {/* Toggle right sidebar */}
          {onToggleRightSidebar && (
            <button
              className="icon-btn hidden md:flex"
              onClick={onToggleRightSidebar}
              title={showRightSidebar ? 'Hide panel' : 'Show panel'}
              style={{ marginLeft: 4 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {showRightSidebar
                  ? <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/><polyline points="18,9 21,12 18,15"/></>
                  : <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/><polyline points="12,9 9,12 12,15"/></>}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={messagesContainerRef}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: '#64748b' }}><div className="loading-spinner" /></div>
        ) : messages.length === 0 && !error ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: '#64748b', fontSize: 14 }}>No messages yet. Say hello! 👋</div>
        ) : (
          <>
            {groupedMessages.map((item, idx) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${idx}`} className="date-separator">
                    <span>{formatDateSeparator(item.date)}</span>
                  </div>
                );
              }

              const msg = item;
              const isMine = msg.sender_id === currentUser?.id;
              const isFriend = msg.sender_id === activeChat.id;
              let displayContent = getDecryptedContent(msg);
              
              let fileAttachment = null;
              if (displayContent.includes('[FILE|*|')) {
                const match = displayContent.match(/\[FILE\|\*\|(.*?)\|\*\|(.*?)\]/);
                if (match) {
                  const fileName = match[1];
                  const fileData = match[2];
                  fileAttachment = { name: fileName, data: fileData };
                  displayContent = displayContent.replace(/\[FILE\|\*\|.*?\|\*\|.*?\]/, `Shared a file: ${fileName}`);
                }
              } else if (displayContent.includes('[FILE:')) {
                const match = displayContent.match(/\[FILE:([^:]+):(.*?)\]/);
                if (match) {
                  const fileName = match[1];
                  const fileData = match[2];
                  fileAttachment = { name: fileName, data: fileData };
                  displayContent = displayContent.replace(/\[FILE:[^\]]+\]/, `Shared a file: ${fileName}`);
                }
              }

              const senderName = isMine 
                ? 'You' 
                : (isFriend ? (aliasName || activeChat.name) : (msg.sender_name || activeChat.name));
              const senderAvatar = isMine ? currentUser.avatar_url : (msg.sender_avatar || activeChat.avatar);

              return (
                <div key={msg.id} className={`message-row ${isMine ? 'sent' : ''}`}>
                  {!isMine && (
                    <img
                      src={senderAvatar || `https://api.dicebear.com/9.x/lorelei/svg?seed=${senderName}`}
                      alt="" className="message-avatar"
                      onError={(e) => { e.target.src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${senderName}`; }}
                    />
                  )}
                  <div className="message-content">
                    <div className="message-meta">
                      {!isMine && <span className="message-sender">{senderName}</span>}
                      <span className="message-time">{formatTime(msg.created_at)}</span>
                      {isMine && msg.status && (
                        <span className={`message-status ${msg.status === 'read' ? 'blue' : ''}`}>
                          {msg.status === 'sending' && '⏳'}
                          {msg.status === 'sent' && '✓'}
                          {msg.status === 'delivered' && '✓✓'}
                          {msg.status === 'read' && '✓✓'}
                        </span>
                      )}
                    </div>
                    <div className="message-bubble">
                      {parseLinks(displayContent)}
                      {fileAttachment && (
                        <div style={{ marginTop: 8, padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <HiPaperClip size={20} className="text-cyan-400" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }} className="truncate">{fileAttachment.name}</div>
                            <a href={fileAttachment.data} download={fileAttachment.name} style={{ fontSize: 11, color: '#06b6d4', textDecoration: 'none', fontWeight: 600 }}>Download File</a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="typing-indicator" style={{ minHeight: 20, opacity: remoteTyping ? 1 : 0, transition: 'opacity 0.15s', visibility: remoteTyping ? 'visible' : 'hidden' }}>
              <span>{remoteTypingName} is typing</span>
              <div className="typing-dots"><span></span><span></span><span></span></div>
            </div>
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="chat-error-banner" style={{ margin: '0 20px 10px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><HiX size={14}/></button>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area" style={{ position: 'relative' }}>
        {showEmojiPicker && (
          <div style={{ position: 'absolute', bottom: '100%', right: '20px', zIndex: 50, marginBottom: '10px' }}>
            <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
          </div>
        )}
        <div className="chat-input-wrapper">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
          <button className="tool-btn" title="Attach file" onClick={() => fileInputRef.current?.click()}><HiPaperClip size={18}/></button>
          <button className="tool-btn" title="Upload image" onClick={() => fileInputRef.current?.click()}><HiPhotograph size={18}/></button>
          <textarea
            ref={textareaRef} className="chat-input"
            placeholder={`Message ${activeChat?.type === 'team' ? '#' : ''}${chatTitle}`}
            rows="1" value={input} onChange={handleInput} onKeyDown={handleKeyDown}
          />
          <button className="tool-btn" title="Add emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><HiEmojiHappy size={18}/></button>
          <button className="send-btn" onClick={handleSend} title="Send" disabled={!input.trim()}><HiPaperAirplane size={18} /></button>
        </div>
      </div>

      {/* Call Modal */}
      <Modal isOpen={showCallModal} onClose={() => setShowCallModal(false)} title={`${callType === 'video' ? 'Video' : 'Audio'} Call`}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {callType === 'video' ? <HiVideoCamera size={40} /> : <HiPhone size={40} />}
          </div>
          <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>Calling {chatTitle}...</h3>
          <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Waiting for response</p>
          <button onClick={() => setShowCallModal(false)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50px', padding: '12px 30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>End Call</button>
        </div>
      </Modal>
    </div>
  );
}
