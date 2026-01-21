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

// Wöchentliche Reinigungsaufgaben (4-Wochen-Rotation)
const weeklyCleaningTasks = [
  // Woche 1
  { title: 'Stuhllehnen & Tischplatten reinigen', week: 1, day: 'monday', category: 'Reinigung Lobby' },
  { title: 'Bodenrandleisten Lobby reinigen', week: 1, day: 'monday', category: 'Reinigung Lobby' },
  { title: 'Bilder & Logo entstauben', week: 1, day: 'monday', category: 'Reinigung Lobby' },
  { title: 'Fensterbretter reinigen', week: 1, day: 'monday', category: 'Reinigung Lobby' },
  { title: 'Backofen auseinanderbauen & reinigen', week: 1, day: 'tuesday', category: 'Reinigung Küche' },
  { title: 'Boden unter Backstation schrubben', week: 1, day: 'tuesday', category: 'Reinigung Küche' },
  { title: 'Menüboard vorne reinigen', week: 1, day: 'tuesday', category: 'Reinigung Theke' },
  { title: 'Menüboard Rückseite entstauben', week: 1, day: 'tuesday', category: 'Reinigung Theke' },
  { title: 'Klimaanlagengitter entstauben', week: 1, day: 'tuesday', category: 'Reinigung Allgemein' },
  { title: 'Regale im Kühlraum abwischen', week: 1, day: 'wednesday', category: 'Reinigung Kühlung' },
  { title: 'Bleche im Kühlraum wechseln', week: 1, day: 'wednesday', category: 'Reinigung Kühlung' },
  { title: 'Soßencambros tauschen', week: 1, day: 'wednesday', category: 'Reinigung Theke' },
  { title: 'Kühlungsboden wischen', week: 1, day: 'wednesday', category: 'Reinigung Kühlung' },
  { title: 'Fächer unter Theke auswischen', week: 1, day: 'thursday', category: 'Reinigung Theke' },
  { title: 'Kondensatoren entstauben', week: 1, day: 'thursday', category: 'Reinigung Technik' },
  { title: 'Küche schrubben inkl. unter Regal', week: 1, day: 'thursday', category: 'Reinigung Küche' },
  { title: 'Graue Kisten reinigen', week: 1, day: 'thursday', category: 'Reinigung Lager' },
  { title: 'Fliesen Kundentoilette abwaschen', week: 1, day: 'friday', category: 'Reinigung Toilette' },
  { title: 'Waschbecken Kundentoilette reinigen', week: 1, day: 'friday', category: 'Reinigung Toilette' },
  { title: 'Toilette komplett schrubben', week: 1, day: 'friday', category: 'Reinigung Toilette' },
  { title: 'Retarder reinigen', week: 1, day: 'saturday', category: 'Reinigung Küche' },
  { title: 'Bodenrandleisten Thekenbereich reinigen', week: 1, day: 'saturday', category: 'Reinigung Theke' },
  { title: 'Getränkekühlschrank komplett reinigen', week: 1, day: 'sunday', category: 'Reinigung Kühlung' },
  { title: 'Müllstationen & Tonnen reinigen', week: 1, day: 'sunday', category: 'Reinigung Allgemein' },

  // Woche 2
  { title: 'Lichtleiste über Theke abwischen', week: 2, day: 'monday', category: 'Reinigung Theke' },
  { title: 'Decken & Lüftungsgitter entstauben', week: 2, day: 'monday', category: 'Reinigung Allgemein' },
  { title: 'Schrank unter Handwaschbecken reinigen', week: 2, day: 'monday', category: 'Reinigung Küche' },
  { title: 'Tisch-, Stuhl- und Bankbeine reinigen', week: 2, day: 'tuesday', category: 'Reinigung Lobby' },
  { title: 'Sitzflächen & Lehnen reinigen', week: 2, day: 'tuesday', category: 'Reinigung Lobby' },
  { title: 'Wand hinter Theke feucht reinigen', week: 2, day: 'tuesday', category: 'Reinigung Theke' },
  { title: 'Handschuhbox, Seifenspender, Waschbecken reinigen', week: 2, day: 'tuesday', category: 'Reinigung Küche' },
  { title: 'Wände & Decke im Kühlraum reinigen', week: 2, day: 'wednesday', category: 'Reinigung Kühlung' },
  { title: 'TK-/Kühlraumtür säubern', week: 2, day: 'wednesday', category: 'Reinigung Kühlung' },
  { title: 'Kühlungsboden wischen', week: 2, day: 'wednesday', category: 'Reinigung Kühlung' },
  { title: 'Wand hinter & über Arbeitstisch reinigen', week: 2, day: 'thursday', category: 'Reinigung Küche' },
  { title: 'Kassenbereich reinigen (Flächen & Fächer)', week: 2, day: 'thursday', category: 'Reinigung Theke' },
  { title: 'Safe abwischen & Boden drumherum schrubben', week: 2, day: 'thursday', category: 'Reinigung Büro' },
  { title: 'Alle Türen & Rahmen abwaschen', week: 2, day: 'friday', category: 'Reinigung Allgemein' },
  { title: 'Eingangstüren mit Glasreiniger reinigen', week: 2, day: 'friday', category: 'Reinigung Lobby' },
  { title: 'Brotwagen neben Backstation reinigen', week: 2, day: 'saturday', category: 'Reinigung Küche' },
  { title: 'Oberseiten Geräte rückseitige Thekenseite reinigen', week: 2, day: 'saturday', category: 'Reinigung Theke' },
  { title: 'Backcounter rauswischen & desinfizieren', week: 2, day: 'saturday', category: 'Reinigung Küche' },
  { title: 'Lobby schrubben (Bereich Tische & Stühle)', week: 2, day: 'sunday', category: 'Reinigung Lobby' },

  // Woche 3
  { title: 'Stuhllehnen & Tischplatten reinigen', week: 3, day: 'monday', category: 'Reinigung Lobby' },
  { title: 'Alle Wände in der Lobby abwischen', week: 3, day: 'monday', category: 'Reinigung Lobby' },
  { title: 'Bilder & Logo entstauben', week: 3, day: 'monday', category: 'Reinigung Lobby' },
  { title: 'Gärschrank auseinanderbauen & reinigen', week: 3, day: 'tuesday', category: 'Reinigung Küche' },
  { title: 'Boden unter Backstation schrubben', week: 3, day: 'tuesday', category: 'Reinigung Küche' },
  { title: 'Menüboard reinigen', week: 3, day: 'tuesday', category: 'Reinigung Theke' },
  { title: 'Rückseite Menüboard entstauben', week: 3, day: 'tuesday', category: 'Reinigung Theke' },
  { title: 'Regale im Kühlraum abwischen', week: 3, day: 'wednesday', category: 'Reinigung Kühlung' },
  { title: 'Bleche im Kühlraum wechseln', week: 3, day: 'wednesday', category: 'Reinigung Kühlung' },
  { title: 'Soßencambros tauschen', week: 3, day: 'wednesday', category: 'Reinigung Theke' },
  { title: 'Kühlungsboden wischen', week: 3, day: 'wednesday', category: 'Reinigung Kühlung' },
  { title: 'Grünes Regal über Spüle reinigen', week: 3, day: 'thursday', category: 'Reinigung Küche' },
  { title: 'Fliesen im Durchgang reinigen', week: 3, day: 'thursday', category: 'Reinigung Allgemein' },
  { title: 'Spülbecken entkalken', week: 3, day: 'thursday', category: 'Reinigung Küche' },
  { title: 'Kassenbereich reinigen', week: 3, day: 'thursday', category: 'Reinigung Theke' },
  { title: 'Safe + Boden drumherum reinigen', week: 3, day: 'thursday', category: 'Reinigung Büro' },
  { title: 'Kundentoilette komplett schrubben', week: 3, day: 'friday', category: 'Reinigung Toilette' },
  { title: 'Arbeitstisch mit Schublade reinigen', week: 3, day: 'friday', category: 'Reinigung Küche' },
  { title: 'Wand hinter Vorbereitungstisch & Boden darunter', week: 3, day: 'friday', category: 'Reinigung Küche' },
  { title: 'Brotwagen neben Theke gründlich reinigen', week: 3, day: 'saturday', category: 'Reinigung Theke' },
  { title: 'Bodenrandleisten im Thekenbereich reinigen', week: 3, day: 'saturday', category: 'Reinigung Theke' },
  { title: 'Getränkekühlschrank innen & außen reinigen', week: 3, day: 'sunday', category: 'Reinigung Kühlung' },
  { title: 'Müllstationen inkl. Tonnen reinigen', week: 3, day: 'sunday', category: 'Reinigung Allgemein' },

  // Woche 4
  { title: 'Geräte Rück- & Oberseiten reinigen', week: 4, day: 'monday', category: 'Reinigung Theke' },
  { title: 'Lichtleiste über Theke abwischen', week: 4, day: 'monday', category: 'Reinigung Theke' },
  { title: 'Decken & Lüftungsgitter entstauben', week: 4, day: 'monday', category: 'Reinigung Allgemein' },
  { title: 'Tische, Stühle & Bänke – Beine reinigen', week: 4, day: 'tuesday', category: 'Reinigung Lobby' },
  { title: 'Sitzflächen & Lehnen reinigen', week: 4, day: 'tuesday', category: 'Reinigung Lobby' },
  { title: 'Wand hinter Theke reinigen', week: 4, day: 'tuesday', category: 'Reinigung Theke' },
  { title: 'Handschuhbox, Seifenspender, Waschbecken reinigen', week: 4, day: 'tuesday', category: 'Reinigung Küche' },
  { title: 'TK & Kühlraum außen reinigen', week: 4, day: 'wednesday', category: 'Reinigung Kühlung' },
  { title: 'Kühlraumtür innen reinigen', week: 4, day: 'wednesday', category: 'Reinigung Kühlung' },
  { title: 'Kühlungsboden wischen', week: 4, day: 'wednesday', category: 'Reinigung Kühlung' },
  { title: 'Kassenbereich reinigen', week: 4, day: 'thursday', category: 'Reinigung Theke' },
  { title: 'Safe + Boden drumherum reinigen', week: 4, day: 'thursday', category: 'Reinigung Büro' },
  { title: 'Spülmaschine innen & außen reinigen', week: 4, day: 'thursday', category: 'Reinigung Küche' },
  { title: 'Boden unter Spüle & Spülmaschine schrubben', week: 4, day: 'thursday', category: 'Reinigung Küche' },
  { title: 'Schmutzwaschbecken gründlich reinigen', week: 4, day: 'thursday', category: 'Reinigung Küche' },
  { title: 'Mitarbeitertoilette schrubben', week: 4, day: 'friday', category: 'Reinigung Toilette' },
  { title: 'Fliesen & Waschbecken reinigen', week: 4, day: 'friday', category: 'Reinigung Toilette' },
  { title: 'Grünes Regal über Spüle + Wand dahinter', week: 4, day: 'friday', category: 'Reinigung Küche' },
  { title: 'Mülltonnen im Küchenbereich auswaschen', week: 4, day: 'friday', category: 'Reinigung Küche' },
  { title: 'Brotwagen Vorbereitungsbereich reinigen', week: 4, day: 'saturday', category: 'Reinigung Küche' },
  { title: 'Backcounter rauswischen & desinfizieren', week: 4, day: 'saturday', category: 'Reinigung Küche' },
  { title: 'Lobby schrubben (Gehwege)', week: 4, day: 'sunday', category: 'Reinigung Lobby' },
];

// Berechne aktuelle Woche im 4-Wochen-Zyklus
function getWeekInCycle(date = new Date()) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((date - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
  return ((weekNumber - 1) % 4) + 1;
}

// Task-Generierung für heute
async function generateTasksForToday() {
  if (!process.env.DATABASE_URL) return;

  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];
    const currentWeek = getWeekInCycle(today);

    console.log(`📅 Generiere Tasks für ${todayStr} (${dayOfWeek}, Woche ${currentWeek})`);

    // Hole alle Stores
    const storesResult = await pool.query('SELECT id, name FROM stores');
    const stores = storesResult.rows;

    // Filtere Tasks für heute
    const todaysTasks = weeklyCleaningTasks.filter(
      task => task.week === currentWeek && task.day === dayOfWeek
    );

    console.log(`📋 ${todaysTasks.length} Aufgaben für heute gefunden`);

    let totalCreated = 0;

    for (const store of stores) {
      for (const task of todaysTasks) {
        // Prüfe ob Task schon existiert
        const existing = await pool.query(`
          SELECT id FROM tasks
          WHERE title = $1 AND store_id = $2 AND due_date = $3
        `, [task.title, store.id, todayStr]);

        if (existing.rows.length === 0) {
          await pool.query(`
            INSERT INTO tasks (store_id, title, description, shift, due_date, status)
            VALUES ($1, $2, $3, 'frueh', $4, 'pending')
          `, [store.id, task.title, task.category, todayStr]);
          totalCreated++;
        }
      }
    }

    console.log(`✅ ${totalCreated} Tasks erstellt für ${stores.length} Stores`);

  } catch (error) {
    console.error('Task-Generierung Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/reports', require('./routes/reports'));

// Health Check mit Debug-Info
app.get('/health', (req, res) => {
  const today = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];
  const currentWeek = getWeekInCycle(today);
  const todaysTasks = weeklyCleaningTasks.filter(
    task => task.week === currentWeek && task.day === dayOfWeek
  );

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    currentWeek,
    dayOfWeek,
    tasksForToday: todaysTasks.length,
    taskTitles: todaysTasks.map(t => t.title)
  });
});

// Manueller Trigger für Task-Generierung
app.post('/api/generate-tasks', async (req, res) => {
  try {
    await generateTasksForToday();
    res.json({ success: true, message: 'Tasks generiert' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug-Endpoint: Zeige Tasks in DB
app.get('/api/debug/tasks', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.json({ error: 'No database' });
  }

  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const stores = await pool.query('SELECT * FROM stores');
    const tasks = await pool.query('SELECT * FROM tasks ORDER BY due_date DESC LIMIT 50');

    res.json({
      storeCount: stores.rows.length,
      stores: stores.rows,
      taskCount: tasks.rows.length,
      tasks: tasks.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
});

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
