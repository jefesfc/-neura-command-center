const fs = require('fs');
const path = require('path');

let LOGO_B64 = '';
try {
  const logoPath = path.resolve(__dirname, '../../client/public/logo.png');
  LOGO_B64 = fs.readFileSync(logoPath).toString('base64');
} catch (e) {}

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
    overlay: 'linear-gradient(150deg, rgba(7,18,28,0.28) 0%, rgba(7,18,28,0.18) 50%, rgba(7,18,28,0.28) 100%)',
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
    separatorColor: 'rgba(31,162,184,0.22)',
    watermarkColor: 'rgba(255,255,255,0.25)',
    cornerColor: 'rgba(31,162,184,0.30)',
    counterColor: 'rgba(31,162,184,0.55)',
  },
  gold: {
    overlay: 'linear-gradient(150deg, rgba(12,8,2,0.28) 0%, rgba(12,8,2,0.18) 50%, rgba(12,8,2,0.28) 100%)',
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
    separatorColor: 'rgba(212,160,64,0.25)',
    watermarkColor: 'rgba(248,242,228,0.28)',
    cornerColor: 'rgba(212,160,64,0.32)',
    counterColor: 'rgba(212,160,64,0.55)',
  },
  grey: {
    overlay: 'linear-gradient(150deg, rgba(6,6,12,0.28) 0%, rgba(6,6,12,0.18) 50%, rgba(6,6,12,0.28) 100%)',
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
    separatorColor: 'rgba(143,168,190,0.22)',
    watermarkColor: 'rgba(240,244,248,0.26)',
    cornerColor: 'rgba(143,168,190,0.30)',
    counterColor: 'rgba(143,168,190,0.55)',
  },
};

const STOP_WORDS = new Set([
  'the','a','an','of','for','in','with','and','or','but','to','at','by',
  'from','as','is','it','its','on','this','that','are','was','were','be',
  'been','not','no','so','do','does','did','your','our','their','we','you',
]);

function applyAccent(text, accentWord, accentColor) {
  if (!text) return '';
  const w = (accentWord || '').trim();
  const esc = s => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  if (w && w.length > 2 && !STOP_WORDS.has(w.toLowerCase()) && text.includes(w)) {
    const i = text.indexOf(w);
    return esc(text.slice(0, i))
      + `<span style="color:${accentColor}">${esc(w)}</span>`
      + esc(text.slice(i + w.length));
  }
  return esc(text);
}

function sharedStyles(p, width, height, isStory, bgStyle) {
  return `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${width}px; height: ${height}px; overflow: hidden; }
  .slide {
    position: relative; width: ${width}px; height: ${height}px;
    ${bgStyle} font-family: 'Inter', sans-serif;
  }
  .overlay { position: absolute; inset: 0; background: ${p.overlay}; }
  .corner-tl {
    position: absolute; top: ${isStory ? '52px' : '38px'}; left: ${isStory ? '52px' : '38px'};
    width: ${isStory ? '44px' : '32px'}; height: ${isStory ? '44px' : '32px'};
    border-top: 2px solid ${p.cornerColor}; border-left: 2px solid ${p.cornerColor}; z-index: 5;
  }
  .corner-br {
    position: absolute; bottom: ${isStory ? '52px' : '38px'}; right: ${isStory ? '52px' : '38px'};
    width: ${isStory ? '44px' : '32px'}; height: ${isStory ? '44px' : '32px'};
    border-bottom: 2px solid ${p.cornerColor}; border-right: 2px solid ${p.cornerColor}; z-index: 5;
  }
  .logo-img { height: ${isStory ? '44px' : '34px'}; width: auto; object-fit: contain; }
  .logo-text {
    font-family: 'Cormorant Garamond', serif; font-size: ${isStory ? '42px' : '32px'};
    font-weight: 700; letter-spacing: 0.14em; color: #ffffff;
    text-shadow: 0 2px 12px rgba(0,0,0,0.85);
  }
  .badge {
    font-family: 'DM Mono', monospace; font-size: ${isStory ? '18px' : '13px'};
    font-weight: 500; color: ${p.badgeColor}; letter-spacing: 0.10em;
    text-transform: uppercase; border: 1.5px solid ${p.badgeBorder};
    padding: ${isStory ? '8px 20px' : '6px 14px'}; border-radius: 3px;
  }
  .sep { width: 100%; height: 1px; background: ${p.separatorColor}; }
  .watermark {
    font-family: 'DM Mono', monospace; font-size: ${isStory ? '17px' : '13px'};
    color: ${p.watermarkColor}; letter-spacing: 0.10em;
  }`;
}

function googleFontsLink() {
  return `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">`;
}

function logoHtml() {
  return LOGO_B64
    ? `<img src="data:image/png;base64,${LOGO_B64}" alt="Neura" class="logo-img" />`
    : `<span class="logo-text">NEURA</span>`;
}

// ─── SLIDE 1: COVER ──────────────────────────────────────────────────────────
function buildCoverSlide({ title, title_accent, subtitle, system, imageB64, format, palette, slideNum, totalSlides }) {
  const isStory = format === '9:16';
  const width = 1080, height = isStory ? 1920 : 1080;
  const p = PALETTES[palette] || PALETTES.navy;
  const badge = SYSTEM_BADGE[system] || 'Neura';
  const bgStyle = imageB64
    ? `background-image: url('data:image/jpeg;base64,${imageB64}'); background-size: cover; background-position: center;`
    : `background: ${p.fallbackBg};`;
  const titleSize = isStory ? '96px' : (title.length > 35 ? '72px' : '84px');
  const titleHtml = applyAccent(title, title_accent, p.accent);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
${googleFontsLink()}
<style>
${sharedStyles(p, width, height, isStory, bgStyle)}
.content {
  position: relative; z-index: 10; display: flex; flex-direction: column;
  height: 100%; padding: ${isStory ? '88px 80px' : '64px 72px'};
}
.top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: ${isStory ? '16px' : '12px'}; }
.main { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.accent-line { width: ${isStory ? '72px' : '56px'}; height: 4px; background: ${p.lineColor}; border-radius: 2px; margin-bottom: ${isStory ? '40px' : '28px'}; }
.title {
  font-family: 'Cormorant Garamond', serif; font-size: ${titleSize}; font-weight: 700;
  line-height: 1.05; color: ${p.text}; margin-bottom: ${isStory ? '40px' : '28px'}; letter-spacing: -0.02em;
  text-shadow: 0 3px 24px rgba(0,0,0,0.92), 0 1px 8px rgba(0,0,0,0.80);
}
.subtitle {
  font-family: 'Inter', sans-serif; font-size: ${isStory ? '32px' : '24px'};
  font-weight: 400; color: ${p.textMuted}; line-height: 1.5; max-width: 85%;
  text-shadow: 0 2px 12px rgba(0,0,0,0.85);
}
.bottom { display: flex; align-items: center; justify-content: space-between; padding-top: ${isStory ? '36px' : '24px'}; }
.swipe-hint {
  font-family: 'DM Mono', monospace; font-size: ${isStory ? '18px' : '14px'};
  color: ${p.counterColor}; letter-spacing: 0.10em; text-transform: uppercase;
}
.slide-counter {
  font-family: 'DM Mono', monospace; font-size: ${isStory ? '16px' : '12px'};
  color: ${p.watermarkColor}; letter-spacing: 0.08em;
}
</style></head><body>
<div class="slide">
  <div class="overlay"></div>
  <div class="corner-tl"></div><div class="corner-br"></div>
  <div class="content">
    <div class="top-bar"><div>${logoHtml()}</div><div class="badge">${badge}</div></div>
    <div class="sep"></div>
    <div class="main">
      <div class="accent-line"></div>
      <h1 class="title">${titleHtml}</h1>
      <p class="subtitle">${subtitle}</p>
    </div>
    <div class="sep"></div>
    <div class="bottom">
      <span class="swipe-hint">Swipe →</span>
      <span class="watermark">neurasolutions.cloud</span>
      <span class="slide-counter">${slideNum}/${totalSlides}</span>
    </div>
  </div>
</div>
</body></html>`;
}

// ─── SLIDES 2-4: CONTENT ─────────────────────────────────────────────────────
function buildContentSlide({ num, point_title, title_accent, point_body, system, imageB64, format, palette, slideNum, totalSlides }) {
  const isStory = format === '9:16';
  const width = 1080, height = isStory ? 1920 : 1080;
  const p = PALETTES[palette] || PALETTES.navy;
  const badge = SYSTEM_BADGE[system] || 'Neura';
  const bgStyle = imageB64
    ? `background-image: url('data:image/jpeg;base64,${imageB64}'); background-size: cover; background-position: center;`
    : `background: ${p.fallbackBg};`;
  const titleSize = isStory ? '72px' : (point_title.length > 35 ? '52px' : '60px');
  const titleHtml = applyAccent(point_title, title_accent, p.accent);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
${googleFontsLink()}
<style>
${sharedStyles(p, width, height, isStory, bgStyle)}
.content {
  position: relative; z-index: 10; display: flex; flex-direction: column;
  height: 100%; padding: ${isStory ? '88px 80px' : '64px 72px'};
}
.top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: ${isStory ? '16px' : '12px'}; }
.main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: ${isStory ? '40px' : '28px'}; }
.big-num {
  font-family: 'DM Mono', monospace; font-size: ${isStory ? '28px' : '22px'};
  font-weight: 500; color: ${p.numColor}; letter-spacing: 0.12em; opacity: 0.9;
}
.accent-line { width: ${isStory ? '72px' : '56px'}; height: 3px; background: ${p.lineColor}; border-radius: 2px; opacity: 0.7; }
.point-title {
  font-family: 'Cormorant Garamond', serif; font-size: ${titleSize}; font-weight: 700;
  line-height: 1.08; color: ${p.text}; letter-spacing: -0.015em;
  text-shadow: 0 3px 24px rgba(0,0,0,0.92), 0 1px 8px rgba(0,0,0,0.80);
}
.point-body {
  font-family: 'Inter', sans-serif; font-size: ${isStory ? '30px' : '22px'};
  font-weight: 400; color: ${p.textMuted}; line-height: 1.60; max-width: 92%;
  text-shadow: 0 2px 12px rgba(0,0,0,0.85);
}
.bottom { display: flex; align-items: center; justify-content: space-between; padding-top: ${isStory ? '36px' : '24px'}; }
.slide-counter {
  font-family: 'DM Mono', monospace; font-size: ${isStory ? '16px' : '12px'};
  color: ${p.watermarkColor}; letter-spacing: 0.08em;
}
</style></head><body>
<div class="slide">
  <div class="overlay"></div>
  <div class="corner-tl"></div><div class="corner-br"></div>
  <div class="content">
    <div class="top-bar"><div>${logoHtml()}</div><div class="badge">${badge}</div></div>
    <div class="sep"></div>
    <div class="main">
      <span class="big-num">${num}</span>
      <div class="accent-line"></div>
      <h2 class="point-title">${titleHtml}</h2>
      <p class="point-body">${point_body}</p>
    </div>
    <div class="sep"></div>
    <div class="bottom">
      <span class="watermark">neurasolutions.cloud</span>
      <span class="slide-counter">${slideNum}/${totalSlides}</span>
    </div>
  </div>
</div>
</body></html>`;
}

// ─── SLIDE 5: CTA ─────────────────────────────────────────────────────────────
function buildCtaSlide({ cta_headline, title_accent, cta_sub, cta_action, system, imageB64, format, palette, slideNum, totalSlides }) {
  const isStory = format === '9:16';
  const width = 1080, height = isStory ? 1920 : 1080;
  const p = PALETTES[palette] || PALETTES.navy;
  const badge = SYSTEM_BADGE[system] || 'Neura';
  const bgStyle = imageB64
    ? `background-image: url('data:image/jpeg;base64,${imageB64}'); background-size: cover; background-position: center;`
    : `background: ${p.fallbackBg};`;
  const headlineSize = isStory ? '88px' : (cta_headline.length > 35 ? '62px' : '72px');
  const headlineHtml = applyAccent(cta_headline, title_accent, p.accent);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
${googleFontsLink()}
<style>
${sharedStyles(p, width, height, isStory, bgStyle)}
.content {
  position: relative; z-index: 10; display: flex; flex-direction: column;
  height: 100%; padding: ${isStory ? '88px 80px' : '64px 72px'};
}
.top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: ${isStory ? '16px' : '12px'}; }
.main {
  flex: 1; display: flex; flex-direction: column; justify-content: center;
  align-items: flex-start; gap: ${isStory ? '44px' : '28px'};
}
.accent-line { width: ${isStory ? '72px' : '56px'}; height: 4px; background: ${p.lineColor}; border-radius: 2px; }
.cta-headline {
  font-family: 'Cormorant Garamond', serif; font-size: ${headlineSize}; font-weight: 700;
  line-height: 1.05; color: ${p.text}; letter-spacing: -0.02em;
  text-shadow: 0 3px 24px rgba(0,0,0,0.92), 0 1px 8px rgba(0,0,0,0.80);
}
.cta-sub {
  font-family: 'Inter', sans-serif; font-size: ${isStory ? '30px' : '22px'};
  font-weight: 400; color: ${p.textMuted}; line-height: 1.5; max-width: 88%;
  text-shadow: 0 2px 12px rgba(0,0,0,0.85);
}
.cta-box {
  display: flex; align-items: center; gap: ${isStory ? '24px' : '16px'};
  border: 1.5px solid ${p.badgeBorder}; padding: ${isStory ? '20px 40px' : '14px 28px'};
  border-radius: 4px;
}
.cta-action {
  font-family: 'Inter', sans-serif; font-size: ${isStory ? '32px' : '24px'};
  font-weight: 600; color: ${p.ctaColor}; letter-spacing: 0.02em;
}
.cta-arrow { font-size: ${isStory ? '32px' : '24px'}; color: ${p.accent2}; font-weight: 300; }
.bottom { display: flex; align-items: center; justify-content: space-between; padding-top: ${isStory ? '36px' : '24px'}; }
.slide-counter {
  font-family: 'DM Mono', monospace; font-size: ${isStory ? '16px' : '12px'};
  color: ${p.watermarkColor}; letter-spacing: 0.08em;
}
</style></head><body>
<div class="slide">
  <div class="overlay"></div>
  <div class="corner-tl"></div><div class="corner-br"></div>
  <div class="content">
    <div class="top-bar"><div>${logoHtml()}</div><div class="badge">${badge}</div></div>
    <div class="sep"></div>
    <div class="main">
      <div class="accent-line"></div>
      <h2 class="cta-headline">${headlineHtml}</h2>
      <p class="cta-sub">${cta_sub}</p>
      <div class="cta-box">
        <span class="cta-action">${cta_action}</span>
        <span class="cta-arrow">→</span>
      </div>
    </div>
    <div class="sep"></div>
    <div class="bottom">
      <span class="watermark">neurasolutions.cloud</span>
      <span class="slide-counter">${slideNum}/${totalSlides}</span>
    </div>
  </div>
</div>
</body></html>`;
}

function buildCarouselSlides({ slides, system, imageB64, format, palette }) {
  const total = slides.length;
  return slides.map((slide, i) => {
    const ctx = { ...slide, system, imageB64, format, palette, slideNum: i + 1, totalSlides: total };
    if (slide.type === 'cover') return { ...slide, index: i, html: buildCoverSlide(ctx) };
    if (slide.type === 'content') return { ...slide, index: i, html: buildContentSlide(ctx) };
    if (slide.type === 'cta') return { ...slide, index: i, html: buildCtaSlide(ctx) };
    return { ...slide, index: i, html: '' };
  });
}

module.exports = { buildCarouselSlides };
