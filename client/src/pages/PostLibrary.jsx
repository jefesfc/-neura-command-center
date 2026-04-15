import { useEffect, useState } from 'react';
import { RefreshCw, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';

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

  // Keyboard navigation when lightbox is open
  useEffect(() => {
    if (selected === null) return;
    const handler = (e) => {
      if (e.key === 'Escape') setSelected(null);
      if (e.key === 'ArrowRight') setSelected(i => (i + 1) % files.length);
      if (e.key === 'ArrowLeft')  setSelected(i => (i - 1 + files.length) % files.length);
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
          <h1 className="font-display text-4xl font-bold text-white">Post Library</h1>
          <p className="text-white/40 mt-1 text-sm">{files.length} imágenes guardadas</p>
        </div>
        <button onClick={fetchFiles} className="btn-secondary">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="card flex items-center justify-center h-48">
          <RefreshCw size={20} className="text-white/20 animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="card flex items-center justify-center h-48">
          <p className="text-white/20 text-sm">No hay imágenes en social-posts</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map((file, idx) => (
            <div
              key={file.filename}
              onClick={() => setSelected(idx)}
              className="group rounded-xl overflow-hidden border border-white/8 hover:border-teal/40 cursor-pointer transition-all"
            >
              <div className="w-full aspect-square bg-navy-light overflow-hidden">
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2 bg-navy-light">
                <p className="text-[10px] text-white/40 truncate font-mono">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {currentFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-3xl w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelected(null)}
              className="absolute -top-10 right-0 text-white/40 hover:text-white transition-colors"
            >
              <X size={22} />
            </button>

            {/* Image */}
            <img
              src={currentFile.url}
              alt={currentFile.name}
              className="w-full rounded-xl border border-white/10 shadow-2xl"
            />

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 px-1">
              <span className="font-mono text-[11px] text-white/30 truncate">{currentFile.name}</span>
              <a
                href={currentFile.url}
                download={currentFile.filename}
                className="btn-secondary text-xs"
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
                  className="absolute left-[-52px] top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <ChevronLeft size={36} />
                </button>
                <button
                  onClick={() => setSelected(i => (i + 1) % files.length)}
                  className="absolute right-[-52px] top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
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
