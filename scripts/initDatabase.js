const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, '../database.sqlite'));

// Erstelle Tabellen
db.exec(`
  -- Stores Tabelle
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Mitarbeiter Tabelle
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'employee')),
    store_id INTEGER,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  -- Task Templates (Aufgabenvorlagen)
  CREATE TABLE IF NOT EXISTS task_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    shift TEXT CHECK(shift IN ('frueh', 'spaet', 'beide')),
    recurrence TEXT CHECK(recurrence IN ('daily', 'weekly', 'monthly', 'once')),
    recurrence_day TEXT,
    store_id INTEGER,
    requires_photo INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  -- Task Instances (Tatsächliche Aufgaben)
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    shift TEXT NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'skipped')),
    completed_by INTEGER,
    completed_at DATETIME,
    photo_path TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES task_templates(id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (completed_by) REFERENCES users(id)
  );

  -- Indizes für Performance
  CREATE INDEX IF NOT EXISTS idx_tasks_store_date ON tasks(store_id, due_date);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_users_store ON users(store_id);
`);

console.log('Datenbank-Tabellen erstellt!');

// Erstelle 9 Subway Stores
const stores = [
  { name: 'Subway Hauptbahnhof', city: 'München' },
  { name: 'Subway Marienplatz', city: 'München' },
  { name: 'Subway Sendlinger Tor', city: 'München' },
  { name: 'Subway Karlsplatz', city: 'München' },
  { name: 'Subway Ostbahnhof', city: 'München' },
  { name: 'Subway Pasing', city: 'München' },
  { name: 'Subway Neuperlach', city: 'München' },
  { name: 'Subway Schwabing', city: 'München' },
  { name: 'Subway Giesing', city: 'München' }
];

const insertStore = db.prepare('INSERT INTO stores (name, city) VALUES (?, ?)');
stores.forEach(store => {
  insertStore.run(store.name, store.city);
});

console.log('9 Subway Stores erstellt!');

// Erstelle Admin-User
const hashedPassword = bcrypt.hashSync('admin123', 10);
const insertUser = db.prepare(`
  INSERT INTO users (username, password, full_name, email, role)
  VALUES (?, ?, ?, ?, ?)
`);

insertUser.run('admin', hashedPassword, 'System Administrator', 'admin@subway.de', 'admin');

console.log('Admin-User erstellt (Username: admin, Passwort: admin123)');

// Erstelle Beispiel-Manager für Store 1
const managerPassword = bcrypt.hashSync('manager123', 10);
insertUser.run('manager1', managerPassword, 'Store Manager 1', 'manager1@subway.de', 'manager', 1);

// Erstelle Beispiel-Mitarbeiter
const employeePassword = bcrypt.hashSync('mitarbeiter123', 10);
insertUser.run('mitarbeiter1', employeePassword, 'Max Mustermann', 'max@subway.de', 'employee', 1);

console.log('Beispiel-Benutzer erstellt!');

// Erstelle Standard-Aufgabenvorlagen
const taskTemplates = [
  {
    title: 'Brot-Bestand prüfen',
    description: 'Alle Brotsorten auf Frische und Verfügbarkeit prüfen',
    category: 'Lager',
    shift: 'frueh',
    recurrence: 'daily',
    requires_photo: 0
  },
  {
    title: 'Kühlschrank-Temperaturen kontrollieren',
    description: 'Alle Kühlgeräte auf korrekte Temperatur prüfen und dokumentieren',
    category: 'Hygiene',
    shift: 'beide',
    recurrence: 'daily',
    requires_photo: 0
  },
  {
    title: 'Kassenabrechnung',
    description: 'Kasse zählen und Tagesabrechnung erstellen',
    category: 'Kasse',
    shift: 'spaet',
    recurrence: 'daily',
    requires_photo: 0
  },
  {
    title: 'Gründliche Reinigung der Ausgabe',
    description: 'Komplette Ausgabetheke reinigen und desinfizieren',
    category: 'Reinigung',
    shift: 'spaet',
    recurrence: 'daily',
    requires_photo: 1
  },
  {
    title: 'Warenbestellung prüfen',
    description: 'Bestandsliste durchgehen und Bestellung vorbereiten',
    category: 'Lager',
    shift: 'frueh',
    recurrence: 'weekly',
    recurrence_day: 'monday',
    requires_photo: 0
  },
  {
    title: 'Tiefenreinigung Küche',
    description: 'Komplette Küchenreinigung inklusive Böden und Geräte',
    category: 'Reinigung',
    shift: 'spaet',
    recurrence: 'weekly',
    recurrence_day: 'sunday',
    requires_photo: 1
  },
  {
    title: 'Inventur',
    description: 'Komplette Inventur aller Waren',
    category: 'Lager',
    shift: 'beide',
    recurrence: 'monthly',
    requires_photo: 0
  }
];

const insertTemplate = db.prepare(`
  INSERT INTO task_templates (title, description, category, shift, recurrence, recurrence_day, requires_photo)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

taskTemplates.forEach(template => {
  insertTemplate.run(
    template.title,
    template.description,
    template.category,
    template.shift,
    template.recurrence,
    template.recurrence_day || null,
    template.requires_photo
  );
});

console.log('Aufgabenvorlagen erstellt!');

db.close();
console.log('\n✓ Datenbank erfolgreich initialisiert!');
console.log('\nZugriffsdaten:');
console.log('Admin - Username: admin, Passwort: admin123');
console.log('Manager - Username: manager1, Passwort: manager123');
console.log('Mitarbeiter - Username: mitarbeiter1, Passwort: mitarbeiter123');
