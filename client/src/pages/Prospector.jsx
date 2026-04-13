import React, { useEffect, useState } from 'react';
import {
  Search, Plus, Trash2, RefreshCw,
  Download, LayoutGrid, Table2, X, ChevronDown
} from 'lucide-react';

const CITY_GROUPS = {
  'UK':          ['London', 'Birmingham', 'Manchester', 'Leeds'],
  'Europe':      ['Madrid', 'Barcelona', 'Zürich', 'Basel', 'Rome', 'Berlin', 'Amsterdam', 'Paris'],
  'Middle East': ['Dubai', 'Abu Dhabi'],
  'Asia':        ['Tokyo', 'Singapore', 'Beijing'],
};

const BUSINESS_TYPES = ['Dentists', 'Medical Clinics', 'Real Estate Agency'];

const STATUS_OPTIONS = ['sin enviar', 'contactado', 'descartado'];
const STATUS_COLORS = {
  'sin enviar':  'text-white/50 bg-white/8',
  'contactado':  'text-teal bg-teal/15',
  'descartado':  'text-red-400/70 bg-red-400/10',
};

function relTime(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export default function Prospector() {
  const [jobs,          setJobs]          = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJob,   setSelectedJob]   = useState(null);
  const [leads,         setLeads]         = useState([]);
  const [showForm,      setShowForm]      = useState(false);
  const [businessType,  setBusinessType]  = useState('Dentists');
  const [city,          setCity]          = useState('London');
  const [triggering,    setTriggering]    = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [viewMode,      setViewMode]      = useState('card');

  useEffect(() => { fetchJobs(); }, []);

  async function fetchJobs() {
    try {
      const data = await fetch('/api/prospector/jobs').then(r => r.json());
      setJobs(Array.isArray(data) ? data : []);
    } catch (_) {}
  }

  async function selectJob(job) {
    setSelectedJobId(job.id);
    setSelectedJob(job);
    setLeads([]);
    await fetchResults(job.id);
  }

  async function fetchResults(jobId) {
    setRefreshing(true);
    try {
      const data = await fetch(`/api/prospector/results/${jobId}`).then(r => r.json());
      setLeads(data.leads || []);
      if (data.job) setSelectedJob(data.job);
    } catch (_) {}
    setRefreshing(false);
  }

  async function handleTrigger() {
    setTriggering(true);
    try {
      const data = await fetch('/api/prospector/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessType, city }),
      }).then(r => r.json());

      setShowForm(false);
      const newJob = {
        id: data.jobId,
        business_type: businessType,
        city,
        query: `${businessType} in ${city}`,
        triggered_at: data.triggeredAt,
        status: 'scraping',
        leads_count: 0,
      };
      setJobs(prev => [newJob, ...prev]);
      setSelectedJobId(data.jobId);
      setSelectedJob(newJob);
      setLeads([]);
    } catch (_) {}
    setTriggering(false);
  }

  async function handleUpdateStatus(leadId, status) {
    try {
      await fetch(`/api/prospector/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    } catch (_) {}
  }

  async function handleDeleteLead(leadId) {
    try {
      await fetch(`/api/prospector/leads/${leadId}`, { method: 'DELETE' });
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (_) {}
  }

  async function handleDeleteJob(jobId) {
    if (!window.confirm('¿Eliminar este job?')) return;
    try {
      await fetch(`/api/prospector/jobs/${jobId}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(j => j.id !== jobId));
      if (selectedJobId === jobId) {
        setSelectedJobId(null);
        setSelectedJob(null);
        setLeads([]);
      }
    } catch (_) {}
  }

  function handleExport() {
    window.open(`/api/prospector/export/${selectedJobId}`, '_blank');
  }

  return (
    <div className="flex h-screen animate-fade-in">
      {/* ── Left panel ── */}
      <aside className="w-64 shrink-0 border-r border-white/8 bg-navy-dark flex flex-col h-full overflow-hidden">
        {/* Panel header */}
        <div className="p-4 border-b border-white/8 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Prospector</h2>
            <p className="text-white/30 text-xs mt-0.5">Lead scraping</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="p-2 rounded-lg bg-teal/15 text-teal hover:bg-teal/25 transition-colors"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {/* New search form */}
        {showForm && (
          <div className="p-4 border-b border-white/8 bg-navy-light/40 space-y-3">
            <div>
              <label className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-1 block">
                Business Type
              </label>
              <select
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal/40"
              >
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-1 block">
                City
              </label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal/40"
              >
                {Object.entries(CITY_GROUPS).map(([region, cities]) => (
                  <optgroup key={region} label={region}>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="w-full py-2 rounded-lg bg-teal text-navy-dark font-semibold text-sm hover:bg-teal-light transition-colors disabled:opacity-50"
            >
              {triggering ? 'Iniciando...' : 'Start Scraping'}
            </button>
          </div>
        )}

        {/* Job list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {jobs.length === 0 && (
            <p className="text-white/20 text-xs text-center mt-8 px-4">
              Ningún job todavía.{' '}
              <button onClick={() => setShowForm(true)} className="text-teal/60 underline">
                Inicia uno
              </button>
            </p>
          )}
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={selectedJobId === job.id}
              onSelect={() => selectJob(job)}
              onDelete={() => handleDeleteJob(job.id)}
              relTime={relTime}
            />
          ))}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main className="flex-1 overflow-y-auto">
        {!selectedJob ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Search size={40} className="text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-sm">Selecciona un job o lanza un nuevo scraping</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Right panel header */}
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  {selectedJob.business_type} · {selectedJob.city}
                </h1>
                <p className="text-white/30 text-sm mt-1">{leads.length} leads encontrados</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* View toggle */}
                <div className="flex bg-navy-light rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setViewMode('card')}
                    title="Card view"
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'card' ? 'bg-teal/20 text-teal' : 'text-white/30 hover:text-white/60'
                    }`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    title="Table view"
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'table' ? 'bg-teal/20 text-teal' : 'text-white/30 hover:text-white/60'
                    }`}
                  >
                    <Table2 size={16} />
                  </button>
                </div>

                <button
                  onClick={() => fetchResults(selectedJobId)}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm transition-all disabled:opacity-50"
                >
                  <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                  Actualizar
                </button>

                <button
                  onClick={handleExport}
                  disabled={leads.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal/15 text-teal hover:bg-teal/25 text-sm font-medium transition-all disabled:opacity-30"
                >
                  <Download size={14} />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Leads content */}
            {leads.length === 0 ? (
              <div className="text-center py-20 border border-white/6 rounded-xl">
                <p className="text-white/20 text-sm">
                  No hay leads aún. Haz clic en <strong className="text-white/40">Actualizar</strong> para verificar.
                </p>
              </div>
            ) : viewMode === 'card' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {leads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    jobBusinessType={selectedJob.business_type}
                    jobCity={selectedJob.city}
                    onStatusChange={handleUpdateStatus}
                    onDelete={handleDeleteLead}
                  />
                ))}
              </div>
            ) : (
              <LeadTable
                leads={leads}
                onStatusChange={handleUpdateStatus}
                onDelete={handleDeleteLead}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function JobCard({ job, isSelected, onSelect, onDelete, relTime }) {
  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border p-3 cursor-pointer transition-all group ${
        isSelected
          ? 'border-teal/50 bg-teal/8'
          : 'border-white/8 hover:border-white/20 bg-navy-light/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">{job.business_type}</div>
          <div className="text-xs text-white/40 truncate">{job.city}</div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 text-white/30 hover:text-red-400/70 transition-all shrink-0"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
          job.status === 'done'
            ? 'bg-teal/15 text-teal'
            : 'bg-amber-500/15 text-amber-400'
        }`}>
          {job.status}
        </span>
        <div className="text-right">
          <div className="font-mono text-[11px] text-white/50">{job.leads_count} leads</div>
          <div className="font-mono text-[10px] text-white/20">{relTime(job.triggered_at)}</div>
        </div>
      </div>
    </div>
  );
}

function LeadCard({ lead, jobBusinessType, jobCity, onStatusChange, onDelete }) {
  return (
    <div className="rounded-xl border border-white/8 bg-navy-light hover:border-teal/20 transition-all p-4 flex flex-col">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-white text-sm leading-snug">
          {lead.company || 'Sin nombre'}
        </h3>
        <StatusBadge
          status={lead.status || 'sin enviar'}
          leadId={lead.id}
          onChange={onStatusChange}
        />
      </div>

      {/* Details */}
      <div className="space-y-1.5 flex-1 mb-3">
        {lead.address && (
          <div className="flex items-start gap-2 text-xs text-white/50">
            <span className="shrink-0 mt-0.5">📍</span>
            <span className="leading-relaxed">{lead.address}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span>📞</span>
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.email ? (
          <div className="flex items-center gap-2 text-xs">
            <span>✉</span>
            <a
              href={`mailto:${lead.email}`}
              className="text-teal/80 hover:text-teal truncate"
              onClick={e => e.stopPropagation()}
            >
              {lead.email}
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-white/20">
            <span>✉</span>
            <span>Sin email</span>
          </div>
        )}
        {lead.website && (
          <div className="flex items-center gap-2 text-xs">
            <span>🌐</span>
            <a
              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal/80 hover:text-teal truncate"
              onClick={e => e.stopPropagation()}
            >
              {lead.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/6">
        <span className="font-mono text-[10px] text-white/20">
          {jobBusinessType} · {jobCity}
        </span>
        <button
          onClick={() => onDelete(lead.id)}
          className="flex items-center gap-1 text-[10px] text-white/20 hover:text-red-400/70 transition-colors"
        >
          <Trash2 size={11} />
          Delete
        </button>
      </div>
    </div>
  );
}

function LeadTable({ leads, onStatusChange, onDelete }) {
  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy-light border-b border-white/8">
            {['Company', 'Phone', 'Email', 'Website', 'City', 'Status', ''].map(h => (
              <th
                key={h}
                className="text-left px-4 py-3 text-[11px] font-mono text-white/30 uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => (
            <tr
              key={lead.id}
              className={`border-b border-white/5 hover:bg-white/3 transition-colors ${
                i % 2 !== 0 ? 'bg-white/[0.02]' : ''
              }`}
            >
              <td className="px-4 py-3 text-white/80 font-medium">{lead.company || '—'}</td>
              <td className="px-4 py-3 text-white/40 font-mono text-xs whitespace-nowrap">
                {lead.phone || '—'}
              </td>
              <td className="px-4 py-3">
                {lead.email
                  ? <a href={`mailto:${lead.email}`} className="text-teal/80 hover:text-teal text-xs">{lead.email}</a>
                  : <span className="text-white/20">—</span>}
              </td>
              <td className="px-4 py-3">
                {lead.website
                  ? (
                    <a
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal/80 hover:text-teal text-xs"
                    >
                      {lead.website.replace(/^https?:\/\//, '').slice(0, 30)}
                    </a>
                  )
                  : <span className="text-white/20">—</span>}
              </td>
              <td className="px-4 py-3 text-white/40 text-xs">{lead.city || '—'}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  status={lead.status || 'sin enviar'}
                  leadId={lead.id}
                  onChange={onStatusChange}
                />
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(lead.id)}
                  className="text-white/20 hover:text-red-400/70 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status, leadId, onChange }) {
  const [open, setOpen] = useState(false);
  const color = STATUS_COLORS[status] || STATUS_COLORS['sin enviar'];

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium shrink-0 whitespace-nowrap ${color}`}
      >
        {status}
        <ChevronDown size={10} />
      </button>
      {open && (
        <>
          {/* Click-outside overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-navy-dark border border-white/10 rounded-lg overflow-hidden z-20 min-w-[130px] shadow-xl">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={e => { e.stopPropagation(); onChange(leadId, s); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${STATUS_COLORS[s]}`}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
