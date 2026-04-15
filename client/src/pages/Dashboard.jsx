import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, TrendingUp, FileText, CheckCircle, Clock } from 'lucide-react';

/* ── Stat Card 3D ─────────────────────────────────────── */
function StatCard({ label, value, sub, icon, accentVar = '--tw-gold' }) {
  const accent = `rgb(var(${accentVar}))`;
  const accentDim = accentVar === '--tw-gold'
    ? 'rgba(201,168,76,0.12)'
    : accentVar === '--tw-teal'
      ? 'rgba(42,127,168,0.10)'
      : 'rgba(58,140,98,0.10)';

  return (
    <div className="card-3d" style={{ cursor: 'default' }}>
      {/* Bottom accent strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
        background: accentVar === '--tw-gold'
          ? 'linear-gradient(90deg, rgb(var(--tw-gold)), rgb(var(--tw-gold-light)))'
          : accent,
        opacity: .65,
      }} />

      {/* Icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px' }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '8px',
          background: accentDim, color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </div>
        <span className="label">{label}</span>
      </div>

      {/* Value */}
      <div style={{
        fontFamily: '"Cormorant Garamond", serif',
        fontSize: '44px', fontWeight: 700, lineHeight: 1,
        letterSpacing: '-.03em', color: 'rgb(var(--color-text))',
      }}>
        {value}
      </div>

      {/* Sub */}
      {sub && (
        <div style={{ fontSize: '11px', color: 'rgb(var(--color-text-muted))', marginTop: '7px' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* ── Status bar row ───────────────────────────────────── */
function StatusRow({ label, count, total, barColor }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '11px 0', borderBottom: '1px solid var(--card-border)',
    }}>
      <span style={{ flex: 1, fontSize: '13px', color: 'rgb(var(--color-text))' }}>{label}</span>
      <div style={{
        flex: '0 0 80px', height: '4px',
        background: 'rgba(0,0,0,0.07)', borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '2px' }} />
      </div>
      <span style={{ fontSize: '16px', fontWeight: 600, fontFamily: '"Cormorant Garamond", serif',
        color: 'rgb(var(--color-text))', minWidth: '24px', textAlign: 'right' }}>
        {count}
      </span>
    </div>
  );
}

/* ── Recent post row ──────────────────────────────────── */
function PostRow({ post }) {
  const statusColor = post.status === 'published'
    ? 'rgb(var(--tw-gold-dark))'
    : post.status === 'ready'
      ? 'rgb(var(--tw-teal))'
      : 'rgb(var(--color-text-muted))';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '11px 0', borderBottom: '1px solid var(--card-border)',
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '8px', flexShrink: 0,
        background: 'linear-gradient(135deg, rgb(var(--tw-navy)), rgb(var(--tw-navy-light)))',
        border: '1px solid var(--card-border)', overflow: 'hidden',
      }}>
        {post.png_url && (
          <img src={post.png_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgb(var(--color-text))',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {post.headline || 'Sin título'}
        </div>
        <div style={{ fontSize: '10px', fontFamily: '"DM Mono", monospace',
          color: 'rgb(var(--color-text-muted))', marginTop: '2px', display: 'flex', gap: '8px' }}>
          <span>{post.system}</span>
          <span style={{ color: statusColor }}>● {post.status}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard page ───────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats]           = useState(null);
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
      setRecentPosts(Array.isArray(p) ? p : []);
    }).catch(() => {});
  }, []);

  const byStatus = stats?.by_status || {};
  const total = Object.values(byStatus).reduce((a, b) => Number(a) + Number(b), 0);

  return (
    <div className="animate-fade-in" style={{ padding: '32px', maxWidth: '960px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '44px', fontWeight: 700, lineHeight: 1,
          letterSpacing: '-.02em', color: 'rgb(var(--color-text))' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: 'rgb(var(--color-text-muted))', marginTop: '6px' }}>
          Resumen de actividad — Neura Command Center
        </p>
      </div>

      {/* Quick action */}
      <div
        onClick={() => navigate('/studio/generator')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '22px 28px', borderRadius: '16px', marginBottom: '24px',
          background: 'linear-gradient(135deg, rgb(var(--tw-navy-dark)) 0%, #2a2015 100%)',
          border: '1px solid rgba(201,168,76,0.25)', cursor: 'pointer', transition: 'all .2s',
          boxShadow: '0 8px 32px rgba(100,70,20,0.18), inset 0 1px 0 rgba(201,168,76,0.10)',
          transform: 'perspective(1200px) rotateX(1deg)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'perspective(1200px) rotateX(0deg) translateY(-3px)';
          e.currentTarget.style.borderColor = 'rgba(201,168,76,0.45)';
          e.currentTarget.style.boxShadow = '0 14px 44px rgba(100,70,20,0.24), inset 0 1px 0 rgba(201,168,76,0.18)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'perspective(1200px) rotateX(1deg)';
          e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(100,70,20,0.18), inset 0 1px 0 rgba(201,168,76,0.10)';
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
            <Wand2 size={18} color="rgb(var(--tw-gold))" />
            Generar nuevo post con IA
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
            Copia, imagen AI, layout premium y caption — pipeline completo
          </p>
        </div>
        <div style={{ fontSize: '26px', color: 'rgba(201,168,76,0.5)', transition: 'all .2s' }}>→</div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
        <StatCard
          label="Posts esta semana"
          value={stats?.this_week ?? '—'}
          sub={stats?.this_week != null ? '+4 vs anterior' : undefined}
          icon={<FileText size={13} />}
          accentVar="--tw-gold"
        />
        <StatCard
          label="Total posts"
          value={total || '—'}
          sub="Desde el inicio"
          icon={<TrendingUp size={13} />}
          accentVar="--tw-gold"
        />
        <StatCard
          label="Spend hoy"
          value={tokenStats ? `$${tokenStats.totals.today_cost.toFixed(3)}` : '—'}
          sub={tokenStats ? `${tokenStats.totals.today_requests ?? '—'} generaciones` : undefined}
          icon={<Clock size={13} />}
          accentVar="--tw-teal"
        />
        <StatCard
          label="Spend mes"
          value={tokenStats ? `$${tokenStats.totals.month_cost.toFixed(2)}` : '—'}
          sub="de $10 presupuesto"
          icon={<CheckCircle size={13} />}
          accentVar="--tw-teal"
        />
      </div>

      {/* Two-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

        {/* Status */}
        <div className="card-3d">
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px',
            color: 'rgb(var(--color-text))' }}>
            Estado de posts
          </h2>
          <StatusRow
            label="Draft" count={byStatus.draft || 0} total={total}
            barColor="rgba(0,0,0,0.18)"
          />
          <StatusRow
            label="Ready" count={byStatus.ready || 0} total={total}
            barColor="rgb(var(--tw-teal))"
          />
          <StatusRow
            label="Published" count={byStatus.published || 0} total={total}
            barColor="linear-gradient(90deg, rgb(var(--tw-gold)), rgb(var(--tw-gold-light)))"
          />
        </div>

        {/* Recent posts */}
        <div className="card-3d">
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px',
            color: 'rgb(var(--color-text))' }}>
            Posts recientes
          </h2>
          {recentPosts.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'rgb(var(--color-text-muted))' }}>
              Aún no hay posts generados.
            </p>
          ) : (
            recentPosts.map(post => <PostRow key={post.id} post={post} />)
          )}
        </div>

      </div>
    </div>
  );
}
