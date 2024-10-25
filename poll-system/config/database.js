const { Pool } = require('pg');

const pgPool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'polling_system',
  password: 'Space@2611',
  port: 5432,
});

const initDatabase = async () => {
  const client = await pgPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS polls (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS poll_options (
        id SERIAL PRIMARY KEY,
        poll_id INTEGER REFERENCES polls(id),
        option_text VARCHAR(255) NOT NULL,
        votes INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        poll_id INTEGER REFERENCES polls(id),
        option_id INTEGER REFERENCES poll_options(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
};

module.exports = { pgPool, initDatabase };