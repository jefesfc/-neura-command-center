require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/social-posts', express.static(path.join(__dirname, 'social-posts')));

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
