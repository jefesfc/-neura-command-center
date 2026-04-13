const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title TEXT,
        headline TEXT,
        bullets JSONB DEFAULT '[]',
        cta TEXT,
        tone TEXT,
        system VARCHAR(20),
        format VARCHAR(20) DEFAULT '1:1',
        brief TEXT,
        image_b64 TEXT,
        png_path TEXT,
        png_url TEXT,
  post_html TEXT,
        caption TEXT,
        hashtags TEXT,
        status VARCHAR(20) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS token_usage (
        id SERIAL PRIMARY KEY,
        provider VARCHAR(20),
        model VARCHAR(100),
        feature VARCHAR(50),
        tokens_in INTEGER DEFAULT 0,
        tokens_out INTEGER DEFAULT 0,
        cost_usd DECIMAL(12,8) DEFAULT 0,
        post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Safe column additions for existing deployments
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS palette VARCHAR(30) DEFAULT 'navy'`);
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS slides JSONB DEFAULT '[]'`);
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type VARCHAR(20) DEFAULT 'single'`);
    await client.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='posts' AND column_name='system'
          AND character_maximum_length < 50
        ) THEN
          ALTER TABLE posts ALTER COLUMN system TYPE VARCHAR(50);
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS scraping_jobs (
        id SERIAL PRIMARY KEY,
        business_type VARCHAR(50) NOT NULL,
        city VARCHAR(50) NOT NULL,
        query TEXT NOT NULL,
        triggered_at TIMESTAMPTZ DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'scraping'
      );
    `);

    // Seed default settings if not present
    await client.query(`
      INSERT INTO settings (key, value) VALUES
        ('color_primary', '#0b1e2d'),
        ('color_accent', '#1fa2b8'),
        ('color_gold', '#c98a5a'),
        ('openai_model_copy', 'gpt-4o'),
        ('openai_model_caption', 'gpt-4o-mini'),
        ('openrouter_model_image', 'google/gemini-3.1-flash-image-preview'),
        ('n8n_webhook_url', '')
      ON CONFLICT (key) DO NOTHING;
    `);

    console.log('[DB] Tables ready.');
  } finally {
    client.release();
  }
}

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query, initDB };
