import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export default function ContentCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch('/api/posts?limit=200').then(r => r.json()).then(setPosts).catch(() => {});
  }, []);

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const postsByDay = {};
  posts.forEach(p => {
    const d = new Date(p.created_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!postsByDay[day]) postsByDay[day] = [];
      postsByDay[day].push(p);
    }
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-theme">Calendario de Contenido</h1>
          <p className="text-theme-muted mt-1 text-sm">Posts creados por fecha</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="btn-secondary px-3 py-2"><ChevronLeft size={16} /></button>
          <span className="font-display text-xl font-semibold text-theme min-w-[180px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="btn-secondary px-3 py-2"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="card">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center label py-2">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="h-20" />;
            const dayPosts = postsByDay[day] || [];
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

            return (
              <div
                key={day}
                className={`h-20 p-1.5 rounded-lg border cursor-pointer transition-all ${
                  dayPosts.length > 0
                    ? 'border-teal/30 bg-teal/5 hover:bg-teal/10'
                    : 'border-black/8 hover:border-black/15'
                } ${isToday ? 'ring-1 ring-teal/40' : ''}`}
                onClick={() => setSelected(dayPosts.length > 0 ? { day, posts: dayPosts } : null)}
              >
                <div className={`text-xs font-medium mb-1 ${isToday ? 'text-teal' : 'text-theme-muted'}`}>{day}</div>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 2).map(p => (
                    <div key={p.id} className={`text-[10px] truncate px-1 rounded badge-${p.status}`}>
                      {p.headline || 'Post'}
                    </div>
                  ))}
                  {dayPosts.length > 2 && (
                    <div className="text-[10px] text-theme-muted px-1">+{dayPosts.length - 2} más</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="mt-6 card animate-fade-in">
          <h2 className="font-display text-xl font-semibold text-white mb-4">
            Posts del {selected.day} de {MONTHS[month]}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selected.posts.map(p => (
              <div key={p.id} className="flex gap-3 p-3 bg-navy rounded-lg border border-white/8">
                {p.png_url && <img src={p.png_url} alt="" className="w-14 h-14 rounded object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-theme truncate">{p.headline || 'Sin título'}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] text-theme-muted">{p.system}</span>
                    <span className={`badge-${p.status}`}>{p.status}</span>
                  </div>
                  {p.caption && (
                    <p className="text-[11px] text-theme-muted mt-1 line-clamp-2">{p.caption}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
