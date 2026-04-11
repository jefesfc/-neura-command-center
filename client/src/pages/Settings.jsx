import React, { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';
import { applyTheme } from '../theme';

const COLOR_GROUPS = [
  {
    title: 'Colores de fondo',
    keys: [
      { key: 'color_primary', label: 'Fondo principal (Navy)', default: '#0b1e2d' },
      { key: 'color_accent',  label: 'Color acento (Teal)',    default: '#1fa2b8' },
      { key: 'color_gold',    label: 'Color gold',             default: '#c98a5a' },
    ],
  },
  {
    title: 'Colores de texto',
    keys: [
      { key: 'color_text',       label: 'Texto principal',  default: '#ffffff' },
      { key: 'color_text_muted', label: 'Texto secundario', default: '#7fa3b8' },
    ],
  },
];

const MODEL_KEYS = [
  { key: 'openai_model_copy',    label: 'Modelo Copy (GPT-4o)' },
  { key: 'openai_model_caption', label: 'Modelo Caption (GPT-4o mini)' },
  { key: 'openrouter_model_image', label: 'Modelo Imagen (OpenRouter)' },
];

const ANIMATIONS = [
  { value: 'none',       label: 'Sin animación',  preview: 'Aa' },
  { value: 'shimmer',    label: 'Shimmer',        preview: 'Aa' },
  { value: 'glow',       label: 'Glow',           preview: 'Aa' },
  { value: 'typewriter', label: 'Typewriter',     preview: 'Aa' },
];

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      setSettings(data);
      applyTheme(data);
    }).catch(() => {});
  }, []);

  function set(key, val) { setSettings(s => ({ ...s, [key]: val })); }

  function handleAnimationChange(val) {
    set('text_animation', val);
    document.body.setAttribute('data-text-anim', val);
  }

  async function handleSave() {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    applyTheme(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white">Settings</h1>
        <p className="text-white/40 mt-1 text-sm">Configuración de la aplicación</p>
      </div>

      {/* Color groups */}
      {COLOR_GROUPS.map(group => (
        <div key={group.title} className="card mb-6">
          <h2 className="font-display text-xl font-semibold text-white mb-5">{group.title}</h2>
          <div className="space-y-4">
            {group.keys.map(({ key, label, default: def }) => (
              <div key={key} className="flex items-center gap-4">
                <label className="label w-52 shrink-0">{label}</label>
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="color"
                    value={settings[key] || def}
                    onChange={e => set(key, e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border border-white/15 shrink-0"
                  />
                  <input
                    type="text"
                    value={settings[key] || def}
                    onChange={e => set(key, e.target.value)}
                    className="input flex-1 font-mono"
                    placeholder={def}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Live preview */}
          <div className="mt-5 p-4 rounded-lg border border-white/10 flex items-center gap-3 flex-wrap">
            {group.keys.map(({ key, default: def }) => (
              <div
                key={key}
                className="w-8 h-8 rounded-full border border-white/10"
                style={{ background: settings[key] || def }}
              />
            ))}
            <span className="label">Preview</span>
          </div>
        </div>
      ))}

      {/* Text animations */}
      <div className="card mb-6">
        <h2 className="font-display text-xl font-semibold text-white mb-2">Animación de títulos</h2>
        <p className="text-white/30 text-xs mb-5">Efecto aplicado a los headings (H1, H2) de la app</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ANIMATIONS.map(anim => (
            <button
              key={anim.value}
              onClick={() => handleAnimationChange(anim.value)}
              className={`rounded-xl border p-4 flex flex-col items-center gap-2 transition-all ${
                (settings.text_animation || 'none') === anim.value
                  ? 'border-teal bg-teal/10'
                  : 'border-white/10 hover:border-white/25 bg-navy'
              }`}
            >
              <span
                className={`font-display text-2xl font-bold ${
                  anim.value === 'shimmer'
                    ? 'bg-gradient-to-r from-teal to-gold bg-clip-text text-transparent'
                    : anim.value === 'glow'
                    ? 'text-teal drop-shadow-[0_0_8px_rgba(31,162,184,0.8)]'
                    : 'text-white'
                }`}
              >
                {anim.value === 'typewriter' ? 'Aa|' : anim.preview}
              </span>
              <span className="label text-[10px]">{anim.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Models */}
      <div className="card mb-6">
        <h2 className="font-display text-xl font-semibold text-white mb-5">Modelos de IA</h2>
        <div className="space-y-4">
          {MODEL_KEYS.map(({ key, label }) => (
            <div key={key}>
              <label className="label mb-2 block">{label}</label>
              <input
                type="text"
                value={settings[key] || ''}
                onChange={e => set(key, e.target.value)}
                className="input font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* n8n Webhook */}
      <div className="card mb-6">
        <h2 className="font-display text-xl font-semibold text-white mb-5">n8n Webhook</h2>
        <div>
          <label className="label mb-2 block">URL del webhook</label>
          <input
            type="url"
            value={settings.n8n_webhook_url || ''}
            onChange={e => set('n8n_webhook_url', e.target.value)}
            className="input"
            placeholder="https://n8n.neurasolutions.cloud/webhook/..."
          />
        </div>
      </div>

      <button onClick={handleSave} className="btn-gold w-full justify-center">
        {saved ? <><Check size={16} /> Guardado</> : <><Save size={16} /> Guardar configuración</>}
      </button>

      {/* System info */}
      <div className="mt-8 card bg-navy-dark/50">
        <h2 className="font-display text-lg font-semibold text-white mb-3">Sistema</h2>
        <div className="space-y-2 font-mono text-xs text-white/30">
          <div className="flex justify-between"><span>Dominio</span><span>neuracenter.neurasolutions.cloud</span></div>
          <div className="flex justify-between"><span>Deploy</span><span>Easypanel → main branch</span></div>
          <div className="flex justify-between"><span>DB</span><span>neura_command_center (Postgres)</span></div>
        </div>
      </div>
    </div>
  );
}
