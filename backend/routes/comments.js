const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/tasks/:taskId/comments', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const taskResult = await pool.query(
      'SELECT team_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [taskResult.rows[0].team_id, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const result = await pool.query(
      'INSERT INTO comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [taskId, req.user.id, content]
    );

    await pool.query(
      `INSERT INTO activity_logs (team_id, user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, 'comment_added', 'task', $3, $4)`,
      [taskResult.rows[0].team_id, req.user.id, taskId, JSON.stringify({ comment_preview: content.substring(0, 50) })]
    );

    const commentWithUser = await pool.query(
      'SELECT c.*, u.name as user_name, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = $1',
      [result.rows[0].id]
    );

    res.status(201).json(commentWithUser.rows[0]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.get('/tasks/:taskId/comments', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;

    const taskResult = await pool.query(
      'SELECT team_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [taskResult.rows[0].team_id, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const result = await pool.query(
      'SELECT c.*, u.name as user_name, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.task_id = $1 ORDER BY c.created_at',
      [taskId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.delete('/comments/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const commentResult = await pool.query(
      'SELECT c.*, t.team_id FROM comments c JOIN tasks t ON c.task_id = t.id WHERE c.id = $1',
      [id]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [commentResult.rows[0].team_id, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    if (commentResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Can only delete your own comments' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [id]);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;