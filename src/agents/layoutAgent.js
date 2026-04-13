const { buildPostHTML } = require('./postTemplate');
const { buildCarouselSlides } = require('./carouselTemplate');

async function runLayoutAgent({ headline, headline_accent, subheadline, stats, description, bullets, cta, system, imageB64, format = '1:1', palette = 'navy', postType = 'single', carouselSlides = [] }) {
  if (postType === 'carousel' && carouselSlides.length > 0) {
    const slides = buildCarouselSlides({ slides: carouselSlides, system, imageB64, format, palette });
    return { html: slides[0]?.html || '', slides };
  }

  const html = buildPostHTML({ headline, headline_accent, subheadline, stats, description, bullets, cta, system, imageB64, format, palette });
  return { html, slides: [] };
}

module.exports = { runLayoutAgent };
