import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wand2, CalendarDays,
  Images, BarChart3, Settings, ChevronRight, Search
} from 'lucide-react';

const nav = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Social Studio',
    children: [
      { label: 'Post Generator', to: '/studio/generator', icon: Wand2 },
      { label: 'Calendario', to: '/studio/calendar', icon: CalendarDays },
    ],
  },
  { label: 'Post Library', to: '/library', icon: Images },
  { label: 'Prospector', to: '/prospector', icon: Search },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Settings', to: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-navy-dark border-r border-white/8 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <img src="/logo.png" alt="Neura" className="h-8 w-auto object-contain" />
        <div className="font-mono text-[10px] text-white/30 tracking-[0.2em] uppercase mt-2">
          Command Center
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {nav.map((item) => {
          if (item.children) {
            const isGroupActive = item.children.some(c => location.pathname.startsWith(c.to));
            return (
              <div key={item.label}>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="label text-[10px]">{item.label}</span>
                  <ChevronRight size={12} className="text-white/20" />
                </div>
                <div className="ml-2 space-y-0.5">
                  {item.children.map(child => (
                    <NavItem key={child.to} {...child} />
                  ))}
                </div>
              </div>
            );
          }
          return <NavItem key={item.to} {...item} />;
        })}
      </nav>

      {/* Bottom */}
      <div className="px-6 py-4 border-t border-white/8">
        <div className="font-mono text-[10px] text-white/20 tracking-wider">
          neurasolutions.cloud
        </div>
      </div>
    </aside>
  );
}

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
          isActive
            ? 'bg-teal/15 text-teal font-medium'
            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
        }`
      }
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  );
}
