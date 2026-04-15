import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wand2, CalendarDays,
  Images, BarChart3, Settings, Search, ChevronRight,
} from 'lucide-react';

const nav = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Social Studio',
    children: [
      { label: 'Post Generator', to: '/studio/generator', icon: Wand2, badge: 'AI' },
      { label: 'Calendario',    to: '/studio/calendar',  icon: CalendarDays },
    ],
  },
  {
    label: 'Contenido',
    children: [
      { label: 'Post Library', to: '/library',    icon: Images },
      { label: 'Prospector',   to: '/prospector', icon: Search },
    ],
  },
  {
    label: 'Sistema',
    children: [
      { label: 'Analytics', to: '/analytics', icon: BarChart3 },
      { label: 'Settings',  to: '/settings',  icon: Settings  },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="w-56 shrink-0 flex flex-col h-screen sticky top-0"
      style={{
        background: 'rgb(var(--tw-navy-dark))',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow orb top */}
      <div style={{
        position: 'absolute', top: '-60px', left: '-40px',
        width: '220px', height: '220px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{ padding: '20px 22px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
        <img
          src="/logo.png"
          alt="Neura Solutions"
          style={{ width: '86px', height: '86px', objectFit: 'contain' }}
        />
        <div style={{
            fontFamily: '"DM Mono", monospace', fontSize: '8px',
            color: 'rgba(201,168,76,0.42)', letterSpacing: '.22em',
            textTransform: 'uppercase',
          }}>
            Command Center
          </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
        {nav.map((item) => {
          if (item.children) {
            return (
              <div key={item.label} style={{ marginBottom: '4px' }}>
                <div style={{
                  fontFamily: '"DM Mono", monospace', fontSize: '9px',
                  color: 'rgba(255,255,255,0.2)', letterSpacing: '.2em',
                  textTransform: 'uppercase', padding: '12px 10px 6px',
                }}>
                  {item.label}
                </div>
                {item.children.map(child => (
                  <NavItem key={child.to} {...child} />
                ))}
              </div>
            );
          }
          return <NavItem key={item.to} {...item} style={{ marginBottom: '2px' }} />;
        })}
      </nav>

      {/* Bottom */}
      <div style={{
        padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{
          fontFamily: '"DM Mono", monospace', fontSize: '9px',
          color: 'rgba(255,255,255,0.18)', letterSpacing: '.14em',
        }}>
          neurasolutions.cloud
        </span>
      </div>
    </aside>
  );
}

function NavItem({ to, icon: Icon, label, badge }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: '8px 10px', borderRadius: '8px', marginBottom: '2px',
        fontSize: '13px', fontWeight: isActive ? 500 : 400,
        textDecoration: 'none', transition: 'all .15s',
        position: 'relative',
        color: isActive ? 'rgb(var(--tw-gold))' : 'rgba(255,255,255,0.42)',
        background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
        border: isActive ? '1px solid rgba(201,168,76,0.18)' : '1px solid transparent',
      })}
    >
      {({ isActive }) => (
        <>
          {/* Left accent bar */}
          {isActive && (
            <div style={{
              position: 'absolute', left: '-1px', top: '22%', bottom: '22%',
              width: '2px',
              background: 'linear-gradient(180deg, rgb(var(--tw-gold-light)), rgb(var(--tw-gold-dark)))',
              borderRadius: '0 2px 2px 0',
            }} />
          )}
          <Icon size={14} style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{label}</span>
          {badge && (
            <span style={{
              fontFamily: '"DM Mono", monospace', fontSize: '8px',
              background: 'rgba(201,168,76,0.15)',
              color: 'rgb(var(--tw-gold))',
              border: '1px solid rgba(201,168,76,0.28)',
              padding: '1px 6px', borderRadius: '10px', letterSpacing: '.1em',
            }}>
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
