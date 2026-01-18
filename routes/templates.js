const express = require('express');
const db = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Alle Templates abrufen
router.get('/', authMiddleware, requireRole('admin', 'manager'), (req, res) => {
  try {
    const templates = db.prepare(`
      SELECT tt.*, s.name as store_name
      FROM task_templates tt
      LEFT JOIN stores s ON tt.store_id = s.id
      ORDER BY tt.title
    `).all();

    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// Template erstellen
router.post('/', authMiddleware, requireRole('admin', 'manager'), (req, res) => {
  try {
    const { title, description, category, shift, recurrence, recurrence_day, store_id, requires_photo } = req.body;

    const result = db.prepare(`
      INSERT INTO task_templates (title, description, category, shift, recurrence, recurrence_day, store_id, requires_photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, category, shift, recurrence, recurrence_day, store_id, requires_photo);

    const template = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// Template aktualisieren
router.put('/:id', authMiddleware, requireRole('admin', 'manager'), (req, res) => {
  try {
    const { title, description, category, shift, recurrence, recurrence_day, requires_photo } = req.body;

    db.prepare(`
      UPDATE task_templates
      SET title = ?, description = ?, category = ?, shift = ?, recurrence = ?, recurrence_day = ?, requires_photo = ?
      WHERE id = ?
    `).run(title, description, category, shift, recurrence, recurrence_day, requires_photo, req.params.id);

    const template = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(req.params.id);

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// Template löschen
router.delete('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM task_templates WHERE id = ?').run(req.params.id);

    res.json({ message: 'Template gelöscht' });
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

module.exports = router;
