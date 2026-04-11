import React, { useEffect, useState } from 'react';
import { Copy, Check, Trash2, RefreshCw } from 'lucide-react';

const STATUSES = ['all', 'draft', 'ready', 'published'];
const SYSTEMS = ['all', 'sistema-01', 'sistema-02', 'sistema-03'];

export default function PostLibrary() {
  const [posts, setPosts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [systemFilter, setSystemFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  function fetchPosts() {
    setLoading(true);
    const params = new URLSearchParams({ limit: 100 });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (systemFilter !== 'all') params.set('system', systemFilter);
    fetch(`/api/posts?${params}`)
      .then(r => r.json())
      .then(data => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { fetchPosts(); }, [statusFilter, systemFilter]);

  async function cycleStatus(post) {
    const next = { draft: 'ready', ready: 'published', published: 'draft' };
    const newStatus = next[post.status] || 'draft';
    await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchPosts();
    if (selected?.id === post.id) setSelected(p => ({ ...p, status: newStatus }));
  }

  async function deletePost(id) {
    if (!confirm('¿Eliminar este post?')) return;
    await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    fetchPosts();
    if (selected?.id === id) setSelected(null);
  }

  function copyCaption(post) {
    if (!post) return;
    navigator.clipboard.writeText(`${post.caption}\n\n${post.hashtags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-white">Post Library</h1>
          <p className="text-white/40 mt-1 text-sm">{posts.length} posts guardados</p>
        </div>
        <button onClick={fetchPosts} className="btn-secondary"><RefreshCw size={14} /> Actualizar</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div>
          <label className="label block mb-1">Estado</label>
          <div className="flex gap-1">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s ? 'bg-teal text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {s === 'all' ? 'Todos' : s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label block mb-1">Sistema</label>
          <div className="flex gap-1">
            {SYSTEMS.map(s => (
              <button
                key={s}
                onClick={() => setSystemFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  systemFilter === s ? 'bg-teal text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {s === 'all' ? 'Todos' : s.replace('sistema-', 'Sys ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grid */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="card flex items-center justify-center h-40">
              <RefreshCw size={20} className="text-white/20 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="card flex items-center justify-center h-40">
              <p className="text-white/20 text-sm">No hay posts con estos filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {posts.map(post => (
                <div
                  key={post.id}
                  className={`rounded-xl overflow-hidden border cursor-pointer transition-all ${
                    selected?.id === post.id ? 'border-teal/60 ring-1 ring-teal/30' : 'border-white/8 hover:border-white/20'
                  }`}
                  onClick={() => setSelected(post)}
                >
                  {post.image_b64 ? (
                    <img src={`data:image/jpeg;base64,${post.image_b64}`} alt="" className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-navy-light flex items-center justify-center">
                      <span className="text-white/10 text-xs">Sin imagen</span>
                    </div>
                  )}
                  <div className="p-2 bg-navy-light">
                    <div className="text-[11px] text-white/60 truncate">{post.headline || 'Sin título'}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`badge-${post.status} text-[10px]`}>{post.status}</span>
                      <span className="font-mono text-[10px] text-white/20">{post.system?.replace('sistema-', 'S')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div>
          {selected ? (
            <div className="card sticky top-8 animate-fade-in">
              <h2 className="font-display text-xl font-semibold text-white mb-4">{selected.headline || 'Post'}</h2>

              {selected.image_b64 && (
                <img src={`data:image/jpeg;base64,${selected.image_b64}`} alt="" className="w-full rounded-lg mb-4 border border-white/8" />
              )}

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => cycleStatus(selected)}
                  className={`badge-${selected.status} cursor-pointer hover:opacity-80`}
                >
                  {selected.status} →
                </button>
              </div>

              {selected.caption && (
                <div className="mb-4">
                  <div className="label mb-2">Caption</div>
                  <p className="text-white/60 text-xs leading-relaxed line-clamp-4">{selected.caption}</p>
                  <p className="text-teal/50 text-[10px] mt-2 leading-loose line-clamp-2">{selected.hashtags}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {selected.caption && (
                  <button onClick={() => copyCaption(selected)} className="btn-secondary justify-center">
                    {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar caption</>}
                  </button>
                )}
                <button onClick={() => deletePost(selected.id)} className="btn-secondary justify-center text-red-400/70 hover:text-red-400">
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </div>
          ) : (
            <div className="card flex items-center justify-center h-40">
              <p className="text-white/20 text-sm">Selecciona un post</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
