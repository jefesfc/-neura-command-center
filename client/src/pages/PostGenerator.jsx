import React, { useState, useRef, useEffect } from 'react';
import { Wand2, Download, RefreshCw, Check, Copy, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Settings2, Plus } from 'lucide-react';
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
  { value: '1:1',  label: '1:1 Feed' },
  { value: '9:16', label: '9:16 Story' },
];

const TONES = [
  { value: 'auto',        label: 'Auto' },
  { value: 'premium',     label: 'Premium' },
  { value: 'aggressive',  label: 'Aggressive' },
  { value: 'educational', label: 'Educational' },
];

const PALETTES = [
  { value: 'navy', label: 'Navy', colors: ['#0b1e2d', '#1fa2b8', '#c98a5a'] },
  { value: 'gold', label: 'Gold', colors: ['#130e04', '#d4a040', '#f0d080'] },
  { value: 'grey', label: 'Grey', colors: ['#08080e', '#8fa8be', '#1fa2b8'] },
];

const PLATFORMS = [
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook',  label: 'Facebook' },
];

const GOALS = [
  { value: 'awareness',  label: 'Awareness' },
  { value: 'authority',  label: 'Authority' },
  { value: 'conversion', label: 'Conversion' },
];

const CONTENT_TYPES = [
  { value: 'auto',     label: 'Auto' },
  { value: 'single',   label: 'Single' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'ad',       label: 'Ad' },
];

const STYLES = [
  {
    value: 'cinematic_dense',
    label: 'Cinematic',
    desc: 'Full background · Dark overlay · High impact',
    tag: 'Ads / Authority',
  },
  {
    value: 'structured_carousel',
    label: 'Structured',
    desc: 'Modular · Multi-slide · Educational flow',
    tag: 'Carousel / Education',
  },
];

const IMAGE_STYLES = [
  { value: 'fotorrealista', label: 'Fotorealistic', desc: 'Office, people, real corporate scenes' },
  { value: 'abstract',      label: 'Abstract Tech',  desc: 'Data streams, neural networks, digital' },
  { value: 'hibrido',       label: 'Hybrid',         desc: 'Real scene with digital UI overlays' },
];

const CTA_TYPES = [
  { value: 'auto', label: 'Auto' },
  { value: 'soft', label: 'Soft' },
  { value: 'hard', label: 'Hard' },
];

const STEPS_SINGLE   = ['creative-director', 'copy', 'image', 'layout', 'caption', 'validation'];
const STEPS_CAROUSEL = ['creative-director', 'copy', 'image', 'carousel', 'layout', 'caption', 'validation'];

const FORMAT_SIZES = {
  '1:1':  { w: 1080, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
};

export default function PostGenerator() {
  const [form, setForm] = useState({
    brief: '', system: 'sistema-01', format: '1:1',
    tone: 'auto', palette: 'navy', post_type: 'single',
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

  const [imageStyle, setImageStyle]     = useState('fotorrealista');
  const [platform, setPlatform]         = useState('Instagram');
  const [goal, setGoal]                 = useState('authority');
  const [layoutStyle, setLayoutStyle]   = useState('cinematic_dense');
  const [context, setContext]           = useState('');
  const [ctaType, setCtaType]           = useState('auto');
  const [contentType, setContentType]   = useState('auto');
  const [briefLang, setBriefLang]       = useState('es');
  const [showContext, setShowContext]   = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function handleContentType(val) {
    setContentType(val);
    if (val === 'carousel') set('post_type', 'carousel');
    else if (val === 'single' || val === 'ad') set('post_type', 'single');
    else set('post_type', layoutStyle === 'structured_carousel' ? 'carousel' : 'single');
  }

  function handleLayoutStyle(val) {
    setLayoutStyle(val);
    if (contentType === 'auto') {
      set('post_type', val === 'structured_carousel' ? 'carousel' : 'single');
    }
  }

  const currentHtml  = slides.length > 0 ? (slides[slideIdx]?.html || postHtml) : postHtml;
  const size         = FORMAT_SIZES[form.format] || FORMAT_SIZES['1:1'];
  const previewScale = size.h > size.w ? 340 / size.h : 420 / size.w;

  async function handleGenerate() {
    if (!form.brief.trim()) return;
    setPhase('generating');
    setSteps({});
    setPost(null);
    setPostHtml(null);
    setSlides([]);
    setSlideIdx(0);

    const langNote = briefLang === 'es'
      ? '\n\n[NOTE: The brief above is written in Spanish. Translate and understand it, but generate ALL output — headline, copy, description, CTA, caption, hashtags — in ENGLISH.]'
      : '';
    const briefWithLang = (form.brief || '').trim() + langNote;

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, brief: briefWithLang, imageStyle, platform, goal, layoutStyle, context, ctaType }),
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

  useEffect(() => {
    if (phase !== 'done' || !postHtml || !post?.id) return;
    const timer = setTimeout(() => autoSaveAll(), 800);
    return () => clearTimeout(timer);
  }, [phase, postHtml, post?.id]);

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
        } catch (err) { console.error('[renderIframeToB64]', err); resolve(null); }
        finally { document.body.removeChild(iframe); }
      };
      iframe.srcdoc = html;
    });
  }

  function triggerDownload(b64, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = `data:image/png;base64,${b64}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function triggerZipDownload(items, zipName) {
    // items: [{ b64, filename }]
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    items.forEach(({ b64, filename }) => zip.file(filename, b64, { base64: true }));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = zipName;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function autoSaveAll() {
    if (!post && phase !== 'done') return;
    setSaving(true);
    const postId = post?.id;
    if (!postId) { setSaving(false); return; }

    const sz        = FORMAT_SIZES[form.format] || FORMAT_SIZES['1:1'];
    const allSlides = slides.length > 0 ? slides : [{ html: postHtml, index: 0 }];
    const rendered  = [];

    for (let i = 0; i < allSlides.length; i++) {
      const html = allSlides[i]?.html;
      if (!html) continue;
      const b64 = await renderIframeToB64(html, sz);
      if (!b64) continue;

      // Save to server
      await fetch(`/api/posts/${postId}/save-png`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pngB64: b64, slideIndex: allSlides.length > 1 ? i : undefined }),
      });

      rendered.push({ b64, filename: allSlides.length > 1
        ? `neura-carousel-${postId}-slide${i + 1}.png`
        : `neura-post-${postId}.png`
      });
    }

    // Single download: ZIP if multiple slides, PNG if single
    if (rendered.length > 1) {
      await triggerZipDownload(rendered, `neura-carousel-${postId}.zip`);
    } else if (rendered.length === 1) {
      triggerDownload(rendered[0].b64, rendered[0].filename);
    }

    setSaving(false);
  }

  async function handleDownloadSlide(idx) {
    setSaving(true);
    const allSlides = slides.length > 0 ? slides : [{ html: postHtml, index: 0 }];
    const html = allSlides[idx]?.html || postHtml;
    if (!html) { setSaving(false); return; }
    const sz  = FORMAT_SIZES[form.format] || FORMAT_SIZES['1:1'];
    const b64 = await renderIframeToB64(html, sz);
    if (b64) {
      const filename = slides.length > 1
        ? `neura-carousel-${post?.id}-slide${idx + 1}.png`
        : `neura-post-${post?.id}.png`;
      triggerDownload(b64, filename);
    }
    setSaving(false);
  }

  async function handleDownloadAll() {
    if (slides.length === 0) { handleDownloadSlide(0); return; }
    setSaving(true);
    const sz      = FORMAT_SIZES[form.format] || FORMAT_SIZES['1:1'];
    const items   = [];
    for (let i = 0; i < slides.length; i++) {
      const b64 = await renderIframeToB64(slides[i].html, sz);
      if (b64) items.push({ b64, filename: `neura-carousel-${post?.id}-slide${i + 1}.png` });
    }
    if (items.length > 0) {
      await triggerZipDownload(items, `neura-carousel-${post?.id}.zip`);
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

  // Toggle button helper
  const Toggle = ({ options, value, onChange }) => (
    <div className="flex gap-1.5">
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
            value === o.value
              ? 'border-teal/50 bg-teal/10 text-teal'
              : 'border-black/10 text-theme-muted hover:border-black/20'
          }`}
        >{o.label}</button>
      ))}
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-theme">Post Generator</h1>
        <p className="text-theme-muted mt-1 text-sm">Creative Director → Copy → Image → Layout → Caption</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── LEFT: FORM ── */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-display text-xl font-semibold text-theme mb-6">Create Content</h2>
            <div className="space-y-5">

              {/* 1. Main Request */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">What do you want to create?</label>
                  <div className="flex rounded-lg overflow-hidden border border-black/10" style={{ fontSize: '10px' }}>
                    {[{ v: 'es', label: 'ES' }, { v: 'en', label: 'EN' }].map(({ v, label }) => (
                      <button
                        key={v}
                        onClick={() => setBriefLang(v)}
                        style={{
                          padding: '3px 10px',
                          fontFamily: '"DM Mono", monospace',
                          fontWeight: 500,
                          letterSpacing: '0.08em',
                          transition: 'all .15s',
                          background: briefLang === v ? 'rgb(var(--tw-gold))' : 'transparent',
                          color: briefLang === v ? 'rgb(var(--tw-navy-dark))' : 'rgb(var(--color-text-muted))',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >{label}</button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={4} className="input resize-none"
                  placeholder={briefLang === 'es'
                    ? 'Describe la idea, tema o objetivo del post...'
                    : 'Describe the idea, topic or goal...'}
                  value={form.brief}
                  onChange={e => set('brief', e.target.value)}
                />
              </div>

              {/* 2. System */}
              <div>
                <label className="label mb-2 block">System / Product</label>
                <select className="input" value={form.system} onChange={e => set('system', e.target.value)}>
                  {SYSTEMS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* 3. Platform + Objective */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-2 block">Platform</label>
                  <Toggle options={PLATFORMS} value={platform} onChange={setPlatform} />
                </div>
                <div>
                  <label className="label mb-2 block">Objective</label>
                  <Toggle options={GOALS} value={goal} onChange={setGoal} />
                </div>
              </div>

              {/* 4. Content Type */}
              <div>
                <label className="label mb-2 block">Content Type</label>
                <Toggle options={CONTENT_TYPES} value={contentType} onChange={handleContentType} />
              </div>

              {/* 5. Visual Style */}
              <div>
                <label className="label mb-2 block">Visual Style</label>
                <div className="flex gap-2">
                  {STYLES.map(s => (
                    <button key={s.value} onClick={() => handleLayoutStyle(s.value)}
                      className={`flex-1 p-3.5 rounded-xl border text-left transition-all ${
                        layoutStyle === s.value
                          ? 'border-teal/60 bg-teal/8'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`text-sm font-semibold mb-0.5 ${layoutStyle === s.value ? 'text-theme' : 'text-theme-muted'}`}>
                        {s.label}
                      </div>
                      <div className="text-[10px] text-theme-muted leading-snug">{s.desc}</div>
                      <div className={`text-[9px] mt-1.5 font-mono uppercase tracking-wider ${
                        layoutStyle === s.value ? 'text-teal/60' : 'text-theme-muted opacity-50'
                      }`}>{s.tag}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Color Palette */}
              <div>
                <label className="label mb-2 block">Color Palette</label>
                <div className="flex gap-2">
                  {PALETTES.map(pl => (
                    <button key={pl.value} onClick={() => set('palette', pl.value)}
                      className={`flex-1 rounded-xl border p-2.5 flex flex-col items-center gap-1.5 transition-all ${
                        form.palette === pl.value ? 'border-teal/60 bg-teal/8' : 'border-black/10 hover:border-black/20'
                      }`}
                    >
                      <div className="flex gap-1">
                        {pl.colors.map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-full border border-black/15" style={{ background: c }} />
                        ))}
                      </div>
                      <span className="label text-[10px]">{pl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Image Style */}
              <div>
                <label className="label mb-2 block">Image Style</label>
                <div className="flex flex-col gap-1.5">
                  {IMAGE_STYLES.map(style => (
                    <label key={style.value}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        imageStyle === style.value ? 'border-teal/50 bg-teal/8' : 'border-black/10 hover:border-black/20'
                      }`}
                    >
                      <input
                        type="radio" name="imageStyle" value={style.value}
                        checked={imageStyle === style.value}
                        onChange={() => setImageStyle(style.value)}
                        className="accent-teal flex-shrink-0"
                      />
                      <div>
                        <div className="text-theme text-xs font-semibold">{style.label}</div>
                        <div className="text-theme-muted text-[10px] mt-0.5">{style.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 8. Optional Context */}
              <div>
                <button
                  onClick={() => setShowContext(v => !v)}
                  className="flex items-center gap-2 text-theme-muted hover:text-theme text-xs font-medium transition-all"
                >
                  <Plus size={12} className={`transition-transform duration-200 ${showContext ? 'rotate-45' : ''}`} />
                  Optional Context
                </button>
                {showContext && (
                  <div className="mt-2">
                    <textarea
                      rows={3} className="input resize-none text-sm"
                      placeholder="Target audience, offer, niche, specific angle..."
                      value={context}
                      onChange={e => setContext(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* 9. Advanced Settings */}
              <div className="border-t border-black/8 pt-4">
                <button
                  onClick={() => setShowAdvanced(v => !v)}
                  className="flex items-center gap-2 text-theme-muted hover:text-theme text-xs font-medium transition-all w-full"
                >
                  <Settings2 size={12} />
                  Advanced Settings
                  {showAdvanced
                    ? <ChevronUp size={12} className="ml-auto" />
                    : <ChevronDown size={12} className="ml-auto" />
                  }
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4">
                    {/* Format */}
                    <div>
                      <label className="label mb-2 block">Format</label>
                      <Toggle options={FORMATS} value={form.format} onChange={v => set('format', v)} />
                    </div>
                    {/* Tone */}
                    <div>
                      <label className="label mb-2 block">Tone</label>
                      <Toggle options={TONES} value={form.tone} onChange={v => set('tone', v)} />
                    </div>
                    {/* CTA Type */}
                    <div>
                      <label className="label mb-2 block">CTA Type</label>
                      <Toggle options={CTA_TYPES} value={ctaType} onChange={setCtaType} />
                    </div>
                  </div>
                )}
              </div>

            </div>

            <button
              onClick={handleGenerate}
              disabled={!form.brief.trim() || phase === 'generating'}
              className="btn-primary w-full justify-center mt-6 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {phase === 'generating'
                ? <><RefreshCw size={16} className="animate-spin" /> Generating...</>
                : <><Wand2 size={16} /> Generate {form.post_type === 'carousel' ? 'Carousel' : 'Post'}</>
              }
            </button>
          </div>

          {/* Progress */}
          {(phase === 'generating' || phase === 'done') && (
            <div className="card">
              <h2 className="font-display text-xl font-semibold text-theme mb-4">Progress</h2>
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
                  <h2 className="font-display text-xl font-semibold text-theme">
                    {isCarousel ? `Carousel — Slide ${slideIdx + 1}/${slides.length}` : 'Preview'}
                  </h2>
                  <div className="flex items-center gap-2">
                    {post && <span className={`badge-${post.status}`}>{post.status}</span>}
                    {saving && <span className="label text-[10px] text-teal animate-pulse-teal">Saving...</span>}
                  </div>
                </div>

                <div
                  className="overflow-hidden rounded-lg border border-black/10 mx-auto"
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

                {isCarousel && (
                  <div className="flex items-center justify-center gap-3 mt-3">
                    <button onClick={() => setSlideIdx(i => Math.max(0, i - 1))} disabled={slideIdx === 0}
                      className="btn-secondary px-3 py-2 disabled:opacity-30">
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex gap-1.5">
                      {slides.map((_, i) => (
                        <button key={i} onClick={() => setSlideIdx(i)}
                          className={`w-2 h-2 rounded-full transition-all ${i === slideIdx ? 'bg-teal w-4' : 'bg-white/20'}`} />
                      ))}
                    </div>
                    <button onClick={() => setSlideIdx(i => Math.min(slides.length - 1, i + 1))} disabled={slideIdx === slides.length - 1}
                      className="btn-secondary px-3 py-2 disabled:opacity-30">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleDownloadSlide(isCarousel ? slideIdx : 0)} disabled={saving}
                    className="btn-secondary flex-1 justify-center disabled:opacity-50">
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                    {isCarousel ? `Slide ${slideIdx + 1}` : 'Download PNG'}
                  </button>
                  {isCarousel && (
                    <button onClick={handleDownloadAll} disabled={saving}
                      className="btn-primary flex-1 justify-center disabled:opacity-50">
                      <Download size={16} /> ZIP ({slides.length} slides)
                    </button>
                  )}
                </div>
              </div>

              {post?.caption && (
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-xl font-semibold text-theme">Caption</h2>
                    <button onClick={handleCopyCaption} className="btn-secondary px-3 py-2 text-xs">
                      {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                    </button>
                  </div>
                  <p className="text-theme text-sm leading-relaxed whitespace-pre-wrap">{post.caption}</p>
                  <p className="text-teal/60 text-xs mt-3 leading-loose">{post.hashtags}</p>
                  <button onClick={handleMarkReady} className="btn-gold w-full justify-center mt-4">
                    <Check size={16} /> Mark as Ready
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card h-80 flex items-center justify-center">
              <div className="text-center">
                <Wand2 size={40} className="text-theme-muted mx-auto mb-3 opacity-20" />
                <p className="text-theme-muted text-sm">Generated post will appear here</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
