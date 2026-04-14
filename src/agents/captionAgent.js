const OpenAI = require('openai');
const { query } = require('../db');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are the Caption Agent for NeuraSolutions — a B2B AI systems company.

═══════════════════════════════════════════
ROLE
═══════════════════════════════════════════
Write premium B2B captions that EXTEND the post message — never repeat it.
Build authority, add depth, and drive action.

═══════════════════════════════════════════
ABSOLUTE RULES
═══════════════════════════════════════════
• Zero numbers — no %, no digits, no numeric claims anywhere in the caption
• Never repeat the post headline, subheadline, or bullets verbatim
• No emojis · No fluff · No hype · No clichés · No generic phrases
• Tone: premium · direct · confident · B2B · authority-driven

═══════════════════════════════════════════
CAPTION STRUCTURE (MANDATORY ORDER)
═══════════════════════════════════════════
1. Hook         — scroll-stopping first line, direct statement (not a question unless razor-sharp)
2. Body         — expand the idea, connect to a real business problem, show authority (short paragraphs)
3. Soft CTA     — invite reflection or next step (middle of caption)
4. Hard CTA     — clear action: "Book a system strategy call" / "DM to see how this applies to your business"
5. Hashtags     — 5-10 max, relevant to: AI · automation · B2B · business systems · growth

═══════════════════════════════════════════
PLATFORM
═══════════════════════════════════════════
Instagram → structured, well-spaced, strong opening, tighter body
Facebook  → slightly more explanatory, still concise and block-based

Always return valid JSON only. No text outside the JSON.`;

async function runCaptionAgent({ headline, bullets, cta, system, brief, postId }) {
  const model = process.env.OPENAI_MODEL_CAPTION || 'gpt-4o-mini';

  const userPrompt = `
System: ${system}
Headline: ${headline}
Key points: ${(bullets || []).join(' | ')}
CTA: ${cta}
Original brief: ${brief}

Write a premium B2B caption in ENGLISH following the mandatory structure: hook → expansion → insight → soft CTA → hard CTA → hashtags.

Return ONLY this JSON:
{
  "caption": {
    "hook": "First scroll-stopping line (1-2 sentences)",
    "body": "Expansion + insight paragraphs with short rhythm, no emojis, no fluff (max 200 chars)",
    "soft_cta": "Middle reflection or action invite (1 sentence)",
    "hard_cta": "Clear next step, e.g. Book a system strategy call / DM to see how this applies to your business",
    "hashtags": ["#tag1", "#tag2"]
  }
}`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.65,
  });

  const usage = response.usage;
  const result = JSON.parse(response.choices[0].message.content);

  // Cost: GPT-4o-mini $0.15/1M in, $0.60/1M out
  const costUsd = (usage.prompt_tokens * 0.15 + usage.completion_tokens * 0.60) / 1_000_000;

  await query(
    `INSERT INTO token_usage (provider, model, feature, tokens_in, tokens_out, cost_usd, post_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    ['openai', model, 'caption', usage.prompt_tokens, usage.completion_tokens, costUsd, postId || null]
  );

  return result;
}

module.exports = { runCaptionAgent };
