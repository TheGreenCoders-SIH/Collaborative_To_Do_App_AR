import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { teams as teamsApi, channels as channelsApi } from '../../utils/api';
import { HiPlus, HiHashtag } from 'react-icons/hi';

export default function ChannelBrowser({ isOpen, onClose }) {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTeamId) {
      fetchChannels(selectedTeamId);
    }
  }, [selectedTeamId]);

  const fetchTeams = async () => {
    try {
      const { data } = await teamsApi.getAll();
      setTeams(data);
      if (data.length > 0 && !selectedTeamId) {
        setSelectedTeamId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const fetchChannels = async (teamId) => {
    setLoading(true);
    try {
      const { data } = await teamsApi.getChannels(teamId);
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim() || !selectedTeamId) return;
    try {
      await teamsApi.createChannel(selectedTeamId, {
        name: newChannelName.trim(),
        description: newChannelDesc.trim()
      });
      setNewChannelName('');
      setNewChannelDesc('');
      setShowCreateForm(false);
      fetchChannels(selectedTeamId);
    } catch (error) {
      console.error('Failed to create channel:', error);
      alert(error.response?.data?.error || 'Failed to create channel');
    }
  };

  const handleJoinChannel = async (channelId) => {
    try {
      await channelsApi.join(channelId);
      fetchChannels(selectedTeamId);
    } catch (error) {
      console.error('Failed to join channel:', error);
      alert(error.response?.data?.error || 'Failed to join channel');
    }
  };

  const handleLeaveChannel = async (channelId) => {
    try {
      await channelsApi.leave(channelId);
      fetchChannels(selectedTeamId);
    } catch (error) {
      console.error('Failed to leave channel:', error);
      alert(error.response?.data?.error || 'Failed to leave channel');
    }
  };

  if (!isOpen) return null;

  const currentTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content channel-browser" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Browse Channels</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {teams.length > 0 && (
            <div className="team-selector">
              <label>Team:</label>
              <select
                value={selectedTeamId || ''}
                onChange={e => setSelectedTeamId(Number(e.target.value))}
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          )}
          {showCreateForm ? (
            <form className="create-channel-form" onSubmit={handleCreateChannel}>
              <h3>Create New Channel</h3>
              <input
                type="text"
                placeholder="Channel name"
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newChannelDesc}
                onChange={e => setNewChannelDesc(e.target.value)}
              />
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>Cancel</button>
                <button type="submit" className="primary">Create</button>
              </div>
            </form>
          ) : (
            <button className="create-channel-btn" onClick={() => setShowCreateForm(true)}>
              <HiPlus size={18} /> Create New Channel
            </button>
          )}
          <div className="channels-list">
            <h3>Channels in {currentTeam?.name || 'selected team'}</h3>
            {loading ? (
              <div className="loading">Loading channels...</div>
            ) : channels.length === 0 ? (
              <div className="empty-state">No channels yet. Create one!</div>
            ) : (
              channels.map(channel => (
                <div key={channel.id} className="channel-item">
                  <div className="channel-info">
                    <span className="channel-icon"><HiHashtag /></span>
                    <div>
                      <div className="channel-name">{channel.name}</div>
                      <div className="channel-meta">
                        {channel.member_count || 0} members
                        {channel.description && ` · ${channel.description.substring(0, 50)}`}
                      </div>
                    </div>
                  </div>
                  <div className="channel-actions">
                    {channel.is_member ? (
                      <button
                        className="btn-secondary"
                        onClick={() => handleLeaveChannel(channel.id)}
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        className="btn-primary"
                        onClick={() => handleJoinChannel(channel.id)}
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
