import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { teams as teamsApi } from '../../utils/api';

export default function InviteDialog({ isOpen, onClose }) {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [emails, setEmails] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen]);

  const fetchTeams = async () => {
    try {
      const { data } = await teamsApi.getAll();
      setTeams(data);
      if (data.length > 0) {
        setSelectedTeamId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const handleSendInvites = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !emails.trim()) return;

    const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
    if (emailList.length === 0) return;

    setSending(true);
    try {
      // Send invites to each email using the team member endpoint
      // This works for existing users; for non-existing users, a proper invite system would be needed
      const promises = emailList.map(email => 
        teamsApi.addMember(selectedTeamId, email)
      );
      await Promise.all(promises);
      
      // Reset form
      setEmails('');
      setMessage('');
      onClose();
      alert('Invitations sent successfully!');
    } catch (error) {
      console.error('Failed to send invites:', error);
      alert(error.response?.data?.error || 'Failed to send some invites. Make sure emails belong to registered users.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invite-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invite Teammates</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSendInvites}>
          <div className="form-group">
            <label>Select Team</label>
            <select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              required
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Email Addresses</label>
            <textarea
              placeholder="colleague1@example.com, colleague2@example.com"
              value={emails}
              onChange={e => setEmails(e.target.value)}
              rows="3"
              required
            />
            <small>Separate multiple emails with commas</small>
          </div>

          <div className="form-group">
            <label>Personal Message (optional)</label>
            <textarea
              placeholder="Add a personal touch to your invitation..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows="2"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={sending}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={sending}>
              {sending ? 'Sending...' : 'Send Invites'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
