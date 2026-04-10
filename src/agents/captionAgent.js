const OpenAI = require('openai');
const { query } = require('../db');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Eres el Caption Agent de Neura. Generas captions optimizados para SEO en Instagram y Facebook.
Tono: premium, inteligente, latinoamericano. Siempre en español.
Devuelves SOLO JSON válido. Sin texto adicional.`;

async function runCaptionAgent({ headline, bullets, cta, system, brief, postId }) {
  const model = process.env.OPENAI_MODEL_CAPTION || 'gpt-4o-mini';

  const userPrompt = `
Sistema: ${system}
Titular: ${headline}
Puntos clave: ${(bullets || []).join(' | ')}
CTA: ${cta}
Brief original: ${brief}

Genera el caption para Instagram/Facebook. Devuelve SOLO este JSON:
{
  "caption": "Caption completo con emojis, saltos de línea naturales. Máx 300 palabras. Incluye el CTA al final.",
  "hashtags": "#hashtag1 #hashtag2 ... (15-20 hashtags relevantes en español e inglés)"
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
