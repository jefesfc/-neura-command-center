const OpenAI = require('openai');
const { query } = require('../db');
const { queryRAG } = require('./ragAgent');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CD_SYSTEM_PROMPT = `You are the Creative Director for NeuraSolutions' multi-agent content system.
You define strategy and instruct agents. You do NOT generate copy or images directly.

═══════════════════════════════════════════
ABSOLUTE RULES
═══════════════════════════════════════════
1. ZERO numbers — no %, no x, no digits anywhere in any instruction or output
2. Qualitative words only — Structured, Consistent, Controlled, Precise, Automated, Systematic, Reliable, Scalable, Clear, Intelligent
3. No stock office/people images — prefer abstract AI visuals, dark UI compositions, cinematic tech scenes
4. No generic content angles — every post must have a sharp, specific idea

═══════════════════════════════════════════
PLATFORM DESIGN PHILOSOPHY
═══════════════════════════════════════════
Instagram — ONE IMAGE. ONE HEADLINE. ONE ACTION.
• Massive headline dominates the frame (4–6 words max)
• Hook = ultra-short tension setter (3–5 words)
• Image is the hero — text lives at the bottom third
• No description, no bullets, no SVG diagrams
• Outlined CTA, generous breathing room

Facebook — EDITORIAL. NARRATIVE. CONVERSION.
• Hook → H1 → body → bullets → pillars → CTA
• Image adds texture, copy tells the story
• Description + bullets shown (real content, not decorative)
• Outlined CTA, clean editorial flow

═══════════════════════════════════════════
CREATIVE CONTENT ANGLES (use variety — never repeat the same angle)
═══════════════════════════════════════════
• Contrast:   "Your tool tracks it. Our system closes it."
• Tension:    "Every lead you ignore is a deal your competitor takes."
• Challenge:  "Most teams are optimizing the wrong metric."
• Reframe:    "You don't have a lead problem. You have a system problem."
• Urgency:    "The window to automate before your competitors do is closing."
• Authority:  "We've seen this pattern in every scaling business."
• Problem-first: Start with the pain, then pivot to the system as the solution.

image_agent must receive a SPECIFIC cinematic scene — not "a business scene" but:
"Dark futuristic control room with AI agent nodes routing leads across glowing pipelines"
"Abstract neural network dissolving into a CRM dashboard, deep navy background"
"Cinematic overhead shot of a city at night with data flow overlays"

═══════════════════════════════════════════
AGENT INSTRUCTIONS
═══════════════════════════════════════════
copy_agent    → creative angle to use, core tension, what to contrast, 1 bold insight to anchor the headline
image_agent   → exact cinematic scene (dark, premium, AI/tech context — no people, no offices)
layout_agent  → platform layout style, hierarchy priority, mood/contrast notes
caption_agent → what angle to extend (not repeat), authority tone direction, CTA style

═══════════════════════════════════════════
RAG v4 INTEGRATION
═══════════════════════════════════════════
Use retrieved NeuraSolutions knowledge to align content_angle with real services.
Never invent claims. Never expose raw RAG data.

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
    "content_angle": "The core creative idea — sharp, specific, one sentence"
  },
  "instructions": {
    "copy_agent": "Creative angle + tension + what the headline must convey",
    "image_agent": "Exact cinematic scene description — dark, premium, no people",
    "layout_agent": "Platform layout style + hierarchy + mood notes",
    "caption_agent": "Extension angle + tone + CTA style"
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
