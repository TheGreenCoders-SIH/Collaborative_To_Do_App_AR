const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /friends/request — Send a friend request
router.post('/request', authenticate, async (req, res) => {
  const { addressee_id } = req.body;
  const requesterId = req.user.id;

  if (!addressee_id) {
    return res.status(400).json({ error: 'addressee_id is required' });
  }

  if (requesterId === addressee_id) {
    return res.status(400).json({ error: 'Cannot send friend request to yourself' });
  }

  try {
    // Check if the target user exists
    const userCheck = await pool.query('SELECT id, name FROM users WHERE id = $1', [addressee_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if a friendship already exists in either direction
    const existing = await pool.query(
      `SELECT * FROM friendships 
       WHERE (requester_id = $1 AND addressee_id = $2) 
          OR (requester_id = $2 AND addressee_id = $1)`,
      [requesterId, addressee_id]
    );

    if (existing.rows.length > 0) {
      const friendship = existing.rows[0];
      if (friendship.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' });
      }
      if (friendship.status === 'pending') {
        // If the other person already sent us a request, auto-accept
        if (friendship.requester_id === addressee_id) {
          await pool.query(
            "UPDATE friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
            [friendship.id]
          );
          return res.json({ message: 'Friend request accepted (they had already sent you one)', status: 'accepted' });
        }
        return res.status(400).json({ error: 'Friend request already pending' });
      }
      if (friendship.status === 'rejected') {
        // Allow re-requesting after rejection
        await pool.query(
          "UPDATE friendships SET status = 'pending', requester_id = $1, addressee_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
          [requesterId, addressee_id, friendship.id]
        );
        return res.status(201).json({ message: 'Friend request sent', status: 'pending' });
      }
    }

    // Create new friendship request
    await pool.query(
      "INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 'pending')",
      [requesterId, addressee_id]
    );

    // Create in-app notification
    const { createNotification } = require('../utils/notifications');
    const requesterResult = await pool.query('SELECT name FROM users WHERE id = $1', [requesterId]);
    const requesterName = requesterResult.rows[0]?.name || 'Someone';
    await createNotification(req.app, addressee_id, 'New Friend Request', `${requesterName} sent you a friend request.`, 'friend_request');

    res.status(201).json({ message: 'Friend request sent', status: 'pending' });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// PUT /friends/respond — Accept or reject a friend request
router.put('/respond', authenticate, async (req, res) => {
  const { friendship_id, action } = req.body; // action: 'accept' or 'reject'
  const userId = req.user.id;

  if (!friendship_id || !action) {
    return res.status(400).json({ error: 'friendship_id and action are required' });
  }

  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be accept or reject' });
  }

  try {
    // Verify this request is addressed to the current user
    const friendship = await pool.query(
      "SELECT * FROM friendships WHERE id = $1 AND addressee_id = $2 AND status = 'pending'",
      [friendship_id, userId]
    );

    if (friendship.rows.length === 0) {
      return res.status(404).json({ error: 'Friend request not found or already handled' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await pool.query(
      'UPDATE friendships SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStatus, friendship_id]
    );

    if (action === 'accept') {
      const { createNotification } = require('../utils/notifications');
      const respondentResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
      const respondentName = respondentResult.rows[0]?.name || 'Someone';
      const requesterId = friendship.rows[0].requester_id;
      await createNotification(req.app, requesterId, 'Friend Request Accepted', `${respondentName} accepted your friend request.`, 'friend_accept');
    }

    res.json({ message: `Friend request ${newStatus}`, status: newStatus });
  } catch (error) {
    console.error('Friend respond error:', error);
    res.status(500).json({ error: 'Failed to respond to friend request' });
  }
});

// DELETE /friends/:friendId — Remove a friend
router.delete('/:friendId', authenticate, async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `DELETE FROM friendships 
       WHERE ((requester_id = $1 AND addressee_id = $2) 
          OR (requester_id = $2 AND addressee_id = $1))
         AND status = 'accepted'`,
      [userId, friendId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// GET /friends — List all friends (accepted)
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT f.id as friendship_id, f.created_at as friends_since,
              u.id, u.email, u.name, u.user_id, u.avatar_url, u.bio, u.public_key
       FROM friendships f
       JOIN users u ON (
         CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END = u.id
       )
       WHERE (f.requester_id = $1 OR f.addressee_id = $1)
         AND f.status = 'accepted'
       ORDER BY u.name ASC`,
      [userId]
    );

    res.json({ friends: result.rows });
  } catch (error) {
    console.error('List friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// GET /friends/pending — List pending friend requests (incoming)
router.get('/pending', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT f.id as friendship_id, f.created_at as requested_at,
              u.id, u.email, u.name, u.user_id, u.avatar_url
       FROM friendships f
       JOIN users u ON f.requester_id = u.id
       WHERE f.addressee_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ requests: result.rows });
  } catch (error) {
    console.error('List pending requests error:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// GET /friends/sent — List sent friend requests (outgoing)
router.get('/sent', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT f.id as friendship_id, f.created_at as requested_at, f.status,
              u.id, u.email, u.name, u.user_id, u.avatar_url
       FROM friendships f
       JOIN users u ON f.addressee_id = u.id
       WHERE f.requester_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ requests: result.rows });
  } catch (error) {
    console.error('List sent requests error:', error);
    res.status(500).json({ error: 'Failed to fetch sent requests' });
  }
});

// GET /friends/check/:userId — Check friendship status with a specific user
router.get('/check/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id as friendship_id, status, requester_id, addressee_id 
       FROM friendships 
       WHERE (requester_id = $1 AND addressee_id = $2) 
          OR (requester_id = $2 AND addressee_id = $1)`,
      [currentUserId, userId]
    );

    if (result.rows.length === 0) {
      return res.json({ status: 'none' });
    }

    const f = result.rows[0];
    res.json({
      friendship_id: f.friendship_id,
      status: f.status,
      direction: f.requester_id === currentUserId ? 'sent' : 'received'
    });
  } catch (error) {
    console.error('Check friendship error:', error);
    res.status(500).json({ error: 'Failed to check friendship' });
  }
});

module.exports = router;
