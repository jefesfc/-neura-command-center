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
    textBody:       'rgba(255,255,255,0.80)',
    textMuted:      'rgba(255,255,255,0.40)',
    badgeColor:     '#c98a5a',
    watermarkColor: 'rgba(255,255,255,0.18)',
    fallbackBg:     '#07121c',
    overlayTop:     'rgba(7,18,28,0.10)',
    overlayMid:     'rgba(7,18,28,0.50)',
    overlayBot:     'rgba(7,18,28,0.97)',
    fbOverlay:      'rgba(5,12,22,0.91)',
    glowColor:      'rgba(31,162,184,0.10)',
  },
  gold: {
    accent:         '#d4a040',
    accent2:        '#f0d080',
    text:           '#f8f2e4',
    textBody:       'rgba(248,242,228,0.82)',
    textMuted:      'rgba(248,242,228,0.40)',
    badgeColor:     '#d4a040',
    watermarkColor: 'rgba(248,242,228,0.18)',
    fallbackBg:     '#130e04',
    overlayTop:     'rgba(19,14,4,0.08)',
    overlayMid:     'rgba(19,14,4,0.50)',
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
    overlayTop:     'rgba(8,8,14,0.08)',
    overlayMid:     'rgba(8,8,14,0.50)',
    overlayBot:     'rgba(8,8,14,0.97)',
    fbOverlay:      'rgba(6,6,10,0.91)',
    glowColor:      'rgba(143,168,190,0.10)',
  },
};

const FONTS_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeCta(cta) {
  return (cta || '').replace(/\s*→+\s*$/, '').trim();
}

// Strips punctuation/numbers — prevents "INTELLIGENT?" or "85%" artifacts
function sanitizeWord(val) {
  return (val || '').replace(/[^a-zA-ZÀ-ÿ\s]/g, '').trim();
}

// Words too short or functional to accent — highlighting "the", "with", "a" looks broken
const STOP_WORDS = new Set([
  'the','a','an','of','for','in','with','and','or','but','to','at','by',
  'from','as','is','it','its','on','this','that','are','was','were','be',
  'been','not','no','so','do','does','did','your','our','their','we','you',
]);

function applyAccent(headline, headline_accent, accentColor) {
  if (!headline) return '';
  const word = (headline_accent || '').trim();
  if (word && headline.includes(word) && !STOP_WORDS.has(word.toLowerCase()) && word.length > 2) {
    const i = headline.indexOf(word);
    return esc(headline.slice(0, i))
      + `<span style="color:${accentColor}">${esc(word)}</span>`
      + esc(headline.slice(i + word.length));
  }
  return esc(headline);
}

function logoEl(isStory) {
  const h = isStory ? '36px' : '24px';
  return LOGO_B64
    ? `<img src="data:image/png;base64,${LOGO_B64}" alt="Neura" style="height:${h};width:auto;object-fit:contain;display:block;"/>`
    : `<span style="font-family:'Cormorant Garamond',serif;font-size:${isStory ? '30px' : '20px'};font-weight:700;letter-spacing:0.14em;color:#fff;">NEURA</span>`;
}

// Premium badge box: system name + platform label, with border + tinted background
function badgeBoxEl(badge, platformLabel, p, isStory) {
  return `<div style="display:inline-flex;flex-direction:column;align-items:flex-end;border:1px solid ${p.badgeColor}55;background:${p.badgeColor}18;padding:${isStory ? '9px 18px' : '5px 12px'};border-radius:2px;gap:${isStory ? '3px' : '2px'};">
    <div style="font-family:'DM Mono',monospace;font-size:${isStory ? '14px' : '9px'};font-weight:500;color:${p.badgeColor};letter-spacing:0.18em;text-transform:uppercase;line-height:1;">${esc(badge)}</div>
    <div style="font-family:'DM Mono',monospace;font-size:${isStory ? '10px' : '6px'};color:${p.textMuted};letter-spacing:0.16em;text-transform:uppercase;line-height:1;">${esc(platformLabel)}</div>
  </div>`;
}

// Four L-shaped corner brackets — premium agency aesthetic
function cornerBracketsEl(p, isStory) {
  const sz  = isStory ? 26 : 17;
  const th  = '1.5px';
  const col = `${p.accent}cc`;
  const off = isStory ? 36 : 24;
  return `
    <div style="position:absolute;top:${off}px;left:${off}px;width:${sz}px;height:${sz}px;border-top:${th} solid ${col};border-left:${th} solid ${col};z-index:15;"></div>
    <div style="position:absolute;top:${off}px;right:${off}px;width:${sz}px;height:${sz}px;border-top:${th} solid ${col};border-right:${th} solid ${col};z-index:15;"></div>
    <div style="position:absolute;bottom:${off}px;left:${off}px;width:${sz}px;height:${sz}px;border-bottom:${th} solid ${col};border-left:${th} solid ${col};z-index:15;"></div>
    <div style="position:absolute;bottom:${off}px;right:${off}px;width:${sz}px;height:${sz}px;border-bottom:${th} solid ${col};border-right:${th} solid ${col};z-index:15;"></div>`;
}

// Outlined CTA — border accent, arrow in accent color
function ctaOutlined(ctaText, p, isStory) {
  const clean = sanitizeCta(ctaText);
  return `<div style="display:inline-flex;align-items:center;gap:${isStory ? '16px' : '10px'};border:1px solid ${p.accent};padding:${isStory ? '16px 44px' : '10px 28px'};border-radius:2px;background:rgba(0,0,0,0.22);">
    <span style="font-family:'Inter',sans-serif;font-size:${isStory ? '18px' : '11px'};font-weight:500;color:${p.text};letter-spacing:0.16em;text-transform:uppercase;line-height:1;white-space:nowrap;">${esc(clean)}</span>
    <span style="color:${p.accent};font-size:${isStory ? '17px' : '11px'};line-height:1;">→</span>
  </div>`;
}

// Watermark — centered, ultra-subtle
function watermarkEl(p, isStory) {
  return `<div style="position:absolute;bottom:${isStory ? '28px' : '16px'};left:50%;transform:translateX(-50%);font-family:'DM Mono',monospace;font-size:${isStory ? '11px' : '7px'};color:${p.watermarkColor};letter-spacing:0.14em;z-index:20;white-space:nowrap;">neurasolutions.cloud</div>`;
}

// Short horizontal accent line — anchor before hook text
function accentLineEl(p, isStory) {
  return `<div style="width:${isStory ? '48px' : '32px'};height:1px;background:linear-gradient(90deg,${p.accent},transparent);margin-bottom:${isStory ? '18px' : '11px'};"></div>`;
}

// Gradient separator — editorial fade line
function separatorEl(p, isStory) {
  return `<div style="width:${isStory ? '64px' : '42px'};height:1px;background:linear-gradient(90deg,${p.accent},transparent);margin-bottom:${isStory ? '22px' : '13px'};"></div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// INSTAGRAM TEMPLATE — Dark luxury. Typography as hero.
//
// Layers (bottom → top):
//   1. Background image (full bleed)
//   2. Cinematic gradient overlay (transparent top → near-black bottom)
//   3. Edge vignette (radial, depth)
//   4. Full-width hairline divider at 58% — stages image above, text below
//   5. Corner brackets (premium chrome)
//   6. Layout: top bar | flex grow | accent line | hook | H1 | CTA
//   7. Watermark (centered, ultra-subtle)
// ═════════════════════════════════════════════════════════════════════════════
function buildInstagramHTML({ headline, headline_accent, subheadline, cta, system, imageB64, format, palette }) {
  const isStory = format === '9:16';
  const W = 1080, H = isStory ? 1920 : 1080;
  const p = PALETTES[palette] || PALETTES.navy;
  const badge = SYSTEM_BADGE[system] || 'Neura';

  const bgStyle = imageB64
    ? `background-image:url('data:image/jpeg;base64,${imageB64}');background-size:cover;background-position:center top;`
    : `background:${p.fallbackBg};`;

  const headlineHtml = applyAccent(headline, headline_accent, p.accent);

  // Adaptive H1 size — shorter headline = bigger type
  // Sizes tuned for 1080px canvas: must feel MASSIVE, not body text
  const charCount = (headline || '').length;
  const h1Size = isStory
    ? (charCount > 36 ? '90px' : charCount > 24 ? '116px' : '140px')
    : (charCount > 36 ? '68px' : charCount > 24 ? '88px' : '110px');

  const hook = subheadline ? subheadline.toUpperCase() : '';
  const pad  = isStory ? { top: 70, side: 80, bottom: 76 } : { top: 52, side: 64, bottom: 62 };

  // Hairline y-position — stages the image above, text zone below
  const hairlineY = isStory ? 57 : 55;

  return `<!DOCTYPE html><html>
<head><meta charset="UTF-8">${FONTS_LINK}
<style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:${W}px;height:${H}px;overflow:hidden;}</style>
</head>
<body>
<div style="position:relative;width:${W}px;height:${H}px;${bgStyle}font-family:'Inter',sans-serif;">

  <!-- Layer 2: Cinematic gradient — transparent top reveals image, near-black bottom anchors text -->
  <div style="position:absolute;inset:0;background:linear-gradient(to bottom,
    ${p.overlayTop} 0%,
    rgba(0,0,0,0.06) 18%,
    ${p.overlayMid} 40%,
    rgba(7,18,28,0.82) 58%,
    ${p.overlayBot} 100%
  );"></div>

  <!-- Layer 3: Edge vignette — depth and cinematic focus -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,transparent 35%,rgba(0,0,0,0.40) 100%);"></div>

  <!-- Layer 4: Full-width hairline — stages image zone above, text zone below -->
  <div style="position:absolute;top:${hairlineY}%;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 0%,${p.accent}55 15%,${p.accent}55 85%,transparent 100%);z-index:6;"></div>

  <!-- Layer 5: Corner brackets -->
  ${cornerBracketsEl(p, isStory)}

  <!-- Layer 6: Main layout -->
  <div style="position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;padding:${pad.top}px ${pad.side}px ${pad.bottom}px ${pad.side}px;">

    <!-- TOP BAR: logo + badge box -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;">
      ${logoEl(isStory)}
      ${badgeBoxEl(badge, 'Instagram', p, isStory)}
    </div>

    <!-- IMAGE HERO ZONE — image breathes here, gradient controls atmosphere -->
    <div style="flex:1;"></div>

    <!-- ACCENT LINE — thin horizontal anchor marking start of text block -->
    ${accentLineEl(p, isStory)}

    <!-- HOOK — 4–5 words, maximum tension, DM Mono small caps -->
    ${hook ? `<div style="font-family:'DM Mono',monospace;font-size:${isStory ? '20px' : '13px'};color:${p.accent};letter-spacing:0.22em;text-transform:uppercase;margin-bottom:${isStory ? '22px' : '14px'};text-shadow:0 1px 8px rgba(0,0,0,0.90);">${esc(hook)}</div>` : ''}

    <!-- H1 — massive Cormorant Garamond, dominates the bottom of the frame -->
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:${h1Size};font-weight:700;line-height:1.01;color:${p.text};letter-spacing:-0.022em;text-shadow:0 3px 24px rgba(0,0,0,0.90),0 1px 6px rgba(0,0,0,0.60);margin-bottom:${isStory ? '42px' : '26px'};">${headlineHtml}</h1>

    <!-- CTA — outlined, accent border, accent arrow -->
    ${ctaOutlined(cta, p, isStory)}

  </div>

  <!-- Layer 7: Watermark -->
  ${watermarkEl(p, isStory)}

</div>
</body></html>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// FACEBOOK TEMPLATE — Magazine editorial authority.
//
// Layers (bottom → top):
//   1. Background image (full bleed)
//   2. Diagonal editorial overlay — strong, image becomes texture
//   3. Subtle accent glow (top-right corner bloom)
//   4. Left gradient bar (4px) — authority / brand anchor
//   5. Layout: top bar | 1px separator | [editorial block] | CTA
//   6. Watermark (centered, ultra-subtle)
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

  const charCount = (headline || '').length;
  const h1Size = isStory
    ? (charCount > 40 ? '76px' : charCount > 28 ? '94px' : '112px')
    : (charCount > 40 ? '52px' : charCount > 28 ? '66px' : '80px');

  // Bullets with teal dot
  const bulletsHtml = Array.isArray(bullets) && bullets.length > 0
    ? bullets.slice(0, 3).map(b => `
      <div style="display:flex;align-items:flex-start;gap:${isStory ? '16px' : '10px'};margin-bottom:${isStory ? '11px' : '7px'};">
        <div style="width:${isStory ? '6px' : '4px'};height:${isStory ? '6px' : '4px'};border-radius:50%;background:${p.accent};flex-shrink:0;margin-top:${isStory ? '15px' : '8px'};"></div>
        <span style="font-family:'Inter',sans-serif;font-size:${isStory ? '26px' : '15px'};color:${p.textBody};line-height:1.55;font-weight:300;">${esc(b)}</span>
      </div>`).join('')
    : '';

  // Pillar words — sanitized, no numbers or punctuation
  const rawPillars = Array.isArray(stats) && stats.length > 0 ? stats : [
    { value: 'Structured' }, { value: 'Systematic' }, { value: 'Scalable' },
  ];
  const pillarsHtml = rawPillars
    .map(s => sanitizeWord(s.value))
    .filter(v => v.length > 0)
    .slice(0, 3)
    .map((v, i) =>
      `<span style="font-family:'DM Mono',monospace;font-size:${isStory ? '14px' : '9px'};color:${i === 1 ? p.accent2 : p.accent};letter-spacing:0.20em;text-transform:uppercase;">${esc(v)}</span>`
    ).join(`<span style="color:${p.textMuted};margin:0 ${isStory ? '14px' : '9px'};">·</span>`);

  const pad = isStory ? { top: 66, side: 86, bottom: 74 } : { top: 46, side: 66, bottom: 52 };
  // Indent content past the left bar
  const leftBarW = isStory ? 6 : 4;
  const contentPadLeft = pad.side + leftBarW + (isStory ? 10 : 6);

  return `<!DOCTYPE html><html>
<head><meta charset="UTF-8">${FONTS_LINK}
<style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:${W}px;height:${H}px;overflow:hidden;}</style>
</head>
<body>
<div style="position:relative;width:${W}px;height:${H}px;${bgStyle}font-family:'Inter',sans-serif;">

  <!-- Layer 2: Editorial overlay — diagonal gradient, image becomes rich texture -->
  <div style="position:absolute;inset:0;background:linear-gradient(148deg,
    ${p.fbOverlay} 0%,
    rgba(5,12,22,0.82) 45%,
    rgba(5,12,22,0.93) 100%
  );"></div>

  <!-- Layer 3: Subtle accent bloom — top right, adds brand color depth -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 15%,${p.glowColor} 0%,transparent 52%);"></div>

  <!-- Layer 4: Left gradient bar — 4px brand authority anchor -->
  <div style="position:absolute;top:0;left:0;width:${leftBarW}px;height:100%;background:linear-gradient(180deg,${p.accent} 0%,${p.accent2}99 55%,transparent 100%);z-index:5;"></div>

  <!-- Layer 5: Main layout -->
  <div style="position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;justify-content:space-between;padding:${pad.top}px ${pad.side}px ${pad.bottom}px ${contentPadLeft}px;">

    <!-- TOP BAR: logo + badge box -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;">
      ${logoEl(isStory)}
      ${badgeBoxEl(badge, 'Facebook', p, isStory)}
    </div>

    <!-- EDITORIAL CONTENT BLOCK -->
    <div>

      <!-- 1px separator line — divides header from editorial zone -->
      <div style="width:100%;height:1px;background:linear-gradient(90deg,${p.accent}55,transparent);margin-bottom:${isStory ? '28px' : '16px'};"></div>

      <!-- HOOK — sets context and urgency -->
      ${subheadline ? `<div style="font-family:'DM Mono',monospace;font-size:${isStory ? '16px' : '10px'};color:${p.accent};letter-spacing:0.24em;text-transform:uppercase;margin-bottom:${isStory ? '16px' : '10px'};">${esc(subheadline.toUpperCase())}</div>` : ''}

      <!-- H1 — strong serif, focal authority -->
      <h1 style="font-family:'Cormorant Garamond',serif;font-size:${h1Size};font-weight:700;line-height:1.06;color:${p.text};letter-spacing:-0.015em;text-shadow:0 2px 14px rgba(0,0,0,0.55);margin-bottom:${isStory ? '24px' : '14px'};">${headlineHtml}</h1>

      <!-- Gradient separator — editorial style, fades to transparent -->
      ${separatorEl(p, isStory)}

      <!-- Description — one focused narrative sentence -->
      ${description ? `<p style="font-family:'Inter',sans-serif;font-size:${isStory ? '25px' : '15px'};color:${p.textBody};line-height:1.65;font-weight:300;letter-spacing:0.008em;margin-bottom:${isStory ? '22px' : '13px'};">${esc(description)}</p>` : ''}

      <!-- Bullets — specific outcomes, teal dot indicator -->
      ${bulletsHtml ? `<div style="margin-bottom:${isStory ? '22px' : '13px'};">${bulletsHtml}</div>` : ''}

      <!-- Pillar words — DM Mono qualitative labels, inline -->
      <div style="margin-bottom:${isStory ? '32px' : '18px'};">${pillarsHtml}</div>

      <!-- CTA -->
      ${ctaOutlined(cta, p, isStory)}

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
