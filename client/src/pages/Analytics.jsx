import React, { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Zap, TrendingUp } from 'lucide-react';

const COLORS = { openai: '#1fa2b8', openrouter: '#c98a5a', copy: '#1fa2b8', image: '#c98a5a', caption: '#a78bfa' };

function fmt(n) { return n < 0.001 ? `$${(n * 1000).toFixed(4)}m` : `$${n.toFixed(4)}`; }

const TICK_COLOR = 'rgba(26,21,10,0.40)';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'rgb(var(--tw-navy-dark))', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '10px', padding: '10px 14px', fontSize: '12px',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: '#fff' }}>
            {p.name}: {typeof p.value === 'number' && p.value < 1 ? fmt(p.value) : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/analytics/tokens').then(r => r.json())
      .then(t => setData(t)).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div style={{ color: 'rgb(var(--color-text-muted))' }}>Cargando analytics...</div>
      </div>
    );
  }

  const byDayFormatted = data.by_day.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
  }));

  const featureData = data.by_feature.map(f => ({ name: f.feature, cost: f.cost, tokens: f.tokens }));

  const daysIntoMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projection = (data.totals.month_cost / daysIntoMonth) * daysInMonth;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>Analytics</h1>
        <p className="mt-1 text-sm" style={{ color: 'rgb(var(--color-text-muted))' }}>
          Costos de tokens y estadísticas de generación
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Spend hoy"       value={fmt(data.totals.today_cost)}  icon={<DollarSign size={18} />} />
        <KpiCard label="Spend este mes"  value={fmt(data.totals.month_cost)}  icon={<DollarSign size={18} />} accent="gold" />
        <KpiCard label="API calls mes"   value={data.totals.month_calls}      icon={<Zap size={18} />} />
        <KpiCard label="Proyección mes"  value={fmt(projection)}              icon={<TrendingUp size={18} />} accent="gold" />
      </div>

      {/* Spend by day chart */}
      <div className="card mb-6">
        <h2 className="font-display text-xl font-semibold mb-5" style={{ color: 'rgb(var(--color-text))' }}>
          Spend por día (30d)
        </h2>
        {byDayFormatted.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'rgb(var(--color-text-muted))' }}>
            Sin datos aún
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={byDayFormatted}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2a7fa8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2a7fa8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${v.toFixed(3)}`} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cost" stroke="#2a7fa8" fill="url(#colorCost)" strokeWidth={2} name="Costo USD" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* By provider */}
        <div className="card">
          <h2 className="font-display text-xl font-semibold mb-5" style={{ color: 'rgb(var(--color-text))' }}>
            Por proveedor
          </h2>
          {data.by_provider.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm" style={{ color: 'rgb(var(--color-text-muted))' }}>
              Sin datos
            </div>
          ) : (
            <div className="space-y-3">
              {data.by_provider.map(p => (
                <div key={p.provider} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[p.provider] || '#c9a84c' }} />
                  <span className="font-mono text-xs capitalize flex-1" style={{ color: 'rgb(var(--color-text-muted))' }}>
                    {p.provider}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                    {fmt(p.cost)}
                  </span>
                  <span className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>
                    {p.tokens.toLocaleString()} tokens
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By feature */}
        <div className="card">
          <h2 className="font-display text-xl font-semibold mb-5" style={{ color: 'rgb(var(--color-text))' }}>
            Por feature
          </h2>
          {featureData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm" style={{ color: 'rgb(var(--color-text-muted))' }}>
              Sin datos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={featureData} layout="vertical">
                <XAxis type="number" tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v.toFixed(4)}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: TICK_COLOR, fontSize: 11 }}
                  axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cost" radius={4} name="Costo USD">
                  {featureData.map((f, i) => (
                    <Cell key={i} fill={COLORS[f.name] || '#2a7fa8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, accent = 'teal' }) {
  const accentColor = accent === 'gold' ? 'rgb(var(--tw-gold))' : 'rgb(var(--tw-teal))';
  const accentBg    = accent === 'gold' ? 'rgba(201,168,76,0.08)' : 'rgba(42,127,168,0.08)';
  const accentBorder= accent === 'gold' ? 'rgba(201,168,76,0.20)' : 'rgba(42,127,168,0.20)';
  return (
    <div style={{
      borderRadius: '12px', border: `1px solid ${accentBorder}`,
      background: accentBg, padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', opacity: 0.7, color: accentColor }}>
        {icon}
        <span className="label text-[10px]">{label}</span>
      </div>
      <div className="font-display text-2xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
        {value}
      </div>
    </div>
  );
}
