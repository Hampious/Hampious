import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';

const PLUM = '#1A0F15';
const PINK = '#D4789A';
const ROSE = '#B84E78';

const NAV_ITEMS = [
  { to: '/admin/dashboard',  icon: '📊', label: 'Dashboard'  },
  { to: '/admin/products',   icon: '🎁', label: 'Products'   },
  { to: '/admin/categories', icon: '🏷️', label: 'Categories' },
  { to: '/admin/orders',     icon: '📦', label: 'Orders'     },
  { to: '/admin/customers',  icon: '👥', label: 'Customers'  },
  { to: '/admin/shipments',  icon: '🚚', label: 'Shipments'  },
  { to: '/admin/pickup',     icon: '📍', label: 'Pickup Locations' },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) navigate('/admin', { replace: true });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin', { replace: true });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Jost', sans-serif", background: '#F8F0F4' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 72 : 240, flexShrink: 0,
        background: PLUM,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'sticky', top: 0, height: '100vh',
        boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '1.5rem 0' : '1.75rem 1.5rem',
          borderBottom: '1px solid rgba(212,120,154,0.15)',
          display: 'flex', alignItems: 'center', gap: 12,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #D4789A, #B84E78)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem',
          }}>🎁</div>
          {!collapsed && (
            <div>
              <p style={{ margin: 0, fontFamily: "'Cormorant Garamond','Georgia',serif", color: PINK, fontSize: '1.1rem', letterSpacing: '0.12em', fontWeight: 600 }}>HAMPIOUS</p>
              <p style={{ margin: 0, color: 'rgba(255,245,248,0.3)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Admin</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: 12, padding: collapsed ? '0.8rem 0' : '0.8rem 1.5rem',
              justifyContent: collapsed ? 'center' : 'flex-start',
              textDecoration: 'none', transition: 'all 0.2s ease',
              background: isActive ? 'rgba(212,120,154,0.15)' : 'transparent',
              borderLeft: isActive ? `3px solid ${PINK}` : '3px solid transparent',
              color: isActive ? PINK : 'rgba(255,245,248,0.55)',
              fontSize: '0.88rem', fontWeight: isActive ? 600 : 400,
              letterSpacing: '0.04em',
            })}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid rgba(212,120,154,0.12)', padding: '1rem' }}>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ width: '100%', background: 'rgba(212,120,154,0.08)', border: 'none', borderRadius: 8, padding: '0.6rem', cursor: 'pointer', color: 'rgba(255,245,248,0.5)', fontSize: '1rem', marginBottom: '0.5rem' }}
          >
            {collapsed ? '→' : '←'}
          </button>
          <button
            onClick={handleLogout}
            style={{ width: '100%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.6rem', cursor: 'pointer', color: '#FCA5A5', fontSize: '0.78rem', letterSpacing: '0.08em' }}
          >
            {collapsed ? '↩' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
