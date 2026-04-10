const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /api/settings — all settings
router.get('/', async (req, res) => {
  const result = await query('SELECT key, value FROM settings ORDER BY key');
  const settings = result.rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
  // Mask API keys
  if (settings.openai_api_key) settings.openai_api_key = '••••••••';
  if (settings.openrouter_api_key) settings.openrouter_api_key = '••••••••';
  res.json(settings);
});

// PATCH /api/settings — update one or more settings
router.patch('/', async (req, res) => {
  const updates = req.body; // { key: value, ... }
  for (const [key, value] of Object.entries(updates)) {
    await query(
      `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value]
    );
  }
  res.json({ ok: true });
});

module.exports = router;
