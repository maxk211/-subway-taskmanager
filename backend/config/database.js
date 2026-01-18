const path = require('path');

let db;

// PostgreSQL für Production, SQLite für Development
if (process.env.DATABASE_URL) {
  // PostgreSQL Pool
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Wrapper für synchrone SQLite-ähnliche API
  db = {
    prepare: (sql) => {
      // Konvertiere SQLite-Platzhalter (?) zu PostgreSQL ($1, $2, etc.)
      let paramIndex = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);

      return {
        run: async (...params) => {
          try {
            const result = await pool.query(pgSql, params);
            return {
              changes: result.rowCount,
              lastInsertRowid: result.rows[0]?.id
            };
          } catch (error) {
            console.error('Database error:', error);
            throw error;
          }
        },
        get: async (...params) => {
          try {
            const result = await pool.query(pgSql, params);
            return result.rows[0];
          } catch (error) {
            console.error('Database error:', error);
            throw error;
          }
        },
        all: async (...params) => {
          try {
            const result = await pool.query(pgSql, params);
            return result.rows;
          } catch (error) {
            console.error('Database error:', error);
            throw error;
          }
        }
      };
    },
    exec: async (sql) => {
      try {
        await pool.query(sql);
      } catch (error) {
        console.error('Database error:', error);
        throw error;
      }
    },
    close: () => pool.end()
  };
} else {
  // SQLite für Development
  const Database = require('better-sqlite3');
  const sqlite = new Database(path.join(__dirname, '../database.sqlite'));
  sqlite.pragma('journal_mode = WAL');
  db = sqlite;
}

module.exports = db;
