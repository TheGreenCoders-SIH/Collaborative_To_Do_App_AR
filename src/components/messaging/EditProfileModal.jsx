import React, { useState, useRef } from 'react';
import { HiX, HiCamera, HiPencil, HiShieldCheck, HiIdentification } from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import { users } from '../../utils/api';
import '../../styles/messaging.css';

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    try {
      const { data } = await users.uploadAvatar(file);
      setAvatarPreview(data.avatar_url);
      setUser(prev => ({ ...prev, avatar_url: data.avatar_url }));
      showMessage('Avatar updated!');
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to upload avatar', 'error');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await users.updateProfile({ name: name.trim(), bio: bio.trim() });
      setUser(prev => ({ ...prev, name: data.name, bio: data.bio, avatar_url: data.avatar_url }));
      showMessage('Profile updated successfully!');
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      return showMessage('Fill in all password fields', 'error');
    }
    if (newPassword.length < 6) {
      return showMessage('Password must be at least 6 characters', 'error');
    }
    if (newPassword !== confirmPassword) {
      return showMessage('New passwords do not match', 'error');
    }

    setSaving(true);
    try {
      await users.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMessage('Password changed successfully!');
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (newPassword.length >= 6) score++;
    if (newPassword.length >= 10) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    const levels = [
      { label: 'Very Weak', color: '#ef4444', width: '20%' },
      { label: 'Weak', color: '#f97316', width: '40%' },
      { label: 'Fair', color: '#eab308', width: '60%' },
      { label: 'Strong', color: '#22c55e', width: '80%' },
      { label: 'Very Strong', color: '#06b6d4', width: '100%' },
    ];
    return levels[Math.min(score, 4)];
  };

  const strength = getPasswordStrength();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-profile-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="close-btn" onClick={onClose}><HiX size={22} /></button>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <HiPencil size={16} /> Profile
          </button>
          <button
            className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <HiShieldCheck size={16} /> Security
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`profile-message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="modal-body" style={{ paddingTop: 12 }}>
          {activeTab === 'profile' && (
            <>
              {/* Avatar */}
              <div className="profile-avatar-section">
                <div className="profile-avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
                  <img
                    src={avatarPreview || '/default-avatar.png'}
                    alt="Avatar"
                    className="profile-edit-avatar"
                    onError={(e) => { e.target.src = `https://api.dicebear.com/9.x/lorelei/svg?seed=${user?.name || 'user'}`; }}
                  />
                  <div className="avatar-overlay">
                    <HiCamera size={24} />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <span className="avatar-hint">Click to change photo</span>
              </div>

              {/* User ID (read-only) */}
              <div className="form-group">
                <label><HiIdentification size={14} style={{ display: 'inline', marginRight: 6 }} />User ID</label>
                <div className="user-id-display">
                  <span>{user?.user_id || 'N/A'}</span>
                  <button
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(user?.user_id || '');
                      showMessage('User ID copied!');
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Email (read-only) */}
              <div className="form-group">
                <label>Email</label>
                <input type="text" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
              </div>

              {/* Name */}
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={50}
                />
              </div>

              {/* Bio */}
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={200}
                />
                <small>{bio.length}/200</small>
              </div>

              <div className="form-actions">
                <button type="button" onClick={onClose}>Cancel</button>
                <button className="primary" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                {newPassword && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className="strength-fill"
                        style={{ width: strength.width, background: strength.color }}
                      />
                    </div>
                    <span style={{ color: strength.color, fontSize: 12 }}>{strength.label}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={onClose}>Cancel</button>
                <button className="primary" onClick={handleChangePassword} disabled={saving}>
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
