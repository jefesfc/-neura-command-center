import React, { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { DollarSign, Zap, TrendingUp } from 'lucide-react';

const COLORS = { openai: '#1fa2b8', openrouter: '#c98a5a', copy: '#1fa2b8', image: '#c98a5a', caption: '#a78bfa' };

function fmt(n) { return n < 0.001 ? `$${(n * 1000).toFixed(4)}m` : `$${n.toFixed(4)}`; }

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-navy-dark border border-white/15 rounded-lg p-3 text-xs">
        <div className="text-white/50 mb-1">{label}</div>
        {payload.map(p => (
          <div key={p.name} className="text-white">{p.name}: {typeof p.value === 'number' && p.value < 1 ? fmt(p.value) : p.value}</div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [postData, setPostData] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/tokens').then(r => r.json()),
      fetch('/api/analytics/posts').then(r => r.json()),
    ]).then(([t, p]) => { setData(t); setPostData(p); }).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-white/20">Cargando analytics...</div>
      </div>
    );
  }

  const byDayFormatted = data.by_day.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
  }));

  const providerData = data.by_provider.map(p => ({ name: p.provider, value: p.cost }));
  const featureData = data.by_feature.map(f => ({ name: f.feature, cost: f.cost, tokens: f.tokens }));

  // Month projection
  const daysIntoMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projection = (data.totals.month_cost / daysIntoMonth) * daysInMonth;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white">Analytics</h1>
        <p className="text-white/40 mt-1 text-sm">Costos de tokens y estadísticas de generación</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Spend hoy" value={fmt(data.totals.today_cost)} icon={<DollarSign size={18} />} />
        <KpiCard label="Spend este mes" value={fmt(data.totals.month_cost)} icon={<DollarSign size={18} />} accent="gold" />
        <KpiCard label="API calls mes" value={data.totals.month_calls} icon={<Zap size={18} />} />
        <KpiCard label="Proyección mes" value={fmt(projection)} icon={<TrendingUp size={18} />} accent="gold" />
      </div>

      {/* Spend by day chart */}
      <div className="card mb-6">
        <h2 className="font-display text-xl font-semibold text-white mb-5">Spend por día (30d)</h2>
        {byDayFormatted.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-white/20 text-sm">Sin datos aún</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={byDayFormatted}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1fa2b8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1fa2b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(3)}`} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cost" stroke="#1fa2b8" fill="url(#colorCost)" strokeWidth={2} name="Costo USD" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By provider */}
        <div className="card">
          <h2 className="font-display text-xl font-semibold text-white mb-5">Por proveedor</h2>
          {providerData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-white/20 text-sm">Sin datos</div>
          ) : (
            <div className="space-y-3">
              {data.by_provider.map(p => (
                <div key={p.provider} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[p.provider] || '#fff' }} />
                  <span className="font-mono text-xs text-white/60 capitalize flex-1">{p.provider}</span>
                  <span className="text-white text-sm font-medium">{fmt(p.cost)}</span>
                  <span className="text-white/30 text-xs">{p.tokens.toLocaleString()} tokens</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By feature */}
        <div className="card">
          <h2 className="font-display text-xl font-semibold text-white mb-5">Por feature</h2>
          {featureData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-white/20 text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={featureData} layout="vertical">
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(4)}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cost" radius={4} name="Costo USD">
                  {featureData.map((f, i) => (
                    <Cell key={i} fill={COLORS[f.name] || '#1fa2b8'} />
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
  const colors = accent === 'gold' ? 'text-gold border-gold/20 bg-gold/5' : 'text-teal border-teal/20 bg-teal/5';
  return (
    <div className={`rounded-xl border p-5 ${colors}`}>
      <div className="flex items-center gap-2 mb-3 opacity-60">{icon}<span className="label text-[10px]">{label}</span></div>
      <div className="text-2xl font-display font-bold text-white">{value}</div>
    </div>
  );
}
