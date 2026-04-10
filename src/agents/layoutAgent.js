const { buildPostHTML } = require('./postTemplate');

// Layout agent now returns HTML — PNG is rendered client-side via html2canvas
async function runLayoutAgent({ headline, bullets, cta, system, imageB64, format = '1:1', filename }) {
  const html = buildPostHTML({ headline, bullets, cta, system, imageB64, format });
  return { html, filename };
}

module.exports = { runLayoutAgent };
