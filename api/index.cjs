const app = require('../api_internal/app');
const http = require('http');
const socketIO = require('socket.io');
const pool = require('../api_internal/config/database');
const { initializeDatabase } = require('../api_internal/config/schema');
const { decryptMessage } = require('../api_internal/utils/encryption');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory maps to track connected users
const connectedUsers = new Map();     // userId -> socket.id
const socketIdToUser = new Map();     // socket.id -> userId

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User comes online
  socket.on('user:online', async (data) => {
    const { userId } = data;
    connectedUsers.set(userId, socket.id);
    socketIdToUser.set(socket.id, userId);

    try {
      await pool.query(
        `INSERT INTO user_presence (user_id, status, last_seen) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET status = $2, last_seen = CURRENT_TIMESTAMP`,
        [userId, 'online']
      );

      // Auto-join user to their team rooms
      const teamResult = await pool.query(
        'SELECT team_id FROM team_members WHERE user_id = $1',
        [userId]
      );
      for (const row of teamResult.rows) {
        socket.join(`team:${row.team_id}`);
      }
    } catch (error) {
      console.error('Error updating presence:', error.message);
    }

    // Broadcast online status
    socket.broadcast.emit('user:status', { userId, status: 'online' });
  });

  // User starts typing
  socket.on('user:typing', async (data) => {
    const { userId, conversationId } = data;

    try {
      await pool.query(
        `UPDATE user_presence SET is_typing = true, typing_conversation_id = $2 WHERE user_id = $1`,
        [userId, conversationId]
      );

      io.emit('user:typing:status', { userId, conversationId, isTyping: true });
    } catch (error) {
      console.error('Error updating typing status:', error.message);
    }
  });

  // User stops typing
  socket.on('user:stop-typing', async (data) => {
    const { userId, conversationId } = data;

    try {
      await pool.query(
        `UPDATE user_presence SET is_typing = false, typing_conversation_id = NULL WHERE user_id = $1`,
        [userId, conversationId]
      );

      io.emit('user:typing:status', { userId, conversationId, isTyping: false });
    } catch (error) {
      console.error('Error updating typing status:', error.message);
    }
  });

  // Send DM message in real-time
  socket.on('message:send', async (data) => {
    const { messageId, conversationId, senderId, recipientId, encryptedContent, nonce } = data;

    console.log('📤 Message send event received:', { messageId, conversationId, senderId, recipientId });

    try {
      // Mark message as delivered
      await pool.query(
        'UPDATE messages SET status = $1 WHERE id = $2',
        ['delivered', messageId]
      );

      // Broadcast message to recipient if online
      const recipientSocketId = connectedUsers.get(recipientId);
      console.log(`Recipient ${recipientId} socket ID: ${recipientSocketId || 'not connected'}`);

      if (recipientSocketId) {
        console.log(`✉️ Sending message to recipient on socket ${recipientSocketId}`);
        io.to(recipientSocketId).emit('message:received', {
          messageId,
          conversationId,
          senderId,
          encryptedContent,
          nonce,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log(`⚠️ Recipient ${recipientId} is not online`);
      }

      // Confirm delivery to sender
      console.log(`✓ Confirming delivery to sender`);
      socket.emit('message:delivered', { messageId });
    } catch (error) {
      console.error('Error sending message:', error.message);
      socket.emit('message:error', { messageId, error: 'Failed to send message' });
    }
  });

  // Mark message as read
  socket.on('message:read', async (data) => {
    const { messageId, conversationId, userId } = data;

    try {
      await pool.query(
        `INSERT INTO message_read_status (message_id, user_id, read_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (message_id, user_id) DO UPDATE SET read_at = CURRENT_TIMESTAMP`,
        [messageId, userId]
      );

      // Update message status
      await pool.query(
        'UPDATE messages SET status = $1 WHERE id = $2',
        ['read', messageId]
      );

      // Broadcast read status
      io.emit('message:read', { messageId, userId });
    } catch (error) {
      console.error('Error marking message as read:', error.message);
    }
  });

  // ==================== TEAM CHAT ====================

  // Join team room
  socket.on('team:join', (data) => {
    const { teamId } = data;
    socket.join(`team:${teamId}`);
    console.log(`User joined team room: team:${teamId}`);
  });

  // Leave team room
  socket.on('team:leave', (data) => {
    const { teamId } = data;
    socket.leave(`team:${teamId}`);
  });

  // Send team message in real-time
  socket.on('team:message:send', async (data) => {
    const { teamId, senderId, content, messageId, senderName, senderAvatar } = data;

    console.log(`📤 Team message in team:${teamId} from ${senderId}`);

    // Broadcast to all team members (except sender)
    socket.to(`team:${teamId}`).emit('team:message:received', {
      messageId,
      teamId,
      senderId,
      content,
      senderName,
      senderAvatar,
      timestamp: new Date().toISOString()
    });
  });

  // Team typing indicators
  socket.on('team:typing', (data) => {
    const { teamId, userId, userName } = data;
    socket.to(`team:${teamId}`).emit('team:typing:status', { teamId, userId, userName, isTyping: true });
  });

  socket.on('team:stop-typing', (data) => {
    const { teamId, userId } = data;
    socket.to(`team:${teamId}`).emit('team:typing:status', { teamId, userId, isTyping: false });
  });

  // ==================== FRIEND REQUESTS ====================

  // Notify user of friend request
  socket.on('friend:request', (data) => {
    const { toUserId } = data;
    const recipientSocketId = connectedUsers.get(toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('friend:request:received', data);
    }
  });

  // Notify user of friend request response
  socket.on('friend:response', (data) => {
    const { toUserId } = data;
    const recipientSocketId = connectedUsers.get(toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('friend:response:received', data);
    }
  });

  // User goes offline (explicit)
  socket.on('user:offline', async (data) => {
    const { userId } = data;
    connectedUsers.delete(userId);
    socketIdToUser.delete(socket.id);

    try {
      await pool.query(
        `UPDATE user_presence SET status = $1, last_seen = CURRENT_TIMESTAMP WHERE user_id = $2`,
        ['offline', userId]
      );
    } catch (error) {
      console.error('Error updating presence:', error.message);
    }

    // Broadcast offline status
    socket.broadcast.emit('user:status', { userId, status: 'offline' });
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    // Find user associated with this socket and mark them offline
    const userId = socketIdToUser.get(socket.id);
    if (userId) {
      connectedUsers.delete(userId);
      socketIdToUser.delete(socket.id);
      try {
        await pool.query(
          `UPDATE user_presence SET status = $1, last_seen = CURRENT_TIMESTAMP WHERE user_id = $2`,
          ['offline', userId]
        );
        // Broadcast offline status to other users
        socket.broadcast.emit('user:status', { userId, status: 'offline' });
      } catch (error) {
        console.error('Error updating presence on disconnect:', error.message);
      }
    }
  });
});

// For Vercel Serverless Functions: 
// We export the app and let Vercel handle the invocation.
// Note: WebSockets (socket.io) will not work on standard Vercel serverless functions.
// For real-time features, you would need a persistent server (e.g., Render, Railway) or a dedicated provider (Pusher).

// Run database initialization
initializeDatabase().then(() => {
  console.log('Database schema ready');

  // Start the server for local development if run directly
  if (require.main === module || !process.env.VERCEL) {
    server.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  }
}).catch(err => {
  console.error('Database initialization failed:', err.message);
});

module.exports = app;