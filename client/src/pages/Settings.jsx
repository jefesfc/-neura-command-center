import React, { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';

const COLOR_KEYS = [
  { key: 'color_primary', label: 'Color Primary (Navy)' },
  { key: 'color_accent', label: 'Color Accent (Teal)' },
  { key: 'color_gold', label: 'Color Gold' },
];

const MODEL_KEYS = [
  { key: 'openai_model_copy', label: 'Modelo Copy (GPT-4o)' },
  { key: 'openai_model_caption', label: 'Modelo Caption (GPT-4o mini)' },
  { key: 'openrouter_model_image', label: 'Modelo Imagen (OpenRouter)' },
];

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {});
  }, []);

  function set(key, val) { setSettings(s => ({ ...s, [key]: val })); }

  async function handleSave() {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white">Settings</h1>
        <p className="text-white/40 mt-1 text-sm">Configuración de la aplicación</p>
      </div>

      {/* Theme Colors */}
      <div className="card mb-6">
        <h2 className="font-display text-xl font-semibold text-white mb-5">Colores de tema</h2>
        <div className="space-y-4">
          {COLOR_KEYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-4">
              <label className="label w-48 shrink-0">{label}</label>
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="color"
                  value={settings[key] || '#000000'}
                  onChange={e => set(key, e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border border-white/15"
                />
                <input
                  type="text"
                  value={settings[key] || ''}
                  onChange={e => set(key, e.target.value)}
                  className="input flex-1 font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Color preview */}
        <div className="mt-5 p-4 rounded-lg border border-white/8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full" style={{ background: settings.color_primary || '#0b1e2d' }} />
          <div className="w-8 h-8 rounded-full" style={{ background: settings.color_accent || '#1fa2b8' }} />
          <div className="w-8 h-8 rounded-full" style={{ background: settings.color_gold || '#c98a5a' }} />
          <span className="label">Preview de colores</span>
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
          <label className="label mb-2 block">URL del webhook (notificación al guardar post)</label>
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
          <div className="flex justify-between"><span>Port</span><span>{window.location.port || '3000'}</span></div>
        </div>
      </div>
    </div>
  );
}
