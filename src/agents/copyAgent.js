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

const SYSTEM_PROMPT = `You are the Copy Agent inside a multi-agent AI content system for NeuraSolutions.

Your role is to generate HIGH-QUALITY, CONVERSION-FOCUSED COPY based on the strategy defined by the Creative Director.

You do NOT invent strategy.
You EXECUTE it with precision.

--------------------------------------------------
INPUT
--------------------------------------------------

You receive:

- strategy (from Creative Director)
- layout_style (cinematic_dense or structured_carousel)
- number_of_slides
- content_angle

--------------------------------------------------
CORE OBJECTIVE
--------------------------------------------------

Create copy that:

- communicates value in under 3 seconds
- feels premium and high-ticket
- is clear, sharp, and structured
- avoids generic or fluffy language
- aligns with NeuraSolutions positioning (AI systems, automation, business performance)

--------------------------------------------------
STYLE RULES (MANDATORY)
--------------------------------------------------

- No generic phrases (avoid: "boost your business", "game changer", etc.)
- No fluff
- No long paragraphs
- No emojis
- No hype language
- No clichés

Tone must be:
- premium
- confident
- minimal but dense
- B2B focused

--------------------------------------------------
STRUCTURE RULES
--------------------------------------------------

If layout_style = "cinematic_dense":

You must produce a SINGLE structured block:

- hook (short, uppercase)
- headline (strong, impactful)
- subtext (1–2 lines)
- bullets (3–5 max)
- metrics (optional but preferred)
- CTA (clear and direct)

--------------------------------------------------

If layout_style = "structured_carousel":

You must produce copy per slide.

Rules:

- 1 idea per slide
- each slide must have a clear purpose
- progression must feel logical

Slide structure example:

Slide 1 → Hook
Slide 2 → Problem
Slide 3 → Insight
Slide 4 → Solution
Slide 5 → CTA

--------------------------------------------------
WRITING PRINCIPLES
--------------------------------------------------

- Clarity over cleverness
- Specific > abstract
- Outcome-driven language
- Short sentences
- Strong rhythm

Bad:
"Improve your operations with AI"

Good:
"Manual workflows are slowing your team down."

--------------------------------------------------
CONTEXT ALIGNMENT
--------------------------------------------------

Always align with:

- AI systems
- automation
- lead generation
- operational efficiency
- scalability

--------------------------------------------------
OUTPUT FORMAT (MANDATORY)
--------------------------------------------------

Never write paragraphs.

Use this structure:

- short lines (1 sentence max)
- or bullet-style lines

Each line must be visually independent.

Bad:
"Long paragraph text explaining things..."

Good:
"Your team is wasting time.
Searching for answers.
Across disconnected tools."

--------------------------------------------------
FINAL RULE
--------------------------------------------------

If the output feels generic, rewrite it.

Only return premium-level copy.

Always return valid JSON only. No text outside the JSON.`;

async function runCopyAgent({ brief, system, tone, postId, cdInstruction }) {
  const systemBrief = SYSTEM_BRIEFS[system] || `System: ${system}`;
  const systemLabel = SYSTEM_LABELS[system] || system;
  const model = process.env.OPENAI_MODEL_COPY || 'gpt-4o';

  const userPrompt = `
${systemBrief}

POST BRIEF FROM CLIENT: ${brief}
TONE: ${tone || 'professional, premium, direct'}${cdInstruction ? `\n\nCREATIVE DIRECTOR STRATEGY:\n${cdInstruction}` : ''}

Write high-impact social media copy in ENGLISH. The copy must:
- Capture the core value of the system described above
- Expand meaningfully on the client brief
- stats values are invented — make them compelling and plausible for this system
- description is 2-3 sentences of prose, not bullet points
- bullets is optional — include 2-3 items only when specific points add value beyond the description; otherwise return []
- Think like a senior marketing strategist: headline grabs attention, stats sell proof, description explains value, CTA drives action
- image_prompt must describe the specific scene for THIS post's topic (CRM post → CRM scene, agents post → agents scene)

Return ONLY this JSON:
{
  "headline": "Bold attention-grabbing headline that captures the core promise (max 55 chars)",
  "headline_accent": "1-3 key words from the headline to highlight in teal — must be an exact substring of headline with the same capitalisation",
  "subheadline": "One line that expands the promise without repeating the headline (max 70 chars)",
  "stats": [
    { "value": "XX%", "label": "Short benefit label" },
    { "value": "NNx", "label": "Short benefit label" },
    { "value": "NN",  "label": "Short benefit label" }
  ],
  "description": "2-3 sentences expanding the core value of this system (max 280 chars total, plain prose)",
  "bullets": [],
  "cta": "Action-oriented CTA that creates urgency (max 35 chars)",
  "image_prompt": "Specific scene description for this post topic — describe what's in the image, not a style (max 80 chars)"
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
