import React, { useState, useEffect } from 'react';
import { HiSearch, HiHashtag, HiUser, HiPlus, HiLogout, HiCog, HiX, HiUserGroup, HiChat, HiChevronDown, HiChevronRight } from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { teams as teamsApi, friends as friendsApi } from '../../utils/api';

export default function LeftSidebar({
  activeChat,
  onOpenChat,
  onlineUsers,
  onOpenChannelBrowser,
  onOpenFriends,
  onOpenProfile,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState([]);
  const [myFriends, setMyFriends] = useState([]);
  const [expandedTeams, setExpandedTeams] = useState({});
  const [teamsExpanded, setTeamsExpanded] = useState(true);
  const [friendsExpanded, setFriendsExpanded] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Load teams and friends
  useEffect(() => {
    loadTeams();
    loadFriends();
  }, []);

  const loadTeams = async () => {
    try {
      const { data } = await teamsApi.getAll();
      setMyTeams(data || []);
      // Auto-expand first team
      if (data && data.length > 0) {
        setExpandedTeams(prev => ({ ...prev, [data[0].id]: true }));
      }
    } catch (e) {
      console.error('Failed to load teams:', e);
    }
  };

  const loadFriends = async () => {
    try {
      const { data } = await friendsApi.list();
      setMyFriends(data.friends || []);
    } catch (e) {
      console.error('Failed to load friends:', e);
    }
    try {
      const { data } = await friendsApi.pending();
      setPendingCount((data.requests || []).length);
    } catch (e) { }
  };

  const toggleTeam = (teamId) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  return (
    <div className="left-sidebar">
      {/* Header with profile */}
      <div className="sidebar-header">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={user?.avatar_url || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user?.name || 'user'}`}
            alt="You"
            className="w-10 h-10 rounded-xl border border-white/10 cursor-pointer"
            onClick={onOpenProfile}
            onError={(e) => { e.target.src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${user?.name || 'user'}`; }}
            style={{ objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-semibold text-sm text-white truncate">{user?.name}</div>
            <div className="text-xs text-cyan-400 truncate">@{user?.user_id || 'N/A'}</div>
          </div>
          <button className="icon-btn" title="Edit Profile" onClick={onOpenProfile}><HiCog size={18} /></button>
          <button className="icon-btn" title="Back to Dashboard" onClick={() => navigate('/dashboard')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="sidebar-scroll">
        {/* TEAMS Section */}
        <div className="sidebar-section">
          <div
            className="sidebar-section-title clickable"
            onClick={() => setTeamsExpanded(!teamsExpanded)}
          >
            <span>Teams ({myTeams.length})</span>
            {teamsExpanded ? <HiChevronDown size={14} /> : <HiChevronRight size={14} />}
          </div>

          {teamsExpanded && (
            <>
              {myTeams.length === 0 ? (
                <div style={{ fontSize: 12, color: '#64748b', padding: '8px 10px' }}>
                  No teams yet. Create one from the dashboard!
                </div>
              ) : (
                myTeams.map(team => (
                  <div key={team.id}>
                    <div
                      className={`nav-item ${activeChat?.type === 'team' && activeChat?.id === team.id ? 'active' : ''}`}
                      onClick={() => {
                        toggleTeam(team.id);
                        onOpenChat({ id: team.id, type: 'team', name: team.name });
                      }}
                    >
                      <span className="icon"><HiHashtag /></span>
                      <span className="truncate">{team.name}</span>
                      {expandedTeams[team.id] ? <HiChevronDown size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} /> : <HiChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* FRIENDS / DMs Section */}
        <div className="sidebar-section">
          <div
            className="sidebar-section-title clickable"
            onClick={() => setFriendsExpanded(!friendsExpanded)}
          >
            <span>Friends ({myFriends.length})</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {pendingCount > 0 && <span className="unread-badge">{pendingCount}</span>}
              <button
                className="add-friend-btn"
                onClick={(e) => { e.stopPropagation(); onOpenFriends?.(); }}
                title="Manage Friends"
              >
                <HiUserGroup size={14} />
              </button>
              {friendsExpanded ? <HiChevronDown size={14} /> : <HiChevronRight size={14} />}
            </div>
          </div>

          {friendsExpanded && (
            <>
              {myFriends.length === 0 ? (
                <div style={{ fontSize: 12, color: '#64748b', padding: '12px', textAlign: 'center' }}>
                  <div style={{ marginBottom: 8 }}>No friends yet</div>
                  <button
                    className="btn-primary btn-sm"
                    onClick={onOpenFriends}
                    style={{ fontSize: 12 }}
                  >
                    <HiUserGroup size={14} /> Find Friends
                  </button>
                </div>
              ) : (
                myFriends.map(f => (
                  <div
                    key={f.id}
                    className={`nav-item ${activeChat?.type === 'dm' && activeChat?.id === f.id ? 'active' : ''}`}
                    onClick={() => onOpenChat({
                      id: f.id,
                      type: 'dm',
                      name: f.name,
                      avatar: f.avatar_url,
                      userId: f.user_id,
                      status: onlineUsers?.has(f.id) ? 'online' : 'offline'
                    })}
                  >
                    <div className="dm-avatar-wrapper">
                      <img
                        src={f.avatar_url || `https://api.dicebear.com/9.x/lorelei/svg?seed=${f.name}`}
                        alt=""
                        className="dm-avatar"
                        onError={(e) => { e.target.src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${f.name}`; }}
                      />
                      <span
                        className="status-indicator"
                        style={{
                          background: onlineUsers?.has(f.id) ? '#22c55e' : '#64748b'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="truncate" style={{ fontSize: 13 }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>@{f.user_id}</div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Current User (bottom) */}
      <div className="sidebar-profile" onClick={onOpenProfile} style={{ cursor: 'pointer' }}>
        <img
          src={user?.avatar_url || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user?.name || 'user'}`}
          alt="Profile"
          className="profile-avatar"
          onError={(e) => { e.target.src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${user?.name || 'user'}`; }}
        />
        <div className="profile-info">
          <div className="profile-name">{user?.name}</div>
          <div className="profile-email">@{user?.user_id} · {user?.email}</div>
        </div>
        <button className="icon-btn" title="Logout" onClick={(e) => { e.stopPropagation(); logout(); }}>
          <HiLogout size={16} />
        </button>
      </div>
    </div>
  );
}
