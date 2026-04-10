import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, TrendingUp, FileText, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tokenStats, setTokenStats] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/posts/stats/summary').then(r => r.json()),
      fetch('/api/analytics/tokens').then(r => r.json()),
      fetch('/api/posts?limit=4').then(r => r.json()),
    ]).then(([s, t, p]) => {
      setStats(s);
      setTokenStats(t);
      setRecentPosts(p);
    }).catch(() => {});
  }, []);

  const byStatus = stats?.by_status || {};
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 mt-1 text-sm">Resumen de actividad de Neura Command Center</p>
      </div>

      {/* Quick Action */}
      <button
        onClick={() => navigate('/studio/generator')}
        className="w-full mb-8 p-6 rounded-xl border border-teal/30 bg-teal/8 hover:bg-teal/12 transition-all duration-200 text-left group"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wand2 size={20} className="text-teal" />
              <span className="font-semibold text-white">Generar nuevo post</span>
            </div>
            <p className="text-white/40 text-sm">Copia, imagen AI, PNG exportado y caption en segundos</p>
          </div>
          <div className="text-teal/40 group-hover:text-teal transition-colors text-2xl">→</div>
        </div>
      </button>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Posts esta semana" value={stats?.this_week ?? '—'} icon={<FileText size={18} />} />
        <StatCard label="Total posts" value={total || '—'} icon={<TrendingUp size={18} />} />
        <StatCard label="Spend hoy" value={tokenStats ? `$${tokenStats.totals.today_cost.toFixed(4)}` : '—'} icon={<Clock size={18} />} accent="gold" />
        <StatCard label="Spend mes" value={tokenStats ? `$${tokenStats.totals.month_cost.toFixed(3)}` : '—'} icon={<CheckCircle size={18} />} accent="gold" />
      </div>

      {/* Status breakdown + Recent posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status */}
        <div className="card">
          <h2 className="font-display text-xl font-semibold text-white mb-5">Estado de posts</h2>
          <div className="space-y-3">
            {[
              { label: 'Draft', key: 'draft', cls: 'badge-draft' },
              { label: 'Ready', key: 'ready', cls: 'badge-ready' },
              { label: 'Published', key: 'published', cls: 'badge-published' },
            ].map(({ label, key, cls }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-white/5">
                <span className={cls}>{label}</span>
                <span className="text-white font-medium">{byStatus[key] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent posts */}
        <div className="card">
          <h2 className="font-display text-xl font-semibold text-white mb-5">Posts recientes</h2>
          {recentPosts.length === 0 ? (
            <p className="text-white/30 text-sm">Aún no hay posts generados.</p>
          ) : (
            <div className="space-y-3">
              {recentPosts.map(post => (
                <div key={post.id} className="flex items-center gap-3 py-2 border-b border-white/5">
                  {post.png_url && (
                    <img src={post.png_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 truncate">{post.headline || 'Sin título'}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-white/30">{post.system}</span>
                      <span className={`badge-${post.status}`}>{post.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent = 'teal' }) {
  const colors = accent === 'gold'
    ? 'text-gold border-gold/20 bg-gold/5'
    : 'text-teal border-teal/20 bg-teal/5';

  return (
    <div className={`rounded-xl border p-5 ${colors}`}>
      <div className="flex items-center gap-2 mb-3 opacity-70">{icon}<span className="label text-[10px]">{label}</span></div>
      <div className="text-3xl font-display font-bold text-white">{value}</div>
    </div>
  );
}
