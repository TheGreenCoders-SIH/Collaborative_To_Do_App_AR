const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

router.post('/tasks/:taskId/attachments', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
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
      `INSERT INTO attachments (task_id, filename, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [taskId, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype, req.user.id]
    );

    await pool.query(
      `INSERT INTO activity_logs (team_id, user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, 'file_uploaded', 'task', $3, $4)`,
      [taskResult.rows[0].team_id, req.user.id, taskId, JSON.stringify({ filename: req.file.originalname })]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

router.get('/attachments/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const attachmentResult = await pool.query(
      'SELECT * FROM attachments WHERE id = $1',
      [id]
    );

    if (attachmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const attachment = attachmentResult.rows[0];

    const taskResult = await pool.query(
      'SELECT team_id FROM tasks WHERE id = $1',
      [attachment.task_id]
    );

    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [taskResult.rows[0].team_id, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const filePath = path.join(__dirname, '../uploads', attachment.file_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, attachment.filename);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

router.delete('/attachments/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const attachmentResult = await pool.query(
      'SELECT a.*, t.team_id FROM attachments a JOIN tasks t ON a.task_id = t.id WHERE a.id = $1',
      [id]
    );

    if (attachmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const membership = await pool.query(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [attachmentResult.rows[0].team_id, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const filePath = path.join(__dirname, '../uploads', attachmentResult.rows[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM attachments WHERE id = $1', [id]);
    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

module.exports = router;