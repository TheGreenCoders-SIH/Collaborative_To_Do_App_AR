const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper: Emit real-time notification via socket.io
const emitNotification = (req, userId, notification) => {
  const io = req.app.get('io');
  const connectedUsers = req.app.get('connectedUsers');
  if (io && connectedUsers) {
    const socketId = connectedUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit('notification:received', notification);
    }
  }
};

// GET /notifications — Get all notifications for current user
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. DYNAMIC TASK REMINDER CHECK
    // Find tasks assigned to this user that are due within the next 24 hours, not complete,
    // and for which we haven't sent a task_reminder notification in the last 12 hours.
    const soonDueTasks = await pool.query(
      `SELECT t.id, t.title, t.deadline
       FROM tasks t
       JOIN task_assignments ta ON t.id = ta.task_id
       WHERE ta.user_id = $1
         AND t.status != 'complete'
         AND t.deadline IS NOT NULL
         AND t.deadline > CURRENT_TIMESTAMP
         AND t.deadline <= CURRENT_TIMESTAMP + INTERVAL '24 hours'`,
      [userId]
    );

    for (const task of soonDueTasks.rows) {
      // Check if we already notified the user about this specific task recently (last 12h)
      const existingReminder = await pool.query(
        `SELECT id FROM notifications
         WHERE user_id = $1
           AND type = 'task_reminder'
           AND message LIKE $2
           AND created_at > CURRENT_TIMESTAMP - INTERVAL '12 hours'`,
        [userId, `%${task.title}%`]
      );

      if (existingReminder.rows.length === 0) {
        // Create new reminder notification
        const insertRes = await pool.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [
            userId,
            'Task Deadline Reminder',
            `Task "${task.title}" is due in less than 24 hours!`,
            'task_reminder'
          ]
        );

        // Emit real-time socket update for the reminder
        emitNotification(req, userId, insertRes.rows[0]);
      }
    }

    // 2. FETCH ALL NOTIFICATIONS
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /notifications/:id/read — Mark a notification as read
router.post('/:id/read', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE notifications 
       SET read = TRUE 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, notification: result.rows[0] });
  } catch (error) {
    console.error('Error reading notification:', error.message);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// POST /notifications/read-all — Mark all notifications for current user as read
router.post('/read-all', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.query(
      `UPDATE notifications 
       SET read = TRUE 
       WHERE user_id = $1`,
      [userId]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error reading all notifications:', error.message);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// DELETE /notifications/:id — Delete a notification
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `DELETE FROM notifications 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error.message);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
