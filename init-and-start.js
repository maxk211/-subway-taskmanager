require('dotenv').config();
const { exec } = require('child_process');
const { Pool } = require('pg');

async function checkAndInit() {
  // Nur für PostgreSQL (Production)
  if (!process.env.DATABASE_URL) {
    console.log('SQLite detected - skipping auto-init');
    startServer();
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();

    // Prüfe ob Tabellen existieren
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'stores'
      );
    `);

    client.release();

    if (!result.rows[0].exists) {
      console.log('📦 Datenbank nicht initialisiert - starte Initialisierung...');

      // Führe init-Script aus
      exec('node scripts/initPostgres.js', (error, stdout, stderr) => {
        if (error) {
          console.error('Fehler bei Datenbank-Initialisierung:', error);
          process.exit(1);
        }
        console.log(stdout);
        if (stderr) console.error(stderr);

        console.log('✅ Datenbank initialisiert - starte Server...');
        startServer();
      });
    } else {
      console.log('✅ Datenbank bereits initialisiert');
      startServer();
    }
  } catch (error) {
    console.error('Fehler bei Datenbank-Check:', error);
    console.log('Versuche Server trotzdem zu starten...');
    startServer();
  } finally {
    await pool.end();
  }
}

function startServer() {
  require('./server.js');
}

checkAndInit();
