const OpenAI = require('openai');
const { query } = require('../db');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_LABELS = {
  'sistema-01': 'Sistema 01 — AI Lead Engine',
  'sistema-02': 'Sistema 02 — AI Conversion Engine',
  'sistema-03': 'Sistema 03 — AI Operating System',
};

const SYSTEM_PROMPT = `Eres el Copy Agent de Neura — una empresa de IA para negocios latinoamericanos.
Marca: NeuraSolutions. Tono: Premium, directo, inteligente. Sin tecnicismos innecesarios.
Colores de marca: Navy #0b1e2d, Teal #1fa2b8, Gold #c98a5a.
Tipografía de marca: Cormorant Garamond (títulos), Inter (cuerpo).

Generas copy para posts de redes sociales (Instagram, Facebook) en español.
Siempre devuelves JSON válido. Sin texto adicional fuera del JSON.`;

async function runCopyAgent({ brief, system, tone, postId }) {
  const systemLabel = SYSTEM_LABELS[system] || system;
  const model = process.env.OPENAI_MODEL_COPY || 'gpt-4o';

  const userPrompt = `
Brief del post: ${brief}
Sistema: ${systemLabel}
Tono: ${tone || 'profesional y directo'}

Genera el copy para un post de redes sociales. Devuelve SOLO este JSON:
{
  "headline": "Título principal impactante (máx 60 chars)",
  "bullets": ["Punto clave 1 (conciso)", "Punto clave 2 (conciso)", "Punto clave 3 (conciso)"],
  "cta": "Llamada a la acción (máx 40 chars)",
  "image_prompt": "Prompt en inglés para generar imagen de fondo (abstracta, tech, premium, dark navy tones)"
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
