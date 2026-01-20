require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
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

// Funktion zur Task-Generierung
async function generateTasksForToday() {
  // Nur für PostgreSQL
  if (!process.env.DATABASE_URL) {
    console.log('SQLite - Task-Generierung übersprungen');
    return;
  }

  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    const today = new Date().toISOString().split('T')[0];
    const dateObj = new Date(today);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dateObj.getDay()];

    // Berechne aktuelle Kalenderwoche (1-4 Rotation)
    const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((dateObj - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
    const weekInCycle = ((weekNumber - 1) % 4) + 1;

    console.log(`📅 Generiere Tasks für ${today} (${dayOfWeek}, Woche ${weekInCycle})`);

    // Hole alle Stores
    const storesResult = await client.query('SELECT id, name FROM stores');
    const stores = storesResult.rows;

    let totalCreated = 0;

    for (const store of stores) {
      // Hole passende Templates
      const templatesResult = await client.query(`
        SELECT * FROM task_templates
        WHERE (store_id IS NULL OR store_id = $1)
        AND active = true
        AND (
          recurrence = 'daily'
          OR (recurrence = 'weekly' AND (
            recurrence_day = $2
            OR recurrence_day = $3
          ))
        )
      `, [store.id, dayOfWeek, `${dayOfWeek}_w${weekInCycle}`]);

      const templates = templatesResult.rows;

      for (const template of templates) {
        const shifts = template.shift === 'beide' ? ['frueh', 'spaet'] : [template.shift];

        for (const shift of shifts) {
          // Prüfe ob Task schon existiert
          const existingResult = await client.query(`
            SELECT id FROM tasks
            WHERE template_id = $1 AND store_id = $2 AND due_date = $3 AND shift = $4
          `, [template.id, store.id, today, shift]);

          if (existingResult.rows.length === 0) {
            await client.query(`
              INSERT INTO tasks (template_id, store_id, title, description, shift, due_date, status, category)
              VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
            `, [template.id, store.id, template.title, template.description, shift, today, template.category]);

            totalCreated++;
          }
        }
      }
    }

    console.log(`✅ ${totalCreated} Tasks für heute erstellt!`);

  } catch (error) {
    console.error('Fehler bei Task-Generierung:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Automatische Task-Generierung täglich um 1 Uhr nachts
cron.schedule('0 1 * * *', generateTasksForToday);

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ein Fehler ist aufgetreten', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   Subway Taskmanager Backend         ║
  ║   Server läuft auf Port ${PORT}        ║
  ╚═══════════════════════════════════════╝
  `);

  // Generiere Tasks beim Server-Start
  await generateTasksForToday();
});
