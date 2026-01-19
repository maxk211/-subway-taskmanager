require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateStores() {
  const client = await pool.connect();

  try {
    console.log('Aktualisiere Stores...');

    // Lösche alte Stores (und abhängige Daten)
    await client.query('DELETE FROM tasks');
    await client.query('DELETE FROM users WHERE role != $1', ['admin']);
    await client.query('DELETE FROM stores');

    // Reset der Sequenzen
    await client.query('ALTER SEQUENCE stores_id_seq RESTART WITH 1');

    // Deine echten Subway Restaurants
    const stores = [
      { name: 'Subway Arcaden', address: 'Arcaden', city: 'Regensburg' },
      { name: 'Subway Ziegetsdorfer Straße', address: 'Ziegetsdorfer Straße', city: 'Regensburg' },
      { name: 'Subway DEZ', address: 'Donau-Einkaufszentrum', city: 'Regensburg' },
      { name: 'Subway Arnulfsplatz', address: 'Arnulfsplatz', city: 'Regensburg' },
      { name: 'Subway Cham', address: '', city: 'Cham' },
      { name: 'Subway Straubing', address: '', city: 'Straubing' },
      { name: 'Subway Dingolfing', address: '', city: 'Dingolfing' },
      { name: 'Subway Neutraubling', address: '', city: 'Neutraubling' },
      { name: 'Subway Regenstauf', address: '', city: 'Regenstauf' }
    ];

    for (const store of stores) {
      await client.query(
        'INSERT INTO stores (name, address, city) VALUES ($1, $2, $3)',
        [store.name, store.address, store.city]
      );
    }

    console.log('✅ 9 Subway Stores aktualisiert!');

    // Zeige die neuen Stores
    const result = await client.query('SELECT * FROM stores ORDER BY id');
    console.log('\nAktuelle Stores:');
    result.rows.forEach(store => {
      console.log(`  ${store.id}: ${store.name} (${store.city})`);
    });

  } catch (error) {
    console.error('Fehler:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateStores();
