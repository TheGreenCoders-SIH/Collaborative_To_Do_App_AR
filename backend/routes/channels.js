const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /teams/:teamId/channels - list channels in a team
router.get('/teams/:teamId/channels', authenticate, async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;

  try {
    // Check if user is a member of the team
    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const result = await pool.query(
      `SELECT c.*,
              COUNT(DISTINCT cm.user_id) as member_count,
              EXISTS(SELECT 1 FROM channel_members WHERE channel_id = c.id AND user_id = $2) as is_member
       FROM channels c
       LEFT JOIN channel_members cm ON c.id = cm.channel_id
       WHERE c.team_id = $1
       GROUP BY c.id
       ORDER BY c.created_at`,
      [teamId, userId]
    );

    res.json({ channels: result.rows });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// POST /teams/:teamId/channels - create channel
router.post('/teams/:teamId/channels', authenticate, async (req, res) => {
  const { teamId } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Channel name is required' });
  }

  try {
    // Check if user is a member of the team
    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const result = await pool.query(
      'INSERT INTO channels (team_id, name, description, creator_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [teamId, name, description || null, req.user.id]
    );

    // Automatically add creator as member
    await pool.query(
      'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)',
      [result.rows[0].id, req.user.id]
    );

    res.status(201).json({ channel: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Channel name already exists in this team' });
    }
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// POST /channels/:channelId/join - join channel
router.post('/channels/:channelId/join', authenticate, async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user.id;

  try {
    // Get channel and verify team membership
    const channelResult = await pool.query(
      'SELECT * FROM channels WHERE id = $1',
      [channelId]
    );

    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const channel = channelResult.rows[0];

    // Check if user is a member of the team
    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [channel.team_id, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Must be a team member to join channels' });
    }

    // Check if already a member
    const existingMember = await pool.query(
      'SELECT * FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'Already a member of this channel' });
    }

    await pool.query(
      'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)',
      [channelId, userId]
    );

    res.json({ message: 'Successfully joined channel' });
  } catch (error) {
    console.error('Error joining channel:', error);
    res.status(500).json({ error: 'Failed to join channel' });
  }
});

// POST /channels/:channelId/leave - leave channel
router.post('/channels/:channelId/leave', authenticate, async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user.id;

  try {
    // Check if user is a member
    const membership = await pool.query(
      'SELECT * FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(400).json({ error: 'Not a member of this channel' });
    }

    await pool.query(
      'DELETE FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    res.json({ message: 'Successfully left channel' });
  } catch (error) {
    console.error('Error leaving channel:', error);
    res.status(500).json({ error: 'Failed to leave channel' });
  }
});

// GET /channels/:channelId/members - get channel members
router.get('/channels/:channelId/members', authenticate, async (req, res) => {
  const { channelId } = req.params;

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.avatar_url, cm.joined_at
       FROM channel_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.channel_id = $1
       ORDER BY cm.joined_at`,
      [channelId]
    );

    res.json({ members: result.rows });
  } catch (error) {
    console.error('Error fetching channel members:', error);
    res.status(500).json({ error: 'Failed to fetch channel members' });
  }
});

module.exports = router;
