const OpenAI = require('openai');
const { query } = require('../db');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a social media carousel content specialist for NeuraSolutions.
You expand post copy into engaging 5-slide Instagram carousel content in ENGLISH.
Each slide must be self-contained but flow as a cohesive story.
Always return valid JSON only. No text outside the JSON.`;

async function runCarouselAgent({ headline, bullets, cta, system, brief, postId }) {
  const model = process.env.OPENAI_MODEL_COPY || 'gpt-4o';

  const userPrompt = `
Create a 5-slide Instagram carousel in ENGLISH from this post copy:

HEADLINE: ${headline}
BULLETS: ${(bullets || []).join(' | ')}
CTA: ${cta}
BRIEF: ${brief}
SYSTEM: ${system}

Generate 5 slides:
- Slide 1 (cover): hook title + subheadline that teases the full story
- Slides 2-4 (content): one bullet per slide, expanded with a title + 2-3 sentence explanation
- Slide 5 (cta): strong closing statement + call to action

Return ONLY this JSON:
{
  "slides": [
    {
      "type": "cover",
      "title": "Short powerful hook (max 50 chars)",
      "subtitle": "One sentence teaser that makes them want to swipe (max 90 chars)"
    },
    {
      "type": "content",
      "num": "01",
      "point_title": "The bullet point as a bold title (max 45 chars)",
      "point_body": "2-3 sentences expanding on this benefit with specific detail and real impact"
    },
    {
      "type": "content",
      "num": "02",
      "point_title": "The bullet point as a bold title (max 45 chars)",
      "point_body": "2-3 sentences expanding on this benefit with specific detail and real impact"
    },
    {
      "type": "content",
      "num": "03",
      "point_title": "The bullet point as a bold title (max 45 chars)",
      "point_body": "2-3 sentences expanding on this benefit with specific detail and real impact"
    },
    {
      "type": "cta",
      "cta_headline": "Compelling closing statement (max 55 chars)",
      "cta_sub": "One line reinforcing the value and next step (max 80 chars)",
      "cta_action": "${cta}"
    }
  ]
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

  const costUsd = (usage.prompt_tokens * 2.5 + usage.completion_tokens * 10) / 1_000_000;
  await query(
    `INSERT INTO token_usage (provider, model, feature, tokens_in, tokens_out, cost_usd, post_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    ['openai', model, 'carousel', usage.prompt_tokens, usage.completion_tokens, costUsd, postId || null]
  );

  return result.slides || [];
}

module.exports = { runCarouselAgent };
