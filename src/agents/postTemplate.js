const fs   = require('fs');
const path = require('path');

let LOGO_B64 = '';
try {
  LOGO_B64 = fs.readFileSync(path.resolve(__dirname, '../../client/public/logo.png')).toString('base64');
} catch (e) {}

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

const PALETTES = {
  navy: {
    accent:         '#1fa2b8',
    accent2:        '#c98a5a',
    text:           '#ffffff',
    textBody:       'rgba(255,255,255,0.82)',
    textMuted:      'rgba(255,255,255,0.45)',
    badgeColor:     '#c98a5a',
    badgeBorder:    'rgba(201,138,90,0.50)',
    watermarkColor: 'rgba(255,255,255,0.18)',
    fallbackBg:     '#07121c',
  },
  gold: {
    accent:         '#d4a040',
    accent2:        '#f0d080',
    text:           '#f8f2e4',
    textBody:       'rgba(248,242,228,0.84)',
    textMuted:      'rgba(248,242,228,0.45)',
    badgeColor:     '#d4a040',
    badgeBorder:    'rgba(212,160,64,0.50)',
    watermarkColor: 'rgba(248,242,228,0.18)',
    fallbackBg:     '#130e04',
  },
  grey: {
    accent:         '#8fa8be',
    accent2:        '#1fa2b8',
    text:           '#f0f4f8',
    textBody:       'rgba(240,244,248,0.82)',
    textMuted:      'rgba(240,244,248,0.45)',
    badgeColor:     '#8fa8be',
    badgeBorder:    'rgba(143,168,190,0.42)',
    watermarkColor: 'rgba(240,244,248,0.18)',
    fallbackBg:     '#08080e',
  },
};

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeCta(cta) {
  return (cta || '').replace(/\s*→+\s*$/, '').trim();
}

function applyAccent(headline, headline_accent, accentColor) {
  if (!headline) return '';
  if (headline_accent && headline.includes(headline_accent)) {
    const i = headline.indexOf(headline_accent);
    return esc(headline.slice(0, i))
      + `<span style="color:${accentColor}">${esc(headline_accent)}</span>`
      + esc(headline.slice(i + headline_accent.length));
  }
  return esc(headline);
}

function logoEl(isStory, fallbackColor) {
  return LOGO_B64
    ? `<img src="data:image/png;base64,${LOGO_B64}" alt="Neura" style="height:${isStory ? '42px' : '30px'};width:auto;object-fit:contain;display:block;"/>`
    : `<span style="font-family:'Cormorant Garamond',serif;font-size:${isStory ? '36px' : '26px'};font-weight:700;letter-spacing:0.14em;color:${fallbackColor || '#fff'};">NEURA</span>`;
}

function badgeEl(badge, p, isStory, label) {
  return `<div style="text-align:right;">
    <div style="font-family:'DM Mono',monospace;font-size:${isStory ? '18px' : '12px'};font-weight:500;color:${p.badgeColor};letter-spacing:0.10em;text-transform:uppercase;border:1.5px solid ${p.badgeBorder};padding:${isStory ? '8px 18px' : '5px 12px'};border-radius:3px;background:rgba(0,0,0,0.30);display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;">${badge}</div>
    <div style="font-family:'DM Mono',monospace;font-size:${isStory ? '14px' : '9px'};color:${p.textMuted};letter-spacing:0.14em;text-transform:uppercase;margin-top:${isStory ? '6px' : '4px'};text-align:right;">${label}</div>
  </div>`;
}

function ctaOutlined(ctaText, p, isStory) {
  const clean = sanitizeCta(ctaText);
  return `<div style="display:inline-flex;align-items:center;justify-content:center;border:1.5px solid ${p.accent};padding:${isStory ? '14px 38px' : '9px 24px'};border-radius:2px;background:rgba(0,0,0,0.18);">
    <span style="font-family:'Inter',sans-serif;font-size:${isStory ? '22px' : '14px'};font-weight:500;color:${p.text};letter-spacing:0.12em;text-transform:uppercase;line-height:1;white-space:nowrap;">${esc(clean)} →</span>
  </div>`;
}

function watermarkEl(p, isStory, padRight) {
  return `<div style="position:absolute;bottom:${isStory ? '34px' : '20px'};right:${padRight}px;font-family:'DM Mono',monospace;font-size:${isStory ? '15px' : '10px'};color:${p.watermarkColor};letter-spacing:0.10em;z-index:20;">neurasolutions.cloud</div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// INSTAGRAM TEMPLATE — Visual-first · Image as hero · Massive H1
// Philosophy: One image. One headline. One action.
// ═════════════════════════════════════════════════════════════════════════════
function buildInstagramHTML({ headline, headline_accent, subheadline, stats, cta, system, imageB64, format, palette }) {
  const isStory = format === '9:16';
  const W = 1080, H = isStory ? 1920 : 1080;
  const p = PALETTES[palette] || PALETTES.navy;
  const badge = SYSTEM_BADGE[system] || 'Neura';

  const bgStyle = imageB64
    ? `background-image:url('data:image/jpeg;base64,${imageB64}');background-size:cover;background-position:center;`
    : `background:${p.fallbackBg};`;

  const headlineHtml = applyAccent(headline, headline_accent, p.accent);

  // H1 is MASSIVE — it fills the frame
  const h1Size = isStory
    ? (headline && headline.length > 28 ? '94px' : '118px')
    : (headline && headline.length > 28 ? '60px' : '76px');

  // Single qualitative accent word — shown below headline
  const accentWord = Array.isArray(stats) && stats[0]?.value ? stats[0].value : 'Intelligent';

  // Hook = subheadline forced SHORT (copy agent generates max 5 words for IG)
  const hook = subheadline ? subheadline.toUpperCase() : '';

  const pad = isStory ? { top: 72, side: 86, bottom: 90 } : { top: 52, side: 70, bottom: 64 };

  return `<!DOCTYPE html><html>
<head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300&family=Inter:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:${W}px;height:${H}px;overflow:hidden;}</style>
</head>
<body>
<div style="position:relative;width:${W}px;height:${H}px;${bgStyle}font-family:'Inter',sans-serif;">

  <!-- Overlay: almost transparent top → dark bottom. Image is the hero. -->
  <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.04) 0%,rgba(0,0,0,0.06) 28%,rgba(7,18,28,0.55) 55%,rgba(7,18,28,0.93) 100%);"></div>

  <!-- Left accent line -->
  <div style="position:absolute;top:0;left:0;width:3px;height:100%;background:linear-gradient(180deg,${p.accent}cc 0%,transparent 100%);z-index:5;"></div>

  <!-- Layout -->
  <div style="position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;padding:${pad.top}px ${pad.side}px ${pad.bottom}px ${pad.side}px;">

    <!-- Top bar -->
    <div style="display:flex;align-items:center;justify-content:space-between;">
      ${logoEl(isStory, '#fff')}
      ${badgeEl(badge, p, isStory, 'Instagram')}
    </div>

    <!-- Image hero zone — flex spacer lets the image breathe -->
    <div style="flex:1;"></div>

    <!-- Hook — ultra short, above headline -->
    ${hook ? `<div style="font-family:'DM Mono',monospace;font-size:${isStory ? '20px' : '12px'};color:${p.accent};letter-spacing:0.18em;text-transform:uppercase;margin-bottom:${isStory ? '30px' : '18px'};text-shadow:0 1px 10px rgba(0,0,0,0.80);">${esc(hook)}</div>` : ''}

    <!-- H1 — dominates the frame, 2–4 words max for visual impact -->
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:${h1Size};font-weight:700;line-height:1.03;color:${p.text};letter-spacing:-0.025em;text-shadow:0 4px 24px rgba(0,0,0,0.85),0 1px 8px rgba(0,0,0,0.60);margin-bottom:${isStory ? '32px' : '20px'};">${headlineHtml}</h1>

    <!-- Accent word — single qualitative keyword, subtle -->
    <div style="font-family:'DM Mono',monospace;font-size:${isStory ? '18px' : '11px'};color:${p.textMuted};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:${isStory ? '52px' : '30px'};">${esc(accentWord)}</div>

    <!-- CTA outlined -->
    ${ctaOutlined(cta, p, isStory)}

  </div>

  ${watermarkEl(p, isStory, pad.side)}

</div>
</body></html>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// FACEBOOK TEMPLATE — Editorial · Narrative · Text-dense
// Philosophy: Hook → Problem → H1 → Body → Proof → Action
// ═════════════════════════════════════════════════════════════════════════════
function buildFacebookHTML({ headline, headline_accent, subheadline, stats, description, bullets, cta, system, imageB64, format, palette }) {
  const isStory = format === '9:16';
  const W = 1080, H = isStory ? 1920 : 1080;
  const p = PALETTES[palette] || PALETTES.navy;
  const badge = SYSTEM_BADGE[system] || 'Neura';

  const bgStyle = imageB64
    ? `background-image:url('data:image/jpeg;base64,${imageB64}');background-size:cover;background-position:center;`
    : `background:${p.fallbackBg};`;

  const headlineHtml = applyAccent(headline, headline_accent, p.accent);

  // H1 large but leaves room for body content
  const h1Size = isStory
    ? (headline && headline.length > 36 ? '68px' : '84px')
    : (headline && headline.length > 36 ? '44px' : '56px');

  // Bullets with dot indicators
  const bulletsHtml = Array.isArray(bullets) && bullets.length > 0
    ? bullets.slice(0, 3).map(b => `
      <div style="display:flex;align-items:flex-start;gap:${isStory ? '18px' : '11px'};margin-bottom:${isStory ? '14px' : '8px'};">
        <div style="width:${isStory ? '7px' : '5px'};height:${isStory ? '7px' : '5px'};border-radius:50%;background:${p.accent};flex-shrink:0;margin-top:${isStory ? '13px' : '7px'};"></div>
        <span style="font-family:'Inter',sans-serif;font-size:${isStory ? '27px' : '16px'};color:${p.textBody};line-height:1.55;font-weight:300;letter-spacing:0.01em;">${esc(b)}</span>
      </div>`).join('')
    : '';

  // Pillars as inline text — no boxes
  const pillars = Array.isArray(stats) && stats.length > 0 ? stats : [
    { value: 'Structured' }, { value: 'Consistent' }, { value: 'Controlled' },
  ];
  const pillarsHtml = pillars.map((s, i) =>
    `<span style="font-family:'DM Mono',monospace;font-size:${isStory ? '18px' : '11px'};color:${i === 1 ? p.accent2 : p.accent};letter-spacing:0.14em;text-transform:uppercase;">${esc(s.value)}</span>`
  ).join(`<span style="color:${p.textMuted};margin:0 ${isStory ? '18px' : '10px'};">·</span>`);

  const pad = isStory ? { top: 72, side: 88, bottom: 90 } : { top: 50, side: 72, bottom: 62 };

  return `<!DOCTYPE html><html>
<head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300&family=Inter:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:${W}px;height:${H}px;overflow:hidden;}</style>
</head>
<body>
<div style="position:relative;width:${W}px;height:${H}px;${bgStyle}font-family:'Inter',sans-serif;">

  <!-- Overlay: editorial — dark enough to read, image adds texture -->
  <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(5,12,20,0.86) 0%,rgba(5,12,20,0.80) 45%,rgba(5,12,20,0.90) 100%);"></div>

  <!-- Left accent line -->
  <div style="position:absolute;top:0;left:0;width:3px;height:100%;background:linear-gradient(180deg,${p.accent}cc 0%,transparent 100%);z-index:5;"></div>

  <!-- Layout -->
  <div style="position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;justify-content:space-between;padding:${pad.top}px ${pad.side}px ${pad.bottom}px ${pad.side}px;">

    <!-- Top bar -->
    <div style="display:flex;align-items:center;justify-content:space-between;">
      ${logoEl(isStory, '#fff')}
      ${badgeEl(badge, p, isStory, 'Facebook')}
    </div>

    <!-- Main editorial block -->
    <div>

      <!-- Hook — short DM Mono, sets the tension -->
      ${subheadline ? `<div style="font-family:'DM Mono',monospace;font-size:${isStory ? '20px' : '13px'};color:${p.accent};letter-spacing:0.16em;text-transform:uppercase;margin-bottom:${isStory ? '26px' : '14px'};text-shadow:0 1px 8px rgba(0,0,0,0.60);">${esc(subheadline.toUpperCase())}</div>` : ''}

      <!-- H1 — strong, serif, clear focus point -->
      <h1 style="font-family:'Cormorant Garamond',serif;font-size:${h1Size};font-weight:700;line-height:1.07;color:${p.text};letter-spacing:-0.02em;text-shadow:0 2px 18px rgba(0,0,0,0.75);margin-bottom:${isStory ? '30px' : '18px'};">${headlineHtml}</h1>

      <!-- Short separator — editorial style -->
      <div style="width:${isStory ? '72px' : '44px'};height:1px;background:${p.accent};opacity:0.55;margin-bottom:${isStory ? '28px' : '16px'};"></div>

      <!-- Description / body paragraph -->
      ${description ? `<p style="font-family:'Inter',sans-serif;font-size:${isStory ? '28px' : '17px'};color:${p.textBody};line-height:1.65;font-weight:300;letter-spacing:0.005em;margin-bottom:${isStory ? '28px' : '16px'};">${esc(description)}</p>` : ''}

      <!-- Bullets -->
      ${bulletsHtml ? `<div style="margin-bottom:${isStory ? '30px' : '18px'};">${bulletsHtml}</div>` : ''}

      <!-- Pillars inline — no boxes, editorial -->
      <div style="margin-bottom:${isStory ? '38px' : '22px'};">${pillarsHtml}</div>

      <!-- CTA outlined -->
      ${ctaOutlined(cta, p, isStory)}

    </div>

  </div>

  ${watermarkEl(p, isStory, pad.side)}

</div>
</body></html>`;
}

// ── Router ────────────────────────────────────────────────────────────────────
function buildPostHTML({ headline, headline_accent, subheadline, stats, description, bullets, cta, system, imageB64, format = '1:1', palette = 'navy', platform = 'Instagram' }) {
  const isIG = (platform || 'Instagram').toLowerCase() === 'instagram';
  return isIG
    ? buildInstagramHTML({ headline, headline_accent, subheadline, stats, cta, system, imageB64, format, palette })
    : buildFacebookHTML({ headline, headline_accent, subheadline, stats, description, bullets, cta, system, imageB64, format, palette });
}

module.exports = { buildPostHTML };
