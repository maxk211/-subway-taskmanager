const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);

    if (!user) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        store_id: user.store_id,
        full_name: user.full_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        store_id: user.store_id
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// Aktuellen User abrufen
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.email, u.role, u.store_id, s.name as store_name
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.id = ?
    `).get(req.user.id);

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

module.exports = router;
