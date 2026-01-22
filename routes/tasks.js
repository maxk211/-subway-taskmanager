const express = require('express');
const db = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer Setup für Foto-Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'task-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Nur Bilder erlaubt!');
    }
  }
});

// Aufgaben für einen bestimmten Tag und Store abrufen
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { store_id, date, shift, status } = req.query;

    let query = `
      SELECT t.*, tt.category, tt.requires_photo,
             u.full_name as completed_by_name
      FROM tasks t
      LEFT JOIN task_templates tt ON t.template_id = tt.id
      LEFT JOIN users u ON t.completed_by = u.id
      WHERE 1=1
    `;

    const params = [];

    if (store_id) {
      query += ' AND t.store_id = ?';
      params.push(store_id);
    } else if (req.user.role !== 'admin') {
      query += ' AND t.store_id = ?';
      params.push(req.user.store_id);
    }

    if (date) {
      query += ' AND DATE(t.due_date) = ?';
      params.push(date);
    }

    if (shift) {
      query += ' AND t.shift = ?';
      params.push(shift);
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.due_date DESC, t.shift, tt.category, t.title';

    const tasks = await db.prepare(query).all(...params);

    res.json(tasks);
  } catch (error) {
    console.error('Tasks error:', error);
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// Aufgabe als erledigt markieren
router.put('/:id/complete', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const { notes, completed_by_id } = req.body;
    const taskId = req.params.id;

    const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Aufgabe nicht gefunden' });
    }

    // Berechtigung prüfen
    if (req.user.role !== 'admin' && req.user.store_id !== task.store_id) {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    // Wenn completed_by_id übergeben wurde, verwende diesen, sonst den eingeloggten User
    let completedById = req.user.id;
    if (completed_by_id) {
      const employee = await db.prepare('SELECT id, store_id FROM users WHERE id = ?').get(completed_by_id);
      if (!employee || employee.store_id !== task.store_id) {
        return res.status(400).json({ message: 'Ungültiger Mitarbeiter' });
      }
      completedById = completed_by_id;
    }

    const photoPath = req.file ? req.file.filename : null;

    await db.prepare(`
      UPDATE tasks
      SET status = 'completed',
          completed_by = ?,
          completed_at = CURRENT_TIMESTAMP,
          photo_path = ?,
          notes = ?
      WHERE id = ?
    `).run(completedById, photoPath, notes, taskId);

    const updatedTask = await db.prepare(`
      SELECT t.*, tt.category, tt.requires_photo,
             u.full_name as completed_by_name
      FROM tasks t
      LEFT JOIN task_templates tt ON t.template_id = tt.id
      LEFT JOIN users u ON t.completed_by = u.id
      WHERE t.id = ?
    `).get(taskId);

    res.json(updatedTask);
  } catch (error) {
    console.error('Task complete error:', error);
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// Individuelle Aufgabe erstellen (einmalig, ohne Template)
router.post('/create', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { title, description, shift, store_id, due_date } = req.body;

    // Berechtigung prüfen
    if (req.user.role === 'manager' && store_id !== req.user.store_id) {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    if (!title || !shift || !store_id || !due_date) {
      return res.status(400).json({ message: 'Titel, Schicht, Store und Datum sind erforderlich' });
    }

    // Prüfe ob Task bereits existiert
    const existing = await db.prepare(`
      SELECT id FROM tasks
      WHERE title = ? AND store_id = ? AND due_date = ? AND shift = ?
    `).get(title, store_id, due_date, shift);

    if (existing) {
      return res.status(400).json({ message: 'Diese Aufgabe existiert bereits für diesen Tag' });
    }

    await db.prepare(`
      INSERT INTO tasks (store_id, title, description, shift, due_date, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(store_id, title, description || '', shift, due_date);

    res.json({ message: 'Aufgabe erstellt', success: true });
  } catch (error) {
    console.error('Task create error:', error);
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// Dashboard-Statistiken
router.get('/stats/dashboard', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { start_date, end_date, store_id } = req.query;

    let storeCondition = '';
    const params = [start_date, end_date];

    if (store_id) {
      storeCondition = 'AND t.store_id = ?';
      params.push(store_id);
    } else if (req.user.role === 'manager') {
      storeCondition = 'AND t.store_id = ?';
      params.push(req.user.store_id);
    }

    // Gesamt-Statistiken
    const totalStats = await db.prepare(`
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped_tasks
      FROM tasks t
      WHERE t.due_date BETWEEN ? AND ?
      ${storeCondition}
    `).get(...params);

    // Statistiken pro Store
    const storeStatsParams = store_id
      ? [start_date, end_date, store_id]
      : req.user.role === 'manager'
        ? [start_date, end_date, req.user.store_id]
        : [start_date, end_date];

    const storeStats = await db.prepare(`
      SELECT
        s.id,
        s.name,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        ROUND((SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(t.id), 0) * 100)::numeric, 2) as completion_rate
      FROM stores s
      LEFT JOIN tasks t ON s.id = t.store_id AND t.due_date BETWEEN ? AND ?
      ${store_id ? 'WHERE s.id = ?' : req.user.role === 'manager' ? 'WHERE s.id = ?' : ''}
      GROUP BY s.id, s.name
      ORDER BY s.name
    `).all(...storeStatsParams);

    // Statistiken pro Mitarbeiter
    const employeeStatsParams = store_id
      ? [start_date, end_date, store_id]
      : req.user.role === 'manager'
        ? [start_date, end_date, req.user.store_id]
        : [start_date, end_date];

    const employeeStats = await db.prepare(`
      SELECT
        u.id,
        u.full_name,
        s.name as store_name,
        COUNT(t.id) as completed_tasks,
        COUNT(DISTINCT DATE(t.completed_at)) as active_days
      FROM users u
      LEFT JOIN tasks t ON u.id = t.completed_by AND t.completed_at BETWEEN ? AND ?
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.role = 'employee'
      ${store_id ? 'AND u.store_id = ?' : req.user.role === 'manager' ? 'AND u.store_id = ?' : ''}
      GROUP BY u.id, u.full_name, s.name
      ORDER BY completed_tasks DESC
      LIMIT 10
    `).all(...employeeStatsParams);

    res.json({
      totalStats,
      storeStats,
      employeeStats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

module.exports = router;
