const OpenAI = require('openai');
const { query } = require('../db');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are the Caption Agent for NeuraSolutions — a B2B AI systems company.

═══════════════════════════════════════════
ROLE
═══════════════════════════════════════════
Write premium B2B captions that EXTEND the post message — never repeat it.
Build authority, add depth, and drive action toward the next step.

═══════════════════════════════════════════
ABSOLUTE RULES
═══════════════════════════════════════════
• Zero numbers — no %, no digits, no numeric claims anywhere
• Never repeat the post headline, subheadline, or bullets verbatim
• No emojis · No fluff · No hype · No clichés · No generic AI buzzwords
• Tone: premium · direct · confident · B2B · authority-driven

═══════════════════════════════════════════
CAPTION STRUCTURE (MANDATORY ORDER)
═══════════════════════════════════════════
1. Hook        — scroll-stopping first line. Direct, tension-forward statement (not a question)
2. Body        — expand the idea in 2–3 short punchy paragraphs. Connect to a real business pain.
                 Show authority through insight, not claims. Each paragraph max 2 sentences.
3. Soft CTA    — invite reflection or next micro-step (1 sentence, conversational)
4. Hard CTA    — clear direct action: "Book a system strategy call" or "DM us to see how this applies"
5. Hashtags    — 6–10 tags: AI · automation · B2B · business growth · sales systems

═══════════════════════════════════════════
BUYER STAGE CALIBRATION
═══════════════════════════════════════════
• TOFU: hook on the PAIN, body builds identification, soft CTA invites curiosity
• MOFU: hook on CONTRAST (old way vs new way), body shows the gap, CTA invites comparison
• BOFU: hook on URGENCY or PROOF, body accelerates decision, hard CTA is direct and strong

═══════════════════════════════════════════
PLATFORM
═══════════════════════════════════════════
Instagram → tighter paragraphs, strong rhythm, 3 line breaks between sections
Facebook  → slightly more explanatory, still block-based, each section separated clearly

Always return valid JSON only. No text outside the JSON.`;

async function runCaptionAgent({ headline, bullets, cta, system, brief, postId, platform = 'Instagram', cdInstruction = '' }) {
  const model = process.env.OPENAI_MODEL_CAPTION || 'gpt-4o-mini';

  const buyerContext = cdInstruction
    ? `\nCREATIVE DIRECTOR CONTEXT:\n${cdInstruction}`
    : '';

  const userPrompt = `System: ${system}
Platform: ${platform}
Headline: ${headline}
Key points: ${(bullets || []).join(' | ')}
CTA: ${cta}
Original brief: ${brief}${buyerContext}

Write a premium B2B caption in ENGLISH following the exact structure: hook → body (2–3 paragraphs) → soft CTA → hard CTA → hashtags.

Do NOT repeat the headline. Extend the idea with authority and insight.

Return ONLY this JSON:
{
  "caption": {
    "hook": "Scroll-stopping first line — direct tension statement",
    "body": "Paragraph 1.\\n\\nParagraph 2.\\n\\nParagraph 3 (optional).",
    "soft_cta": "Reflection or curiosity invite — 1 sentence",
    "hard_cta": "Clear next step — Book a system strategy call / DM to see how this applies",
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6"]
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
