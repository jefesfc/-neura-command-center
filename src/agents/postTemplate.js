const fs   = require('fs');
const path = require('path');

let LOGO_B64 = '';
try {
  LOGO_B64 = fs.readFileSync(path.resolve(__dirname, '../../client/public/logo.png')).toString('base64');
} catch (e) {}

// ── System badge labels ───────────────────────────────────────────────────────
const SYSTEM_BADGE = {
  'sistema-01': 'Sistema 01',
  'sistema-02': 'Sistema 02',
  'sistema-03': 'Sistema 03',
  'neura':      'Neura',
  'ai-agents':  'AI Agents',
  'crm':        'AI CRM',
  'rag':        'RAG',
  'ai':         'AI',
};

// ── Brand palettes ────────────────────────────────────────────────────────────
const PALETTES = {
  navy: {
    accent:         '#1fa2b8',
    accent2:        '#c98a5a',
    text:           '#ffffff',
    textBody:       'rgba(255,255,255,0.80)',
    textMuted:      'rgba(255,255,255,0.40)',
    badgeColor:     '#c98a5a',
    watermarkColor: 'rgba(255,255,255,0.18)',
    fallbackBg:     '#07121c',
    overlayTop:     'rgba(7,18,28,0.10)',
    overlayMid:     'rgba(7,18,28,0.52)',
    overlayBot:     'rgba(7,18,28,0.97)',
    fbOverlay:      'rgba(5,12,22,0.91)',
    glowColor:      'rgba(31,162,184,0.10)',
  },
  gold: {
    accent:         '#d4a040',
    accent2:        '#f0d080',
    text:           '#f8f2e4',
    textBody:       'rgba(248,242,228,0.80)',
    textMuted:      'rgba(248,242,228,0.40)',
    badgeColor:     '#d4a040',
    watermarkColor: 'rgba(248,242,228,0.18)',
    fallbackBg:     '#130e04',
    overlayTop:     'rgba(19,14,4,0.10)',
    overlayMid:     'rgba(19,14,4,0.52)',
    overlayBot:     'rgba(19,14,4,0.97)',
    fbOverlay:      'rgba(16,10,2,0.91)',
    glowColor:      'rgba(212,160,64,0.10)',
  },
  grey: {
    accent:         '#8fa8be',
    accent2:        '#1fa2b8',
    text:           '#f0f4f8',
    textBody:       'rgba(240,244,248,0.80)',
    textMuted:      'rgba(240,244,248,0.40)',
    badgeColor:     '#8fa8be',
    watermarkColor: 'rgba(240,244,248,0.18)',
    fallbackBg:     '#08080e',
    overlayTop:     'rgba(8,8,14,0.10)',
    overlayMid:     'rgba(8,8,14,0.52)',
    overlayBot:     'rgba(8,8,14,0.97)',
    fbOverlay:      'rgba(6,6,10,0.91)',
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

// Remove punctuation/numbers from stat/pillar words — prevents "INTELLIGENT?" artifacts
function sanitizeWord(val) {
  return (val || '').replace(/[^a-zA-ZÀ-ÿ\s]/g, '').trim();
}

// Stop words: never accent articles, prepositions, conjunctions
const STOP_WORDS = new Set([
  'the','a','an','of','for','in','with','and','or','but','to','at','by',
  'from','as','is','it','its','on','this','that','are','was','were','be',
  'been','not','no','so','do','does','did','your','our','their','we','you',
]);

// Apply accent color to headline_accent word — skip if it's a stop word or too short
function applyAccent(headline, accent_word, accentColor) {
  if (!headline) return '';
  const w = (accent_word || '').trim();
  if (w && w.length > 2 && !STOP_WORDS.has(w.toLowerCase()) && headline.includes(w)) {
    const i = headline.indexOf(w);
    return esc(headline.slice(0, i))
      + `<span style="color:${accentColor}">${esc(w)}</span>`
      + esc(headline.slice(i + w.length));
  }
  return esc(headline);
}

// ── Shared element builders ───────────────────────────────────────────────────

function logoEl(isStory) {
  const h = isStory ? '36px' : '24px';
  return LOGO_B64
    ? `<img src="data:image/png;base64,${LOGO_B64}" alt="Neura" style="height:${h};width:auto;object-fit:contain;display:block;">`
    : `<span style="font-family:'Cormorant Garamond',serif;font-size:${isStory?'30px':'20px'};font-weight:700;letter-spacing:0.14em;color:#fff;">NEURA</span>`;
}

// Badge box: two rows — system name (accent color) + platform label (muted)
// Has a subtle border + tinted background — structured, not plain text
function badgeEl(system, platform, p, isStory) {
  const pad  = isStory ? '9px 18px' : '5px 12px';
  const gap  = isStory ? '3px' : '2px';
  const sz1  = isStory ? '14px' : '9px';
  const sz2  = isStory ? '10px' : '6px';
  return `<div style="display:inline-flex;flex-direction:column;align-items:flex-end;border:1px solid ${p.badgeColor}55;background:${p.badgeColor}18;padding:${pad};border-radius:2px;gap:${gap};">
    <span style="font-family:'DM Mono',monospace;font-size:${sz1};font-weight:500;color:${p.badgeColor};letter-spacing:0.18em;text-transform:uppercase;line-height:1;">${esc(SYSTEM_BADGE[system] || system || 'Neura')}</span>
    <span style="font-family:'DM Mono',monospace;font-size:${sz2};color:${p.textMuted};letter-spacing:0.16em;text-transform:uppercase;line-height:1;">${esc(platform)}</span>
  </div>`;
}

// Outlined CTA: accent border, text in white, arrow in accent color
function ctaEl(cta, p, isStory) {
  const clean = sanitizeCta(cta);
  const pad   = isStory ? '16px 44px' : '10px 28px';
  const gap   = isStory ? '16px' : '10px';
  const sz    = isStory ? '18px' : '11px';
  return `<div style="display:inline-flex;align-items:center;gap:${gap};border:1px solid ${p.accent};padding:${pad};border-radius:2px;background:rgba(0,0,0,0.22);">
    <span style="font-family:'Inter',sans-serif;font-size:${sz};font-weight:500;color:${p.text};letter-spacing:0.16em;text-transform:uppercase;line-height:1;white-space:nowrap;">${esc(clean)}</span>
    <span style="color:${p.accent};font-size:${sz};line-height:1;">→</span>
  </div>`;
}

// Watermark: centered bottom, ultra-subtle
function watermarkEl(p, isStory) {
  return `<div style="position:absolute;bottom:${isStory?'28px':'16px'};left:50%;transform:translateX(-50%);font-family:'DM Mono',monospace;font-size:${isStory?'11px':'7px'};color:${p.watermarkColor};letter-spacing:0.14em;z-index:20;white-space:nowrap;">neurasolutions.cloud</div>`;
}

// Four L-shaped corner brackets — visual chrome that says "designed"
function bracketsEl(p, isStory) {
  const sz  = isStory ? '26px' : '17px';
  const off = isStory ? '36px' : '24px';
  const col = `${p.accent}cc`;  // accent at ~80% opacity
  const b   = `1.5px solid ${col}`;
  return `
  <div style="position:absolute;top:${off};left:${off};width:${sz};height:${sz};border-top:${b};border-left:${b};z-index:15;"></div>
  <div style="position:absolute;top:${off};right:${off};width:${sz};height:${sz};border-top:${b};border-right:${b};z-index:15;"></div>
  <div style="position:absolute;bottom:${off};left:${off};width:${sz};height:${sz};border-bottom:${b};border-left:${b};z-index:15;"></div>
  <div style="position:absolute;bottom:${off};right:${off};width:${sz};height:${sz};border-bottom:${b};border-right:${b};z-index:15;"></div>`;
}

// Short horizontal accent line — marks the start of the text zone
function accentLineEl(p, isStory) {
  const w = isStory ? '48px' : '32px';
  const mb = isStory ? '20px' : '12px';
  return `<div style="width:${w};height:1px;background:linear-gradient(90deg,${p.accent},transparent);margin-bottom:${mb};"></div>`;
}

// Gradient separator — editorial fade (Facebook only)
function separatorEl(p, isStory) {
  const w  = isStory ? '64px' : '42px';
  const mb = isStory ? '22px' : '13px';
  return `<div style="width:${w};height:1px;background:linear-gradient(90deg,${p.accent},transparent);margin-bottom:${mb};"></div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// INSTAGRAM — One image. One headline. One action.
//
// Layer stack (bottom → top):
//   1. Background image (full bleed, center top)
//   2. Cinematic gradient (transparent → near-black, darkens from 40%)
//   3. Edge vignette (radial, draws focus inward)
//   4. Full-width hairline at 57% (stages image zone above, text zone below)
//   5. Corner brackets (4× L-shapes, accent color, z-index 15)
//   6. Layout content (z-index 10)
//   7. Watermark (z-index 20)
//
// Layout: top bar | flex:1 (image breathes) | accent line | hook | H1 | CTA
// NO description, NO bullets, NO pillars, NO accent word below H1
// ═════════════════════════════════════════════════════════════════════════════
function buildInstagramHTML({ headline, headline_accent, subheadline, cta, system, imageB64, format, palette }) {
  const isStory = format === '9:16';
  const W = 1080, H = isStory ? 1920 : 1080;
  const p = PALETTES[palette] || PALETTES.navy;

  const bgStyle = imageB64
    ? `background-image:url('data:image/jpeg;base64,${imageB64}');background-size:cover;background-position:center top;`
    : `background:${p.fallbackBg};`;

  const headlineHtml = applyAccent(headline, headline_accent, p.accent);

  // H1 size — tuned for 1080px canvas: short headlines get massive type
  const chars = (headline || '').length;
  const h1Size = isStory
    ? (chars <= 22 ? '140px' : chars <= 36 ? '116px' : '90px')
    : (chars <= 22 ? '110px' : chars <= 36 ? '88px'  : '68px');

  const hook = subheadline ? subheadline.toUpperCase() : '';
  const hookSz = isStory ? '20px' : '13px';

  // Padding: content does not touch canvas edge
  const pad = isStory
    ? { top: '70px', side: '80px', bot: '76px' }
    : { top: '52px', side: '64px', bot: '62px' };

  return `<!DOCTYPE html><html>
<head>
<meta charset="UTF-8">
${FONTS}
<style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:${W}px;height:${H}px;overflow:hidden;}</style>
</head>
<body>
<div style="position:relative;width:${W}px;height:${H}px;${bgStyle}font-family:'Inter',sans-serif;">

  <!-- Layer 2: Cinematic gradient — transparent top, near-black bottom -->
  <!-- Darkening starts at 40% so the text zone always has strong contrast -->
  <div style="position:absolute;inset:0;background:linear-gradient(to bottom,
    ${p.overlayTop} 0%,
    rgba(0,0,0,0.06) 18%,
    ${p.overlayMid} 40%,
    rgba(7,18,28,0.82) 58%,
    ${p.overlayBot} 100%
  );z-index:1;"></div>

  <!-- Layer 3: Edge vignette — draws focus to center, adds cinematic depth -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,transparent 35%,rgba(0,0,0,0.42) 100%);z-index:2;"></div>

  <!-- Layer 4: Full-width hairline at 57% — stages image above, text below -->
  <div style="position:absolute;top:57%;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 0%,${p.accent}55 15%,${p.accent}55 85%,transparent 100%);z-index:6;"></div>

  <!-- Layer 5: Corner brackets — the visual chrome that makes it look designed -->
  ${bracketsEl(p, isStory)}

  <!-- Layer 6: Main layout — flex column, anchored to bottom -->
  <div style="position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;padding:${pad.top} ${pad.side} ${pad.bot} ${pad.side};">

    <!-- TOP BAR -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;">
      ${logoEl(isStory)}
      ${badgeEl(system, 'Instagram', p, isStory)}
    </div>

    <!-- IMAGE ZONE — flex:1 lets the image breathe, gradient covers the transition -->
    <div style="flex:1;"></div>

    <!-- TEXT ZONE — anchored to bottom -->
    ${accentLineEl(p, isStory)}

    ${hook ? `<div style="font-family:'DM Mono',monospace;font-size:${hookSz};color:${p.accent};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:${isStory?'22px':'14px'};text-shadow:0 1px 8px rgba(0,0,0,0.90);">${esc(hook)}</div>` : ''}

    <h1 style="font-family:'Cormorant Garamond',serif;font-size:${h1Size};font-weight:700;line-height:1.01;color:${p.text};letter-spacing:-0.022em;text-shadow:0 3px 28px rgba(0,0,0,0.90),0 1px 8px rgba(0,0,0,0.70);margin-bottom:${isStory?'44px':'28px'};">${headlineHtml}</h1>

    ${ctaEl(cta, p, isStory)}

  </div>

  <!-- Layer 7: Watermark -->
  ${watermarkEl(p, isStory)}

</div>
</body></html>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// FACEBOOK — Hook → H1 → Body → Proof → Action. Editorial authority.
//
// Layer stack (bottom → top):
//   1. Background image (full bleed, center)
//   2. Diagonal editorial overlay (148deg — more dynamic than flat gradient)
//   3. Accent glow top-right (brand color bloom, subtle depth)
//   4. Left accent bar (4px, teal → gold → transparent)
//   5. Layout content (z-index 10)
//   6. Watermark (z-index 20)
//
// Layout: top bar | [separator | hook | H1 | sep line | desc | bullets | pillars | CTA]
// Content left padding clears the 4px left bar
// ═════════════════════════════════════════════════════════════════════════════
function buildFacebookHTML({ headline, headline_accent, subheadline, stats, description, bullets, cta, system, imageB64, format, palette }) {
  const isStory = format === '9:16';
  const W = 1080, H = isStory ? 1920 : 1080;
  const p = PALETTES[palette] || PALETTES.navy;

  const bgStyle = imageB64
    ? `background-image:url('data:image/jpeg;base64,${imageB64}');background-size:cover;background-position:center;`
    : `background:${p.fallbackBg};`;

  const headlineHtml = applyAccent(headline, headline_accent, p.accent);

  const chars = (headline || '').length;
  const h1Size = isStory
    ? (chars <= 28 ? '112px' : chars <= 40 ? '94px' : '76px')
    : (chars <= 28 ? '80px'  : chars <= 40 ? '66px' : '52px');

  // Bullets with teal dot
  const bulletsHtml = Array.isArray(bullets) && bullets.length > 0
    ? bullets.slice(0, 3).map(b => {
        const dotSz  = isStory ? '6px' : '4px';
        const dotTop = isStory ? '15px' : '8px';
        const textSz = isStory ? '26px' : '15px';
        const gap    = isStory ? '16px' : '10px';
        const mb     = isStory ? '11px' : '7px';
        return `<div style="display:flex;align-items:flex-start;gap:${gap};margin-bottom:${mb};">
          <div style="width:${dotSz};height:${dotSz};border-radius:50%;background:${p.accent};flex-shrink:0;margin-top:${dotTop};"></div>
          <span style="font-family:'Inter',sans-serif;font-size:${textSz};color:${p.textBody};line-height:1.55;font-weight:300;">${esc(b)}</span>
        </div>`;
      }).join('')
    : '';

  // Pillar words — sanitized, no numbers/punctuation, inline with · separator
  const rawPillars = Array.isArray(stats) && stats.length > 0
    ? stats : [{ value: 'Structured' }, { value: 'Systematic' }, { value: 'Scalable' }];
  const pillarsHtml = rawPillars
    .map(s => sanitizeWord(s.value))
    .filter(v => v.length > 0)
    .slice(0, 3)
    .map((v, i) => {
      const color = i === 1 ? p.accent2 : p.accent;
      const sz = isStory ? '14px' : '9px';
      return `<span style="font-family:'DM Mono',monospace;font-size:${sz};color:${color};letter-spacing:0.20em;text-transform:uppercase;">${esc(v)}</span>`;
    })
    .join(`<span style="color:${p.textMuted};margin:0 ${isStory?'14px':'9px'};">·</span>`);

  // Side padding — content clears the 4px left bar
  const barW   = 4;
  const padSide = isStory ? 86 : 66;
  const padLeft = padSide + barW + (isStory ? 10 : 6);
  const pad = {
    top: isStory ? '66px' : '46px',
    right: `${padSide}px`,
    bot: isStory ? '74px' : '52px',
    left: `${padLeft}px`,
  };

  const hookSz  = isStory ? '17px' : '10px';
  const descSz  = isStory ? '25px' : '15px';

  return `<!DOCTYPE html><html>
<head>
<meta charset="UTF-8">
${FONTS}
<style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:${W}px;height:${H}px;overflow:hidden;}</style>
</head>
<body>
<div style="position:relative;width:${W}px;height:${H}px;${bgStyle}font-family:'Inter',sans-serif;">

  <!-- Layer 2: Diagonal editorial overlay — image becomes rich texture, not distraction -->
  <div style="position:absolute;inset:0;background:linear-gradient(148deg,
    ${p.fbOverlay} 0%,
    rgba(5,12,22,0.82) 45%,
    ${p.fbOverlay} 100%
  );z-index:1;"></div>

  <!-- Layer 3: Accent glow top-right — brand color depth -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 15%,${p.glowColor} 0%,transparent 52%);z-index:2;"></div>

  <!-- Layer 4: Left accent bar — 4px authority anchor, teal → gold → fade -->
  <div style="position:absolute;top:0;left:0;width:${barW}px;height:100%;background:linear-gradient(180deg,${p.accent} 0%,${p.accent2}99 55%,transparent 100%);z-index:5;"></div>

  <!-- Layer 5: Main layout -->
  <div style="position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;justify-content:space-between;padding:${pad.top} ${pad.right} ${pad.bot} ${pad.left};">

    <!-- TOP BAR -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;">
      ${logoEl(isStory)}
      ${badgeEl(system, 'Facebook', p, isStory)}
    </div>

    <!-- EDITORIAL CONTENT BLOCK — sits in the bottom half -->
    <div>

      <!-- Full-width separator — marks the start of the editorial zone -->
      <div style="width:100%;height:1px;background:linear-gradient(90deg,${p.accent}66,transparent);margin-bottom:${isStory?'26px':'16px'};"></div>

      <!-- Hook — context and urgency -->
      ${subheadline ? `<div style="font-family:'DM Mono',monospace;font-size:${hookSz};color:${p.accent};letter-spacing:0.24em;text-transform:uppercase;margin-bottom:${isStory?'16px':'10px'};">${esc(subheadline.toUpperCase())}</div>` : ''}

      <!-- H1 — authority serif, dominant focal point -->
      <h1 style="font-family:'Cormorant Garamond',serif;font-size:${h1Size};font-weight:700;line-height:1.06;color:${p.text};letter-spacing:-0.015em;text-shadow:0 2px 16px rgba(0,0,0,0.55);margin-bottom:${isStory?'24px':'14px'};">${headlineHtml}</h1>

      <!-- Gradient separator — editorial style, fades to transparent -->
      ${separatorEl(p, isStory)}

      <!-- Description — one focused narrative sentence -->
      ${description ? `<p style="font-family:'Inter',sans-serif;font-size:${descSz};color:${p.textBody};line-height:1.65;font-weight:300;letter-spacing:0.008em;margin-bottom:${isStory?'22px':'13px'};">${esc(description)}</p>` : ''}

      <!-- Bullets — specific outcomes -->
      ${bulletsHtml ? `<div style="margin-bottom:${isStory?'22px':'13px'};">${bulletsHtml}</div>` : ''}

      <!-- Pillar words — DM Mono inline, qualitative only -->
      <div style="margin-bottom:${isStory?'32px':'18px'};">${pillarsHtml}</div>

      <!-- CTA -->
      ${ctaEl(cta, p, isStory)}

    </div>

  </div>

  <!-- Layer 6: Watermark -->
  ${watermarkEl(p, isStory)}

</div>
</body></html>`;
}

// ── Router ────────────────────────────────────────────────────────────────────
function buildPostHTML({ headline, headline_accent, subheadline, stats, description, bullets, cta, system, imageB64, format = '1:1', palette = 'navy', platform = 'Instagram' }) {
  const isIG = (platform || 'Instagram').toLowerCase() === 'instagram';
  return isIG
    ? buildInstagramHTML({ headline, headline_accent, subheadline, cta, system, imageB64, format, palette })
    : buildFacebookHTML({ headline, headline_accent, subheadline, stats, description, bullets, cta, system, imageB64, format, palette });
}

module.exports = { buildPostHTML };
