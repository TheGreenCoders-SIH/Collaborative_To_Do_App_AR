const express = require('express');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
  }
});

// GET /users/profile — Get current user's full profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, user_id, bio, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /users/profile — Update profile (name, bio, avatar_url)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, bio, avatar_url } = req.body;
    const result = await pool.query(
      `UPDATE users SET 
        name = COALESCE($1, name), 
        bio = COALESCE($2, bio),
        avatar_url = COALESCE($3, avatar_url), 
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING id, email, name, user_id, bio, avatar_url`,
      [name, bio, avatar_url, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /users/profile/password — Change password
router.put('/profile/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = userResult.rows[0];
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Cannot change password for OAuth-only accounts' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHash, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// POST /users/profile/avatar — Upload avatar image
router.post('/profile/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const result = await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, user_id, bio, avatar_url',
      [avatarUrl, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// GET /users/search — Search users by EXACT email or user_id only
router.get('/search', authenticate, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length === 0) {
      return res.json({ users: [] });
    }

    const trimmed = query.trim();

    // Only search by exact email match or exact user_id match
    const result = await pool.query(
      `SELECT id, email, name, user_id, avatar_url FROM users 
       WHERE (LOWER(email) = LOWER($1) OR UPPER(user_id) = UPPER($1)) 
       AND id != $2
       LIMIT 10`,
      [trimmed, req.user.id]
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /users/all — Get all users (for admin purposes)
router.get('/all', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, user_id, avatar_url FROM users WHERE id != $1 ORDER BY name ASC',
      [req.user.id]
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;