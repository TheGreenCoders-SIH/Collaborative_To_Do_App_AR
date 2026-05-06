import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';
import ChatArea from '../components/messaging/ChatArea';
import LeftSidebar from '../components/messaging/LeftSidebar';
import RightSidebar from '../components/messaging/RightSidebar';
import ChannelBrowser from '../components/messaging/ChannelBrowser';
import InviteDialog from '../components/messaging/InviteDialog';
import EditProfileModal from '../components/messaging/EditProfileModal';
import FriendsPanel from '../components/messaging/FriendsPanel';
import '../styles/messaging.css';

export default function MessagingPage() {
  const { user } = useAuth();
  const socket = useSocket();
  const [activeChat, setActiveChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showChannelBrowser, setShowChannelBrowser] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFriendsPanel, setShowFriendsPanel] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(window.innerWidth > 900);

  // Listen for presence updates
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        data.status === 'online' ? next.add(data.userId) : next.delete(data.userId);
        return next;
      });
    };
    socket.on('user:status', handler);
    return () => socket.off('user:status', handler);
  }, [socket]);

  const openChat = (chat) => {
    setActiveChat(chat);
  };

  const openDMFromFriend = (friend) => {
    setActiveChat({
      id: friend.id,
      type: 'dm',
      name: friend.name,
      avatar: friend.avatar_url,
      userId: friend.user_id,
      status: onlineUsers.has(friend.id) ? 'online' : 'offline'
    });
  };

  return (
    <div className={`messaging-3col ${!activeChat ? 'mobile-show-sidebar' : 'mobile-show-chat'} ${!showRightSidebar ? 'right-sidebar-hidden' : ''}`}>
      {/* Left Sidebar: Teams + Friends */}
      <LeftSidebar
        activeChat={activeChat}
        onOpenChat={openChat}
        onlineUsers={onlineUsers}
        onOpenChannelBrowser={() => setShowChannelBrowser(true)}
        onOpenFriends={() => setShowFriendsPanel(true)}
        onOpenProfile={() => setShowEditProfile(true)}
      />

      {/* Center: Chat Area */}
      <ChatArea
        activeChat={activeChat}
        currentUser={user}
        socket={socket}
        onBack={() => setActiveChat(null)}
        showRightSidebar={showRightSidebar}
        onToggleRightSidebar={() => setShowRightSidebar(v => !v)}
      />

      {/* Right Sidebar: Context Panel */}
      {showRightSidebar && <RightSidebar activeChat={activeChat} onlineUsers={onlineUsers} onClose={() => setShowRightSidebar(false)} />}

      {/* Modals */}
      <ChannelBrowser isOpen={showChannelBrowser} onClose={() => setShowChannelBrowser(false)} />
      <InviteDialog isOpen={showInviteDialog} onClose={() => setShowInviteDialog(false)} />
      <EditProfileModal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} />
      <FriendsPanel
        isOpen={showFriendsPanel}
        onClose={() => setShowFriendsPanel(false)}
        onOpenDM={openDMFromFriend}
      />
    </div>
  );
}
