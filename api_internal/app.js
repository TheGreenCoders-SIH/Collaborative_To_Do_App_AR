const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔑 GOOGLE_CLIENT_ID present:', !!process.env.GOOGLE_CLIENT_ID);
if (!process.env.GOOGLE_CLIENT_ID) {
  console.log('⚠️ Warning: GOOGLE_CLIENT_ID is missing from process.env');
  console.log('   Looking in:', path.join(__dirname, '.env'));
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for OAuth
app.use(session({
  secret: process.env.JWT_SECRET || 'session_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Collaborative ToDo API', status: 'running' });
});

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const friendRoutes = require('./routes/friends');
const teamRoutes = require('./routes/teams');
const taskRoutes = require('./routes/tasks');
const commentRoutes = require('./routes/comments');
const attachmentRoutes = require('./routes/attachments');
const activityRoutes = require('./routes/activity');
const messageRoutes = require('./routes/messages');
const channelRoutes = require('./routes/channels');

// Consolidation of routes for Vercel/Local compatibility
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/friends', friendRoutes);
apiRouter.use('/teams', teamRoutes);
apiRouter.use('/', taskRoutes);
apiRouter.use('/comments', commentRoutes);
apiRouter.use('/attachments', attachmentRoutes);
apiRouter.use('/', activityRoutes);
apiRouter.use('/', channelRoutes);
apiRouter.use('/messages', messageRoutes);

// Mount the router at both /api (for Vercel) and / (for local proxy/direct access)
app.use('/api', apiRouter);
app.use('/', apiRouter);

console.log('\n✅ API Routes Configured:');
console.log('   Auth: /auth/*');
console.log('   Users: /users/*');
console.log('   Friends: /friends/*');
console.log('   Teams: /teams/*');
console.log('   Tasks: /teams/:teamId/tasks, /tasks/:id');
console.log('   Comments: /tasks/:taskId/comments, /comments/:id');
console.log('   Attachments: /tasks/:taskId/attachments, /attachments/:id');
console.log('   Activity: /teams/:teamId/activity, /teams/:teamId/updates, /teams/:teamId/metrics');
console.log('   Channels: /teams/:teamId/channels, /channels/:channelId/join, /channels/:channelId/leave');
console.log('   Messages: /messages/*\n');

app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    error: `Server error: ${err.message}`,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;