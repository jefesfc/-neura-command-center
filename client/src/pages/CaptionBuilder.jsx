import React, { useState } from 'react';
import { AlignLeft, Copy, Check, Loader2 } from 'lucide-react';

export default function CaptionBuilder() {
  const [form, setForm] = useState({ topic: '', system: 'sistema-01', keywords: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleGenerate() {
    if (!form.topic.trim()) return;
    setLoading(true);
    setResult(null);

    // Use the caption endpoint directly (no PNG needed)
    const res = await fetch('/api/generate/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'caption',
        postId: null,
        brief: form.topic,
        system: form.system,
        _direct: true,
        headline: form.topic,
        bullets: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
        cta: 'Descubre más en neurasolutions.cloud',
      }),
    });

    // For direct caption without a post, use a standalone endpoint
    const captionRes = await fetch('/api/analytics/caption-standalone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: form.topic,
        system: form.system,
        keywords: form.keywords,
      }),
    }).catch(() => null);

    if (captionRes?.ok) {
      const data = await captionRes.json();
      setResult(data);
    }

    setLoading(false);
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(`${result.caption}\n\n${result.hashtags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white">Caption Builder</h1>
        <p className="text-white/40 mt-1 text-sm">Genera captions SEO optimizados para Instagram y Facebook</p>
      </div>

      <div className="card mb-6">
        <div className="space-y-4">
          <div>
            <label className="label mb-2 block">Tema del post</label>
            <textarea
              rows={3}
              className="input resize-none"
              placeholder="Ej: Cómo la IA puede triplicar las ventas de una empresa B2B en 90 días..."
              value={form.topic}
              onChange={e => set('topic', e.target.value)}
            />
          </div>

          <div>
            <label className="label mb-2 block">Sistema</label>
            <select className="input" value={form.system} onChange={e => set('system', e.target.value)}>
              <option value="sistema-01">Sistema 01 — AI Lead Engine</option>
              <option value="sistema-02">Sistema 02 — AI Conversion Engine</option>
              <option value="sistema-03">Sistema 03 — AI Operating System</option>
            </select>
          </div>

          <div>
            <label className="label mb-2 block">Keywords objetivo (separadas por coma)</label>
            <input
              className="input"
              placeholder="inteligencia artificial, ventas B2B, automatización..."
              value={form.keywords}
              onChange={e => set('keywords', e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!form.topic.trim() || loading}
            className="btn-primary w-full justify-center disabled:opacity-40"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Generando caption...</> : <><AlignLeft size={16} /> Generar Caption</>}
          </button>
        </div>
      </div>

      {result && (
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-white">Caption generado</h2>
            <button onClick={handleCopy} className="btn-secondary px-3 py-2 text-xs">
              {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar todo</>}
            </button>
          </div>
          <div className="bg-navy rounded-lg p-4 border border-white/8">
            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{result.caption}</p>
            <p className="text-teal/60 text-xs mt-4 leading-loose">{result.hashtags}</p>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="card flex items-center justify-center h-40">
          <div className="text-center">
            <AlignLeft size={32} className="text-white/10 mx-auto mb-2" />
            <p className="text-white/20 text-sm">El caption aparecerá aquí</p>
          </div>
        </div>
      )}
    </div>
  );
}
