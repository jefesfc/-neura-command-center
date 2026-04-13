const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { scraperQuery } = require('../db/scraper');

const N8N_WEBHOOK = 'https://xneurasolutions-n8n.9lagn8.easypanel.host/webhook/94504d52-2d81-4803-8dd7-71142b1e3ddb';

// POST /trigger — launch scraping job
router.post('/trigger', async (req, res) => {
  try {
    const { businessType, city } = req.body;
    if (!businessType || !city) {
      return res.status(400).json({ error: 'businessType and city required' });
    }

    const queryStr = `${businessType} in ${city}`;

    const result = await query(
      'INSERT INTO scraping_jobs (business_type, city, query, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [businessType, city, queryStr, 'scraping']
    );
    const job = result.rows[0];

    // Fire-and-forget: call n8n webhook (don't await — it can take minutes)
    fetch(`${N8N_WEBHOOK}?query=${encodeURIComponent(queryStr)}`).catch(() => {});

    res.json({ jobId: job.id, triggeredAt: job.triggered_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /jobs — list all jobs with lead counts
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await query('SELECT * FROM scraping_jobs ORDER BY triggered_at DESC');

    const jobsWithCount = await Promise.all(
      jobs.rows.map(async (job) => {
        const countResult = await scraperQuery(
          'SELECT COUNT(*) as count FROM leads WHERE created_at >= $1 AND city ILIKE $2',
          [job.triggered_at, job.city]
        );
        return { ...job, leads_count: parseInt(countResult.rows[0].count) };
      })
    );

    res.json(jobsWithCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /results/:jobId — leads for a specific job
router.get('/results/:jobId', async (req, res) => {
  try {
    const jobResult = await query('SELECT * FROM scraping_jobs WHERE id = $1', [req.params.jobId]);
    if (!jobResult.rows.length) return res.status(404).json({ error: 'Job not found' });

    const job = jobResult.rows[0];
    const leads = await scraperQuery(
      `SELECT * FROM leads
       WHERE created_at >= $1 AND city ILIKE $2
       ORDER BY created_at DESC
       LIMIT 50`,
      [job.triggered_at, job.city]
    );

    res.json({ job, leads: leads.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /leads/:id — update lead status
router.patch('/leads/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });

    const result = await scraperQuery(
      'UPDATE leads SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Lead not found' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /leads/:id — delete individual lead
router.delete('/leads/:id', async (req, res) => {
  try {
    await scraperQuery('DELETE FROM leads WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /jobs/:jobId — delete job record only (leads stay in neura_scraper)
router.delete('/jobs/:jobId', async (req, res) => {
  try {
    await query('DELETE FROM scraping_jobs WHERE id = $1', [req.params.jobId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /export/:jobId — download leads as CSV
router.get('/export/:jobId', async (req, res) => {
  try {
    const jobResult = await query('SELECT * FROM scraping_jobs WHERE id = $1', [req.params.jobId]);
    if (!jobResult.rows.length) return res.status(404).json({ error: 'Job not found' });

    const job = jobResult.rows[0];
    const leads = await scraperQuery(
      `SELECT company, phone, address, email, website, city, status
       FROM leads
       WHERE created_at >= $1 AND city ILIKE $2
       ORDER BY created_at DESC`,
      [job.triggered_at, job.city]
    );

    const fields = ['company', 'phone', 'address', 'email', 'website', 'city', 'status'];
    const csv = [
      fields.join(','),
      ...leads.rows.map(r =>
        fields.map(f => `"${(r[f] || '').toString().replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const filename = `leads-${job.city}-${job.business_type}.csv`.replace(/\s+/g, '-');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
