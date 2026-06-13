const pool = require('../config/database');

const createNotification = async (app, userId, title, message, type) => {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, title, message, type]
    );

    const notification = result.rows[0];

    // Emit real-time update if user is connected
    if (app) {
      const io = app.get('io');
      const connectedUsers = app.get('connectedUsers');
      if (io && connectedUsers) {
        const socketId = connectedUsers.get(userId);
        if (socketId) {
          io.to(socketId).emit('notification:received', notification);
        }
      }
    }

    return notification;
  } catch (error) {
    console.error('Error in createNotification utility:', error.message);
  }
};

module.exports = { createNotification };
