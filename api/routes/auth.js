const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateKeyPair } = require('../utils/encryption');
const { generateUserId, getDefaultAvatar } = require('../config/schema');

const router = express.Router();

// Configure Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const avatar_url = profile.photos[0]?.value;
      
      let user = await pool.query(
        'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
        ['google', profile.id]
      );

      if (user.rows.length === 0) {
        // Check if email exists
        const existingEmail = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (existingEmail.rows.length > 0) {
          // Link OAuth to existing account
          await pool.query(
            'UPDATE users SET oauth_provider = $1, oauth_id = $2, avatar_url = $3 WHERE email = $4',
            ['google', profile.id, avatar_url, email]
          );
          user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        } else {
          // Create new user with user_id and default avatar
          const keyPair = generateKeyPair();
          const userId = generateUserId();
          user = await pool.query(
            'INSERT INTO users (email, name, user_id, oauth_provider, oauth_id, avatar_url, public_key, secret_key) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [email, name, userId, 'google', profile.id, avatar_url || getDefaultAvatar(name, Date.now()), keyPair.publicKey, keyPair.secretKey]
          );
        }
      }
      
      return done(null, user.rows[0]);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const keyPair = generateKeyPair();
    const userId = generateUserId();
    const defaultAvatar = getDefaultAvatar(name, Date.now());

    const result = await pool.query(
      'INSERT INTO users (email, name, user_id, password_hash, avatar_url, public_key, secret_key) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, name, user_id, avatar_url, bio, public_key, secret_key, created_at',
      [email, name, userId, password_hash, defaultAvatar, keyPair.publicKey, keyPair.secretKey]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

    delete user.secret_key; // Never send secret key to frontend
    
    console.log('✅ User registered successfully:', email, 'UserID:', userId);
    res.status(201).json({ user, token, refreshToken });
  } catch (error) {
    console.error('❌ Register error:', error.message);
    console.error('Error details:', error);
    res.status(500).json({ error: `Registration failed: ${error.message}` });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('📝 Login attempt for email:', email);

    const result = await pool.query(
      'SELECT id, email, name, user_id, bio, password_hash, avatar_url, public_key, secret_key FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      console.log('⚠️ User has no password hash (OAuth only):', email);
      return res.status(401).json({ error: 'Please use OAuth to login' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

    delete user.password_hash;
    delete user.secret_key; // Never send secret key to frontend
    
    // Ensure public_key exists
    if (!user.public_key) {
      console.log('⚠️ User has no public key, generating new pair for:', email);
      const keyPair = generateKeyPair();
      await pool.query(
        'UPDATE users SET public_key = $1, secret_key = $2 WHERE id = $3',
        [keyPair.publicKey, keyPair.secretKey, user.id]
      );
      user.public_key = keyPair.publicKey;
    }
    
    console.log('✅ Login successful for user:', email);
    res.json({ user, token, refreshToken });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('Error details:', error);
    res.status(500).json({ error: `Login failed: ${error.message}` });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const result = await pool.query(
      'SELECT id, email, name, user_id, bio, avatar_url FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const newToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const newRefreshToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, user_id, bio, avatar_url, public_key, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Google OAuth Routes
router.get('/oauth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/oauth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    try {
      // Generate JWT tokens for the authenticated user
      const token = jwt.sign(
        { userId: req.user.id }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      const refreshToken = jwt.sign(
        { userId: req.user.id }, 
        process.env.JWT_REFRESH_SECRET, 
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

      // Remove sensitive data
      const user = { ...req.user };
      delete user.password_hash;
      delete user.secret_key;

      // Redirect to frontend with tokens (supports frontend on any dev port)
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const frontendHost = process.env.FRONTEND_URL || 'localhost:5173';
      const redirectUrl = `${protocol}://${frontendHost}/oauth-callback?token=${token}&refreshToken=${refreshToken}&userId=${user.id}&email=${user.email}&name=${user.name}&publicKey=${user.public_key}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('http://localhost:5173/login?error=authentication_failed');
    }
  }
);

// OAuth Callback Handler for Frontend
router.post('/oauth-callback', (req, res) => {
  const { token, refreshToken, userId } = req.body;
  
  if (!token || !refreshToken) {
    return res.status(400).json({ error: 'Missing authentication data' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ 
      success: true, 
      token, 
      refreshToken,
      userId: decoded.userId 
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;