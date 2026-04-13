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

async function initScraperDB() {
  try {
    await getPool().query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT`);
    await getPool().query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS address TEXT`);
    console.log('[ScraperDB] Columns ready.');
  } catch (err) {
    console.warn('[ScraperDB] Init warning:', err.message);
  }
}

module.exports = { scraperQuery, initScraperDB };
