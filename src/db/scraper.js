const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.SCRAPER_DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

async function scraperQuery(text, params) {
  return getPool().query(text, params);
}

module.exports = { scraperQuery };
