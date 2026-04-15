const OpenAI = require('openai');
const { query } = require('../db');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_BRIEFS = {
  'sistema-01': `
SYSTEM: Sistema 01 — AI Lead Engine
WHAT IT DOES: Captures leads from every channel (ads, web, social), qualifies them automatically using AI scoring models, and nurtures them through intelligent sequences until they're ready to buy.
CORE VALUE: Eliminates manual lead qualification. Sales team only speaks to hot, ready prospects.
RESULTS: Significantly more qualified leads, far less time wasted on cold prospects, predictable pipeline.
TARGET: Business owners and sales directors with lead generation problems.
KEY MESSAGES: Automatic lead scoring, multi-channel capture, intelligent nurture sequences, sales pipeline on autopilot.`,

  'sistema-02': `
SYSTEM: Sistema 02 — AI Conversion Engine
WHAT IT DOES: Takes qualified leads and converts them into paying clients through hyper-personalized AI-powered follow-up sequences. Times messages perfectly, handles objections automatically, and closes deals around the clock.
CORE VALUE: Never lose a deal to poor follow-up again. Every lead gets the perfect message at the perfect moment.
RESULTS: Higher close rates, deals closed while you sleep, zero leads fall through the cracks.
TARGET: Sales teams and business owners struggling with follow-up consistency and conversion rates.
KEY MESSAGES: Automated follow-up, objection handling, perfect timing, closes deals on autopilot.`,

  'sistema-03': `
SYSTEM: Sistema 03 — AI Operating System
WHAT IT DOES: Connects every tool and department in your business through a central AI brain. Automates repetitive workflows, eliminates manual data entry, integrates all software, and delivers real-time business intelligence.
CORE VALUE: Your entire business runs like a machine — while you focus on growth.
RESULTS: Dramatic reduction in manual tasks, zero human error in operations, real-time visibility across the business.
TARGET: Business owners and operations managers drowning in manual processes and disconnected tools.
KEY MESSAGES: Business automation, workflow integration, operational intelligence, scale without hiring.`,

  'neura': `
SYSTEM: NeuraSolutions — AI Transformation Agency
WHAT IT DOES: Designs and implements complete AI transformation systems for businesses. From strategy to execution, we build intelligent infrastructure that multiplies revenue and eliminates manual work.
CORE VALUE: The fastest path from traditional business to AI-powered competitive machine.
RESULTS: Clients report substantial revenue growth, significant operational cost reduction, and lasting competitive advantage.
TARGET: Ambitious business owners and executives ready to leave competitors behind.
KEY MESSAGES: AI transformation, competitive advantage, revenue multiplication, done-for-you implementation.`,

  'ai-agents': `
SYSTEM: AI Agents — Autonomous Digital Workforce
WHAT IT DOES: Deploys specialized AI agents that work autonomously around the clock — researching prospects, sending outreach, handling customer service, creating content, analyzing data, and executing complex multi-step tasks without human intervention.
CORE VALUE: Hire a team of tireless AI workers at a fraction of human cost.
RESULTS: Non-stop operations, massive task throughput, human team freed for high-value work only.
TARGET: Companies looking to scale operations without proportional headcount growth.
KEY MESSAGES: Autonomous operation, specialized AI roles, infinite scalability, no breaks no errors.`,

  'crm': `
SYSTEM: AI CRM — Intelligent Relationship Intelligence
WHAT IT DOES: A CRM that actively predicts deal outcomes, automatically updates contact records from every interaction, suggests the optimal next action for each relationship, and spots revenue opportunities before humans can see them.
CORE VALUE: Stop managing a database. Start leveraging relationship intelligence that makes you money.
RESULTS: More deals closed, zero CRM data entry, proactive opportunity alerts, improved client retention.
TARGET: Sales leaders and business owners frustrated with traditional CRM complexity and low adoption.
KEY MESSAGES: Predictive deal scoring, automatic data capture, AI-suggested actions, relationship intelligence at scale.`,

  'rag': `
SYSTEM: RAG — Business Knowledge AI
WHAT IT DOES: Builds an AI system trained exclusively on your business knowledge, documents, products, and processes. Instantly answers client questions, handles complex support, creates on-brand content, and onboards new team members — all with your exact expertise.
CORE VALUE: Your best expert, available at all times, at zero marginal cost per interaction.
RESULTS: Dramatic reduction in support tickets, instant expert-level answers, content that sounds exactly like you.
TARGET: Knowledge-intensive businesses with high support volume or content creation needs.
KEY MESSAGES: Your knowledge multiplied infinitely, instant expert responses, branded AI, zero training time for clients.`,

  'ai': `
SYSTEM: AI Implementation — Strategic AI for Business
WHAT IT DOES: Identifies the highest-ROI AI opportunities in your specific business, designs the implementation roadmap, and executes the full transformation — from process automation to predictive analytics to intelligent customer experiences.
CORE VALUE: Cut through AI hype. Get proven implementations that generate measurable, fast ROI.
RESULTS: Fast measurable ROI, clear competitive moat, AI strategy aligned to your business goals.
TARGET: Business owners and executives who know AI is the future but don't know where to start.
KEY MESSAGES: Proven ROI, fast results, tailored strategy, done-for-you implementation.`,
};

const SYSTEM_LABELS = {
  'sistema-01': 'Sistema 01 — AI Lead Engine',
  'sistema-02': 'Sistema 02 — AI Conversion Engine',
  'sistema-03': 'Sistema 03 — AI Operating System',
  'neura': 'NeuraSolutions',
  'ai-agents': 'AI Agents',
  'crm': 'AI CRM',
  'rag': 'RAG — Business Knowledge AI',
  'ai': 'AI Implementation',
};

const SYSTEM_PROMPT = `You are the Copy Agent for NeuraSolutions — a B2B AI systems company.

═══════════════════════════════════════════
RULE #1 — ABSOLUTE: ZERO NUMBERS ANYWHERE
═══════════════════════════════════════════
Never output any digit, %, x, multiplier, timeframe, or numeric claim in any field.
"80%", "3x", "24/7", "90 days", "2 years" — all forbidden. No exceptions.
If the brief or context contains numbers, ignore them completely.
stats.value → single qualitative word ONLY: Structured · Consistent · Controlled · Precise · Automated · Systematic · Reliable · Scalable · Clear · Intelligent

═══════════════════════════════════════════
ROLE
═══════════════════════════════════════════
Execute the Creative Director's strategy with precision and creative edge.
Write copy that stops the scroll. Specific, sharp, B2B, premium.

═══════════════════════════════════════════
CREATIVE ANGLES (vary — never generic)
═══════════════════════════════════════════
Use contrast, tension, or a provocative truth. Examples:
• Contrast:   "Your CRM tracks contacts. It doesn't close them."
• Tension:    "Every lead you ignore is a deal your competitor takes."
• Challenge:  "Most sales teams are optimizing the wrong thing."
• Direct:     "Manual follow-up is killing your pipeline."
• Reframe:    "You don't have a lead problem. You have a system problem."

═══════════════════════════════════════════
TONE & WRITING RULES
═══════════════════════════════════════════
Premium · Confident · B2B · Minimal · Specific
No emojis · No fluff · No hype · No clichés

Bad:  "Boost your business with AI-powered growth solutions."
Good: "Your sales team is talking to the wrong leads."

Always return valid JSON only. No text outside the JSON.`;

async function runCopyAgent({ brief, system, tone, platform = 'Instagram', postId, cdInstruction }) {
  const systemBrief = SYSTEM_BRIEFS[system] || `System: ${system}`;
  const model = process.env.OPENAI_MODEL_COPY || 'gpt-4o';
  const isIG = (platform || 'Instagram').toLowerCase() === 'instagram';

  // ── Platform-specific instructions and examples ─────────────────────────────
  const platformRules = isIG ? `
PLATFORM: Instagram — VISUAL FIRST
The image is the hero. Text is minimal. Every word must earn its place.

subheadline → HOOK: max 5 words, punchy tension-setter. NOT a sentence. Examples:
  "YOUR SYSTEM IS BROKEN." / "LEADS DON'T CLOSE THEMSELVES." / "WRONG TOOL. WRONG RESULT."
headline → THE BIG STATEMENT: max 6 words, dominates the frame visually. Bold truth.
  Examples: "Your system does." / "Automate or fall behind." / "The pipeline runs itself."
description → return "" (not displayed on Instagram)
bullets → return [] (not displayed on Instagram)
stats → 3 qualitative single words — shown as accent below the headline
cta → max 30 chars, sharp action

EXAMPLE:
{
  "headline": "Your system closes deals.",
  "headline_accent": "closes deals",
  "subheadline": "Your CRM doesn't.",
  "stats": [
    { "value": "Automated", "label": "Lead Flow" },
    { "value": "Precise", "label": "Targeting" },
    { "value": "Scalable", "label": "Pipeline" }
  ],
  "description": "",
  "bullets": [],
  "cta": "Book a strategy call",
  "image_prompt": "Futuristic dark CRM dashboard with glowing pipeline nodes and AI scoring interface"
}` : `
PLATFORM: Facebook — EDITORIAL
Users read. Tell a story. Hook → problem → solution → proof → action.

subheadline → HOOK: 1 sharp line that creates tension. Max 60 chars.
  Examples: "Your CRM doesn't close deals." / "Most businesses have tools, not systems."
headline → BOLD TRUTH: strong serif statement, max 55 chars.
description → 1 narrative sentence, max 90 chars. Sets up the solution.
  Example: "We design AI systems that capture, qualify and convert leads — automatically."
bullets → 2-3 specific outcome lines. Concrete, no fluff.
  Example: ["Qualifies leads without human input", "Triggers follow-ups at the right moment", "Gives your team full pipeline visibility"]
stats → 3 qualitative single words — shown inline as proof pillars
cta → max 35 chars, direct

EXAMPLE:
{
  "headline": "Your system does the selling.",
  "headline_accent": "does the selling",
  "subheadline": "Your CRM tracks contacts. It doesn't close them.",
  "stats": [
    { "value": "Automated", "label": "Lead Qualification" },
    { "value": "Consistent", "label": "Follow-up" },
    { "value": "Scalable", "label": "Revenue Growth" }
  ],
  "description": "We design AI systems that capture, qualify and convert leads — automatically.",
  "bullets": [
    "Qualifies leads without human input",
    "Triggers follow-ups at the right moment",
    "Gives your team full pipeline visibility"
  ],
  "cta": "Book a system strategy call",
  "image_prompt": "Dark editorial workspace with holographic AI pipeline diagram and business team"
}`;

  const userPrompt = `SYSTEM CONTEXT:
${systemBrief}

CLIENT BRIEF: ${brief}
TONE: ${tone || 'professional, premium, direct'}${cdInstruction ? `\nCREATIVE DIRECTOR STRATEGY:\n${cdInstruction}` : ''}
${platformRules}

Write high-impact copy in ENGLISH. Use a creative angle — contrast, tension, or a provocative truth. No generic phrases.
stats.value must be qualitative single words only. No numbers anywhere.
image_prompt: describe the specific visual scene for THIS topic — concrete, cinematic, dark and premium.

Return ONLY valid JSON with these exact fields: headline, headline_accent, subheadline, stats, description, bullets, cta, image_prompt`;

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

  // Cost: GPT-4o $2.50/1M in, $10/1M out
  const costUsd = (usage.prompt_tokens * 2.5 + usage.completion_tokens * 10) / 1_000_000;

  await query(
    `INSERT INTO token_usage (provider, model, feature, tokens_in, tokens_out, cost_usd, post_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    ['openai', model, 'copy', usage.prompt_tokens, usage.completion_tokens, costUsd, postId || null]
  );

  return result;
}

module.exports = { runCopyAgent, SYSTEM_LABELS };
