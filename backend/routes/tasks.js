const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/teams/:teamId/tasks', authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { title, description, status, deadline, assigned_to } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const taskResult = await client.query(
        `INSERT INTO tasks (team_id, created_by, title, description, status, deadline)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [teamId, req.user.id, title, description || null, status || 'todo', deadline || null]
      );

      const task = taskResult.rows[0];

      if (assigned_to && assigned_to.length > 0) {
        for (const userId of assigned_to) {
          await client.query(
            'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)',
            [task.id, userId]
          );
        }
      }

      await client.query(
        `INSERT INTO activity_logs (team_id, user_id, action, resource_type, resource_id, metadata)
         VALUES ($1, $2, 'task_created', 'task', $3, $4)`,
        [teamId, req.user.id, task.id, JSON.stringify({ task_title: title })]
      );

      await client.query('COMMIT');

      const assignedResult = await pool.query(
        `SELECT u.id, u.email, u.name, u.avatar_url
         FROM task_assignments ta
         JOIN users u ON ta.user_id = u.id
         WHERE ta.task_id = $1`,
        [task.id]
      );

      res.status(201).json({ ...task, assignments: assignedResult.rows });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.get('/teams/:teamId/tasks', authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { status, assigned_to } = req.query;

    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    let query = `
      SELECT t.*, u.name as creator_name, u.email as creator_email
      FROM tasks t
      JOIN users u ON t.created_by = u.id
      WHERE t.team_id = $1
    `;
    const params = [teamId];

    if (status) {
      query += ` AND t.status = $${params.length + 1}`;
      params.push(status);
    }

    if (assigned_to) {
      query += ` AND t.id IN (SELECT task_id FROM task_assignments WHERE user_id = $${params.length + 1})`;
      params.push(assigned_to);
    }

    query += ' ORDER BY t.created_at DESC';

    const tasksResult = await pool.query(query, params);

    const tasks = await Promise.all(tasksResult.rows.map(async (task) => {
      const assignmentsResult = await pool.query(
        `SELECT u.id, u.email, u.name, u.avatar_url
         FROM task_assignments ta
         JOIN users u ON ta.user_id = u.id
         WHERE ta.task_id = $1`,
        [task.id]
      );

      const approvalsResult = await pool.query(
        `SELECT a.*, u.name as user_name
         FROM approvals a
         JOIN users u ON a.user_id = u.id
         WHERE a.task_id = $1`,
        [task.id]
      );

      const commentsCountResult = await pool.query(
        'SELECT COUNT(*) as count FROM comments WHERE task_id = $1',
        [task.id]
      );

      return {
        ...task,
        assignments: assignmentsResult.rows,
        approvals: approvalsResult.rows,
        comments_count: parseInt(commentsCountResult.rows[0].count)
      };
    }));

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/tasks/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const taskResult = await pool.query(
      'SELECT t.*, u.name as creator_name FROM tasks t JOIN users u ON t.created_by = u.id WHERE t.id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [task.team_id, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const assignmentsResult = await pool.query(
      'SELECT u.id, u.email, u.name, u.avatar_url FROM task_assignments ta JOIN users u ON ta.user_id = u.id WHERE ta.task_id = $1',
      [id]
    );

    const approvalsResult = await pool.query(
      'SELECT a.*, u.name as user_name FROM approvals a JOIN users u ON a.user_id = u.id WHERE a.task_id = $1',
      [id]
    );

    const commentsResult = await pool.query(
      'SELECT c.*, u.name as user_name, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.task_id = $1 ORDER BY c.created_at',
      [id]
    );

    const attachmentsResult = await pool.query(
      'SELECT * FROM attachments WHERE task_id = $1 ORDER BY created_at',
      [id]
    );

    res.json({
      ...task,
      assignments: assignmentsResult.rows,
      approvals: approvalsResult.rows,
      comments: commentsResult.rows,
      attachments: attachmentsResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.put('/tasks/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, deadline } = req.body;

    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
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
      `UPDATE tasks SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        deadline = COALESCE($3, deadline),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [title, description, deadline, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.put('/tasks/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['todo', 'in_progress', 'pending_approval', 'complete'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const taskResult = await pool.query(
      'SELECT t.*, tm.approval_rule FROM tasks t JOIN teams tm ON t.team_id = tm.id WHERE t.id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];
    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [task.team_id, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    if (status === 'pending_approval' && task.status !== 'pending_approval') {
      const teamMembers = await pool.query(
        'SELECT user_id FROM team_members WHERE team_id = $1',
        [task.team_id]
      );

      for (const member of teamMembers.rows) {
        await pool.query(
          'INSERT INTO approvals (task_id, user_id, status) VALUES ($1, $2, $3)',
          [id, member.user_id, 'pending']
        );
      }
    }

    const result = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    await pool.query(
      `INSERT INTO activity_logs (team_id, user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, 'status_changed', 'task', $3, $4)`,
      [task.team_id, req.user.id, id, JSON.stringify({ new_status: status })]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.delete('/tasks/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
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

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

router.post('/tasks/:id/assign', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];
    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [task.team_id, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const teamMemberCheck = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [task.team_id, user_id]
    );

    if (teamMemberCheck.rows.length === 0) {
      return res.status(400).json({ error: 'User is not a team member' });
    }

    await pool.query(
      'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, user_id]
    );

    res.json({ message: 'User assigned to task' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign user' });
  }
});

router.delete('/tasks/:id/assign/:userId', authenticate, async (req, res) => {
  try {
    const { id, userId } = req.params;

    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
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

    await pool.query(
      'DELETE FROM task_assignments WHERE task_id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'User removed from task' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
});

router.post('/tasks/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { approve, reason } = req.body;

    const taskResult = await pool.query(
      'SELECT t.*, tm.approval_rule FROM tasks t JOIN teams tm ON t.team_id = tm.id WHERE t.id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];
    const approvalRule = taskResult.rows[0].approval_rule;

    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [task.team_id, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    if (task.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Task is not pending approval' });
    }

    await pool.query(
      `INSERT INTO approvals (task_id, user_id, status, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (task_id, user_id) DO UPDATE SET status = $3, reason = $4, updated_at = CURRENT_TIMESTAMP`,
      [id, req.user.id, approve ? 'approved' : 'rejected', reason || null]
    );

    let shouldComplete = false;

    if (approvalRule === 'creator_only') {
      const creatorResult = await pool.query(
        'SELECT created_by FROM tasks WHERE id = $1',
        [id]
      );
      if (req.user.id === creatorResult.rows[0].created_by) {
        shouldComplete = true;
      }
    } else if (approvalRule === 'all_must_approve') {
      const allMembers = await pool.query(
        'SELECT user_id FROM team_members WHERE team_id = $1',
        [task.team_id]
      );

      const allApproved = await pool.query(
        `SELECT COUNT(*) as count FROM approvals 
         WHERE task_id = $1 AND status = 'approved'`,
        [id]
      );

      shouldComplete = parseInt(allApproved.rows[0].count) === allMembers.rows.length;
    }

    if (shouldComplete) {
      await pool.query(
        'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['complete', id]
      );
    }

    await pool.query(
      `INSERT INTO activity_logs (team_id, user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, 'task_approved', 'task', $3, $4)`,
      [task.team_id, req.user.id, id, JSON.stringify({ approved: approve })]
    );

    res.json({ message: shouldComplete ? 'Task completed' : 'Vote recorded', task_completed: shouldComplete });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: 'Failed to process approval' });
  }
});

module.exports = router;