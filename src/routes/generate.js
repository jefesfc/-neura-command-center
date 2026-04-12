const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const { runCopyAgent } = require('../agents/copyAgent');
const { runImageAgent } = require('../agents/imageAgent');
const { runLayoutAgent } = require('../agents/layoutAgent');
const { runCaptionAgent } = require('../agents/captionAgent');
const { runCarouselAgent } = require('../agents/carouselAgent');

// In-memory job store
const jobs = new Map();

// POST /api/generate — start generation job
router.post('/', async (req, res) => {
  const { brief, system, format = '1:1', tone = 'profesional', palette = 'navy', post_type = 'single' } = req.body;
  if (!brief || !system) return res.status(400).json({ error: 'brief and system required' });

  const jobId = uuidv4();
  jobs.set(jobId, { status: 'pending', steps: {}, error: null, postId: null });
  res.json({ jobId });

  runPipeline(jobId, { brief, system, format, tone, palette, post_type });
});

// GET /api/generate/stream/:jobId — SSE stream
router.get('/stream/:jobId', (req, res) => {
  const { jobId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  let lastStepsSent = {};
  const interval = setInterval(() => {
    const job = jobs.get(jobId);
    if (!job) { send({ type: 'error', message: 'Job not found' }); clearInterval(interval); res.end(); return; }

    for (const [step, state] of Object.entries(job.steps)) {
      const last = lastStepsSent[step];
      if (!last || last.status !== state.status) {
        send({ type: 'step', step, ...state });
        lastStepsSent[step] = { ...state };
      }
    }

    if (job.status === 'done') {
      send({ type: 'complete', postId: job.postId });
      clearInterval(interval);
      setTimeout(() => { res.end(); jobs.delete(jobId); }, 500);
    }
    if (job.status === 'error') {
      send({ type: 'error', message: job.error });
      clearInterval(interval);
      setTimeout(() => { res.end(); jobs.delete(jobId); }, 500);
    }
  }, 300);

  req.on('close', () => clearInterval(interval));
});

// POST /api/generate/step — regenerate a single step
router.post('/step', async (req, res) => {
  const { postId, step, brief, system, format, imagePrompt, palette } = req.body;
  if (!postId || !step) return res.status(400).json({ error: 'postId and step required' });

  const postResult = await query('SELECT * FROM posts WHERE id = $1', [postId]);
  if (!postResult.rows.length) return res.status(404).json({ error: 'Post not found' });
  const post = postResult.rows[0];

  try {
    if (step === 'copy') {
      const copy = await runCopyAgent({ brief: brief || post.brief, system: system || post.system, tone: post.tone, postId });
      await query('UPDATE posts SET headline=$1, bullets=$2, cta=$3, updated_at=NOW() WHERE id=$4',
        [copy.headline, JSON.stringify(copy.bullets), copy.cta, postId]);
      return res.json({ ok: true, data: copy });
    }

    if (step === 'image') {
      const prompt = imagePrompt || `${post.headline} ${post.brief}`;
      const imageB64 = await runImageAgent({ imagePrompt: prompt, aspectRatio: post.format, postId });
      await query('UPDATE posts SET image_b64=$1, updated_at=NOW() WHERE id=$2', [imageB64, postId]);
      return res.json({ ok: true, imageB64 });
    }

    if (step === 'layout') {
      const usePalette = palette || post.palette || 'navy';
      const { html } = await runLayoutAgent({
        headline: post.headline, bullets: post.bullets, cta: post.cta,
        system: post.system, imageB64: post.image_b64, format: post.format,
        palette: usePalette, postType: post.post_type || 'single',
      });
      await query('UPDATE posts SET post_html=$1, updated_at=NOW() WHERE id=$2', [html, postId]);
      return res.json({ ok: true, html });
    }

    if (step === 'caption') {
      const caption = await runCaptionAgent({
        headline: post.headline, bullets: post.bullets, cta: post.cta,
        system: post.system, brief: post.brief, postId,
      });
      await query('UPDATE posts SET caption=$1, hashtags=$2, updated_at=NOW() WHERE id=$3',
        [caption.caption, caption.hashtags, postId]);
      return res.json({ ok: true, data: caption });
    }

    res.status(400).json({ error: 'Unknown step' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function runPipeline(jobId, { brief, system, format, tone, palette, post_type }) {
  const job = jobs.get(jobId);
  const setStep = (step, status, data = {}) => { job.steps[step] = { status, ...data }; };

  try {
    // Create draft post
    const draftResult = await query(
      `INSERT INTO posts (brief, system, format, tone, palette, post_type, status) VALUES ($1,$2,$3,$4,$5,$6,'draft') RETURNING id`,
      [brief, system, format, tone, palette, post_type]
    );
    const postId = draftResult.rows[0].id;
    job.postId = postId;

    // Step 1: Copy
    setStep('copy', 'running');
    const copy = await runCopyAgent({ brief, system, tone, postId });
    await query('UPDATE posts SET headline=$1, bullets=$2, cta=$3 WHERE id=$4',
      [copy.headline, JSON.stringify(copy.bullets), copy.cta, postId]);
    setStep('copy', 'done', { headline: copy.headline });

    // Step 2: Image
    setStep('image', 'running');
    let imageB64 = null;
    try {
      imageB64 = await runImageAgent({ imagePrompt: copy.image_prompt, aspectRatio: format, postId });
      await query('UPDATE posts SET image_b64=$1 WHERE id=$2', [imageB64, postId]);
      setStep('image', 'done');
    } catch (err) {
      setStep('image', 'skipped', { warning: err.message });
    }

    // Step 3: Layout / Carousel
    setStep('layout', 'running');

    let layoutResult;
    if (post_type === 'carousel') {
      // Carousel agent expands copy into 5 slides
      setStep('carousel', 'running');
      const carouselSlides = await runCarouselAgent({
        headline: copy.headline, bullets: copy.bullets, cta: copy.cta,
        system, brief, postId,
      });
      setStep('carousel', 'done');

      layoutResult = await runLayoutAgent({
        headline: copy.headline, bullets: copy.bullets, cta: copy.cta,
        system, imageB64, format, palette, postType: 'carousel', carouselSlides,
      });

      const slidesForDb = layoutResult.slides.map(s => ({
        index: s.index, type: s.type, html: s.html,
        title: s.title || s.point_title || s.cta_headline || '',
      }));
      await query('UPDATE posts SET post_html=$1, slides=$2 WHERE id=$3',
        [layoutResult.html, JSON.stringify(slidesForDb), postId]);
      setStep('layout', 'done', { html: layoutResult.html, slides: layoutResult.slides });
    } else {
      layoutResult = await runLayoutAgent({
        headline: copy.headline, bullets: copy.bullets, cta: copy.cta,
        system, imageB64, format, palette, postType: 'single',
      });
      await query('UPDATE posts SET post_html=$1 WHERE id=$2', [layoutResult.html, postId]);
      setStep('layout', 'done', { html: layoutResult.html });
    }

    // Step 4: Caption
    setStep('caption', 'running');
    const captionData = await runCaptionAgent({
      headline: copy.headline, bullets: copy.bullets, cta: copy.cta,
      system, brief, postId,
    });
    await query('UPDATE posts SET caption=$1, hashtags=$2, status=$3 WHERE id=$4',
      [captionData.caption, captionData.hashtags, 'ready', postId]);
    setStep('caption', 'done', { caption: captionData.caption, hashtags: captionData.hashtags });

    job.status = 'done';
  } catch (err) {
    job.status = 'error';
    job.error = err.message;
    console.error('[Pipeline error]', err);
  }
}

module.exports = router;
