const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Alle Mitarbeiter abrufen
router.get('/', authMiddleware, requireRole('admin', 'manager'), (req, res) => {
  try {
    let users;

    if (req.user.role === 'admin') {
      users = db.prepare(`
        SELECT u.id, u.username, u.full_name, u.email, u.role, u.store_id, u.active, s.name as store_name
        FROM users u
        LEFT JOIN stores s ON u.store_id = s.id
        ORDER BY u.full_name
      `).all();
    } else if (req.user.role === 'manager') {
      users = db.prepare(`
        SELECT u.id, u.username, u.full_name, u.email, u.role, u.store_id, u.active, s.name as store_name
        FROM users u
        LEFT JOIN stores s ON u.store_id = s.id
        WHERE u.store_id = ?
        ORDER BY u.full_name
      `).all(req.user.store_id);
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// Mitarbeiter erstellen
router.post('/', authMiddleware, requireRole('admin', 'manager'), (req, res) => {
  try {
    const { username, password, full_name, email, role, store_id } = req.body;

    // Manager können nur Mitarbeiter für ihren Store erstellen
    if (req.user.role === 'manager') {
      if (store_id !== req.user.store_id) {
        return res.status(403).json({ message: 'Keine Berechtigung' });
      }
      if (role !== 'employee') {
        return res.status(403).json({ message: 'Manager können nur Mitarbeiter erstellen' });
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO users (username, password, full_name, email, role, store_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username, hashedPassword, full_name, email, role, store_id);

    const user = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.email, u.role, u.store_id, s.name as store_name
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// Mitarbeiter aktualisieren
router.put('/:id', authMiddleware, requireRole('admin', 'manager'), (req, res) => {
  try {
    const { full_name, email, active, store_id, role } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Mitarbeiter nicht gefunden' });
    }

    // Manager können nur ihre Store-Mitarbeiter bearbeiten
    if (req.user.role === 'manager' && user.store_id !== req.user.store_id) {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    db.prepare(`
      UPDATE users
      SET full_name = ?, email = ?, active = ?, store_id = ?, role = ?
      WHERE id = ?
    `).run(full_name, email, active, store_id, role, req.params.id);

    const updatedUser = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.email, u.role, u.store_id, u.active, s.name as store_name
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.id = ?
    `).get(req.params.id);

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// Passwort ändern
router.put('/:id/password', authMiddleware, (req, res) => {
  try {
    const { password } = req.body;

    // Nur eigenes Passwort oder als Admin
    if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.params.id);

    res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

module.exports = router;
