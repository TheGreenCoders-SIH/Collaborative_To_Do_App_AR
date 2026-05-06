const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/teams/:teamId/activity', authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const result = await pool.query(
      `SELECT al.*, u.name as user_name, u.avatar_url
       FROM activity_logs al
       JOIN users u ON al.user_id = u.id
       WHERE al.team_id = $1
       ORDER BY al.created_at DESC
       LIMIT $2 OFFSET $3`,
      [teamId, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

router.get('/teams/:teamId/updates', authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { since } = req.query;

    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    let query = `
      SELECT al.*, u.name as user_name
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.team_id = $1
    `;
    const params = [teamId];

    if (since) {
      query += ' AND al.created_at > $2';
      params.push(new Date(since));
    }

    query += ' ORDER BY al.created_at DESC LIMIT 20';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
});

router.get('/teams/:teamId/metrics', authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;

    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const userMetrics = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.avatar_url,
        COUNT(CASE WHEN t.status = 'complete' THEN 1 END) as tasks_completed,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as tasks_in_progress,
        COUNT(CASE WHEN t.status = 'pending_approval' THEN 1 END) as tasks_pending_approval,
        COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as tasks_todo
       FROM users u
       JOIN team_members tm ON u.id = tm.user_id
       LEFT JOIN tasks t ON t.team_id = tm.team_id
       WHERE tm.team_id = $1
       GROUP BY u.id
       ORDER BY tasks_completed DESC`,
      [teamId]
    );

    const teamStats = await pool.query(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'complete' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'pending_approval' THEN 1 END) as pending_approval_tasks,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_tasks,
        COUNT(DISTINCT created_by) as active_members
       FROM tasks
       WHERE team_id = $1`,
      [teamId]
    );

    const approvalStats = await pool.query(
      `SELECT 
        AVG(EXTRACT(EPOCH FROM (a.updated_at - a.created_at))) as avg_approval_time,
        COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as total_approved,
        COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as total_rejected
       FROM approvals a
       JOIN tasks t ON a.task_id = t.id
       WHERE t.team_id = $1 AND a.status != 'pending'`,
      [teamId]
    );

    res.json({
      user_metrics: userMetrics.rows,
      team_stats: teamStats.rows[0],
      approval_stats: approvalStats.rows[0]
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

module.exports = router;