require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

// Einmaliger Cleanup: Lösche alle automatisch generierten Routine-Tasks
async function cleanupRoutineTasks() {
  if (!process.env.DATABASE_URL) return;

  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Lösche alle Tasks die eine template_id haben (automatisch generiert)
    const result = await pool.query(`
      DELETE FROM tasks WHERE template_id IS NOT NULL
    `);
    console.log(`🧹 ${result.rowCount} automatisch generierte Tasks gelöscht`);
  } catch (error) {
    console.error('Cleanup error:', error.message);
  } finally {
    await pool.end();
  }
}

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

  // Einmaliger Cleanup beim Start - entfernt alle alten Routine-Tasks
  await cleanupRoutineTasks();
});
