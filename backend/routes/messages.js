const express = require('express');
const pool = require('../config/database');
const { encryptMessage, decryptMessage, generateKeyPair } = require('../utils/encryption');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper: Check if two users are friends
async function areFriends(userId1, userId2) {
  const result = await pool.query(
    `SELECT id FROM friendships 
     WHERE ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))
       AND status = 'accepted'`,
    [userId1, userId2]
  );
  return result.rows.length > 0;
}

// Get or create conversation with a user (FRIEND-GATED)
router.post('/conversations', authenticate, async (req, res) => {
  const { user_id_2 } = req.body;
  const user_id_1 = req.user.id;

  if (user_id_1 === user_id_2) {
    return res.status(400).json({ error: 'Cannot create conversation with yourself' });
  }

  try {
    // Check friendship status
    const friends = await areFriends(user_id_1, user_id_2);
    if (!friends) {
      return res.status(403).json({ error: 'You can only message friends. Send a friend request first!' });
    }

    // Ensure user_id_1 < user_id_2 for unique constraint
    const [smaller, larger] = user_id_1 < user_id_2 ? [user_id_1, user_id_2] : [user_id_2, user_id_1];

    // Check if conversation exists
    const existingConv = await pool.query(
      'SELECT * FROM conversations WHERE user_id_1 = $1 AND user_id_2 = $2',
      [smaller, larger]
    );

    if (existingConv.rows.length > 0) {
      return res.json({ conversation: existingConv.rows[0] });
    }

    // Create new conversation
    const result = await pool.query(
      'INSERT INTO conversations (user_id_1, user_id_2) VALUES ($1, $2) RETURNING *',
      [smaller, larger]
    );

    res.status(201).json({ conversation: result.rows[0] });
  } catch (error) {
    console.error('Error creating conversation:', error.message);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get all conversations for a user
router.get('/conversations', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT c.*, 
              CASE WHEN c.user_id_1 = $1 THEN u2.id ELSE u1.id END as other_user_id,
              CASE WHEN c.user_id_1 = $1 THEN u2.name ELSE u1.name END as other_user_name,
              CASE WHEN c.user_id_1 = $1 THEN u2.avatar_url ELSE u1.avatar_url END as other_user_avatar,
              CASE WHEN c.user_id_1 = $1 THEN u2.user_id ELSE u1.user_id END as other_user_uid,
              (SELECT encrypted_content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
       FROM conversations c
       JOIN users u1 ON c.user_id_1 = u1.id
       JOIN users u2 ON c.user_id_2 = u2.id
       WHERE c.user_id_1 = $1 OR c.user_id_2 = $1
       ORDER BY c.updated_at DESC`,
      [userId]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Error fetching conversations:', error.message);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  try {
    // Verify user is part of conversation
    const convCheck = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND (user_id_1 = $2 OR user_id_2 = $2)',
      [conversationId, userId]
    );

    if (convCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT m.*, 
              u.name as sender_name, 
              u.avatar_url as sender_avatar,
              u.public_key as sender_public_key,
              COUNT(DISTINCT CASE WHEN mrs.read_at IS NOT NULL THEN mrs.id END) as read_count
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN message_read_status mrs ON m.id = mrs.message_id
       WHERE m.conversation_id = $1
       GROUP BY m.id, u.id, u.name, u.avatar_url, u.public_key
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/messages', authenticate, async (req, res) => {
  const { conversation_id, encrypted_content } = req.body;
  const sender_id = req.user.id;

  if (!conversation_id || !encrypted_content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify user is part of conversation
    const convCheck = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND (user_id_1 = $2 OR user_id_2 = $2)',
      [conversation_id, sender_id]
    );

    if (convCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Create message
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, encrypted_content, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [conversation_id, sender_id, encrypted_content, 'sent']
    );

    // Update conversation updated_at
    await pool.query(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversation_id]
    );

    res.status(201).json({ message: result.rows[0] });
  } catch (error) {
    console.error('Error sending message:', error.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark message as read
router.post('/messages/:messageId/read', authenticate, async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    // Check if user is recipient of message
    const msgCheck = await pool.query(
      `SELECT m.* FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE m.id = $1 AND (c.user_id_1 = $2 OR c.user_id_2 = $2) AND m.sender_id != $2`,
      [messageId, userId]
    );

    if (msgCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Insert or update read status
    await pool.query(
      `INSERT INTO message_read_status (message_id, user_id, read_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (message_id, user_id) DO UPDATE SET read_at = CURRENT_TIMESTAMP`,
      [messageId, userId]
    );

    // Update message status if all recipients have read
    const messageData = msgCheck.rows[0];
    const convCheck = await pool.query('SELECT * FROM conversations WHERE id = $1', [messageData.conversation_id]);
    const conv = convCheck.rows[0];
    
    const otherUserId = conv.user_id_1 === userId ? conv.user_id_2 : conv.user_id_1;
    const readStatusCheck = await pool.query(
      'SELECT * FROM message_read_status WHERE message_id = $1 AND user_id = $2 AND read_at IS NOT NULL',
      [messageId, otherUserId]
    );

    if (readStatusCheck.rows.length > 0) {
      await pool.query('UPDATE messages SET status = $1 WHERE id = $2', ['read', messageId]);
    } else {
      await pool.query('UPDATE messages SET status = $1 WHERE id = $2', ['delivered', messageId]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error.message);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Get user presence
router.get('/presence/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM user_presence WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ presence: { status: 'offline', last_seen: null } });
    }

    res.json({ presence: result.rows[0] });
  } catch (error) {
    console.error('Error fetching presence:', error.message);
    res.status(500).json({ error: 'Failed to fetch presence' });
  }
});

// ===================== TEAM MESSAGES =====================

// GET /messages/team/:teamId — Get team chat messages
router.get('/team/:teamId', authenticate, async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  try {
    // Verify user is a member of the team
    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const result = await pool.query(
      `SELECT tm.*, u.name as sender_name, u.avatar_url as sender_avatar, u.user_id as sender_uid
       FROM team_messages tm
       JOIN users u ON tm.sender_id = u.id
       WHERE tm.team_id = $1
       ORDER BY tm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [teamId, limit, offset]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Error fetching team messages:', error.message);
    res.status(500).json({ error: 'Failed to fetch team messages' });
  }
});

// POST /messages/team/:teamId — Send a message in team chat
router.post('/team/:teamId', authenticate, async (req, res) => {
  const { teamId } = req.params;
  const { content } = req.body;
  const senderId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    // Verify user is a member of the team
    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, senderId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const result = await pool.query(
      `INSERT INTO team_messages (team_id, sender_id, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [teamId, senderId, content.trim()]
    );

    // Get sender info for the response
    const userResult = await pool.query(
      'SELECT name, avatar_url, user_id FROM users WHERE id = $1',
      [senderId]
    );

    const message = {
      ...result.rows[0],
      sender_name: userResult.rows[0].name,
      sender_avatar: userResult.rows[0].avatar_url,
      sender_uid: userResult.rows[0].user_id
    };

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending team message:', error.message);
    res.status(500).json({ error: 'Failed to send team message' });
  }
});

module.exports = router;
