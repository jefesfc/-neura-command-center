import { useEffect, useState } from 'react';
import { RefreshCw, Download, X, ChevronLeft, ChevronRight, Images } from 'lucide-react';

const SYSTEM_LABELS = {
  'sistema-01': 'Sistema 01', 'sistema-02': 'Sistema 02', 'sistema-03': 'Sistema 03',
  'neura': 'Neura', 'ai-agents': 'AI Agents', 'crm': 'AI CRM', 'rag': 'RAG', 'ai': 'AI',
};

export default function PostLibrary() {
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  function fetchPosts() {
    setLoading(true);
    fetch('/api/posts?limit=100')
      .then(r => r.json())
      .then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => {
    if (selected === null) return;
    const handler = (e) => {
      if (e.key === 'Escape')      setSelected(null);
      if (e.key === 'ArrowRight')  setSelected(i => (i + 1) % posts.length);
      if (e.key === 'ArrowLeft')   setSelected(i => (i - 1 + posts.length) % posts.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, posts.length]);

  const currentPost = selected !== null ? posts[selected] : null;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
            Post Library
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-muted))' }}>
            {posts.length} posts guardados
          </p>
        </div>
        <button onClick={fetchPosts} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="card flex items-center justify-center h-48">
          <RefreshCw size={20} className="animate-spin" style={{ color: 'rgb(var(--color-text-muted))' }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-64 gap-4">
          <Images size={40} style={{ color: 'rgb(var(--color-text-muted))', opacity: 0.4 }} />
          <div style={{ textAlign: 'center' }}>
            <p className="text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>
              No hay posts todavía
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-muted))' }}>
              Genera tu primer post en Social Studio → Post Generator
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((post, idx) => (
            <div
              key={post.id}
              onClick={() => setSelected(idx)}
              className="card-3d cursor-pointer overflow-hidden"
              style={{ padding: 0 }}
            >
              <div className="w-full aspect-square overflow-hidden rounded-[13px]" style={{ background: '#12100d' }}>
                <img
                  src={`/api/posts/${post.id}/image`}
                  alt={post.headline || post.id}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  onError={e => { e.currentTarget.style.opacity = '0.3'; }}
                />
              </div>
              <div style={{ padding: '10px 14px' }}>
                <p className="truncate" style={{ fontSize: '12px', fontWeight: 500, color: 'rgb(var(--color-text))' }}>
                  {post.headline || '—'}
                </p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                  {post.system && (
                    <span style={{
                      fontFamily: '"DM Mono",monospace', fontSize: '9px',
                      background: 'rgba(201,168,76,0.12)', color: 'rgb(var(--tw-gold))',
                      border: '1px solid rgba(201,168,76,0.22)', padding: '1px 6px', borderRadius: '8px',
                    }}>
                      {SYSTEM_LABELS[post.system] || post.system}
                    </span>
                  )}
                  <span style={{ fontFamily: '"DM Mono",monospace', fontSize: '9px', color: 'rgb(var(--color-text-muted))' }}>
                    {post.format}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {currentPost && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ position: 'relative', maxWidth: '780px', width: '100%', margin: '0 16px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelected(null)}
              style={{
                position: 'absolute', top: '-40px', right: 0,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)', transition: 'color .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              <X size={22} />
            </button>

            {/* Image */}
            <img
              src={`/api/posts/${currentPost.id}/image`}
              alt={currentPost.headline || currentPost.id}
              style={{ width: '100%', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
            />

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', padding: '0 4px' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#fff', marginBottom: '2px' }}>
                  {currentPost.headline || '—'}
                </p>
                <p style={{ fontFamily: '"DM Mono",monospace', fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                  {SYSTEM_LABELS[currentPost.system] || currentPost.system} · {currentPost.format} · {currentPost.post_type}
                </p>
              </div>
              <a
                href={`/api/posts/${currentPost.id}/image`}
                download={`neura-post-${currentPost.id}.jpg`}
                className="btn-secondary"
                style={{ fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={e => e.stopPropagation()}
              >
                <Download size={13} /> Descargar
              </a>
            </div>

            {/* Prev / Next */}
            {posts.length > 1 && (
              <>
                <button
                  onClick={() => setSelected(i => (i - 1 + posts.length) % posts.length)}
                  style={{
                    position: 'absolute', left: '-52px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)', transition: 'color .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                >
                  <ChevronLeft size={36} />
                </button>
                <button
                  onClick={() => setSelected(i => (i + 1) % posts.length)}
                  style={{
                    position: 'absolute', right: '-52px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)', transition: 'color .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                >
                  <ChevronRight size={36} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
