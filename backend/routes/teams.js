const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, approval_rule } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const teamResult = await client.query(
        'INSERT INTO teams (name, description, creator_id, approval_rule) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description || null, req.user.id, approval_rule || 'creator_only']
      );
      
      const team = teamResult.rows[0];
      
      await client.query(
        'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
        [team.id, req.user.id, 'creator']
      );
      
      await client.query('COMMIT');
      
      res.status(201).json(team);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, tm.role as user_role
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const teamResult = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );
    
    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const membersResult = await pool.query(
      `SELECT u.id, u.email, u.name, u.avatar_url, tm.role, tm.joined_at
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at`,
      [id]
    );
    
    res.json({
      ...teamResult.rows[0],
      members: membersResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, approval_rule } = req.body;
    
    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = $3',
      [id, req.user.id, 'creator']
    );
    
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Only team creator can update team settings' });
    }
    
    const result = await pool.query(
      'UPDATE teams SET name = COALESCE($1, name), description = COALESCE($2, description), approval_rule = COALESCE($3, approval_rule), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, description, approval_rule, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update team' });
  }
});

router.post('/:id/members', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }
    
    const userResult = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    const existingMember = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, user.id]
    );
    
    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a member' });
    }
    
    await pool.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
      [id, user.id, 'member']
    );
    
    await pool.query(
      `INSERT INTO activity_logs (team_id, user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, 'member_added', 'user', $3, $4)`,
      [id, req.user.id, user.id, JSON.stringify({ added_user_email: email })]
    );
    
    res.status(201).json({ message: 'Member added successfully', user });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = $3',
      [id, req.user.id, 'creator']
    );
    
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Only team creator can remove members' });
    }
    
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }
    
    await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

router.get('/:id/members', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }
    
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.avatar_url, tm.role, tm.joined_at
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1
       ORDER BY tm.role DESC, tm.joined_at`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

module.exports = router;