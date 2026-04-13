import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Wand2, Download, RefreshCw, Check, Copy, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import ProgressStep from '../components/ProgressStep';

const SYSTEMS = [
  { value: 'sistema-01', label: 'Sistema 01 — AI Lead Engine' },
  { value: 'sistema-02', label: 'Sistema 02 — AI Conversion Engine' },
  { value: 'sistema-03', label: 'Sistema 03 — AI Operating System' },
  { value: 'neura',      label: 'NeuraSolutions' },
  { value: 'ai-agents',  label: 'AI Agents' },
  { value: 'crm',        label: 'AI CRM' },
  { value: 'rag',        label: 'RAG — Business Knowledge AI' },
  { value: 'ai',         label: 'AI Implementation' },
];

const FORMATS = [
  { value: '1:1',  label: 'Cuadrado 1:1 (Feed)' },
  { value: '9:16', label: 'Vertical 9:16 (Story)' },
];

const TONES = [
  { value: 'profesional', label: 'Professional' },
  { value: 'urgente',     label: 'Urgent' },
  { value: 'inspirador',  label: 'Inspirational' },
  { value: 'educativo',   label: 'Educational' },
];

const PALETTES = [
  { value: 'navy', label: 'Neura Navy',    colors: ['#0b1e2d', '#1fa2b8', '#c98a5a'] },
  { value: 'gold', label: 'Gold Premium',  colors: ['#130e04', '#d4a040', '#f0d080'] },
  { value: 'grey', label: 'Grey Premium',  colors: ['#08080e', '#8fa8be', '#1fa2b8'] },
];

const POST_TYPES = [
  { value: 'single',   label: 'Single Post',  icon: '▭' },
  { value: 'carousel', label: 'Carousel',      icon: '▭▭▭' },
];

const IMAGE_STYLES = [
  { value: 'fotorrealista', label: 'Fotorrealista', desc: 'Oficinas, personas, entornos corporativos reales' },
  { value: 'abstract',      label: 'Abstract Tech',  desc: 'Flujos de datos, redes neuronales, geometría digital' },
  { value: 'hibrido',       label: 'Híbrido',         desc: 'Escena real con overlays digitales y UI holográfica' },
];

const STEPS_SINGLE   = ['copy', 'image', 'layout', 'caption'];
const STEPS_CAROUSEL = ['copy', 'image', 'carousel', 'layout', 'caption'];

const FORMAT_SIZES = {
  '1:1':  { w: 1080, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
};

export default function PostGenerator() {
  const [form, setForm] = useState({
    brief: '', system: 'sistema-01', format: '1:1',
    tone: 'profesional', palette: 'navy', post_type: 'single',
  });
  const [phase, setPhase]       = useState('idle');
  const [steps, setSteps]       = useState({});
  const [post, setPost]         = useState(null);
  const [postHtml, setPostHtml] = useState(null);
  const [slides, setSlides]     = useState([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [copied, setCopied]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const iframeRef = useRef(null);
  const sseRef    = useRef(null);
  const [imageStyle, setImageStyle] = useState('fotorrealista');

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  const currentHtml = slides.length > 0 ? (slides[slideIdx]?.html || postHtml) : postHtml;
  const size = FORMAT_SIZES[form.format] || FORMAT_SIZES['1:1'];
  const previewScale = size.h > size.w ? 340 / size.h : 420 / size.w;

  async function handleGenerate() {
    if (!form.brief.trim()) return;
    setPhase('generating');
    setSteps({});
    setPost(null);
    setPostHtml(null);
    setSlides([]);
    setSlideIdx(0);

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, imageStyle }),
    });
    const { jobId, error } = await res.json();
    if (error || !jobId) { setPhase('error'); return; }

    const es = new EventSource(`/api/generate/stream/${jobId}`);
    sseRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === 'step') {
        setSteps(s => ({ ...s, [data.step]: { status: data.status, ...data } }));
        if (data.step === 'layout' && data.status === 'done') {
          if (data.slides && data.slides.length > 0) {
            setSlides(data.slides);
            setPostHtml(data.slides[0]?.html || data.html);
          } else if (data.html) {
            setPostHtml(data.html);
          }
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

  // Auto-render and save all slides/single post when generation completes
  useEffect(() => {
    if (phase !== 'done' || !postHtml) return;
    const timer = setTimeout(() => autoSaveAll(), 800);
    return () => clearTimeout(timer);
  }, [phase, postHtml]);

  async function renderIframeToB64(html, sz) {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${sz.w}px;height:${sz.h}px;border:none;`;
      iframe.sandbox = 'allow-same-origin';
      document.body.appendChild(iframe);
      iframe.onload = async () => {
        try {
          const html2canvas = (await import('html2canvas')).default;
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          const el = doc.body.firstElementChild || doc.body;
          const canvas = await html2canvas(el, {
            width: sz.w, height: sz.h, scale: 1,
            useCORS: true, allowTaint: true, backgroundColor: '#0b1e2d',
          });
          resolve(canvas.toDataURL('image/png').split(',')[1]);
        } catch { resolve(null); }
        finally { document.body.removeChild(iframe); }
      };
      iframe.srcdoc = html;
    });
  }

  async function autoSaveAll() {
    if (!post && phase !== 'done') return;
    setSaving(true);

    const postId = post?.id;
    if (!postId) { setSaving(false); return; }

    const sz = FORMAT_SIZES[form.format] || FORMAT_SIZES['1:1'];
    const allSlides = slides.length > 0 ? slides : [{ html: postHtml, index: 0 }];

    for (let i = 0; i < allSlides.length; i++) {
      const html = allSlides[i]?.html;
      if (!html) continue;
      const b64 = await renderIframeToB64(html, sz);
      if (!b64) continue;

      await fetch(`/api/posts/${postId}/save-png`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pngB64: b64, slideIndex: allSlides.length > 1 ? i : undefined }),
      });

      // Auto-download first slide / single post
      if (i === 0) {
        const link = document.createElement('a');
        link.download = slides.length > 1 ? `neura-carousel-${postId}-slide1.png` : `neura-post-${postId}.png`;
        link.href = `data:image/png;base64,${b64}`;
        link.click();
      }
    }
    setSaving(false);
  }

  async function handleDownloadSlide(idx) {
    setSaving(true);
    const allSlides = slides.length > 0 ? slides : [{ html: postHtml, index: 0 }];
    const html = allSlides[idx]?.html || postHtml;
    if (!html) { setSaving(false); return; }
    const sz = FORMAT_SIZES[form.format] || FORMAT_SIZES['1:1'];
    const b64 = await renderIframeToB64(html, sz);
    if (b64) {
      const link = document.createElement('a');
      link.download = slides.length > 1 ? `neura-carousel-${post?.id}-slide${idx + 1}.png` : `neura-post-${post?.id}.png`;
      link.href = `data:image/png;base64,${b64}`;
      link.click();
    }
    setSaving(false);
  }

  async function handleDownloadAll() {
    if (slides.length === 0) { handleDownloadSlide(0); return; }
    setSaving(true);
    const sz = FORMAT_SIZES[form.format] || FORMAT_SIZES['1:1'];
    for (let i = 0; i < slides.length; i++) {
      const b64 = await renderIframeToB64(slides[i].html, sz);
      if (b64) {
        const link = document.createElement('a');
        link.download = `neura-carousel-${post?.id}-slide${i + 1}.png`;
        link.href = `data:image/png;base64,${b64}`;
        link.click();
        await new Promise(r => setTimeout(r, 400));
      }
    }
    setSaving(false);
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
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ready' }),
    });
    setPost(p => ({ ...p, status: 'ready' }));
  }

  const activeSteps = form.post_type === 'carousel' ? STEPS_CAROUSEL : STEPS_SINGLE;
  const isCarousel  = slides.length > 1;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white">Post Generator</h1>
        <p className="text-white/40 mt-1 text-sm">AI agents: Copy → Image → Layout → Caption</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── LEFT: FORM ── */}
        <div className="space-y-5">
          <div className="card">
            <h2 className="font-display text-xl font-semibold text-white mb-5">Brief del post</h2>
            <div className="space-y-4">

              {/* Brief */}
              <div>
                <label className="label mb-2 block">Brief / Idea principal</label>
                <textarea
                  rows={4} className="input resize-none"
                  placeholder="Describe the post idea, target audience, key message..."
                  value={form.brief}
                  onChange={e => set('brief', e.target.value)}
                />
              </div>

              {/* System */}
              <div>
                <label className="label mb-2 block">System</label>
                <select className="input" value={form.system} onChange={e => set('system', e.target.value)}>
                  {SYSTEMS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Post type */}
              <div>
                <label className="label mb-2 block">Post type</label>
                <div className="flex gap-2">
                  {POST_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => set('post_type', t.value)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                        form.post_type === t.value
                          ? 'border-teal bg-teal/10 text-teal'
                          : 'border-white/10 text-white/50 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-mono">{t.icon}</span>
                      {t.label}
                      {t.value === 'carousel' && <Layers size={13} className="opacity-60" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format + Tone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-2 block">Format</label>
                  <select className="input" value={form.format} onChange={e => set('format', e.target.value)}>
                    {FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label mb-2 block">Tone</label>
                  <select className="input" value={form.tone} onChange={e => set('tone', e.target.value)}>
                    {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Palette */}
              <div>
                <label className="label mb-2 block">Color palette</label>
                <div className="flex gap-3">
                  {PALETTES.map(pl => (
                    <button
                      key={pl.value}
                      onClick={() => set('palette', pl.value)}
                      className={`flex-1 rounded-xl border p-3 flex flex-col items-center gap-2 transition-all ${
                        form.palette === pl.value
                          ? 'border-teal/60 bg-teal/8'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex gap-1">
                        {pl.colors.map((c, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border border-white/15" style={{ background: c }} />
                        ))}
                      </div>
                      <span className="label text-[10px]">{pl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Style */}
              <div>
                <label className="label mb-2 block">Image Style</label>
                <div className="flex flex-col gap-2">
                  {IMAGE_STYLES.map(style => (
                    <label
                      key={style.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        imageStyle === style.value
                          ? 'border-teal/50 bg-teal/8'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="imageStyle"
                        value={style.value}
                        checked={imageStyle === style.value}
                        onChange={() => setImageStyle(style.value)}
                        className="mt-0.5 accent-teal flex-shrink-0"
                      />
                      <div>
                        <div className="text-white text-sm font-semibold leading-tight">{style.label}</div>
                        <div className="text-white/40 text-xs mt-0.5 leading-snug">{style.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!form.brief.trim() || phase === 'generating'}
                className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {phase === 'generating'
                  ? <><RefreshCw size={16} className="animate-spin" /> Generando...</>
                  : <><Wand2 size={16} /> Generar {form.post_type === 'carousel' ? 'Carrusel' : 'Post'}</>
                }
              </button>
            </div>
          </div>

          {/* Progress */}
          {(phase === 'generating' || phase === 'done') && (
            <div className="card">
              <h2 className="font-display text-xl font-semibold text-white mb-4">Progreso</h2>
              <div className="space-y-2">
                {activeSteps.map(step => (
                  <ProgressStep key={step} step={step} state={steps[step]} />
                ))}
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="card border-red-500/30 bg-red-500/5">
              <p className="text-red-400 text-sm">Error during generation. Check server logs.</p>
            </div>
          )}
        </div>

        {/* ── RIGHT: PREVIEW ── */}
        <div className="space-y-5">
          {currentHtml ? (
            <>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-semibold text-white">
                    {isCarousel ? `Carrusel — Slide ${slideIdx + 1}/${slides.length}` : 'Preview'}
                  </h2>
                  <div className="flex items-center gap-2">
                    {post && <span className={`badge-${post.status}`}>{post.status}</span>}
                    {saving && <span className="label text-[10px] text-teal animate-pulse-teal">Guardando...</span>}
                  </div>
                </div>

                {/* Scaled iframe preview */}
                <div
                  className="overflow-hidden rounded-lg border border-white/10 mx-auto"
                  style={{ width: Math.round(size.w * previewScale), height: Math.round(size.h * previewScale) }}
                >
                  <iframe
                    ref={iframeRef}
                    srcDoc={currentHtml}
                    style={{
                      width: size.w, height: size.h,
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top left',
                      border: 'none', display: 'block',
                    }}
                    title="Post preview"
                    sandbox="allow-same-origin"
                  />
                </div>

                {/* Carousel navigation */}
                {isCarousel && (
                  <div className="flex items-center justify-center gap-3 mt-3">
                    <button
                      onClick={() => setSlideIdx(i => Math.max(0, i - 1))}
                      disabled={slideIdx === 0}
                      className="btn-secondary px-3 py-2 disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex gap-1.5">
                      {slides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSlideIdx(i)}
                          className={`w-2 h-2 rounded-full transition-all ${i === slideIdx ? 'bg-teal w-4' : 'bg-white/20'}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setSlideIdx(i => Math.min(slides.length - 1, i + 1))}
                      disabled={slideIdx === slides.length - 1}
                      className="btn-secondary px-3 py-2 disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {/* Download buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleDownloadSlide(isCarousel ? slideIdx : 0)}
                    disabled={saving}
                    className="btn-secondary flex-1 justify-center disabled:opacity-50"
                  >
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                    {isCarousel ? `Slide ${slideIdx + 1}` : 'Descargar PNG'}
                  </button>
                  {isCarousel && (
                    <button
                      onClick={handleDownloadAll}
                      disabled={saving}
                      className="btn-primary flex-1 justify-center disabled:opacity-50"
                    >
                      <Download size={16} /> Todos ({slides.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Caption */}
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
