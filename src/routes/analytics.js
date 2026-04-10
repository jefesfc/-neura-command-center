const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { runCaptionAgent } = require('../agents/captionAgent');

// POST /api/analytics/caption-standalone — caption without a full post
router.post('/caption-standalone', async (req, res) => {
  const { topic, system, keywords } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic required' });

  const bullets = (keywords || '').split(',').map(k => k.trim()).filter(Boolean);
  const result = await runCaptionAgent({
    headline: topic,
    bullets,
    cta: 'Descubre más en neurasolutions.cloud',
    system: system || 'sistema-01',
    brief: topic,
    postId: null,
  });

  res.json(result);
});

// GET /api/analytics/tokens — spend by day + breakdown
router.get('/tokens', async (req, res) => {
  const [byDay, byProvider, byFeature, totals] = await Promise.all([
    query(`
      SELECT DATE(created_at) as date, SUM(cost_usd) as cost, SUM(tokens_in + tokens_out) as tokens
      FROM token_usage
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `),
    query(`
      SELECT provider, SUM(cost_usd) as cost, SUM(tokens_in + tokens_out) as tokens
      FROM token_usage
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY provider
    `),
    query(`
      SELECT feature, SUM(cost_usd) as cost, SUM(tokens_in + tokens_out) as tokens
      FROM token_usage
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY feature
    `),
    query(`
      SELECT
        SUM(cost_usd) FILTER (WHERE created_at >= date_trunc('month', NOW())) as month_cost,
        SUM(cost_usd) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_cost,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as month_calls
      FROM token_usage
    `),
  ]);

  const t = totals.rows[0];

  res.json({
    by_day: byDay.rows.map(r => ({ date: r.date, cost: parseFloat(r.cost || 0), tokens: parseInt(r.tokens || 0) })),
    by_provider: byProvider.rows.map(r => ({ provider: r.provider, cost: parseFloat(r.cost || 0), tokens: parseInt(r.tokens || 0) })),
    by_feature: byFeature.rows.map(r => ({ feature: r.feature, cost: parseFloat(r.cost || 0), tokens: parseInt(r.tokens || 0) })),
    totals: {
      month_cost: parseFloat(t.month_cost || 0),
      today_cost: parseFloat(t.today_cost || 0),
      month_calls: parseInt(t.month_calls || 0),
    },
  });
});

// GET /api/analytics/posts — post creation stats
router.get('/posts', async (req, res) => {
  const [byDay, bySystem, byStatus] = await Promise.all([
    query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM posts
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `),
    query(`SELECT system, COUNT(*) as count FROM posts GROUP BY system`),
    query(`SELECT status, COUNT(*) as count FROM posts GROUP BY status`),
  ]);

  res.json({
    by_day: byDay.rows,
    by_system: bySystem.rows,
    by_status: byStatus.rows,
  });
});

module.exports = router;
