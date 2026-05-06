import React, { useState, useEffect } from 'react';
import { HiClock, HiUserGroup, HiIdentification, HiMail, HiCalendar } from 'react-icons/hi';
import { teams as teamsApi } from '../../utils/api';

export default function RightSidebar({ activeChat, onlineUsers, onClose }) {
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    if (activeChat?.type === 'team') {
      loadTeamMembers(activeChat.id);
    } else {
      setTeamMembers([]);
    }
  }, [activeChat?.id, activeChat?.type]);

  const loadTeamMembers = async (teamId) => {
    try {
      const { data } = await teamsApi.getMembers(teamId);
      setTeamMembers(data || []);
    } catch (e) {
      console.error('Failed to load team members:', e);
    }
  };

  const isDM = activeChat?.type === 'dm';
  const isTeam = activeChat?.type === 'team';

  return (
    <div className="right-sidebar !flex fixed md:relative inset-0 md:inset-auto right-0 w-full md:w-[300px] z-[100] md:z-10 bg-[#0f0a1a] md:bg-transparent overflow-y-auto shadow-2xl md:shadow-none flex-col h-full border-l-0 md:border-l border-white/10">
      {/* Mobile close header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#171223]">
        <h3 className="text-white font-semibold m-0">{isTeam ? 'Team Details' : 'User Profile'}</h3>
        <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      {!activeChat && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 13 }}>Select a chat to see details</p>
        </div>
      )}

      {/* DM: User Profile */}
      {isDM && (
        <>
          <div className="context-section">
            <h4>User Profile</h4>
            <div className="member-card">
              <img
                src={activeChat.avatar || `https://api.dicebear.com/9.x/lorelei/svg?seed=${activeChat.name}`}
                alt=""
                className="member-avatar"
                onError={(e) => { e.target.src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${activeChat.name}`; }}
                style={{ objectFit: 'cover' }}
              />
              <div className="member-name">{activeChat.name}</div>
              {activeChat.userId && (
                <div className="member-role" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HiIdentification size={14} /> @{activeChat.userId}
                </div>
              )}
              <div className="member-status">
                <span
                  className="status-dot"
                  style={{ background: onlineUsers?.has(activeChat.id) ? '#22c55e' : '#64748b' }}
                />
                {onlineUsers?.has(activeChat.id) ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>

          <div className="context-section">
            <h4>Quick Actions</h4>
            <div className="quick-actions-list">
              <div className="quick-action-item">
                <HiMail size={16} />
                <span>Send Email</span>
              </div>
              <div className="quick-action-item">
                <HiCalendar size={16} />
                <span>Schedule Meeting</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Team: Members + Info */}
      {isTeam && (
        <>
          <div className="context-section">
            <h4>Team Info</h4>
            <div className="context-label">Channel</div>
            <div className="context-value"># {activeChat.name}</div>
          </div>

          <div className="context-section">
            <h4>
              <HiUserGroup size={16} style={{ display: 'inline', marginRight: 6 }} />
              Members ({teamMembers.length})
            </h4>
            {teamMembers.length === 0 ? (
              <div style={{ fontSize: 13, color: '#64748b', padding: '8px 0' }}>Loading...</div>
            ) : (
              <div className="team-members-list">
                {teamMembers.map(m => (
                  <div key={m.id} className="team-member-item">
                    <div className="dm-avatar-wrapper" style={{ flexShrink: 0 }}>
                      <img
                        src={m.avatar_url || `https://api.dicebear.com/9.x/lorelei/svg?seed=${m.name}`}
                        alt=""
                        className="dm-avatar"
                        onError={(e) => { e.target.src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${m.name}`; }}
                      />
                      <span
                        className="status-indicator"
                        style={{ background: onlineUsers?.has(m.id) ? '#22c55e' : '#64748b' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#f8fafc' }} className="truncate">{m.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{m.role || 'member'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
