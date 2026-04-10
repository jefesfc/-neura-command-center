const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { buildPostHTML } = require('./postTemplate');

const FORMAT_SIZES = {
  '1:1':  { width: 1080, height: 1080 },
  '16:9': { width: 1080, height: 608 },
  '9:16': { width: 1080, height: 1920 },
  '4:5':  { width: 1080, height: 1350 },
};

async function runLayoutAgent({ headline, bullets, cta, system, imageB64, format = '1:1', filename }) {
  const { width, height } = FORMAT_SIZES[format] || FORMAT_SIZES['1:1'];
  const html = buildPostHTML({ headline, bullets, cta, system, imageB64, format });

  const outputDir = path.join(__dirname, '../../social-posts');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const pngPath = path.join(outputDir, filename);

  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });
  const page = await browser.newPage();

  await page.setViewport({ width, height });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Wait extra for Google Fonts
  await page.waitForTimeout(1500);

  await page.screenshot({ path: pngPath, type: 'png', clip: { x: 0, y: 0, width, height } });
  await browser.close();

  return pngPath;
}

module.exports = { runLayoutAgent };
