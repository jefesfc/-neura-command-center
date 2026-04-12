const OpenAI = require('openai');
const { query } = require('../db');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_LABELS = {
  'sistema-01': 'Sistema 01 — AI Lead Engine',
  'sistema-02': 'Sistema 02 — AI Conversion Engine',
  'sistema-03': 'Sistema 03 — AI Operating System',
};

const SYSTEM_PROMPT = `You are the Copy Agent for NeuraSolutions — an AI automation company that transforms Latin American businesses.
Brand: NeuraSolutions. Tone: Premium, direct, intelligent, results-focused. No unnecessary jargon.
Brand colors: Navy #0b1e2d, Teal #1fa2b8, Gold #c98a5a.
Brand fonts: Cormorant Garamond (headings), Inter (body).

You write high-impact social media copy (Instagram, Facebook) ALWAYS in English.
Your copy is benefit-driven, marketing-trained, and explains the brief with depth and clarity.
Every bullet must communicate a concrete, specific benefit or transformation — not vague statements.
Always return valid JSON only. No text outside the JSON.`;

async function runCopyAgent({ brief, system, tone, postId }) {
  const systemLabel = SYSTEM_LABELS[system] || system;
  const model = process.env.OPENAI_MODEL_COPY || 'gpt-4o';

  const userPrompt = `
Post brief: ${brief}
System: ${systemLabel}
Tone: ${tone || 'professional, premium, direct'}

Write high-impact social media post copy in ENGLISH. The copy must clearly explain and expand on the brief — not summarize it vaguely.
Each bullet point must be a specific, compelling benefit or outcome the audience will experience.
Think like a senior marketing strategist: headline grabs attention, bullets sell the transformation, CTA drives action.

Return ONLY this JSON:
{
  "headline": "Bold, attention-grabbing headline that captures the core promise (max 60 chars)",
  "bullets": [
    "Specific benefit or outcome #1 — concrete and compelling (max 12 words)",
    "Specific benefit or outcome #2 — concrete and compelling (max 12 words)",
    "Specific benefit or outcome #3 — concrete and compelling (max 12 words)"
  ],
  "cta": "Action-oriented CTA that creates urgency (max 40 chars)",
  "image_prompt": "Cinematic background image prompt in English: abstract tech, data flows, dark navy atmosphere, premium aesthetic, no text, ultra HD"
}`;

  const t0 = Date.now();
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  });

  const usage = response.usage;
  const result = JSON.parse(response.choices[0].message.content);

  // Cost: GPT-4o $2.50/1M in, $10/1M out
  const costUsd = (usage.prompt_tokens * 2.5 + usage.completion_tokens * 10) / 1_000_000;

  await query(
    `INSERT INTO token_usage (provider, model, feature, tokens_in, tokens_out, cost_usd, post_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    ['openai', model, 'copy', usage.prompt_tokens, usage.completion_tokens, costUsd, postId || null]
  );

  return result;
}

module.exports = { runCopyAgent };
