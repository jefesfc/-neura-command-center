const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { query } = require('../db');

const SOCIAL_POSTS_DIR = path.resolve(__dirname, '../../social-posts');
if (!fs.existsSync(SOCIAL_POSTS_DIR)) fs.mkdirSync(SOCIAL_POSTS_DIR, { recursive: true });

// GET all posts (with optional filters)
router.get('/', async (req, res) => {
  const { status, system, limit = 50, offset = 0 } = req.query;
  let sql = 'SELECT id, title, headline, bullets, cta, tone, system, format, caption, hashtags, status, png_path, post_type, slides, palette, created_at, updated_at FROM posts';
  const params = [];
  const conditions = [];

  if (status) { conditions.push(`status = $${params.length + 1}`); params.push(status); }
  if (system) { conditions.push(`system = $${params.length + 1}`); params.push(system); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  res.json(result.rows);
});

// GET raw AI image for a post (served as JPEG from DB — persistent across deploys)
router.get('/:id/image', async (req, res) => {
  const result = await query('SELECT image_b64 FROM posts WHERE id = $1', [req.params.id]);
  if (!result.rows.length || !result.rows[0].image_b64) return res.status(404).end();
  const buf = Buffer.from(result.rows[0].image_b64, 'base64');
  res.set('Content-Type', 'image/jpeg');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(buf);
});

// GET single post
router.get('/:id', async (req, res) => {
  const result = await query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'Post not found' });
  res.json(result.rows[0]);
});

// PATCH post status or fields
router.patch('/:id', async (req, res) => {
  const { status, title, caption, hashtags } = req.body;
  const fields = [];
  const params = [];

  if (status !== undefined) { fields.push(`status = $${params.length + 1}`); params.push(status); }
  if (title !== undefined) { fields.push(`title = $${params.length + 1}`); params.push(title); }
  if (caption !== undefined) { fields.push(`caption = $${params.length + 1}`); params.push(caption); }
  if (hashtags !== undefined) { fields.push(`hashtags = $${params.length + 1}`); params.push(hashtags); }

  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  fields.push(`updated_at = NOW()`);

  params.push(req.params.id);
  const result = await query(
    `UPDATE posts SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  res.json(result.rows[0]);
});

// DELETE post
router.delete('/:id', async (req, res) => {
  await query('DELETE FROM posts WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// POST save rendered PNG to disk (called by client after html2canvas render)
router.post('/:id/save-png', async (req, res) => {
  const { pngB64, slideIndex } = req.body;
  if (!pngB64) return res.status(400).json({ error: 'pngB64 required' });

  const suffix = slideIndex !== undefined ? `_slide${slideIndex}` : '';
  const filename = `post_${req.params.id}${suffix}.png`;
  const filepath = path.join(SOCIAL_POSTS_DIR, filename);

  try {
    const buffer = Buffer.from(pngB64, 'base64');
    fs.writeFileSync(filepath, buffer);

    // Only update png_path for the main post image (no slideIndex or slideIndex === 0)
    if (slideIndex === undefined || slideIndex === 0) {
      await query('UPDATE posts SET png_path=$1, updated_at=NOW() WHERE id=$2', [filename, req.params.id]);
    }

    res.json({ ok: true, filename, url: `/social-posts/${filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET stats for dashboard
router.get('/stats/summary', async (req, res) => {
  const [weekPosts, statusCounts] = await Promise.all([
    query(`SELECT COUNT(*) as count FROM posts WHERE created_at >= NOW() - INTERVAL '7 days'`),
    query(`SELECT status, COUNT(*) as count FROM posts GROUP BY status`),
  ]);

  res.json({
    this_week: parseInt(weekPosts.rows[0].count),
    by_status: statusCounts.rows.reduce((acc, r) => ({ ...acc, [r.status]: parseInt(r.count) }), {}),
  });
});

module.exports = router;
