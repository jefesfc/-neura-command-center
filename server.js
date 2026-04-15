require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDB } = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/social-posts', express.static(path.join(__dirname, 'social-posts')));

// List PNG files in social-posts folder
const SOCIAL_POSTS_DIR = path.join(__dirname, 'social-posts');
app.get('/api/social-posts', (_req, res) => {
  try {
    const files = fs.readdirSync(SOCIAL_POSTS_DIR)
      .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
      .map(f => ({
        filename: f,
        url: `/social-posts/${encodeURIComponent(f)}`,
        name: f.replace(/\.[^.]+$/, ''),
        mtime: fs.statSync(path.join(SOCIAL_POSTS_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/posts', require('./src/routes/posts'));
app.use('/api/generate', require('./src/routes/generate'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/api/prospector', require('./src/routes/prospector'));

// Serve React in production
app.use(express.static(path.join(__dirname, 'client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const { startBot } = require('./src/telegram/bot');
const { initScraperDB } = require('./src/db/scraper');

initDB().then(async () => {
  await initScraperDB();
  app.listen(PORT, () => {
    console.log(`[Neura] Running on port ${PORT}`);
    startBot();
  });
}).catch(err => {
  console.error('[DB] Init failed:', err.message);
  process.exit(1);
});
