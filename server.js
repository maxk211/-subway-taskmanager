require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./config/database');
const path = require('path');

const app = express();

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische Dateien für Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/reports', require('./routes/reports'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Automatische Task-Generierung (täglich um 1 Uhr nachts)
cron.schedule('0 1 * * *', () => {
  console.log('Generiere Tasks für heute...');

  const today = new Date().toISOString().split('T')[0];
  const stores = db.prepare('SELECT id FROM stores').all();

  stores.forEach(store => {
    try {
      const dateObj = new Date(today);
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dateObj.getDay()];

      const templates = db.prepare(`
        SELECT * FROM task_templates
        WHERE (store_id IS NULL OR store_id = ?)
        AND (
          recurrence = 'daily'
          OR (recurrence = 'weekly' AND recurrence_day = ?)
          OR (recurrence = 'monthly' AND CAST(strftime('%d', ?) AS INTEGER) = CAST(recurrence_day AS INTEGER))
        )
      `).all(store.id, dayOfWeek, today);

      const insertTask = db.prepare(`
        INSERT INTO tasks (template_id, store_id, title, description, shift, due_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      templates.forEach(template => {
        const shifts = template.shift === 'beide' ? ['frueh', 'spaet'] : [template.shift];

        shifts.forEach(shift => {
          const existing = db.prepare(`
            SELECT id FROM tasks
            WHERE template_id = ? AND store_id = ? AND due_date = ? AND shift = ?
          `).get(template.id, store.id, today, shift);

          if (!existing) {
            insertTask.run(template.id, store.id, template.title, template.description, shift, today);
          }
        });
      });

      console.log(`Tasks für Store ${store.id} generiert`);
    } catch (error) {
      console.error(`Fehler bei Store ${store.id}:`, error);
    }
  });

  console.log('Task-Generierung abgeschlossen');
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ein Fehler ist aufgetreten', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   Subway Taskmanager Backend         ║
  ║   Server läuft auf Port ${PORT}        ║
  ╚═══════════════════════════════════════╝
  `);
});
