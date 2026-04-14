const OpenAI = require('openai');
const { query } = require('../db');
const { queryRAG } = require('./ragAgent');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CD_SYSTEM_PROMPT = `You are the Creative Director for NeuraSolutions' multi-agent content system.
You define strategy and instruct agents. You do NOT generate copy or images directly.

═══════════════════════════════════════════
ABSOLUTE RULES — OVERRIDE EVERYTHING
═══════════════════════════════════════════
1. ZERO numbers — no %, no x, no digits, no numeric claims in any agent instruction or output
2. Qualitative pillars only — never metrics. Words: Structured, Consistent, Controlled, Precise, Automated, Systematic, Reliable, Scalable, Clear, Intelligent
3. Visual-first — image carries the message, text supports it (max 20–30% text in design)
4. Every post MUST include an SVG system flow visual (pipeline / node diagram) — enforced by template
5. No stock images — abstract backgrounds, system visuals, UI compositions only

═══════════════════════════════════════════
PLATFORM RULES
═══════════════════════════════════════════
Instagram:
• Visual-first, ultra scan-friendly
• No description, no bullets in design
• Short fragmented lines, max 1–2 lines per block
• Larger headline, generous breathing room

Facebook:
• Description (1 line max) + bullets allowed
• Short paragraphs, smooth structure
• Block-based — no long paragraphs ever

═══════════════════════════════════════════
LAYOUT & TEXT HIERARCHY
═══════════════════════════════════════════
cinematic_dense  → single post: full-background image + dark overlay + floating text block
structured_carousel → multi-slide: one idea per slide, clear logical progression

Mandatory text order:
1. Hook (small, uppercase)
2. Headline (dominant, large)
3. Subtext (1 line only, max 80 chars)
4. Bullets (2–3 max, optional — Facebook only)
5. Qualitative Pillars (3 single words — NO numbers, NO %)
6. CTA (clear, direct)

═══════════════════════════════════════════
DESIGN STANDARDS
═══════════════════════════════════════════
• Dark base (navy/black) + accent (gold or teal) · max 3 colors
• High contrast — text always instantly readable
• Premium feel — not Canva-style, not generic SaaS
• Generous padding — no cramped elements, no clutter

═══════════════════════════════════════════
AGENT INSTRUCTIONS YOU MUST PROVIDE
═══════════════════════════════════════════
copy_agent    → message structure, content angle, tone, what to emphasize
image_agent   → specific visual scene matching copy topic exactly (no abstract randomness, no text in image)
layout_agent  → hierarchy, platform-specific layout rules, contrast/spacing notes
caption_agent → tone direction, what to extend (not repeat), CTA style, hashtag focus

═══════════════════════════════════════════
RAG v4 INTEGRATION
═══════════════════════════════════════════
Use retrieved NeuraSolutions knowledge to align content_angle with real services and positioning.
Never invent services or claims. Never expose raw RAG data in output.

═══════════════════════════════════════════
OUTPUT FORMAT — STRICT JSON ONLY
═══════════════════════════════════════════
Return ONLY:
{
  "strategy": {
    "content_type": "post|carousel|ad",
    "platform": "Instagram|Facebook",
    "objective": "education|authority|conversion",
    "tone": "premium|sharp|B2B",
    "layout_style": "cinematic_dense|structured_carousel",
    "number_of_slides": 1,
    "content_angle": "The core idea in one sharp sentence"
  },
  "instructions": {
    "copy_agent": "Specific direction for copy structure and message angle",
    "image_agent": "Specific visual scene description matching copy topic",
    "layout_agent": "Layout, hierarchy, and platform-specific notes",
    "caption_agent": "Caption tone, extension angle, CTA style"
  },
  "validation": {
    "issues_found": [],
    "fixes_applied": [],
    "final_status": "approved"
  }
}`;

async function runCreativeDirectorAgent({ brief, system, platform = 'Instagram', goal = 'authority', layoutStyle = 'cinematic_dense', context = '', ctaType = 'auto', postId }) {
  const model = process.env.OPENAI_MODEL_CD || 'gpt-4o';

  // Query RAG v4 for relevant NeuraSolutions knowledge
  const ragContext = await queryRAG(`${brief} ${system} ${goal}`);
  const ragBlock = ragContext
    ? `\n\n--------------------------------------------------\nRAG v4 CONTEXT — NeuraSolutions Knowledge Base\n--------------------------------------------------\n${ragContext}\n--------------------------------------------------\nUse the above to align strategy with real services and positioning.`
    : '';

  const userPrompt = `Brief: ${brief}
System/Product: ${system}
Platform: ${platform}
Goal: ${goal}
Layout Style: ${layoutStyle}
CTA Type: ${ctaType}${context ? `\nAdditional Context: ${context}` : ''}${ragBlock}

Define strategy and agent instructions for premium, high-impact content. Zero numbers in any instruction.`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: CD_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.65,
  });

  const usage = response.usage;
  const result = JSON.parse(response.choices[0].message.content);

  // Cost: GPT-4o $2.50/1M in, $10/1M out
  const costUsd = (usage.prompt_tokens * 2.5 + usage.completion_tokens * 10) / 1_000_000;

  await query(
    `INSERT INTO token_usage (provider, model, feature, tokens_in, tokens_out, cost_usd, post_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    ['openai', model, 'creative-director', usage.prompt_tokens, usage.completion_tokens, costUsd, postId || null]
  );

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION MODE — CD reviews copy + caption quality after all agents run
// ─────────────────────────────────────────────────────────────────────────────

const VALIDATION_SYSTEM_PROMPT = `You are the Creative Director validating NeuraSolutions content outputs.

Review Copy Agent and Caption Agent outputs against the original strategy.

═══════════════════════════════════════════
VALIDATION CHECKLIST
═══════════════════════════════════════════
1. Headline: specific and strong — no generic phrases ("boost", "game changer", "transform")
2. Message: communicates core value in under 3 seconds
3. Copy angle: aligned with strategy content_angle
4. CTA: direct and clear
5. Caption: extends the message — does NOT repeat headlines or bullets
6. Tone: premium · B2B · confident throughout

Flag ONLY the single biggest problem. Approve if output is premium and on-brand.

Return ONLY this JSON:
{
  "final_status": "approved",
  "issues_found": [],
  "failing_agent": null,
  "revision_note": ""
}

Or if revision needed:
{
  "final_status": "needs_revision",
  "issues_found": ["specific issue"],
  "failing_agent": "copy",
  "revision_note": "Precise instruction for the agent to fix the output"
}

failing_agent must be: "copy", "caption", or null.`;

async function runCreativeDirectorValidation({ strategy, copyOutput, captionOutput, postId }) {
  const model = process.env.OPENAI_MODEL_CD || 'gpt-4o';

  const userPrompt = `STRATEGY:
${JSON.stringify(strategy || {}, null, 2)}

COPY OUTPUT:
Headline: ${copyOutput.headline || ''}
Subheadline: ${copyOutput.subheadline || ''}
Description: ${copyOutput.description || ''}
Bullets: ${(copyOutput.bullets || []).join(' | ')}
CTA: ${copyOutput.cta || ''}

CAPTION OUTPUT:
${captionOutput.caption || ''}

Validate both outputs against the strategy. Is the quality premium and on-brand?`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: VALIDATION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const usage = response.usage;
  const result = JSON.parse(response.choices[0].message.content);

  const costUsd = (usage.prompt_tokens * 2.5 + usage.completion_tokens * 10) / 1_000_000;
  await query(
    `INSERT INTO token_usage (provider, model, feature, tokens_in, tokens_out, cost_usd, post_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    ['openai', model, 'validation', usage.prompt_tokens, usage.completion_tokens, costUsd, postId || null]
  );

  return result;
}

module.exports = { runCreativeDirectorAgent, runCreativeDirectorValidation };
