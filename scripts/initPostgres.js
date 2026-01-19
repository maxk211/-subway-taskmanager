require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('Erstelle PostgreSQL Tabellen...');

    // Erstelle Tabellen
    await client.query(`
      -- Stores Tabelle
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        city TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Mitarbeiter Tabelle
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'employee')),
        store_id INTEGER,
        active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );

      -- Task Templates
      CREATE TABLE IF NOT EXISTS task_templates (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        shift TEXT CHECK(shift IN ('frueh', 'spaet', 'beide')),
        recurrence TEXT CHECK(recurrence IN ('daily', 'weekly', 'monthly', 'once')),
        recurrence_day TEXT,
        store_id INTEGER,
        requires_photo INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );

      -- Tasks
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL,
        store_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        shift TEXT NOT NULL,
        due_date DATE NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'skipped')),
        completed_by INTEGER,
        completed_at TIMESTAMP,
        photo_path TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (template_id) REFERENCES task_templates(id),
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (completed_by) REFERENCES users(id)
      );

      -- Indizes
      CREATE INDEX IF NOT EXISTS idx_tasks_store_date ON tasks(store_id, due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_users_store ON users(store_id);
    `);

    console.log('Tabellen erstellt!');

    // Prüfe ob bereits Daten existieren
    const storesCheck = await client.query('SELECT COUNT(*) FROM stores');

    if (parseInt(storesCheck.rows[0].count) === 0) {
      console.log('Erstelle Beispieldaten...');

      // Erstelle Stores
      const stores = [
        { name: 'Subway Arcaden', city: 'Regensburg' },
        { name: 'Subway Ziegetsdorfer Straße', city: 'Regensburg' },
        { name: 'Subway DEZ', city: 'Regensburg' },
        { name: 'Subway Arnulfsplatz', city: 'Regensburg' },
        { name: 'Subway Cham', city: 'Cham' },
        { name: 'Subway Straubing', city: 'Straubing' },
        { name: 'Subway Dingolfing', city: 'Dingolfing' },
        { name: 'Subway Neutraubling', city: 'Neutraubling' },
        { name: 'Subway Regenstauf', city: 'Regenstauf' }
      ];

      for (const store of stores) {
        await client.query('INSERT INTO stores (name, city) VALUES ($1, $2)', [store.name, store.city]);
      }

      console.log('9 Subway Stores erstellt!');

      // Erstelle Admin-User
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await client.query(
        'INSERT INTO users (username, password, full_name, email, role) VALUES ($1, $2, $3, $4, $5)',
        ['admin', hashedPassword, 'System Administrator', 'admin@subway.de', 'admin']
      );

      // Manager
      const managerPassword = bcrypt.hashSync('manager123', 10);
      await client.query(
        'INSERT INTO users (username, password, full_name, email, role, store_id) VALUES ($1, $2, $3, $4, $5, $6)',
        ['manager1', managerPassword, 'Store Manager 1', 'manager1@subway.de', 'manager', 1]
      );

      // Mitarbeiter
      const employeePassword = bcrypt.hashSync('mitarbeiter123', 10);
      await client.query(
        'INSERT INTO users (username, password, full_name, email, role, store_id) VALUES ($1, $2, $3, $4, $5, $6)',
        ['mitarbeiter1', employeePassword, 'Max Mustermann', 'max@subway.de', 'employee', 1]
      );

      console.log('Benutzer erstellt!');

      // Erstelle Task Templates
      const templates = [
        ['Brot-Bestand prüfen', 'Alle Brotsorten auf Frische und Verfügbarkeit prüfen', 'Lager', 'frueh', 'daily', null, 0],
        ['Kühlschrank-Temperaturen kontrollieren', 'Alle Kühlgeräte auf korrekte Temperatur prüfen', 'Hygiene', 'beide', 'daily', null, 0],
        ['Kassenabrechnung', 'Kasse zählen und Tagesabrechnung erstellen', 'Kasse', 'spaet', 'daily', null, 0],
        ['Gründliche Reinigung der Ausgabe', 'Komplette Ausgabetheke reinigen und desinfizieren', 'Reinigung', 'spaet', 'daily', null, 1],
        ['Warenbestellung prüfen', 'Bestandsliste durchgehen und Bestellung vorbereiten', 'Lager', 'frueh', 'weekly', 'monday', 0],
        ['Tiefenreinigung Küche', 'Komplette Küchenreinigung inklusive Böden', 'Reinigung', 'spaet', 'weekly', 'sunday', 1],
        ['Inventur', 'Komplette Inventur aller Waren', 'Lager', 'beide', 'monthly', null, 0]
      ];

      for (const template of templates) {
        await client.query(
          'INSERT INTO task_templates (title, description, category, shift, recurrence, recurrence_day, requires_photo) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          template
        );
      }

      console.log('Aufgabenvorlagen erstellt!');
    }

    console.log('\n✓ PostgreSQL Datenbank erfolgreich initialisiert!');
    console.log('\nZugriffsdaten:');
    console.log('Admin - Username: admin, Passwort: admin123');
    console.log('Manager - Username: manager1, Passwort: manager123');
    console.log('Mitarbeiter - Username: mitarbeiter1, Passwort: mitarbeiter123');

  } catch (error) {
    console.error('Fehler:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();
