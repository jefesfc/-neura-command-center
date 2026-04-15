import { useEffect, useState } from 'react';
import { RefreshCw, Download, X, ChevronLeft, ChevronRight, Images } from 'lucide-react';

export default function PostLibrary() {
  const [files, setFiles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  function fetchFiles() {
    setLoading(true);
    fetch('/api/social-posts')
      .then(r => r.json())
      .then(data => { setFiles(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { fetchFiles(); }, []);

  useEffect(() => {
    if (selected === null) return;
    const handler = (e) => {
      if (e.key === 'Escape')      setSelected(null);
      if (e.key === 'ArrowRight')  setSelected(i => (i + 1) % files.length);
      if (e.key === 'ArrowLeft')   setSelected(i => (i - 1 + files.length) % files.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, files.length]);

  const currentFile = selected !== null ? files[selected] : null;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
            Post Library
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-muted))' }}>
            {files.length} imágenes guardadas
          </p>
        </div>
        <button onClick={fetchFiles} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="card flex items-center justify-center h-48">
          <RefreshCw size={20} className="animate-spin" style={{ color: 'rgb(var(--color-text-muted))' }} />
        </div>
      ) : files.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-64 gap-4">
          <Images size={40} style={{ color: 'rgb(var(--color-text-muted))', opacity: 0.4 }} />
          <div style={{ textAlign: 'center' }}>
            <p className="text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>
              No hay imágenes todavía
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-muted))' }}>
              Genera tu primer post en Social Studio → Post Generator
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, idx) => (
            <div
              key={file.filename}
              onClick={() => setSelected(idx)}
              className="card-3d cursor-pointer overflow-hidden"
              style={{ padding: 0 }}
            >
              <div className="w-full aspect-square overflow-hidden rounded-[13px]">
                <img
                  src={file.url}
                  alt={file.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>
              <div style={{ padding: '10px 14px' }}>
                <p className="font-mono truncate" style={{ fontSize: '10px', color: 'rgb(var(--color-text-muted))' }}>
                  {file.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {currentFile && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
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
              src={currentFile.url}
              alt={currentFile.name}
              style={{ width: '100%', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
            />

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', padding: '0 4px' }}>
              <span style={{ fontFamily: '"DM Mono",monospace', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                {currentFile.name}
              </span>
              <a
                href={currentFile.url}
                download={currentFile.filename}
                className="btn-secondary"
                style={{ fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={e => e.stopPropagation()}
              >
                <Download size={13} /> Descargar
              </a>
            </div>

            {/* Prev / Next */}
            {files.length > 1 && (
              <>
                <button
                  onClick={() => setSelected(i => (i - 1 + files.length) % files.length)}
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
                  onClick={() => setSelected(i => (i + 1) % files.length)}
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
