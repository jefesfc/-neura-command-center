import React, { useState, useRef, useCallback } from 'react';
import { Wand2, Download, RefreshCw, Check, Copy } from 'lucide-react';
import ProgressStep from '../components/ProgressStep';

const SYSTEMS = [
  { value: 'sistema-01', label: 'Sistema 01 — AI Lead Engine' },
  { value: 'sistema-02', label: 'Sistema 02 — AI Conversion Engine' },
  { value: 'sistema-03', label: 'Sistema 03 — AI Operating System' },
];

const FORMATS = [
  { value: '1:1', label: 'Cuadrado 1:1 (Feed)' },
  { value: '9:16', label: 'Vertical 9:16 (Story)' },
];

const TONES = [
  { value: 'profesional', label: 'Profesional' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'inspirador', label: 'Inspirador' },
  { value: 'educativo', label: 'Educativo' },
];

const STEPS = ['copy', 'image', 'layout', 'caption'];

const FORMAT_SIZES = {
  '1:1':  { w: 1080, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1080, h: 608 },
  '4:5':  { w: 1080, h: 1350 },
};

export default function PostGenerator() {
  const [form, setForm] = useState({ brief: '', system: 'sistema-01', format: '1:1', tone: 'profesional' });
  const [phase, setPhase] = useState('idle');
  const [steps, setSteps] = useState({});
  const [post, setPost] = useState(null);
  const [postHtml, setPostHtml] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const iframeRef = useRef(null);
  const sseRef = useRef(null);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleGenerate() {
    if (!form.brief.trim()) return;
    setPhase('generating');
    setSteps({});
    setPost(null);
    setPostHtml(null);

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const { jobId, error } = await res.json();
    if (error || !jobId) { setPhase('error'); return; }

    const es = new EventSource(`/api/generate/stream/${jobId}`);
    sseRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === 'step') {
        setSteps(s => ({ ...s, [data.step]: { status: data.status, ...data } }));
        if (data.step === 'layout' && data.status === 'done' && data.html) {
          setPostHtml(data.html);
        }
      }

      if (data.type === 'complete') {
        es.close();
        setPhase('done');
        fetch(`/api/posts/${data.postId}`).then(r => r.json()).then(setPost);
      }

      if (data.type === 'error') {
        es.close();
        setPhase('error');
      }
    };

    es.onerror = () => { es.close(); setPhase('error'); };
  }

  async function handleDownload() {
    if (!iframeRef.current || !post) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const el = doc.body.firstElementChild || doc.body;
      const size = FORMAT_SIZES[post.format] || FORMAT_SIZES['1:1'];
      const canvas = await html2canvas(el, {
        width: size.w,
        height: size.h,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0b1e2d',
      });
      const link = document.createElement('a');
      link.download = `neura-post-${post.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
    setDownloading(false);
  }

  function handleCopyCaption() {
    if (!post) return;
    navigator.clipboard.writeText(`${post.caption}\n\n${post.hashtags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleMarkReady() {
    if (!post) return;
    await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ready' }),
    });
    setPost(p => ({ ...p, status: 'ready' }));
  }

  const size = FORMAT_SIZES[form.format] || FORMAT_SIZES['1:1'];
  const previewScale = size.h > size.w ? 320 / size.h : 400 / size.w;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white">Post Generator</h1>
        <p className="text-white/40 mt-1 text-sm">4 agentes de IA: Copy → Imagen → Layout → Caption</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT */}
        <div className="space-y-5">
          <div className="card">
            <h2 className="font-display text-xl font-semibold text-white mb-5">Brief del post</h2>
            <div className="space-y-4">
              <div>
                <label className="label mb-2 block">Brief / Idea principal</label>
                <textarea
                  rows={4}
                  className="input resize-none"
                  placeholder="Ej: Mostrar cómo nuestro Sistema 01 califica leads automáticamente..."
                  value={form.brief}
                  onChange={e => set('brief', e.target.value)}
                />
              </div>
              <div>
                <label className="label mb-2 block">Sistema</label>
                <select className="input" value={form.system} onChange={e => set('system', e.target.value)}>
                  {SYSTEMS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-2 block">Formato</label>
                  <select className="input" value={form.format} onChange={e => set('format', e.target.value)}>
                    {FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label mb-2 block">Tono</label>
                  <select className="input" value={form.tone} onChange={e => set('tone', e.target.value)}>
                    {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={!form.brief.trim() || phase === 'generating'}
                className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {phase === 'generating'
                  ? <><RefreshCw size={16} className="animate-spin" /> Generando...</>
                  : <><Wand2 size={16} /> Generar Post</>
                }
              </button>
            </div>
          </div>

          {(phase === 'generating' || phase === 'done') && (
            <div className="card">
              <h2 className="font-display text-xl font-semibold text-white mb-4">Progreso</h2>
              <div className="space-y-2">
                {STEPS.map(step => (
                  <ProgressStep key={step} step={step} state={steps[step]} />
                ))}
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="card border-red-500/30 bg-red-500/5">
              <p className="text-red-400 text-sm">Error durante la generación. Revisa la consola del servidor.</p>
            </div>
          )}
        </div>

        {/* RIGHT — Preview */}
        <div className="space-y-5">
          {postHtml ? (
            <>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-semibold text-white">Preview</h2>
                  {post && <span className={`badge-${post.status}`}>{post.status}</span>}
                </div>

                {/* Scaled iframe preview */}
                <div
                  className="overflow-hidden rounded-lg border border-white/10 mx-auto"
                  style={{
                    width: Math.round(size.w * previewScale),
                    height: Math.round(size.h * previewScale),
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    srcDoc={postHtml}
                    style={{
                      width: size.w,
                      height: size.h,
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top left',
                      border: 'none',
                      display: 'block',
                    }}
                    title="Post preview"
                    sandbox="allow-same-origin"
                  />
                </div>

                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn-primary w-full justify-center mt-4 disabled:opacity-50"
                >
                  {downloading
                    ? <><RefreshCw size={16} className="animate-spin" /> Exportando...</>
                    : <><Download size={16} /> Descargar PNG</>
                  }
                </button>
              </div>

              {post?.caption && (
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-xl font-semibold text-white">Caption</h2>
                    <button onClick={handleCopyCaption} className="btn-secondary px-3 py-2 text-xs">
                      {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                    </button>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{post.caption}</p>
                  <p className="text-teal/60 text-xs mt-3 leading-loose">{post.hashtags}</p>
                  <button onClick={handleMarkReady} className="btn-gold w-full justify-center mt-4">
                    <Check size={16} /> Marcar como Ready
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card h-80 flex items-center justify-center">
              <div className="text-center">
                <Wand2 size={40} className="text-white/10 mx-auto mb-3" />
                <p className="text-white/20 text-sm">El post generado aparecerá aquí</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
