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
    overlay: 'linear-gradient(150deg, rgba(7,18,28,0.97) 0%, rgba(11,30,45,0.90) 50%, rgba(7,18,28,0.97) 100%)',
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
    overlay: 'linear-gradient(150deg, rgba(12,8,2,0.97) 0%, rgba(20,14,4,0.90) 50%, rgba(12,8,2,0.97) 100%)',
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
    overlay: 'linear-gradient(150deg, rgba(6,6,12,0.97) 0%, rgba(10,10,18,0.90) 50%, rgba(6,6,12,0.97) 100%)',
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

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildPostHTML({ headline, headline_accent, subheadline, stats, description, bullets, cta, system, imageB64, format = '1:1', palette = 'navy' }) {
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

  // Headline with accent color
  let headlineHtml = esc(headline);
  if (headline_accent && headline && headline.includes(headline_accent)) {
    const idx = headline.indexOf(headline_accent);
    const before = headline.slice(0, idx);
    const after = headline.slice(idx + headline_accent.length);
    headlineHtml = `${esc(before)}<span style="color:${p.accent}">${esc(headline_accent)}</span>${esc(after)}`;
  }

  // Stats row
  const statsArr = Array.isArray(stats) && stats.length > 0 ? stats : [
    { value: '24/7', label: 'Non-stop ops' },
    { value: '100x', label: 'Task output' },
    { value: '0',    label: 'Human errors' },
  ];
  const statCells = statsArr.map((s, i) => {
    const valColor = i === 1 ? p.accent2 : p.accent;
    const border = i < statsArr.length - 1 ? `border-right: 1px solid rgba(255,255,255,0.08);` : '';
    return `<div style="flex:1;padding:${isStory ? '18px 0' : '14px 0'};text-align:center;${border}">
      <div style="font-family:'Cormorant Garamond',serif;font-size:${isStory ? '52px' : '36px'};font-weight:700;color:${valColor};line-height:1;">${esc(s.value)}</div>
      <div style="font-size:${isStory ? '22px' : '16px'};color:rgba(255,255,255,0.65);margin-top:5px;letter-spacing:0.04em;">${esc(s.label)}</div>
    </div>`;
  }).join('');

  // Optional bullets
  const bulletsArr = Array.isArray(bullets) ? bullets : [];
  const bulletsHtml = bulletsArr.length > 0
    ? `<div style="display:flex;flex-direction:column;gap:${isStory ? '16px' : '10px'};margin-top:${isStory ? '28px' : '16px'};">
        ${bulletsArr.map(b => `
          <div style="display:flex;align-items:center;gap:${isStory ? '16px' : '10px'};">
            <div style="width:${isStory ? '22px' : '14px'};height:2px;background:${p.accent};flex-shrink:0;"></div>
            <span style="font-size:${isStory ? '28px' : '20px'};color:rgba(255,255,255,0.82);line-height:1.4;">${esc(b)}</span>
          </div>`).join('')}
      </div>`
    : '';

  // Font sizes
  const headlineFontSize = isStory
    ? (headline && headline.length > 40 ? '72px' : '84px')
    : (headline && headline.length > 40 ? '48px' : '58px');
  const subFontSize    = isStory ? '32px' : '18px';
  const descFontSize   = isStory ? '36px' : '22px';
  const ctaFontSize    = isStory ? '36px' : '22px';

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
  .overlay {
    position: absolute;
    inset: 0;
    background: ${p.overlay};
  }
  .left-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: linear-gradient(180deg, ${p.accent} 0%, transparent 100%);
    z-index: 5;
  }
  .content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: ${isStory ? '72px 80px 72px 86px' : '52px 64px 52px 70px'};
  }
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${isStory ? '12px' : '8px'};
  }
  .logo-img {
    height: ${isStory ? '50px' : '36px'};
    width: auto;
    object-fit: contain;
  }
  .logo-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: ${isStory ? '42px' : '32px'};
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #ffffff;
  }
  .badge {
    font-family: 'DM Mono', monospace;
    font-size: ${isStory ? '22px' : '15px'};
    font-weight: 500;
    color: ${p.badgeColor};
    letter-spacing: 0.10em;
    text-transform: uppercase;
    border: 1.5px solid ${p.badgeBorder};
    padding: ${isStory ? '10px 22px' : '6px 14px'};
    border-radius: 3px;
    background: rgba(0,0,0,0.25);
  }
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-top: ${isStory ? '20px' : '12px'};
  }
  .subheadline {
    font-family: 'DM Mono', monospace;
    font-size: ${subFontSize};
    color: ${p.accent};
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: ${isStory ? '22px' : '12px'};
  }
  .headline {
    font-family: 'Cormorant Garamond', serif;
    font-size: ${headlineFontSize};
    font-weight: 700;
    line-height: 1.1;
    color: ${p.text};
    margin-bottom: ${isStory ? '36px' : '22px'};
    letter-spacing: -0.02em;
  }
  .stats-row {
    display: flex;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: ${isStory ? '36px' : '22px'};
  }
  .description {
    font-size: ${descFontSize};
    color: rgba(255,255,255,0.82);
    line-height: 1.6;
    margin-bottom: ${isStory ? '10px' : '6px'};
  }
  .bottom-sep {
    width: 100%;
    height: 1px;
    background: ${p.separatorColor};
    margin-top: auto;
    margin-bottom: ${isStory ? '32px' : '20px'};
  }
  .bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .cta-btn {
    background: ${p.accent};
    padding: ${isStory ? '16px 36px' : '10px 22px'};
    border-radius: 2px;
  }
  .cta-text {
    font-family: 'Inter', sans-serif;
    font-size: ${ctaFontSize};
    font-weight: 700;
    color: #070c12;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .watermark {
    font-family: 'DM Mono', monospace;
    font-size: ${isStory ? '20px' : '14px'};
    color: ${p.watermarkColor};
    letter-spacing: 0.10em;
  }
</style>
</head>
<body>
<div class="post">
  <div class="overlay"></div>
  <div class="left-bar"></div>
  <div class="content">

    <div class="top-bar">
      <div>${logoHtml}</div>
      <div class="badge">${badge}</div>
    </div>

    <div class="main">
      <div class="subheadline">${esc(subheadline)}</div>
      <h1 class="headline">${headlineHtml}</h1>

      <p class="description">${esc(description)}</p>

      ${bulletsHtml}

      <div class="stats-row">${statCells}</div>
    </div>

    <div class="bottom-sep"></div>
    <div class="bottom-bar">
      <div class="cta-btn">
        <span class="cta-text">${esc(cta)} →</span>
      </div>
      <span class="watermark">neurasolutions.cloud</span>
    </div>

  </div>
</div>
</body>
</html>`;
}

module.exports = { buildPostHTML };
