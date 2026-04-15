function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

export function applyTheme(settings) {
  const root = document.documentElement;

  if (settings.color_primary) root.style.setProperty('--tw-navy', hexToRgb(settings.color_primary));
  if (settings.color_card)    root.style.setProperty('--tw-navy-light', hexToRgb(settings.color_card));
  if (settings.color_sidebar) root.style.setProperty('--tw-navy-dark', hexToRgb(settings.color_sidebar));

  if (settings.color_accent) {
    root.style.setProperty('--tw-teal', hexToRgb(settings.color_accent));
    root.style.setProperty('--tw-teal-light', hexToRgb(settings.color_accent));
    root.style.setProperty('--tw-teal-dark',  hexToRgb(settings.color_accent));
  }

  if (settings.color_gold) {
    root.style.setProperty('--tw-gold',       hexToRgb(settings.color_gold));
    root.style.setProperty('--tw-gold-light', hexToRgb(settings.color_gold));
    root.style.setProperty('--tw-gold-dark',  hexToRgb(settings.color_gold));
    // Rebuild semantic gold vars from the hex value
    const r = parseInt(settings.color_gold.slice(1, 3), 16);
    const g = parseInt(settings.color_gold.slice(3, 5), 16);
    const b = parseInt(settings.color_gold.slice(5, 7), 16);
    root.style.setProperty('--gold-dim',    `rgba(${r},${g},${b},0.13)`);
    root.style.setProperty('--gold-glow',   `rgba(${r},${g},${b},0.28)`);
    root.style.setProperty('--card-border', `rgba(${r},${g},${b},0.22)`);
  }

  if (settings.color_text)       root.style.setProperty('--color-text',       hexToRgb(settings.color_text));
  if (settings.color_text_muted) root.style.setProperty('--color-text-muted', hexToRgb(settings.color_text_muted));

  if (settings.text_animation !== undefined)
    document.body.setAttribute('data-text-anim',  settings.text_animation  || 'none');
  if (settings.block_animation !== undefined)
    document.body.setAttribute('data-block-anim', settings.block_animation || 'none');
}
