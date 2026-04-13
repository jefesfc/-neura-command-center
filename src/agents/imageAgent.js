const axios = require('axios');
const { query } = require('../db');

const SYSTEM_CONTEXT = {
  'sistema-01': 'sales pipeline, lead qualification, CRM dashboard, prospect funnel, sales team',
  'sistema-02': 'sales conversion, deal closing, follow-up automation, client handshake, signed contract',
  'sistema-03': 'business automation, workflow orchestration, connected systems, operations dashboard',
  'neura':      'AI transformation, business intelligence, digital strategy, executive briefing',
  'ai-agents':  'autonomous AI agents, robotic process automation, digital workforce, server room',
  'crm':        'CRM interface, customer relationship management, contact records, sales analytics',
  'rag':        'knowledge base, document retrieval, business knowledge AI, expert answering system',
  'ai':         'AI implementation, machine learning dashboard, business technology, strategic planning',
};

const STYLE_SUFFIX = {
  fotorrealista: 'photorealistic, modern office environment, professionals using technology, corporate setting, natural lighting, high detail photography',
  abstract:      'abstract digital art, neural network visualization, dark background with teal and gold data streams, futuristic geometric forms, premium aesthetic',
  hibrido:       'real office scene with holographic digital overlays, floating UI dashboards, data streams, blend of physical and digital worlds',
};

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function runImageAgent({ imagePrompt, aspectRatio = '1:1', system = '', imageStyle = 'fotorrealista', postId }) {
  const model = process.env.OPENROUTER_MODEL_IMAGE || 'google/gemini-3.1-flash-image-preview';
  const apiKey = process.env.OPENROUTER_API_KEY;

  const context = SYSTEM_CONTEXT[system] || 'business technology, AI solutions, digital transformation';
  const styleSuffix = STYLE_SUFFIX[imageStyle] || STYLE_SUFFIX.abstract;
  const enhancedPrompt = `${imagePrompt} — ${context} — dark navy tones (#0b1e2d), subtle teal accents, no text, no logos, ultra HD — ${styleSuffix}`;

  const payload = {
    model,
    messages: [{ role: 'user', content: enhancedPrompt }],
    modalities: ['image', 'text'],
    image_config: { aspect_ratio: aspectRatio },
  };

  const t0 = Date.now();
  const response = await axios.post(OPENROUTER_URL, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://neuracenter.neurasolutions.cloud',
      'X-Title': 'Neura Command Center',
    },
    timeout: 120000,
  });

  const data = response.data;
  let imageB64 = null;

  // Parse response (two possible formats from OpenRouter/Gemini)
  const message = data?.choices?.[0]?.message;
  if (message) {
    const images = message.images || [];
    if (images.length > 0) {
      const url = images[0].image_url?.url || '';
      if (url.startsWith('data:')) {
        imageB64 = url.split(',', 2)[1];
      }
    }

    if (!imageB64) {
      const contentBlocks = Array.isArray(message.content) ? message.content : [];
      for (const block of contentBlocks) {
        if (block?.type === 'image_url') {
          const url = block.image_url?.url || '';
          if (url.startsWith('data:')) {
            imageB64 = url.split(',', 2)[1];
            break;
          }
        }
      }
    }
  }

  // Log token usage (OpenRouter usually returns usage)
  const usage = data?.usage;
  if (usage) {
    // google/gemini image models: roughly $0.039 per image (no token billing)
    const costUsd = 0.039;
    await query(
      `INSERT INTO token_usage (provider, model, feature, tokens_in, tokens_out, cost_usd, post_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['openrouter', model, 'image', usage.prompt_tokens || 0, usage.completion_tokens || 0, costUsd, postId || null]
    );
  }

  if (!imageB64) {
    throw new Error('No image returned from OpenRouter. Check API key and model availability.');
  }

  return imageB64; // base64 PNG string
}

module.exports = { runImageAgent };
