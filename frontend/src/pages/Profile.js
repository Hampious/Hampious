import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PLUM  = '#1A0F15';
const PINK  = '#D4789A';
const ROSE  = '#B84E78';
const BLUSH = '#FFF5F8';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const initials = (user.name || user.email || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fields = [
    { label: 'Full Name',  value: user.name  || '—' },
    { label: 'Email',      value: user.email || '—' },
    { label: 'Phone',      value: user.phone || 'Not provided' },
    { label: 'Role',       value: user.role  || 'Customer' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BLUSH, padding: '5rem 1.5rem 4rem' }}>
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{ maxWidth: 640, margin: '0 auto' }}
      >
        {/* Avatar + name */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            style={{
              width: 96, height: 96, borderRadius: '50%',
              background: `linear-gradient(135deg, ${PINK} 0%, ${ROSE} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: `0 8px 32px rgba(184,78,120,0.35)`,
              fontFamily: "'Cormorant Garamond', 'Garamond', serif",
              fontSize: '2.2rem', fontWeight: 700, color: '#fff',
              letterSpacing: '0.05em',
            }}
          >
            {initials}
          </motion.div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', 'Garamond', serif",
            fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
            fontWeight: 600, color: PLUM,
            margin: '0 0 0.3rem',
            letterSpacing: '0.04em',
          }}>
            {user.name || 'My Profile'}
          </h1>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.85rem', letterSpacing: '0.18em',
            color: PINK, textTransform: 'uppercase', margin: 0,
          }}>
            Hampious Member
          </p>
        </div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          style={{
            background: '#fff',
            borderRadius: 20,
            border: `1px solid rgba(212,120,154,0.18)`,
            boxShadow: '0 4px 40px rgba(212,120,154,0.10)',
            overflow: 'hidden',
            marginBottom: '1.5rem',
          }}
        >
          {fields.map(({ label, value }, i) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center',
              padding: '1.25rem 2rem',
              borderBottom: i < fields.length - 1 ? `1px solid rgba(212,120,154,0.1)` : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '0.72rem', letterSpacing: '0.15em',
                  textTransform: 'uppercase', color: PINK,
                  margin: '0 0 0.25rem',
                }}>
                  {label}
                </p>
                <p style={{
                  fontFamily: "'Cormorant Garamond', 'Garamond', serif",
                  fontSize: '1.15rem', color: PLUM,
                  margin: 0, fontWeight: 500,
                }}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Logout button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ textAlign: 'center' }}
        >
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: `2px solid ${ROSE}`,
              color: ROSE,
              padding: '0.75rem 2.5rem',
              borderRadius: 50,
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => {
              e.target.style.background = ROSE;
              e.target.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'transparent';
              e.target.style.color = ROSE;
            }}
          >
            Sign Out
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
