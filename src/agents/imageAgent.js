const axios = require('axios');
const { query } = require('../db');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function runImageAgent({ imagePrompt, aspectRatio = '1:1', postId }) {
  const model = process.env.OPENROUTER_MODEL_IMAGE || 'google/gemini-3.1-flash-image-preview';
  const apiKey = process.env.OPENROUTER_API_KEY;

  const enhancedPrompt = `${imagePrompt}. Style: cinematic, premium, dark navy tones (#0b1e2d), subtle teal accents, abstract technology background, no text, no logos, high quality.`;

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
