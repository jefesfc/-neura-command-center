const fs   = require('fs');
const path = require('path');

let LOGO_B64 = '';
try {
  LOGO_B64 = fs.readFileSync(path.resolve(__dirname, '../../client/public/logo.png')).toString('base64');
} catch (e) {}

// ── System badge labels ───────────────────────────────────────────────────────
const SYSTEM_BADGE = {
  'system-lead-engine':   'Lead Engine',
  'system-ai-conversion': 'AI Conversion',
  'system-ai-os':         'AI Operating System',
  'neura':                'Neura',
  'ai-agents':            'AI Agents',
  'crm':                  'AI CRM',
  'rag':                  'RAG',
  'ai':                   'AI Systems',
  // legacy keys
  'sistema-01': 'Lead Engine',
  'sistema-02': 'AI Conversion',
  'sistema-03': 'AI Operating System',
};

// ── Brand palettes ────────────────────────────────────────────────────────────
const PALETTES = {
  navy: {
    accent:         '#1fa2b8',
    accent2:        '#c9a84c',
    text:           '#ffffff',
    textBody:       'rgba(255,255,255,0.80)',
    textMuted:      'rgba(255,255,255,0.40)',
    badgeColor:     '#c9a84c',
    watermarkColor: 'rgba(255,255,255,0.13)',
    fallbackBg:     '#04101c',
    glowColor:      'rgba(201,168,76,0.10)',
  },
  gold: {
    accent:         '#d4a040',
    accent2:        '#f0d080',
    text:           '#f8f2e4',
    textBody:       'rgba(248,242,228,0.80)',
    textMuted:      'rgba(248,242,228,0.40)',
    badgeColor:     '#d4a040',
    watermarkColor: 'rgba(248,242,228,0.13)',
    fallbackBg:     '#130e04',
    glowColor:      'rgba(212,160,64,0.10)',
  },
  grey: {
    accent:         '#8fa8be',
    accent2:        '#1fa2b8',
    text:           '#f0f4f8',
    textBody:       'rgba(240,244,248,0.80)',
    textMuted:      'rgba(240,244,248,0.40)',
    badgeColor:     '#8fa8be',
    watermarkColor: 'rgba(240,244,248,0.13)',
    fallbackBg:     '#08080e',
    glowColor:      'rgba(143,168,190,0.10)',
  },
};

// ── Google Fonts ──────────────────────────────────────────────────────────────
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">`;

// ── Utility functions ─────────────────────────────────────────────────────────

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeCta(cta) {
  return (cta || '').replace(/\s*→+\s*$/, '').trim();
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `${r},${g},${b}`;
}

const STOP_WORDS = new Set([
  'the','a','an','of','for','in','with','and','or','but','to','at','by',
  'from','as','is','it','its','on','this','that','are','was','were','be',
  'been','not','no','so','do','does','did','your','our','their','we','you',
]);

// Deterministic PRNG seeded from post content — guarantees a unique but
// reproducible SVG for every distinct headline+system combination.
function mkRng(seed) {
  let h = 2166136261;
  for (let i = 0; i < (seed || '').length; i++) {
    h = (Math.imul(h ^ seed.charCodeAt(i), 16777619)) >>> 0;
  }
  if (h === 0) h = 1;
  return function () {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    h >>>= 0;
    return h / 4294967296;
  };
}

function applyAccent(headline, accent_word, accentColor) {
  if (!headline) return '';
  const w = (accent_word || '').trim();
  if (w && w.length > 2 && !STOP_WORDS.has(w.toLowerCase()) && headline.includes(w)) {
    const i = headline.indexOf(w);
    // Triple glow on the accent word
    const glow = `0 0 40px rgba(${hexToRgb(accentColor)},0.70),0 0 80px rgba(${hexToRgb(accentColor)},0.35),0 0 120px rgba(${hexToRgb(accentColor)},0.18)`;
    return esc(headline.slice(0, i))
      + `<span style="color:${accentColor};text-shadow:${glow}">${esc(w)}</span>`
      + esc(headline.slice(i + w.length));
  }
  return esc(headline);
}

// ── Shared element builders ───────────────────────────────────────────────────

function logoEl(format) {
  const h   = format === '9:16' ? '55px' : format === '1.91:1' ? '30px' : '41px';
  const fSz = format === '9:16' ? '46px' : format === '1.91:1' ? '24px' : '34px';
  return LOGO_B64
    ? `<img src="data:image/png;base64,${LOGO_B64}" alt="Neura" style="height:${h};width:auto;object-fit:contain;display:block;">`
    : `<span style="font-family:'Cormorant Garamond',serif;font-size:${fSz};font-weight:700;letter-spacing:0.14em;color:#fff;">NEURA</span>`;
}

// Single-line badge — system name only, no platform label
// compact=true for Instagram (smaller text + padding)
function badgeEl(system, p, format, compact = false) {
  const isStory = format === '9:16';
  const pad  = compact ? '5px 12px' : isStory ? '10px 20px' : '12px 26px';
  const sz   = compact ? '9px'      : isStory ? '14px'      : '15px';
  const lsp  = compact ? '0.18em'   : '0.24em';
  return `<div style="display:inline-flex;align-items:center;border:1px solid ${p.badgeColor}5c;background:${p.badgeColor}14;padding:${pad};border-radius:2px;">
    <span style="font-family:'DM Mono',monospace;font-size:${sz};font-weight:500;color:${p.badgeColor};letter-spacing:${lsp};text-transform:uppercase;line-height:1;white-space:nowrap;">${esc(SYSTEM_BADGE[system] || system || 'AI Systems')}</span>
  </div>`;
}

// Four L-shaped corner brackets
function bracketsEl(p, isStory) {
  const sz  = isStory ? '26px' : '17px';
  const off = isStory ? '36px' : '24px';
  const col = `${p.badgeColor}cc`;
  const b   = `1.5px solid ${col}`;
  return `
  <div style="position:absolute;top:${off};left:${off};width:${sz};height:${sz};border-top:${b};border-left:${b};z-index:15;"></div>
  <div style="position:absolute;top:${off};right:${off};width:${sz};height:${sz};border-top:${b};border-right:${b};z-index:15;"></div>
  <div style="position:absolute;bottom:${off};left:${off};width:${sz};height:${sz};border-bottom:${b};border-left:${b};z-index:15;"></div>
  <div style="position:absolute;bottom:${off};right:${off};width:${sz};height:${sz};border-bottom:${b};border-right:${b};z-index:15;"></div>`;
}

function watermarkEl(p, isStory) {
  return `<div style="position:absolute;bottom:${isStory?'28px':'16px'};left:50%;transform:translateX(-50%);font-family:'DM Mono',monospace;font-size:${isStory?'11px':'7px'};color:${p.watermarkColor};letter-spacing:0.14em;z-index:20;white-space:nowrap;">neurasolutions.cloud</div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// SVG BACKGROUND — chart + network nodes, palette-aware
//
// chartUp: pixels to shift chart upward from base IG position
//   0  → Instagram (chart rect y=170, bars start ~y=345)
//   80 → Facebook  (chart rect y=90,  bars start ~y=265)
//
// seed: headline + system string — drives unique bar heights, node positions,
//       glow placement. Same seed always produces the same design.
// ═════════════════════════════════════════════════════════════════════════════
function buildSvgBg(p, chartUp = 0, seed = '') {
  const rng = mkRng(seed);
  const a  = (o) => `rgba(${hexToRgb(p.accent)},${o})`;
  const a2 = (o) => `rgba(${hexToRgb(p.accent2)},${o})`;
  const u  = (y) => y - chartUp;

  // ── Bar heights — rising trend + per-post noise ───────────────────────────
  const baseTrend    = [95, 112, 100, 130, 115, 152, 135, 175, 195];
  const CHART_BOTTOM = 465;
  const barH = baseTrend.map(b => Math.max(55, Math.min(268, Math.round(b * (0.78 + rng() * 0.44)))));
  const bY   = barH.map(h => u(CHART_BOTTOM - h));
  const tY   = bY.map((y, i) => y + Math.round(barH[i] * 0.05 + 2));

  // ── Glow ellipse positions ────────────────────────────────────────────────
  const g1x = Math.round(48 + rng() * 30);  const g1y = Math.round(12 + rng() * 28);
  const g2x = Math.round(68 + rng() * 24);  const g2y = Math.round(62 + rng() * 22);
  const g3x = Math.round(6  + rng() * 22);  const g3y = Math.round(8  + rng() * 18);

  // ── Network node positions (upper-right quadrant, ±45px variance) ─────────
  const nodeBase = [
    [635, 72], [798, 194], [896, 132], [726, 318], [866, 374],
    [708, 154], [878, 474], [976, 514], [1018, 294],
  ];
  const nodes = nodeBase.map(([bx, by]) => ({
    x: Math.round(Math.max(20, Math.min(1060, bx + (rng() - 0.5) * 90))),
    y: Math.round(Math.max(20, Math.min(560,  by + (rng() - 0.5) * 64))),
  }));

  // ── Bar fill opacities ────────────────────────────────────────────────────
  const barFill = Array.from({ length: 9 }, (_, i) => {
    const v = (0.28 + rng() * 0.30).toFixed(2);
    return i % 2 === 0 ? a(v) : a2(v);
  });

  // ── Scattered lower nodes (inside chart area) ─────────────────────────────
  const sn = Array.from({ length: 4 }, () => ({
    x: Math.round(150 + rng() * 430),
    y: u(Math.round(360 + rng() * 88)),
  }));

  const BARS_X  = [80, 190, 300, 410, 520, 630, 740, 850, 960];
  const TREND_X = [104, 214, 324, 434, 544, 654, 764, 874, 984];
  const nodeR   = [4, 6, 3, 5, 4, 3, 3, 2, 4];
  const nodeOp  = [0.70, 0.65, 0.55, 0.60, 0.55, 0.50, 0.40, 0.35, 0.50];

  const trendPts = TREND_X.map((x, i) => `${x},${tY[i]}`).join(' ');

  return `
  <div style="position:absolute;inset:0;z-index:1;
    background:
      radial-gradient(ellipse at ${g1x}% ${g1y}%,${a('0.13')} 0%,transparent 42%),
      radial-gradient(ellipse at ${g2x}% ${g2y}%,${a2('0.08')} 0%,transparent 35%),
      radial-gradient(ellipse at ${g3x}% ${g3y}%,${a('0.06')} 0%,transparent 30%),
      linear-gradient(160deg,#071828 0%,#0c2644 30%,#071420 60%,#030a12 100%);">
  </div>
  <svg style="position:absolute;inset:0;z-index:2;width:100%;height:100%;" viewBox="0 0 1080 1080" preserveAspectRatio="xMidYMid slice">
    <line x1="${nodes[0].x}" y1="${nodes[0].y}" x2="${nodes[1].x}" y2="${nodes[1].y}" stroke="${a('0.12')}" stroke-width="1"/>
    <line x1="${nodes[1].x}" y1="${nodes[1].y}" x2="${nodes[2].x}" y2="${nodes[2].y}" stroke="${a('0.10')}" stroke-width="1"/>
    <line x1="${nodes[1].x}" y1="${nodes[1].y}" x2="${nodes[3].x}" y2="${nodes[3].y}" stroke="${a('0.08')}" stroke-width="1"/>
    <line x1="${nodes[3].x}" y1="${nodes[3].y}" x2="${nodes[4].x}" y2="${nodes[4].y}" stroke="${a2('0.08')}" stroke-width="1"/>
    <line x1="${nodes[4].x}" y1="${nodes[4].y}" x2="${nodes[8].x}" y2="${nodes[8].y}" stroke="${a('0.07')}" stroke-width="1"/>
    <line x1="${nodes[0].x}" y1="${nodes[0].y}" x2="${nodes[5].x}" y2="${nodes[5].y}" stroke="${a('0.09')}" stroke-width="1"/>
    <line x1="${nodes[5].x}" y1="${nodes[5].y}" x2="${nodes[1].x}" y2="${nodes[1].y}" stroke="${a('0.09')}" stroke-width="1"/>
    <line x1="${nodes[4].x}" y1="${nodes[4].y}" x2="${nodes[6].x}" y2="${nodes[6].y}" stroke="${a('0.07')}" stroke-width="1"/>
    <line x1="${nodes[6].x}" y1="${nodes[6].y}" x2="${nodes[7].x}" y2="${nodes[7].y}" stroke="${a('0.06')}" stroke-width="1"/>
    <line x1="${nodes[8].x}" y1="${nodes[8].y}" x2="${nodes[2].x}" y2="${nodes[2].y}" stroke="${a2('0.07')}" stroke-width="1"/>
    <rect x="0" y="${u(170)}" width="1080" height="295" fill="${a('0.018')}"/>
    ${BARS_X.map((x, i) => `<rect x="${x}" y="${bY[i]}" width="48" height="${barH[i]}" rx="3" fill="${barFill[i]}"/>`).join('\n    ')}
    <polyline points="${trendPts}" fill="none" stroke="${a2('0.20')}" stroke-width="9"/>
    <polyline points="${trendPts}" fill="none" stroke="${a2('0.88')}" stroke-width="2.5" stroke-dasharray="6 3"/>
    <circle cx="${nodes[1].x}" cy="${nodes[1].y}" r="14" fill="${a('0.12')}"/>
    <circle cx="${nodes[1].x}" cy="${nodes[1].y}" r="22" fill="${a('0.06')}"/>
    ${nodes.map((n, i) => `<circle cx="${n.x}" cy="${n.y}" r="${nodeR[i]}" fill="${i % 2 === 0 ? a(nodeOp[i].toFixed(2)) : a2(nodeOp[i].toFixed(2))}"/>`).join('\n    ')}
    ${sn.map((n, i) => `<circle cx="${n.x}" cy="${n.y}" r="${i < 2 ? 3 : 2}" fill="${i % 2 === 0 ? a('0.22') : a2('0.18')}"/>`).join('\n    ')}
    <line x1="${sn[0].x}" y1="${sn[0].y}" x2="${sn[1].x}" y2="${sn[1].y}" stroke="${a('0.07')}" stroke-width="1"/>
    <line x1="${sn[1].x}" y1="${sn[1].y}" x2="${sn[2].x}" y2="${sn[2].y}" stroke="${a('0.06')}" stroke-width="1"/>
    <line x1="${sn[2].x}" y1="${sn[2].y}" x2="${sn[3].x}" y2="${sn[3].y}" stroke="${a2('0.06')}" stroke-width="1"/>
  </svg>
  <div style="position:absolute;inset:0;z-index:3;opacity:0.028;
    background-image:linear-gradient(rgba(${hexToRgb(p.accent)},1) 1px,transparent 1px),linear-gradient(90deg,rgba(${hexToRgb(p.accent)},1) 1px,transparent 1px);
    background-size:90px 90px;">
  </div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// INSTAGRAM — One image. One headline. One action.
//
// Layer stack (bottom → top):
//   1. Background image or SVG (full bleed)
//   2. Grid (SVG mode only)
//   3. Cinematic gradient (transparent top → near-black bottom)
//   4. Edge vignette (radial, draws focus inward)
//   5. Gold glow top-right
//   6. Hairline at 49% (stages image zone vs text zone)
//   7. Corner brackets
//   8. Content (flex column: top bar | 440px spacer | accent line | hook | H1 | CTA)
//   9. Watermark
// ═════════════════════════════════════════════════════════════════════════════
function buildInstagramHTML({ headline, headline_accent, subheadline, cta, system, imageB64, format, palette, imageTone = 'dark', designStyle = 'hero-image', seed = '' }) {
  const isStory = format === '9:16';
  const W = 1080, H = isStory ? 1920 : 1080;
  const p = PALETTES[palette] || PALETTES.navy;
  const isSvg = designStyle === 'data-visual' || !imageB64;

  const bgStyle = (!isSvg && imageB64)
    ? `background-image:url('data:image/jpeg;base64,${imageB64}');background-size:cover;background-position:center top;`
    : `background:${p.fallbackBg};`;

  const headlineHtml = applyAccent(headline, headline_accent, p.badgeColor);

  const chars = (headline || '').length;
  const h1Size = isStory
    ? (chars <= 22 ? '140px' : chars <= 36 ? '116px' : '90px')
    : (chars <= 22 ? '110px' : chars <= 36 ? '88px'  : '68px');

  const hook   = subheadline ? subheadline.toUpperCase() : '';
  const hookSz = isStory ? '20px' : '13px';

  // Cinematic gradient — image stays bright at top, darkens for text zone
  const igMid = imageTone === 'light' ? '0.52' : '0.52';
  const igBot = imageTone === 'light' ? '0.95' : '0.97';

  // Spacer: reserves image zone above the editorial block
  const spacerH = isStory ? '820px' : '440px';

  const pad = isStory
    ? { top: '70px', side: '80px', bot: '76px' }
    : { top: '52px', side: '64px', bot: '62px' };

  const clean = sanitizeCta(cta);
  const ctaPad = isStory ? '16px 44px' : '10px 28px';
  const ctaSz  = isStory ? '18px' : '11px';
  const ctaGap = isStory ? '16px' : '10px';

  return `<!DOCTYPE html><html>
<head>
<meta charset="UTF-8">
${FONTS}
<style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:${W}px;height:${H}px;overflow:hidden;}</style>
</head>
<body>
<div style="position:relative;width:${W}px;height:${H}px;${bgStyle}font-family:'Inter',sans-serif;">

  ${isSvg ? buildSvgBg(p, 0, seed) : ''}

  <!-- L3: Cinematic gradient — transparent top, dark bottom -->
  <div style="position:absolute;inset:0;z-index:4;
    background:linear-gradient(to bottom,
      rgba(4,16,28,0.10) 0%,
      rgba(0,0,0,0.06) 18%,
      rgba(4,16,28,${igMid}) 40%,
      rgba(4,16,28,0.82) 58%,
      rgba(4,16,28,${igBot}) 100%
    );"></div>

  <!-- L4: Edge vignette — draws focus toward center -->
  <div style="position:absolute;inset:0;z-index:5;
    background:radial-gradient(ellipse at 50% 40%,transparent 35%,rgba(0,0,0,0.42) 100%);"></div>

  <!-- L5: Gold glow top-right -->
  <div style="position:absolute;inset:0;z-index:6;
    background:radial-gradient(ellipse at 88% 8%,${p.glowColor} 0%,transparent 40%);"></div>

  <!-- L6: Hairline at 49% — stages image zone vs text zone -->
  <div style="position:absolute;top:49%;left:0;right:0;height:1px;z-index:7;
    background:linear-gradient(90deg,transparent 0%,${p.badgeColor}8c 15%,${p.badgeColor}8c 85%,transparent 100%);"></div>

  <!-- L7: Corner brackets -->
  ${bracketsEl(p, isStory)}

  <!-- L8: Content -->
  <div style="position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;padding:${pad.top} ${pad.side} ${pad.bot};">

    <!-- Top bar -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      ${logoEl(format)}
      ${badgeEl(system, p, format, true)}
    </div>

    <!-- Image zone spacer -->
    <div style="height:${spacerH};flex-shrink:0;"></div>

    <!-- Accent line -->
    <div style="width:${isStory?'48px':'32px'};height:1px;background:linear-gradient(90deg,${p.badgeColor} 0%,transparent 100%);margin-bottom:${isStory?'28px':'20px'};"></div>

    ${hook ? `<div style="font-family:'DM Mono',monospace;font-size:${hookSz};color:${p.badgeColor};letter-spacing:0.08em;text-transform:uppercase;margin-bottom:${isStory?'34px':'28px'};text-shadow:0 1px 8px rgba(0,0,0,0.90);">${esc(hook)}</div>` : ''}

    <h1 style="font-family:'Cormorant Garamond',serif;font-size:${h1Size};font-weight:700;line-height:0.94;color:${p.text};letter-spacing:-0.022em;text-shadow:0 8px 56px rgba(0,0,0,0.95),0 1px 8px rgba(0,0,0,0.70);margin-bottom:${isStory?'64px':'58px'};">${headlineHtml}</h1>

    <div style="display:inline-flex;align-items:center;gap:${ctaGap};border:1px solid ${p.badgeColor};padding:${ctaPad};border-radius:2px;background:rgba(0,0,0,0.22);width:fit-content;">
      <span style="font-family:'Inter',sans-serif;font-size:${ctaSz};font-weight:500;color:${p.text};letter-spacing:0.16em;text-transform:uppercase;line-height:1;white-space:nowrap;">${esc(clean)}</span>
      <span style="color:${p.badgeColor};font-size:${ctaSz};line-height:1;">→</span>
    </div>

  </div>

  ${watermarkEl(p, isStory)}

</div>
</body></html>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// FACEBOOK — Hook → Social proof → H1 → Body → Bullets → Action. Editorial authority.
//
// Layer stack (bottom → top):
//   1. Background image or SVG (full bleed, higher chart — chartUp=80)
//   2. Grid (SVG mode only)
//   3. Cinematic overlay (heavier at bottom)
//   4. Left accent bar (5px, gold → fade)
//   5. Gold glow top-right (88% 8%)
//   6. Content (flex column: top bar push → editorial block at bottom)
//   7. Watermark
// ═════════════════════════════════════════════════════════════════════════════
function buildFacebookHTML({ headline, headline_accent, subheadline, description, bullets, cta, system, imageB64, format, palette, imageTone = 'dark', designStyle = 'editorial', seed = '' }) {
  const isStory    = format === '9:16';
  const isLandscape = format === '1.91:1';
  const W = isLandscape ? 1200 : 1080;
  const H = isStory ? 1920 : isLandscape ? 628 : 1080;
  const p = PALETTES[palette] || PALETTES.navy;
  const isSvg = designStyle === 'data-visual' || !imageB64;

  const bgStyle = (!isSvg && imageB64)
    ? `background-image:url('data:image/jpeg;base64,${imageB64}');background-size:cover;background-position:center;`
    : `background:${p.fallbackBg};`;

  const headlineHtml = applyAccent(headline, headline_accent, p.badgeColor);

  const chars = (headline || '').length;
  const h1Size = isStory
    ? (chars <= 24 ? '112px' : chars <= 36 ? '94px'  : '76px')
    : isLandscape
    ? (chars <= 28 ? '72px'  : chars <= 40 ? '58px'  : '46px')
    : (chars <= 24 ? '118px' : chars <= 36 ? '96px'  : chars <= 48 ? '78px' : '62px');

  const hookSz  = isStory ? '17px' : isLandscape ? '9px'  : '14px';
  const descSz  = isStory ? '28px' : isLandscape ? '13px' : '26px';
  const bulletSz = isStory ? '26px' : isLandscape ? '13px' : '22px';
  const dotSz   = isStory ? '7px'  : isLandscape ? '4px'  : '7px';

  // Padding — left clears the 5px bar
  const padTop  = isStory ? '66px'  : isLandscape ? '36px' : '58px';
  const padRight = isStory ? '86px' : isLandscape ? '56px' : '70px';
  const padBot  = isStory ? '74px'  : isLandscape ? '36px' : '68px';
  const padLeft = isStory ? '100px' : isLandscape ? '66px' : '84px';

  // Max 2 bullets for 1:1/story, 2 for landscape too
  const bulletsHtml = Array.isArray(bullets) && bullets.length > 0
    ? bullets.slice(0, 2).map(b => {
        const gap = isStory ? '18px' : '18px';
        const mb  = isStory ? '14px' : '13px';
        return `<div style="display:flex;align-items:center;gap:${gap};margin-bottom:${mb};">
          <div style="width:${dotSz};height:${dotSz};border-radius:50%;background:${p.accent};flex-shrink:0;box-shadow:0 0 8px rgba(${hexToRgb(p.accent)},0.65);"></div>
          <span style="font-family:'Inter',sans-serif;font-size:${bulletSz};color:rgba(255,255,255,0.76);line-height:1.55;font-weight:300;">${esc(b)}</span>
        </div>`;
      }).join('')
    : '';

  // Social proof "200+" — hardcoded Neura brand constant
  const socialProofHtml = !isLandscape ? `
    <div style="display:inline-flex;align-items:center;gap:20px;margin-bottom:${isStory?'30px':'26px'};width:fit-content;border-left:2px solid ${p.badgeColor};padding-left:20px;">
      <span style="font-family:'Cormorant Garamond',serif;font-weight:700;font-size:${isStory?'88px':'72px'};color:${p.badgeColor};line-height:1;text-shadow:0 0 32px rgba(${hexToRgb(p.badgeColor)},0.55);">200+</span>
      <div style="display:flex;flex-direction:column;gap:3px;">
        <span style="font-family:'DM Mono',monospace;font-size:13px;color:rgba(255,255,255,0.65);letter-spacing:0.12em;text-transform:uppercase;line-height:1.3;">businesses</span>
        <span style="font-family:'DM Mono',monospace;font-size:13px;color:rgba(255,255,255,0.65);letter-spacing:0.12em;text-transform:uppercase;line-height:1.3;">trust Neura</span>
      </div>
    </div>` : '';

  const clean = sanitizeCta(cta);
  const ctaPad = isStory ? '20px 52px' : isLandscape ? '10px 28px' : '20px 52px';
  const ctaSz  = isStory ? '16px'      : isLandscape ? '11px'      : '15px';
  const ctaGap = isStory ? '18px'      : isLandscape ? '10px'      : '18px';

  return `<!DOCTYPE html><html>
<head>
<meta charset="UTF-8">
${FONTS}
<style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:${W}px;height:${H}px;overflow:hidden;}</style>
</head>
<body>
<div style="position:relative;width:${W}px;height:${H}px;${bgStyle}font-family:'Inter',sans-serif;">

  ${isSvg ? buildSvgBg(p, 80, seed) : ''}

  <!-- L3: Cinematic overlay — heavier at bottom where text lives -->
  <div style="position:absolute;inset:0;z-index:4;
    background:linear-gradient(to bottom,
      rgba(4,16,28,0.30) 0%,
      rgba(4,16,28,0.20) 18%,
      rgba(4,16,28,${imageTone === 'light' ? '0.60' : '0.55'}) 42%,
      rgba(4,16,28,${imageTone === 'light' ? '0.92' : '0.88'}) 60%,
      rgba(4,16,28,0.98) 100%
    );"></div>

  <!-- L4: Left accent bar — 5px gold authority anchor -->
  <div style="position:absolute;top:0;left:0;width:5px;height:100%;z-index:5;
    background:linear-gradient(180deg,${p.badgeColor} 0%,rgba(${hexToRgb(p.badgeColor)},0.38) 55%,transparent 100%);"></div>

  <!-- L5: Gold glow top-right -->
  <div style="position:absolute;inset:0;z-index:6;
    background:radial-gradient(ellipse at 88% 8%,${p.glowColor} 0%,transparent 40%);"></div>

  <!-- L6: Content — flex column, editorial block anchored to bottom -->
  <div style="position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;padding:${padTop} ${padRight} ${padBot} ${padLeft};">

    <!-- Top bar -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:auto;">
      ${logoEl(format)}
      ${badgeEl(system, p, format, false)}
    </div>

    <!-- Editorial block — pushed to bottom via margin-bottom:auto on top bar -->
    <div style="display:flex;flex-direction:column;">

      <!-- Full-width hairline -->
      <div style="width:100%;height:1px;background:linear-gradient(90deg,${p.badgeColor}55 0%,${p.badgeColor}28 55%,transparent 100%);margin-bottom:${isStory?'30px':'28px'};"></div>

      ${socialProofHtml}

      ${subheadline ? `<div style="font-family:'DM Mono',monospace;font-size:${hookSz};color:${p.badgeColor};letter-spacing:0.08em;text-transform:uppercase;margin-bottom:${isStory?'20px':'22px'};line-height:1.5;">${esc(subheadline.toUpperCase())}</div>` : ''}

      <h1 style="font-family:'Cormorant Garamond',serif;font-size:${h1Size};font-weight:700;line-height:0.92;color:${p.text};letter-spacing:-0.026em;text-shadow:0 8px 56px rgba(0,0,0,0.95);margin-bottom:${isStory?'30px':'36px'};">${headlineHtml}</h1>

      <!-- Short gradient divider -->
      <div style="width:${isStory?'80px':'68px'};height:1.5px;background:linear-gradient(90deg,${p.badgeColor} 0%,transparent 100%);margin-bottom:${isStory?'30px':'28px'};"></div>

      ${description ? `<p style="font-family:'Inter',sans-serif;font-size:${descSz};color:${p.textBody};line-height:1.50;font-weight:300;margin-bottom:${isStory?'28px':'30px'};max-width:880px;">${esc(description)}</p>` : ''}

      ${bulletsHtml ? `<div style="margin-bottom:${isStory?'36px':'36px'};">${bulletsHtml}</div>` : ''}

      <!-- CTA -->
      <div style="display:inline-flex;align-items:center;gap:${ctaGap};border:1px solid ${p.badgeColor};padding:${ctaPad};border-radius:2px;background:rgba(0,0,0,0.20);width:fit-content;">
        <span style="font-family:'Inter',sans-serif;font-weight:500;color:${p.text};font-size:${ctaSz};letter-spacing:0.20em;text-transform:uppercase;white-space:nowrap;">${esc(clean)}</span>
        <span style="color:${p.badgeColor};font-size:${ctaSz === '15px' ? '20px' : ctaSz};line-height:1;">→</span>
      </div>

    </div>
  </div>

  ${watermarkEl(p, isStory)}

</div>
</body></html>`;
}

// ── Router ────────────────────────────────────────────────────────────────────
function buildPostHTML({ headline, headline_accent, subheadline, description, bullets, cta, system, imageB64, format = '1:1', palette = 'navy', platform = 'Instagram', imageTone = 'dark', designStyle = 'hero-image', seed = '' }) {
  const isIG = (platform || 'Instagram').toLowerCase() === 'instagram';
  return isIG
    ? buildInstagramHTML({ headline, headline_accent, subheadline, cta, system, imageB64, format, palette, imageTone, designStyle, seed })
    : buildFacebookHTML({ headline, headline_accent, subheadline, description, bullets, cta, system, imageB64, format, palette, imageTone, designStyle, seed });
}

module.exports = { buildPostHTML };
