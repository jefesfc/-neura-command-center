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
  'neura':      'Neura',
  'ai-agents':  'AI Agents',
  'crm':        'AI CRM',
  'rag':        'RAG',
  'ai':         'AI',
};

// ── System flow diagrams (SVG Creative Blocks) ───────────────────────────────
const SYSTEM_FLOWS = {
  'sistema-01': ['Capture', 'Score',    'Nurture',     'Close'],
  'sistema-02': ['Lead In', 'Qualify',  'Follow-up',   'Convert'],
  'sistema-03': ['Connect', 'Automate', 'Orchestrate', 'Scale'],
  'neura':      ['Diagnose','Design',   'Build',        'Deploy'],
  'ai-agents':  ['Assign',  'Execute',  'Report',       'Learn'],
  'crm':        ['Contact', 'Score',    'Action',       'Close'],
  'rag':        ['Query',   'Retrieve', 'Answer',       'Refine'],
  'ai':         ['Assess',  'Plan',     'Deploy',       'Optimize'],
};

const PALETTES = {
  navy: {
    // Transparent top (image visible) → dark bottom (text readable)
    overlay:        'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.18) 30%, rgba(7,18,28,0.72) 58%, rgba(7,18,28,0.94) 100%)',
    fallbackBg:     '#0b1e2d',
    accent:         '#1fa2b8',
    accent2:        '#c98a5a',
    text:           '#ffffff',
    textMuted:      'rgba(255,255,255,0.68)',
    badgeColor:     '#c98a5a',
    badgeBorder:    'rgba(201,138,90,0.50)',
    separatorColor: 'rgba(31,162,184,0.22)',
    watermarkColor: 'rgba(255,255,255,0.25)',
  },
  gold: {
    overlay:        'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.18) 30%, rgba(12,8,2,0.72) 58%, rgba(12,8,2,0.94) 100%)',
    fallbackBg:     '#130e04',
    accent:         '#d4a040',
    accent2:        '#f0d080',
    text:           '#f8f2e4',
    textMuted:      'rgba(248,242,228,0.72)',
    badgeColor:     '#d4a040',
    badgeBorder:    'rgba(212,160,64,0.50)',
    separatorColor: 'rgba(212,160,64,0.25)',
    watermarkColor: 'rgba(248,242,228,0.28)',
  },
  grey: {
    overlay:        'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.18) 30%, rgba(6,6,12,0.72) 58%, rgba(6,6,12,0.94) 100%)',
    fallbackBg:     '#08080e',
    accent:         '#8fa8be',
    accent2:        '#1fa2b8',
    text:           '#f0f4f8',
    textMuted:      'rgba(240,244,248,0.68)',
    badgeColor:     '#8fa8be',
    badgeBorder:    'rgba(143,168,190,0.42)',
    separatorColor: 'rgba(143,168,190,0.22)',
    watermarkColor: 'rgba(240,244,248,0.26)',
  },
};

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── SVG flow diagram builder ─────────────────────────────────────────────────
function buildFlowSVG(steps, accentColor, isStory) {
  if (!steps || steps.length === 0) return '';

  const W       = 700;
  const dotY    = isStory ? 26 : 18;
  const labelY  = isStory ? 54 : 38;
  const fs      = isStory ? 22 : 11;
  const dotR    = isStory ? 10 : 5;
  const svgH    = isStory ? 74 : 48;
  const margin  = 50;
  const gap     = (W - 2 * margin) / (steps.length - 1);

  let inner = '';

  steps.forEach((label, i) => {
    const cx     = margin + i * gap;
    const isLast = i === steps.length - 1;
    const color  = i % 2 === 0 ? accentColor : accentColor + 'bb';

    // Dashed line + arrowhead to next node
    if (!isLast) {
      const nx      = margin + (i + 1) * gap;
      const lineX1  = cx + dotR + 5;
      const lineX2  = nx - dotR - 8;
      const arrowX  = nx - dotR - 2;
      inner += `<line x1="${lineX1}" y1="${dotY}" x2="${lineX2}" y2="${dotY}" stroke="${accentColor}40" stroke-width="1" stroke-dasharray="4 3"/>`;
      inner += `<polygon points="${arrowX},${dotY - 3} ${arrowX + 6},${dotY} ${arrowX},${dotY + 3}" fill="${accentColor}60"/>`;
    }

    // Node dot
    inner += `<circle cx="${cx}" cy="${dotY}" r="${dotR}" fill="${color}" opacity="0.85"/>`;

    // Node label
    inner += `<text x="${cx}" y="${labelY}" text-anchor="middle" font-family="DM Mono,monospace" font-size="${fs}" fill="rgba(255,255,255,0.38)" letter-spacing="0.10em">${label.toUpperCase()}</text>`;
  });

  return `<svg viewBox="0 0 ${W} ${svgH}" width="100%" height="${svgH}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${inner}</svg>`;
}

// ── Main template ─────────────────────────────────────────────────────────────
function buildPostHTML({
  headline, headline_accent, subheadline,
  stats, description, bullets, cta,
  system, imageB64,
  format   = '1:1',
  palette  = 'navy',
  platform = 'Instagram',
}) {
  const isStory  = format === '9:16';
  const isIG     = (platform || 'Instagram').toLowerCase() === 'instagram';
  const width    = 1080;
  const height   = isStory ? 1920 : 1080;
  const badge    = SYSTEM_BADGE[system] || 'Neura';
  const p        = PALETTES[palette] || PALETTES.navy;

  // ── Platform layout rules ──────────────────────────────────────────────────
  // Instagram: visual-first — minimum text, no description, no bullets
  // Facebook:  informative — description (1 line) + bullets if present
  const showDescription = !isIG && !!description;
  const showBullets     = !isIG && Array.isArray(bullets) && bullets.length > 0;

  // ── Background ─────────────────────────────────────────────────────────────
  const bgStyle = imageB64
    ? `background-image:url('data:image/jpeg;base64,${imageB64}');background-size:cover;background-position:center;`
    : `background:${p.fallbackBg};`;

  const logoHtml = LOGO_B64
    ? `<img src="data:image/png;base64,${LOGO_B64}" alt="Neura" class="logo-img"/>`
    : `<span class="logo-text">NEURA</span>`;

  // ── Headline with accent span ──────────────────────────────────────────────
  let headlineHtml = esc(headline);
  if (headline_accent && headline && headline.includes(headline_accent)) {
    const idx    = headline.indexOf(headline_accent);
    const before = headline.slice(0, idx);
    const after  = headline.slice(idx + headline_accent.length);
    headlineHtml = `${esc(before)}<span style="color:${p.accent}">${esc(headline_accent)}</span>${esc(after)}`;
  }

  // ── Qualitative pillars (no numbers) ──────────────────────────────────────
  const pillars = Array.isArray(stats) && stats.length > 0 ? stats : [
    { value: 'Structured', label: 'Operations' },
    { value: 'Consistent', label: 'Execution'  },
    { value: 'Controlled', label: 'Pipeline'   },
  ];
  const pillarCells = pillars.map((s, i) => {
    const col    = i === 1 ? p.accent2 : p.accent;
    const border = i < pillars.length - 1 ? `border-right:1px solid rgba(255,255,255,0.08);` : '';
    return `<div style="flex:1;padding:${isStory ? '18px 0' : '12px 0'};text-align:center;${border}">
      <div style="font-family:'DM Mono',monospace;font-size:${isStory ? '26px' : '15px'};font-weight:500;color:${col};letter-spacing:0.08em;text-transform:uppercase;line-height:1;">${esc(s.value)}</div>
      <div style="font-size:${isStory ? '18px' : '12px'};color:rgba(255,255,255,0.40);margin-top:6px;letter-spacing:0.10em;text-transform:uppercase;">${esc(s.label)}</div>
    </div>`;
  }).join('');

  // ── SVG system flow diagram ────────────────────────────────────────────────
  const flowSteps  = SYSTEM_FLOWS[system] || ['Input', 'Process', 'Automate', 'Output'];
  const flowSVG    = buildFlowSVG(flowSteps, p.accent, isStory);
  const flowBlock  = `<div style="margin:${isStory ? '36px 0 28px' : '20px 0 16px'};opacity:0.90;">${flowSVG}</div>`;

  // ── Bullets (Facebook only) ────────────────────────────────────────────────
  const bulletsHtml = showBullets
    ? `<div style="display:flex;flex-direction:column;gap:${isStory ? '14px' : '8px'};margin-bottom:${isStory ? '24px' : '14px'};">
        ${bullets.map(b => `
          <div style="display:flex;align-items:center;gap:${isStory ? '14px' : '9px'};">
            <div style="width:${isStory ? '20px' : '12px'};height:1px;background:${p.accent};flex-shrink:0;opacity:0.7;"></div>
            <span style="font-size:${isStory ? '26px' : '17px'};color:rgba(255,255,255,0.78);line-height:1.4;">${esc(b)}</span>
          </div>`).join('')}
      </div>`
    : '';

  // ── Font sizes ─────────────────────────────────────────────────────────────
  // Instagram: larger headline, more breathing room
  const headlineFontSize = isStory
    ? (headline && headline.length > 40 ? '74px' : '88px')
    : isIG
      ? (headline && headline.length > 40 ? '54px' : '64px')
      : (headline && headline.length > 40 ? '48px' : '58px');

  const subFontSize  = isStory ? '30px' : '16px';
  const descFontSize = isStory ? '32px' : '18px';
  const ctaFontSize  = isStory ? '24px' : '15px';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${width}px; height:${height}px; overflow:hidden; }
  .post {
    position:relative;
    width:${width}px;
    height:${height}px;
    ${bgStyle}
    font-family:'Inter',sans-serif;
  }
  .overlay {
    position:absolute;
    inset:0;
    background:${p.overlay};
  }
  .left-bar {
    position:absolute;
    top:0; left:0;
    width:3px; height:100%;
    background:linear-gradient(180deg,${p.accent} 0%,transparent 100%);
    z-index:5;
  }
  .content {
    position:relative;
    z-index:10;
    display:flex;
    flex-direction:column;
    height:100%;
    padding:${isStory ? '72px 80px 96px 86px' : '52px 64px 72px 70px'};
  }
  .top-bar {
    display:flex;
    align-items:center;
    justify-content:space-between;
    margin-bottom:${isStory ? '14px' : '10px'};
  }
  .logo-img {
    height:${isStory ? '50px' : '36px'};
    width:auto;
    object-fit:contain;
  }
  .logo-text {
    font-family:'Cormorant Garamond',serif;
    font-size:${isStory ? '42px' : '32px'};
    font-weight:700;
    letter-spacing:0.14em;
    color:#ffffff;
  }
  .badge {
    font-family:'DM Mono',monospace;
    font-size:${isStory ? '20px' : '13px'};
    font-weight:500;
    color:${p.badgeColor};
    letter-spacing:0.10em;
    text-transform:uppercase;
    border:1.5px solid ${p.badgeBorder};
    padding:${isStory ? '9px 20px' : '5px 13px'};
    border-radius:3px;
    background:rgba(0,0,0,0.25);
    display:inline-flex;
    align-items:center;
    justify-content:center;
    white-space:nowrap;
  }
  /* Platform label — small tag showing IG / FB */
  .platform-tag {
    font-family:'DM Mono',monospace;
    font-size:${isStory ? '16px' : '10px'};
    color:rgba(255,255,255,0.22);
    letter-spacing:0.14em;
    text-transform:uppercase;
    margin-top:${isStory ? '6px' : '4px'};
    text-align:right;
  }
  .main {
    flex:1;
    display:flex;
    flex-direction:column;
    justify-content:center;
    gap:${isStory ? '24px' : '14px'};
  }
  .subheadline {
    font-family:'DM Mono',monospace;
    font-size:${subFontSize};
    color:${p.accent};
    letter-spacing:0.15em;
    text-transform:uppercase;
    text-shadow:0 1px 8px rgba(0,0,0,0.60);
  }
  .headline {
    font-family:'Cormorant Garamond',serif;
    font-size:${headlineFontSize};
    font-weight:700;
    line-height:1.08;
    color:${p.text};
    letter-spacing:-0.02em;
    text-shadow:0 2px 16px rgba(0,0,0,0.70), 0 1px 4px rgba(0,0,0,0.50);
  }
  .description {
    font-size:${descFontSize};
    color:rgba(255,255,255,0.72);
    line-height:1.5;
    margin-bottom:${isStory ? '20px' : '12px'};
    font-weight:300;
    letter-spacing:0.01em;
  }
  .pillars-row {
    display:flex;
    border:1px solid rgba(255,255,255,0.08);
    border-radius:4px;
    overflow:hidden;
    margin-top:${isStory ? '8px' : '4px'};
  }
  .bottom-sep {
    width:100%;
    height:1px;
    background:${p.separatorColor};
    margin-top:auto;
    margin-bottom:${isStory ? '30px' : '18px'};
  }
  .bottom-bar {
    display:flex;
    align-items:center;
    justify-content:center;
    position:relative;
  }
  .cta-btn {
    background:${p.accent};
    padding:${isStory ? '10px 32px' : '7px 20px'};
    border-radius:2px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    width:fit-content;
  }
  .cta-text {
    font-family:'Inter',sans-serif;
    font-size:${ctaFontSize};
    font-weight:600;
    color:#070c12;
    letter-spacing:0.10em;
    text-transform:uppercase;
    line-height:1;
    white-space:nowrap;
  }
  .watermark {
    position:absolute;
    bottom:${isStory ? '36px' : '22px'};
    right:${isStory ? '86px' : '70px'};
    font-family:'DM Mono',monospace;
    font-size:${isStory ? '17px' : '11px'};
    color:${p.watermarkColor};
    letter-spacing:0.10em;
    z-index:15;
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
      <div>
        <div class="badge">${badge}</div>
        <div class="platform-tag">${isIG ? 'Instagram' : 'Facebook'}</div>
      </div>
    </div>

    <div class="main">
      ${subheadline ? `<div class="subheadline">${esc(subheadline)}</div>` : ''}
      <h1 class="headline">${headlineHtml}</h1>

      ${showDescription ? `<p class="description">${esc(description)}</p>` : ''}

      ${bulletsHtml}

      ${flowBlock}

      <div class="pillars-row">${pillarCells}</div>
    </div>

    <div class="bottom-sep"></div>
    <div class="bottom-bar">
      <div class="cta-btn">
        <span class="cta-text">${esc((cta || '').replace(/\s*→+\s*$/, '').trim())} →</span>
      </div>
    </div>

  </div>
  <span class="watermark">neurasolutions.cloud</span>
</div>
</body>
</html>`;
}

module.exports = { buildPostHTML };
