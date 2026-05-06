import React, { useState, useEffect } from 'react';
import { HiUserAdd, HiCheck, HiX, HiSearch, HiUserGroup, HiClock, HiArrowRight } from 'react-icons/hi';
import { friends as friendsApi, users as usersApi } from '../../utils/api';
import { useSocket } from '../../context/SocketContext';

export default function FriendsPanel({ isOpen, onClose, onOpenDM }) {
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState('friends');
  const [friendsList, setFriendsList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
      loadPending();
      loadSent();
    }
  }, [isOpen]);

  // Listen for real-time friend events
  useEffect(() => {
    if (!socket) return;
    const onRequestReceived = () => { loadPending(); };
    const onResponseReceived = () => { loadFriends(); loadSent(); };

    socket.on('friend:request:received', onRequestReceived);
    socket.on('friend:response:received', onResponseReceived);
    return () => {
      socket.off('friend:request:received', onRequestReceived);
      socket.off('friend:response:received', onResponseReceived);
    };
  }, [socket]);

  const loadFriends = async () => {
    try {
      const { data } = await friendsApi.list();
      setFriendsList(data.friends || []);
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  };

  const loadPending = async () => {
    try {
      const { data } = await friendsApi.pending();
      setPendingRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to load pending:', err);
    }
  };

  const loadSent = async () => {
    try {
      const { data } = await friendsApi.sent();
      setSentRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to load sent:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchMessage('');
      return;
    }

    setSearchLoading(true);
    setSearchMessage('');
    try {
      const { data } = await usersApi.search(searchQuery.trim());
      setSearchResults(data.users || []);
      if ((data.users || []).length === 0) {
        setSearchMessage('No user found. Enter the complete email or User ID.');
      }
    } catch (err) {
      setSearchMessage('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await friendsApi.request(userId);
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      loadSent();
      // Notify via socket
      socket?.emit('friend:request', { toUserId: userId });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send request');
    }
  };

  const respondToRequest = async (friendshipId, action, requesterId) => {
    try {
      await friendsApi.respond(friendshipId, action);
      loadPending();
      loadFriends();
      // Notify via socket
      socket?.emit('friend:response', { toUserId: requesterId, action });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to respond');
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm('Remove this friend?')) return;
    try {
      await friendsApi.remove(friendId);
      loadFriends();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove friend');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content friends-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2><HiUserGroup size={20} style={{ marginRight: 8, display: 'inline' }} />Friends</h2>
          <button className="close-btn" onClick={onClose}><HiX size={22} /></button>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button className={`profile-tab ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
            Friends ({friendsList.length})
          </button>
          <button className={`profile-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            Requests {pendingRequests.length > 0 && <span className="tab-badge">{pendingRequests.length}</span>}
          </button>
          <button className={`profile-tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>
            <HiUserAdd size={16} /> Add
          </button>
        </div>

        <div className="modal-body" style={{ paddingTop: 12, minHeight: 300 }}>
          {/* FRIENDS TAB */}
          {activeTab === 'friends' && (
            <div className="friends-list">
              {friendsList.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                  <p>No friends yet. Add someone!</p>
                </div>
              ) : (
                friendsList.map(f => (
                  <div key={f.id} className="friend-item">
                    <img
                      src={f.avatar_url || `https://api.dicebear.com/9.x/lorelei/svg?seed=${f.name}`}
                      alt=""
                      className="friend-avatar"
                      onError={(e) => { e.target.src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${f.name}`; }}
                    />
                    <div className="friend-info">
                      <div className="friend-name">{f.name}</div>
                      <div className="friend-meta">@{f.user_id} · {f.email}</div>
                    </div>
                    <div className="friend-actions">
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => {
                          onOpenDM?.(f);
                          onClose();
                        }}
                        title="Message"
                      >
                        💬
                      </button>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => removeFriend(f.id)}
                        title="Remove"
                      >
                        <HiX size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PENDING REQUESTS TAB */}
          {activeTab === 'pending' && (
            <div className="friends-list">
              {pendingRequests.length === 0 && sentRequests.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
                  <p>No pending requests</p>
                </div>
              ) : (
                <>
                  {pendingRequests.length > 0 && (
                    <>
                      <div className="section-label">Incoming Requests</div>
                      {pendingRequests.map(r => (
                        <div key={r.friendship_id} className="friend-item">
                          <img
                            src={r.avatar_url || `https://api.dicebear.com/9.x/lorelei/svg?seed=${r.name}`}
                            alt=""
                            className="friend-avatar"
                            onError={(e) => { e.target.src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${r.name}`; }}
                          />
                          <div className="friend-info">
                            <div className="friend-name">{r.name}</div>
                            <div className="friend-meta">@{r.user_id} · {r.email}</div>
                          </div>
                          <div className="friend-actions">
                            <button
                              className="btn-primary btn-sm"
                              onClick={() => respondToRequest(r.friendship_id, 'accept', r.id)}
                              title="Accept"
                            >
                              <HiCheck size={16} />
                            </button>
                            <button
                              className="btn-secondary btn-sm"
                              onClick={() => respondToRequest(r.friendship_id, 'reject', r.id)}
                              title="Reject"
                            >
                              <HiX size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {sentRequests.length > 0 && (
                    <>
                      <div className="section-label" style={{ marginTop: 16 }}>Sent Requests</div>
                      {sentRequests.map(r => (
                        <div key={r.friendship_id} className="friend-item" style={{ opacity: 0.7 }}>
                          <img
                            src={r.avatar_url || `https://api.dicebear.com/9.x/lorelei/svg?seed=${r.name}`}
                            alt=""
                            className="friend-avatar"
                            onError={(e) => { e.target.src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${r.name}`; }}
                          />
                          <div className="friend-info">
                            <div className="friend-name">{r.name}</div>
                            <div className="friend-meta"><HiClock size={12} style={{ display: 'inline' }} /> Pending...</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ADD FRIEND TAB */}
          {activeTab === 'add' && (
            <div>
              <div className="form-group">
                <label>Find by Email or User ID</label>
                <div className="search-row">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setSearchResults([]);
                      setSearchMessage('');
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter complete email or User ID..."
                  />
                  <button className="btn-primary" onClick={handleSearch} disabled={searchLoading}>
                    <HiSearch size={18} />
                  </button>
                </div>
                <small>Enter the full email address or User ID, then press Enter or click search</small>
              </div>

              {searchLoading && (
                <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Searching...</div>
              )}

              {searchMessage && (
                <div style={{ textAlign: 'center', padding: 16, color: '#94a3b8', fontSize: 13 }}>{searchMessage}</div>
              )}

              {searchResults.map(u => (
                <div key={u.id} className="friend-item">
                  <img
                    src={u.avatar_url || `https://api.dicebear.com/9.x/lorelei/svg?seed=${u.name}`}
                    alt=""
                    className="friend-avatar"
                    onError={(e) => { e.target.src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${u.name}`; }}
                  />
                  <div className="friend-info">
                    <div className="friend-name">{u.name}</div>
                    <div className="friend-meta">@{u.user_id} · {u.email}</div>
                  </div>
                  <button className="btn-primary btn-sm" onClick={() => sendFriendRequest(u.id)}>
                    <HiUserAdd size={16} /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
