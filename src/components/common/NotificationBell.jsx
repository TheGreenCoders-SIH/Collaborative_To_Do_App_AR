import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { notifications as notificationsApi } from '../../utils/api';
import { HiBell, HiChat, HiUserAdd, HiClipboardList } from 'react-icons/hi';

export default function NotificationBell() {
  const { isDarkMode } = useTheme();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationsApi.list();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(interval);
  }, []);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications(prev => {
        // Prevent duplicates
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
    };

    socket.on('notification:received', handleNewNotification);

    return () => {
      socket.off('notification:received', handleNewNotification);
    };
  }, [socket]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.read(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.readAll();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    const baseClass = "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0";
    switch (type) {
      case 'dm':
      case 'team_message':
        return (
          <div className={`${baseClass} bg-cyan-500/10 text-cyan-500`}>
            <HiChat className="w-4 h-4" />
          </div>
        );
      case 'friend_request':
      case 'friend_accept':
        return (
          <div className={`${baseClass} bg-indigo-500/10 text-indigo-500`}>
            <HiUserAdd className="w-4 h-4" />
          </div>
        );
      case 'task_assigned':
      case 'task_status':
        return (
          <div className={`${baseClass} bg-amber-500/10 text-amber-500`}>
            <HiClipboardList className="w-4 h-4" />
          </div>
        );
      case 'task_reminder':
        return (
          <div className={`${baseClass} bg-red-500/10 text-red-500 animate-pulse`}>
            <HiClipboardList className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className={`${baseClass} bg-gray-500/10 text-gray-500`}>
            <HiBell className="w-4 h-4" />
          </div>
        );
    }
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative p-2.5 rounded-xl transition-all border ${
          isDarkMode
            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
        }`}
      >
        <HiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Box */}
      {showDropdown && (
        <div className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-xl z-50 border overflow-hidden backdrop-blur-md transition-all duration-200 ${
          isDarkMode
            ? 'bg-slate-900/95 border-slate-800 text-white'
            : 'bg-white/95 border-gray-100 text-gray-900'
        }`}>
          {/* Header */}
          <div className={`p-4 flex items-center justify-between border-b ${
            isDarkMode ? 'border-slate-800' : 'border-gray-100'
          }`}>
            <h3 className="font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-cyan-500 hover:text-cyan-400 font-semibold transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-opacity-5 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs opacity-60">
                All caught up! 🎉
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`p-4 flex gap-3 hover:bg-opacity-5 hover:bg-cyan-500 cursor-pointer transition-colors relative group ${
                    !n.read ? (isDarkMode ? 'bg-slate-800/40' : 'bg-cyan-50/30') : ''
                  }`}
                >
                  {getNotificationIcon(n.type)}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className={`text-xs font-semibold truncate ${!n.read ? 'text-cyan-400' : ''}`}>
                      {n.title}
                    </p>
                    <p className="text-xs opacity-75 mt-0.5 leading-relaxed break-words">
                      {n.message}
                    </p>
                    <span className="text-[10px] opacity-40 mt-1 block">
                      {formatTimeAgo(n.created_at)}
                    </span>
                  </div>
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    className="absolute right-3 top-4 text-xs opacity-0 group-hover:opacity-100 hover:text-red-500 text-gray-400 transition-opacity"
                    title="Delete notification"
                  >
                    ×
                  </button>
                  {/* Unread indicator dot */}
                  {!n.read && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-500 rounded-full" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
