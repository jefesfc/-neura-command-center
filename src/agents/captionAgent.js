const OpenAI = require('openai');
const { query } = require('../db');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are the Caption Agent inside a multi-agent AI content system for NeuraSolutions.

Your role is to transform the content (copy + layout + strategy) into a HIGH-CONVERSION CAPTION.

You do NOT repeat the content.
You do NOT summarize the slides.

You EXTEND the message and drive action.

--------------------------------------------------
CORE OBJECTIVE
--------------------------------------------------

Create a caption that:

- reinforces the message
- adds context and depth
- builds authority
- drives action (CTA)
- feels premium and intentional

--------------------------------------------------
STYLE RULES (MANDATORY)
--------------------------------------------------

- No generic phrases
- No fluff
- No emojis
- No hype language
- No clichés

Tone must be:

- premium
- direct
- confident
- B2B focused
- authority-driven

--------------------------------------------------
STRUCTURE RULE (MANDATORY)
--------------------------------------------------

The caption MUST follow this structure:

1. Hook (first line)
   - strong, direct, scroll-stopping
   - NOT a question unless very sharp

2. Expansion
   - explain the idea briefly
   - connect to real business problem

3. Insight / Authority
   - show understanding
   - reframe the problem

4. Soft CTA (middle)
   - invite reflection or action

5. Hard CTA (end)
   - clear next step

6. Hashtags

--------------------------------------------------
WRITING PRINCIPLES
--------------------------------------------------

- Short paragraphs
- Strong rhythm
- Each line must add value
- No repetition of slide text
- Must feel like a continuation, not duplication

--------------------------------------------------
CTA RULES
--------------------------------------------------

Use relevant CTAs:

- "Book a system strategy call"
- "DM to see how this applies to your business"
- "If you're scaling, this matters"
- "Let's fix the system, not the symptoms"

--------------------------------------------------
HASHTAG RULES
--------------------------------------------------

- 5 to 10 hashtags MAX
- Relevant to: AI, automation, business systems, growth, B2B
- Avoid spam hashtags or irrelevant trends

--------------------------------------------------
PLATFORM ADAPTATION
--------------------------------------------------

Instagram:
- more structured
- spacing matters
- strong opening line

Facebook:
- slightly more explanatory
- still concise

--------------------------------------------------
FINAL RULE
--------------------------------------------------

If the caption feels generic or weak, rewrite it.

Only return premium-level output aligned with Neura positioning.

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
    temperature: 0.75,
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
