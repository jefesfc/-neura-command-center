require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./src/db');

const postsRouter = require('./src/routes/posts');
const generateRouter = require('./src/routes/generate');
const analyticsRouter = require('./src/routes/analytics');
const settingsRouter = require('./src/routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve generated post images
app.use('/social-posts', express.static(path.join(__dirname, 'social-posts')));

// API routes
app.use('/api/posts', postsRouter);
app.use('/api/generate', generateRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings', settingsRouter);

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  });
}

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`[Neura] Server running on port ${PORT}`);
  });
}

start();
