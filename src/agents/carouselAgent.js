const OpenAI = require('openai');
const { query } = require('../db');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are the Carousel Agent for NeuraSolutions — a B2B AI systems company.

═══════════════════════════════════════════
ABSOLUTE RULES
═══════════════════════════════════════════
• Zero numbers — no %, no digits, no numeric claims anywhere in any slide
• No emojis · No generic phrases · No fluff · No hype
• Each slide: ONE idea, self-contained, flows as part of a cohesive story
• Tone: premium · direct · B2B · outcome-focused · authority-driven

═══════════════════════════════════════════
SLIDE STRUCTURE
═══════════════════════════════════════════
Slide 1 (cover)    → hook title + teaser subheadline that makes them swipe
Slides 2–4 (content) → one idea per slide, expanded with real business context and insight
Slide 5 (cta)     → strong closing statement + clear next step action

═══════════════════════════════════════════
WRITING RULES
═══════════════════════════════════════════
• Titles: sharp, specific, max 45–55 chars — be unexpected, provocative, concrete
• Body: 2–3 short sentences — concrete, insight-driven, not generic
• Progression: each slide builds on the last (problem → insight → solution → action)
• Never start with "Boost", "Improve", "Transform", or any generic verb
• Use strong, unexpected verbs and vivid nouns — make every word earn its place

═══════════════════════════════════════════
ACCENT WORD RULES
═══════════════════════════════════════════
• Every slide must include "title_accent": ONE meaningful word from the title/headline
• Pick a strong noun, verb, or adjective — the word that carries the most weight
• NEVER pick stop words: the, a, an, of, for, in, with, and, or, but, to, at, by,
  from, as, is, it, its, on, this, that, are, was, were, be, been, not, no, so,
  do, does, did, your, our, their, we, you
• The accent word must appear exactly as written in the title (case-sensitive match)

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
      "title": "Unexpected, sharp hook — makes them stop scrolling (max 50 chars)",
      "title_accent": "the one word from title that carries the most weight",
      "subtitle": "One sentence that reveals just enough to make them swipe (max 90 chars)"
    },
    {
      "type": "content",
      "num": "01",
      "point_title": "Bold, specific claim — not a summary, a revelation (max 45 chars)",
      "title_accent": "the one word from point_title that carries the most weight",
      "point_body": "2-3 sentences with concrete detail, real business context, unexpected insight"
    },
    {
      "type": "content",
      "num": "02",
      "point_title": "Bold, specific claim — not a summary, a revelation (max 45 chars)",
      "title_accent": "the one word from point_title that carries the most weight",
      "point_body": "2-3 sentences with concrete detail, real business context, unexpected insight"
    },
    {
      "type": "content",
      "num": "03",
      "point_title": "Bold, specific claim — not a summary, a revelation (max 45 chars)",
      "title_accent": "the one word from point_title that carries the most weight",
      "point_body": "2-3 sentences with concrete detail, real business context, unexpected insight"
    },
    {
      "type": "cta",
      "cta_headline": "Closing statement with urgency and weight (max 55 chars)",
      "title_accent": "the one word from cta_headline that carries the most weight",
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
    temperature: 0.65,
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
