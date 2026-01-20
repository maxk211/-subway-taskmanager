require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function generateTodayTasks() {
  const client = await pool.connect();

  try {
    const today = new Date().toISOString().split('T')[0];
    const dateObj = new Date(today);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dateObj.getDay()];

    // Berechne aktuelle Kalenderwoche (1-4 Rotation)
    const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((dateObj - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
    const weekInCycle = ((weekNumber - 1) % 4) + 1; // 1, 2, 3 oder 4

    console.log(`Generiere Tasks für ${today} (${dayOfWeek}, Woche ${weekInCycle} im 4-Wochen-Zyklus)`);

    // Hole alle Stores
    const storesResult = await client.query('SELECT id, name FROM stores');
    const stores = storesResult.rows;

    console.log(`Gefundene Stores: ${stores.length}`);

    let totalCreated = 0;

    for (const store of stores) {
      // Hole passende Templates:
      // 1. Tägliche Tasks
      // 2. Wöchentliche Tasks für den aktuellen Wochentag UND die aktuelle Woche im Zyklus
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

      console.log(`Store "${store.name}": ${templates.length} Templates verarbeitet`);
    }

    console.log(`\n✅ ${totalCreated} Tasks für heute erstellt!`);

  } catch (error) {
    console.error('Fehler:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

generateTodayTasks();
