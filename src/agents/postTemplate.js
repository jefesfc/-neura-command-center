const fs = require('fs');
const path = require('path');

let LOGO_B64 = '';
try {
  const logoPath = path.resolve(__dirname, '../../client/public/logo.png');
  LOGO_B64 = fs.readFileSync(logoPath).toString('base64');
} catch (e) {
  // fallback to text if file not found
}

const SYSTEM_BADGE = {
  'sistema-01': 'Sistema 01',
  'sistema-02': 'Sistema 02',
  'sistema-03': 'Sistema 03',
  'neura': 'Neura',
  'ai-agents': 'AI Agents',
  'crm': 'AI CRM',
  'rag': 'RAG',
  'ai': 'AI',
};

const PALETTES = {
  navy: {
    overlay: 'linear-gradient(150deg, rgba(7,18,28,0.94) 0%, rgba(11,30,45,0.65) 50%, rgba(7,18,28,0.92) 100%)',
    fallbackBg: '#0b1e2d',
    accent: '#1fa2b8',
    accent2: '#c98a5a',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.68)',
    badgeColor: '#c98a5a',
    badgeBorder: 'rgba(201,138,90,0.50)',
    lineColor: '#1fa2b8',
    numColor: '#1fa2b8',
    ctaColor: '#1fa2b8',
    arrowColor: '#c98a5a',
    separatorColor: 'rgba(31,162,184,0.22)',
    watermarkColor: 'rgba(255,255,255,0.25)',
    cornerColor: 'rgba(31,162,184,0.30)',
  },
  gold: {
    overlay: 'linear-gradient(150deg, rgba(12,8,2,0.95) 0%, rgba(20,14,4,0.68) 50%, rgba(12,8,2,0.94) 100%)',
    fallbackBg: '#130e04',
    accent: '#d4a040',
    accent2: '#f0d080',
    text: '#f8f2e4',
    textMuted: 'rgba(248,242,228,0.72)',
    badgeColor: '#d4a040',
    badgeBorder: 'rgba(212,160,64,0.50)',
    lineColor: '#d4a040',
    numColor: '#d4a040',
    ctaColor: '#d4a040',
    arrowColor: '#f0d080',
    separatorColor: 'rgba(212,160,64,0.25)',
    watermarkColor: 'rgba(248,242,228,0.28)',
    cornerColor: 'rgba(212,160,64,0.32)',
  },
  grey: {
    overlay: 'linear-gradient(150deg, rgba(6,6,12,0.96) 0%, rgba(10,10,18,0.66) 50%, rgba(6,6,12,0.94) 100%)',
    fallbackBg: '#08080e',
    accent: '#8fa8be',
    accent2: '#1fa2b8',
    text: '#f0f4f8',
    textMuted: 'rgba(240,244,248,0.68)',
    badgeColor: '#8fa8be',
    badgeBorder: 'rgba(143,168,190,0.42)',
    lineColor: '#8fa8be',
    numColor: '#8fa8be',
    ctaColor: '#8fa8be',
    arrowColor: '#1fa2b8',
    separatorColor: 'rgba(143,168,190,0.22)',
    watermarkColor: 'rgba(240,244,248,0.26)',
    cornerColor: 'rgba(143,168,190,0.30)',
  },
};

function buildPostHTML({ headline, bullets, cta, system, imageB64, format = '1:1', palette = 'navy' }) {
  const isStory = format === '9:16';
  const width = 1080;
  const height = isStory ? 1920 : 1080;
  const badge = SYSTEM_BADGE[system] || 'Neura';
  const p = PALETTES[palette] || PALETTES.navy;

  const bgStyle = imageB64
    ? `background-image: url('data:image/jpeg;base64,${imageB64}'); background-size: cover; background-position: center;`
    : `background: ${p.fallbackBg};`;

  const logoHtml = LOGO_B64
    ? `<img src="data:image/png;base64,${LOGO_B64}" alt="Neura" class="logo-img" />`
    : `<span class="logo-text">NEURA</span>`;

  const bulletItems = (bullets || [])
    .map((b, i) => `
    <li class="bullet-item">
      <span class="bullet-num">0${i + 1}</span>
      <div class="bullet-content">
        <div class="bullet-line"></div>
        <span class="bullet-text">${b}</span>
      </div>
    </li>`)
    .join('');

  const headlineFontSize = isStory ? '92px' : (headline && headline.length > 40 ? '68px' : '78px');
  const bulletFontSize = isStory ? '34px' : '26px';
  const numFontSize = isStory ? '20px' : '16px';
  const ctaFontSize = isStory ? '30px' : '24px';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${width}px; height: ${height}px; overflow: hidden; }

  .post {
    position: relative;
    width: ${width}px;
    height: ${height}px;
    ${bgStyle}
    font-family: 'Inter', sans-serif;
  }

  /* Overlay */
  .overlay {
    position: absolute;
    inset: 0;
    background: ${p.overlay};
  }

  /* Corner decoration top-left */
  .corner-tl {
    position: absolute;
    top: ${isStory ? '52px' : '38px'};
    left: ${isStory ? '52px' : '38px'};
    width: ${isStory ? '48px' : '36px'};
    height: ${isStory ? '48px' : '36px'};
    border-top: 2px solid ${p.cornerColor};
    border-left: 2px solid ${p.cornerColor};
    z-index: 5;
  }

  /* Corner decoration bottom-right */
  .corner-br {
    position: absolute;
    bottom: ${isStory ? '52px' : '38px'};
    right: ${isStory ? '52px' : '38px'};
    width: ${isStory ? '48px' : '36px'};
    height: ${isStory ? '48px' : '36px'};
    border-bottom: 2px solid ${p.cornerColor};
    border-right: 2px solid ${p.cornerColor};
    z-index: 5;
  }

  .content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: ${isStory ? '88px 80px' : '64px 72px'};
  }

  /* TOP BAR */
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${isStory ? '18px' : '12px'};
  }

  .logo-img {
    height: ${isStory ? '50px' : '38px'};
    width: auto;
    object-fit: contain;
  }

  .logo-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: ${isStory ? '46px' : '36px'};
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #ffffff;
  }

  .badge {
    font-family: 'DM Mono', monospace;
    font-size: ${isStory ? '20px' : '15px'};
    font-weight: 500;
    color: ${p.badgeColor};
    letter-spacing: 0.10em;
    text-transform: uppercase;
    border: 1.5px solid ${p.badgeBorder};
    padding: ${isStory ? '10px 22px' : '7px 16px'};
    border-radius: 3px;
  }

  /* SEPARATOR */
  .top-sep {
    width: 100%;
    height: 1px;
    background: ${p.separatorColor};
    margin-bottom: ${isStory ? '80px' : '44px'};
  }

  /* MAIN */
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* Accent line */
  .accent-line {
    width: ${isStory ? '72px' : '56px'};
    height: 4px;
    background: ${p.lineColor};
    border-radius: 2px;
    margin-bottom: ${isStory ? '36px' : '24px'};
  }

  .headline {
    font-family: 'Cormorant Garamond', serif;
    font-size: ${headlineFontSize};
    font-weight: 700;
    line-height: 1.08;
    color: ${p.text};
    margin-bottom: ${isStory ? '72px' : '44px'};
    letter-spacing: -0.02em;
  }

  /* BULLETS */
  .bullets {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: ${isStory ? '36px' : '22px'};
  }

  .bullet-item {
    display: flex;
    align-items: flex-start;
    gap: ${isStory ? '28px' : '20px'};
  }

  .bullet-num {
    font-family: 'DM Mono', monospace;
    font-size: ${numFontSize};
    font-weight: 500;
    color: ${p.numColor};
    letter-spacing: 0.08em;
    flex-shrink: 0;
    margin-top: ${isStory ? '8px' : '5px'};
    opacity: 0.85;
  }

  .bullet-content {
    display: flex;
    flex-direction: column;
    gap: ${isStory ? '10px' : '7px'};
  }

  .bullet-line {
    width: ${isStory ? '40px' : '30px'};
    height: 1.5px;
    background: ${p.lineColor};
    opacity: 0.5;
  }

  .bullet-text {
    font-family: 'Inter', sans-serif;
    font-size: ${bulletFontSize};
    font-weight: 400;
    color: ${p.textMuted};
    line-height: 1.45;
    letter-spacing: 0.005em;
  }

  /* BOTTOM */
  .bottom-sep {
    width: 100%;
    height: 1px;
    background: ${p.separatorColor};
    margin-top: ${isStory ? '80px' : '44px'};
    margin-bottom: ${isStory ? '36px' : '24px'};
  }

  .bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .cta-group {
    display: flex;
    align-items: center;
    gap: ${isStory ? '20px' : '14px'};
  }

  .cta {
    font-family: 'Inter', sans-serif;
    font-size: ${ctaFontSize};
    font-weight: 600;
    color: ${p.ctaColor};
    letter-spacing: 0.02em;
  }

  .cta-arrow {
    font-size: ${ctaFontSize};
    color: ${p.arrowColor};
    font-weight: 300;
    line-height: 1;
  }

  .watermark {
    font-family: 'DM Mono', monospace;
    font-size: ${isStory ? '18px' : '14px'};
    color: ${p.watermarkColor};
    letter-spacing: 0.10em;
  }
</style>
</head>
<body>
<div class="post">
  <div class="overlay"></div>
  <div class="corner-tl"></div>
  <div class="corner-br"></div>
  <div class="content">

    <div class="top-bar">
      <div class="logo-wrap">${logoHtml}</div>
      <div class="badge">${badge}</div>
    </div>
    <div class="top-sep"></div>

    <div class="main">
      <div class="accent-line"></div>
      <h1 class="headline">${headline}</h1>
      <ul class="bullets">${bulletItems}</ul>
    </div>

    <div class="bottom-sep"></div>
    <div class="bottom-bar">
      <div class="cta-group">
        <span class="cta">${cta}</span>
        <span class="cta-arrow">→</span>
      </div>
      <span class="watermark">neurasolutions.cloud</span>
    </div>

  </div>
</div>
</body>
</html>`;
}

module.exports = { buildPostHTML };
