const express = require('express');
const db = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Alle Stores abrufen
router.get('/', authMiddleware, (req, res) => {
  try {
    let stores;

    if (req.user.role === 'admin') {
      stores = db.prepare('SELECT * FROM stores ORDER BY name').all();
    } else if (req.user.store_id) {
      stores = db.prepare('SELECT * FROM stores WHERE id = ?').all(req.user.store_id);
    } else {
      stores = [];
    }

    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// Einzelnen Store abrufen
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id);

    if (!store) {
      return res.status(404).json({ message: 'Store nicht gefunden' });
    }

    // Berechtigung prüfen
    if (req.user.role !== 'admin' && req.user.store_id !== store.id) {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    res.json(store);
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// Store erstellen (nur Admin)
router.post('/', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const { name, address, city } = req.body;

    const result = db.prepare('INSERT INTO stores (name, address, city) VALUES (?, ?, ?)').run(name, address, city);

    const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(store);
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// Store aktualisieren (nur Admin)
router.put('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const { name, address, city } = req.body;

    db.prepare('UPDATE stores SET name = ?, address = ?, city = ? WHERE id = ?').run(name, address, city, req.params.id);

    const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id);

    res.json(store);
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

module.exports = router;
