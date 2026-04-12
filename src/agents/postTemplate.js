const fs = require('fs');
const path = require('path');

let LOGO_B64 = '';
try {
  const logoPath = path.resolve(__dirname, '../../client/public/logo.png');
  LOGO_B64 = fs.readFileSync(logoPath).toString('base64');
} catch (e) {
  // fallback to text logo if file not found
}

const SYSTEM_BADGE = {
  'sistema-01': 'Sistema 01',
  'sistema-02': 'Sistema 02',
  'sistema-03': 'Sistema 03',
};

function buildPostHTML({ headline, bullets, cta, system, imageB64, format = '1:1' }) {
  const isStory = format === '9:16';
  const width = 1080;
  const height = isStory ? 1920 : 1080;
  const badge = SYSTEM_BADGE[system] || 'Neura';

  const bgStyle = imageB64
    ? `background-image: url('data:image/png;base64,${imageB64}'); background-size: cover; background-position: center;`
    : `background: #0b1e2d;`;

  const bulletItems = (bullets || [])
    .map(b => `<li>${b}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
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
    background: linear-gradient(
      160deg,
      rgba(11, 30, 45, 0.88) 0%,
      rgba(11, 30, 45, 0.72) 40%,
      rgba(11, 30, 45, 0.82) 100%
    );
  }

  .content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: ${isStory ? '80px 72px' : '64px 72px'};
  }

  /* TOP BAR */
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${isStory ? '120px' : '60px'};
  }

  .logo img {
    height: ${isStory ? '52px' : '40px'};
    width: auto;
    object-fit: contain;
  }

  .badge {
    font-family: 'DM Mono', monospace;
    font-size: ${isStory ? '22px' : '18px'};
    font-weight: 500;
    color: #c98a5a;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border: 1.5px solid rgba(201, 138, 90, 0.5);
    padding: ${isStory ? '10px 24px' : '8px 18px'};
    border-radius: 4px;
  }

  /* MAIN CONTENT */
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .teal-line {
    width: 60px;
    height: 3px;
    background: #1fa2b8;
    margin-bottom: ${isStory ? '40px' : '28px'};
  }

  .headline {
    font-family: 'Cormorant Garamond', serif;
    font-size: ${isStory ? '86px' : '72px'};
    font-weight: 700;
    line-height: 1.1;
    color: #ffffff;
    margin-bottom: ${isStory ? '60px' : '40px'};
    letter-spacing: -0.01em;
  }

  .bullets {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: ${isStory ? '28px' : '20px'};
  }

  .bullets li {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    font-family: 'Inter', sans-serif;
    font-size: ${isStory ? '34px' : '28px'};
    font-weight: 400;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.4;
  }

  .bullets li::before {
    content: '';
    display: block;
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #1fa2b8;
    margin-top: ${isStory ? '13px' : '10px'};
  }

  /* BOTTOM */
  .bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: ${isStory ? '80px' : '48px'};
    padding-top: ${isStory ? '40px' : '28px'};
    border-top: 1px solid rgba(31, 162, 184, 0.3);
  }

  .cta {
    font-family: 'Inter', sans-serif;
    font-size: ${isStory ? '32px' : '26px'};
    font-weight: 600;
    color: #1fa2b8;
    letter-spacing: 0.02em;
  }

  .cta-arrow {
    font-size: ${isStory ? '32px' : '26px'};
    color: #c98a5a;
    font-weight: 300;
  }

  .watermark {
    font-family: 'DM Mono', monospace;
    font-size: ${isStory ? '20px' : '16px'};
    color: rgba(255,255,255,0.3);
    letter-spacing: 0.1em;
  }
</style>
</head>
<body>
<div class="post">
  <div class="overlay"></div>
  <div class="content">
    <div class="top-bar">
      <div class="logo">${LOGO_B64 ? `<img src="data:image/png;base64,${LOGO_B64}" alt="Neura" />` : '<span style="font-family:\'Cormorant Garamond\',serif;font-size:38px;font-weight:700;letter-spacing:0.12em;color:#fff">NEURA</span>'}</div>
      <div class="badge">${badge}</div>
    </div>

    <div class="main">
      <div class="teal-line"></div>
      <h1 class="headline">${headline}</h1>
      <ul class="bullets">${bulletItems}</ul>
    </div>

    <div class="bottom-bar">
      <span class="cta">${cta}</span>
      <span class="cta-arrow">→</span>
      <span class="watermark">neurasolutions.cloud</span>
    </div>
  </div>
</div>
</body>
</html>`;
}

module.exports = { buildPostHTML };
