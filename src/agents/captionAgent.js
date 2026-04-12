const OpenAI = require('openai');
const { query } = require('../db');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are the Caption Agent for NeuraSolutions. You write SEO-optimized captions for Instagram and Facebook.
Tone: premium, intelligent, results-focused. Always write in English.
You are a marketing expert — your captions tell a story, build desire, and drive action.
Return ONLY valid JSON. No text outside the JSON.`;

async function runCaptionAgent({ headline, bullets, cta, system, brief, postId }) {
  const model = process.env.OPENAI_MODEL_CAPTION || 'gpt-4o-mini';

  const userPrompt = `
System: ${system}
Headline: ${headline}
Key points: ${(bullets || []).join(' | ')}
CTA: ${cta}
Original brief: ${brief}

Write an Instagram/Facebook caption in ENGLISH. The caption must:
- Open with a hook that stops the scroll
- Expand on the brief with depth — explain the value and transformation
- Use natural line breaks and strategic emojis
- Build towards the CTA naturally
- Max 300 words

Return ONLY this JSON:
{
  "caption": "Full caption in English with emojis and natural line breaks. Opens with hook, expands on value, ends with CTA.",
  "hashtags": "#hashtag1 #hashtag2 ... (15-20 hashtags mixing English and Spanish for reach)"
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
