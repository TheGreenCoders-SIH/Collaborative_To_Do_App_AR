const pool = require('../config/database');

const initializeDatabase = async () => {
  const client = await pool.connect();
  
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(10) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        bio TEXT DEFAULT '',
        password_hash VARCHAR(255),
        oauth_provider VARCHAR(50),
        oauth_id VARCHAR(255),
        avatar_url VARCHAR(500),
        public_key TEXT,
        secret_key TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add missing columns to existing tables (handles migrations)
    console.log('📋 Checking and adding missing columns...');
    
    // Check if public_key column exists, if not add it
    const publicKeyExists = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='public_key'
    `);
    
    if (publicKeyExists.rows.length === 0) {
      console.log('➕ Adding public_key column to users table');
      await client.query('ALTER TABLE users ADD COLUMN public_key TEXT');
    }

    // Check if secret_key column exists, if not add it
    const secretKeyExists = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='secret_key'
    `);
    
    if (secretKeyExists.rows.length === 0) {
      console.log('➕ Adding secret_key column to users table');
      await client.query('ALTER TABLE users ADD COLUMN secret_key TEXT');
    }

    // Check if nonce column exists in messages table, if not add it
    const nonceExists = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='messages' AND column_name='nonce'
    `);
    
    if (nonceExists.rows.length === 0) {
      console.log('➕ Adding nonce column to messages table');
      await client.query('ALTER TABLE messages ADD COLUMN nonce TEXT');
    }

    // Check if user_id column exists, if not add it
    const userIdExists = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='user_id'
    `);
    
    if (userIdExists.rows.length === 0) {
      console.log('➕ Adding user_id column to users table');
      await client.query('ALTER TABLE users ADD COLUMN user_id VARCHAR(10) UNIQUE');
    }

    // Check if bio column exists, if not add it
    const bioExists = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='bio'
    `);
    
    if (bioExists.rows.length === 0) {
      console.log('➕ Adding bio column to users table');
      await client.query("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''");
    }

    // Backfill user_id for existing users that don't have one
    const usersWithoutUserId = await client.query(
      'SELECT id FROM users WHERE user_id IS NULL'
    );
    for (const row of usersWithoutUserId.rows) {
      const uid = generateUserId();
      await client.query('UPDATE users SET user_id = $1 WHERE id = $2', [uid, row.id]);
      console.log(`  ✅ Assigned user_id ${uid} to user #${row.id}`);
    }

    // Backfill avatar_url for existing users without one
    const usersWithoutAvatar = await client.query(
      "SELECT id, name FROM users WHERE avatar_url IS NULL OR avatar_url = ''"
    );
    for (const row of usersWithoutAvatar.rows) {
      const avatar = getDefaultAvatar(row.name, row.id);
      await client.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatar, row.id]);
      console.log(`  ✅ Assigned default avatar to user #${row.id}`);
    }

    console.log('✅ Database columns verified');

    // Create other tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        approval_rule VARCHAR(50) DEFAULT 'creator_only',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'todo',
        deadline TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS task_assignments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS approvals (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attachments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id_1 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id_2 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id_1, user_id_2),
        CHECK (user_id_1 < user_id_2)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        encrypted_content TEXT NOT NULL,
        nonce TEXT,
        status VARCHAR(20) DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS message_read_status (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP,
        UNIQUE(message_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS user_presence (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'offline',
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_typing BOOLEAN DEFAULT FALSE,
        typing_conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS channels (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, name)
      );

      CREATE TABLE IF NOT EXISTS channel_members (
        id SERIAL PRIMARY KEY,
        channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(channel_id, user_id)
      );

      -- Friendships table for the friends system
      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(requester_id, addressee_id),
        CHECK (requester_id != addressee_id)
      );

      -- Team messages for team-scoped group chat
      CREATE TABLE IF NOT EXISTS team_messages (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_team ON tasks(team_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON task_assignments(user_id);
      CREATE INDEX IF NOT EXISTS idx_approvals_task ON approvals(task_id);
      CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_team ON activity_logs(team_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user_id_1);
      CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user_id_2);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_message_read_status_message ON message_read_status(message_id);
      CREATE INDEX IF NOT EXISTS idx_message_read_status_user ON message_read_status(user_id);
       CREATE INDEX IF NOT EXISTS idx_user_presence_user ON user_presence(user_id);
       CREATE INDEX IF NOT EXISTS idx_channels_team ON channels(team_id);
       CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON channel_members(channel_id);
       CREATE INDEX IF NOT EXISTS idx_channel_members_user ON channel_members(user_id);
       CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
       CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
       CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
       CREATE INDEX IF NOT EXISTS idx_team_messages_team ON team_messages(team_id);
       CREATE INDEX IF NOT EXISTS idx_team_messages_sender ON team_messages(sender_id);
       CREATE INDEX IF NOT EXISTS idx_team_messages_created ON team_messages(created_at);
       CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
    `);
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Generate a unique 8-char alphanumeric user_id
function generateUserId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a default avatar URL using DiceBear API
function getDefaultAvatar(name, id) {
  const styles = ['avataaars', 'bottts', 'fun-emoji', 'lorelei', 'notionists', 'pixel-art', 'thumbs'];
  const style = styles[id % styles.length];
  const seed = encodeURIComponent(name || `user-${id}`);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
}

module.exports = { initializeDatabase, generateUserId, getDefaultAvatar };