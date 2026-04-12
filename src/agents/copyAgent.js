const OpenAI = require('openai');
const { query } = require('../db');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_BRIEFS = {
  'sistema-01': `
SYSTEM: Sistema 01 — AI Lead Engine
WHAT IT DOES: Captures leads from every channel (ads, web, social), qualifies them automatically using AI scoring models, and nurtures them through intelligent sequences until they're ready to buy.
CORE VALUE: Eliminates manual lead qualification. Sales team only speaks to hot, ready prospects.
RESULTS: 3x more qualified leads, 60% less time wasted on cold prospects, predictable pipeline.
TARGET: Business owners and sales directors with lead generation problems.
KEY MESSAGES: Automatic lead scoring, multi-channel capture, intelligent nurture sequences, sales pipeline on autopilot.`,

  'sistema-02': `
SYSTEM: Sistema 02 — AI Conversion Engine
WHAT IT DOES: Takes qualified leads and converts them into paying clients through hyper-personalized AI-powered follow-up sequences. Times messages perfectly, handles objections automatically, and closes deals 24/7.
CORE VALUE: Never lose a deal to poor follow-up again. Every lead gets the perfect message at the perfect moment.
RESULTS: 40% higher close rates, deals closed while you sleep, zero leads fall through the cracks.
TARGET: Sales teams and business owners struggling with follow-up consistency and conversion rates.
KEY MESSAGES: Automated follow-up, objection handling, perfect timing, closes deals on autopilot.`,

  'sistema-03': `
SYSTEM: Sistema 03 — AI Operating System
WHAT IT DOES: Connects every tool and department in your business through a central AI brain. Automates repetitive workflows, eliminates manual data entry, integrates all software, and delivers real-time business intelligence.
CORE VALUE: Your entire business runs like a machine — while you focus on growth.
RESULTS: 70% reduction in manual tasks, zero human error in operations, real-time visibility across the business.
TARGET: Business owners and operations managers drowning in manual processes and disconnected tools.
KEY MESSAGES: Business automation, workflow integration, operational intelligence, scale without hiring.`,

  'neura': `
SYSTEM: NeuraSolutions — AI Transformation Agency
WHAT IT DOES: Designs and implements complete AI transformation systems for Latin American businesses. From strategy to execution, we build intelligent infrastructure that multiplies revenue and eliminates manual work.
CORE VALUE: The fastest path from traditional business to AI-powered competitive machine.
RESULTS: Clients report 2-5x revenue growth, 60-80% operational cost reduction, competitive advantages that last years.
TARGET: Ambitious business owners and executives ready to leave competitors behind.
KEY MESSAGES: AI transformation, competitive advantage, revenue multiplication, done-for-you implementation.`,

  'ai-agents': `
SYSTEM: AI Agents — Autonomous Digital Workforce
WHAT IT DOES: Deploys specialized AI agents that work autonomously 24/7 — researching prospects, sending outreach, handling customer service, creating content, analyzing data, and executing complex multi-step tasks without human intervention.
CORE VALUE: Hire a team of tireless AI workers at a fraction of human cost.
RESULTS: 24/7 operations, 100x task throughput, human team freed for high-value work only.
TARGET: Companies looking to scale operations without proportional headcount growth.
KEY MESSAGES: 24/7 autonomous operation, specialized AI roles, infinite scalability, no breaks no errors.`,

  'crm': `
SYSTEM: AI CRM — Intelligent Relationship Intelligence
WHAT IT DOES: A CRM that actively predicts deal outcomes, automatically updates contact records from every interaction, suggests the optimal next action for each relationship, and spots revenue opportunities before humans can see them.
CORE VALUE: Stop managing a database. Start leveraging relationship intelligence that makes you money.
RESULTS: 35% more deals closed, zero CRM data entry, proactive opportunity alerts, retention improved by 45%.
TARGET: Sales leaders and business owners frustrated with traditional CRM complexity and low adoption.
KEY MESSAGES: Predictive deal scoring, automatic data capture, AI-suggested actions, relationship intelligence at scale.`,

  'rag': `
SYSTEM: RAG — Business Knowledge AI
WHAT IT DOES: Builds an AI system trained exclusively on your business knowledge, documents, products, and processes. Instantly answers client questions, handles complex support, creates on-brand content, and onboards new team members — all with your exact expertise.
CORE VALUE: Your best expert, available 24/7, at zero marginal cost per interaction.
RESULTS: 80% reduction in support tickets, instant expert-level answers, content that sounds exactly like you.
TARGET: Knowledge-intensive businesses with high support volume or content creation needs.
KEY MESSAGES: Your knowledge multiplied infinitely, instant expert responses, branded AI, zero training time for clients.`,

  'ai': `
SYSTEM: AI Implementation — Strategic AI for Business
WHAT IT DOES: Identifies the highest-ROI AI opportunities in your specific business, designs the implementation roadmap, and executes the full transformation — from process automation to predictive analytics to intelligent customer experiences.
CORE VALUE: Cut through AI hype. Get proven implementations that generate measurable ROI in 90 days.
RESULTS: Measurable ROI within 90 days, clear competitive moat, AI strategy aligned to your business goals.
TARGET: Business owners and executives who know AI is the future but don't know where to start.
KEY MESSAGES: Proven ROI, 90-day results, tailored strategy, done-for-you implementation.`,
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

const SYSTEM_PROMPT = `You are the Copy Agent for NeuraSolutions — an AI automation company that transforms Latin American businesses.
Brand: NeuraSolutions. Tone: Premium, direct, intelligent, results-focused. No unnecessary jargon.
Brand colors: Navy #0b1e2d, Teal #1fa2b8, Gold #c98a5a.
Brand fonts: Cormorant Garamond (headings), Inter (body).

You write high-impact social media copy (Instagram, Facebook) ALWAYS in English.
Your copy is benefit-driven, marketing-trained, and fully explains the system's value based on the context provided.
Every bullet must communicate a concrete, specific benefit or transformation — not vague statements.
Always return valid JSON only. No text outside the JSON.`;

async function runCopyAgent({ brief, system, tone, postId }) {
  const systemBrief = SYSTEM_BRIEFS[system] || `System: ${system}`;
  const systemLabel = SYSTEM_LABELS[system] || system;
  const model = process.env.OPENAI_MODEL_COPY || 'gpt-4o';

  const userPrompt = `
${systemBrief}

POST BRIEF FROM CLIENT: ${brief}
TONE: ${tone || 'professional, premium, direct'}

Write high-impact social media copy in ENGLISH. The copy must:
- Capture the core value of the system described above
- Expand meaningfully on the client brief
- Each bullet must be a specific, compelling benefit or outcome (not generic)
- Think like a senior marketing strategist: headline grabs attention, bullets sell transformation, CTA drives action

Return ONLY this JSON:
{
  "headline": "Bold attention-grabbing headline that captures the core promise (max 60 chars)",
  "bullets": [
    "Specific benefit or outcome #1 — concrete and compelling (max 12 words)",
    "Specific benefit or outcome #2 — concrete and compelling (max 12 words)",
    "Specific benefit or outcome #3 — concrete and compelling (max 12 words)"
  ],
  "cta": "Action-oriented CTA that creates urgency (max 40 chars)",
  "image_prompt": "Cinematic background image in English: abstract tech, data flows, dark atmospheric, premium aesthetic, no text, no logos, ultra HD"
}`;

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

module.exports = { runCopyAgent, SYSTEM_LABELS };
