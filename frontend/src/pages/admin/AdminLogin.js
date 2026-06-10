import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000/api'}/admin`;

// ── Local admin credentials (fallback when backend is offline) ────────────────
const LOCAL_ADMIN_EMAIL    = process.env.REACT_APP_ADMIN_EMAIL    || 'team.hampious@gmail.com';
const LOCAL_ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'Hampious@123';
const LOCAL_TOKEN          = 'local_admin_token';

export default function AdminLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) navigate('/admin/dashboard', { replace: true });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ── Step 1: Try backend ────────────────────────────────────────────────
    try {
      const res = await axios.post(`${API}/login`, { email, password }, { timeout: 4000 });
      localStorage.setItem('admin_token', res.data.access_token);
      navigate('/admin/dashboard', { replace: true });
      return;
    } catch (err) {
      // If server is reachable but credentials are wrong → show error
      if (err.response?.status === 401) {
        setError('Invalid admin email or password.');
        setLoading(false);
        return;
      }
      // Network error → fall through to local auth
    }

    // ── Step 2: Local auth fallback (backend offline) ──────────────────────
    if (email === LOCAL_ADMIN_EMAIL && password === LOCAL_ADMIN_PASSWORD) {
      localStorage.setItem('admin_token', LOCAL_TOKEN);
      navigate('/admin/dashboard', { replace: true });
      return;
    }

    setError('Invalid admin email or password.');
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1A0F15 0%, #2A1020 50%, #3D1A2A 100%)',
      fontFamily: "'Jost', sans-serif",
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(212,120,154,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-5%', left: '-5%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(184,78,120,0.1)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{
        background: 'rgba(255,245,248,0.04)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(212,120,154,0.2)',
        borderRadius: 24, padding: '3rem 2.5rem',
        width: '100%', maxWidth: 420,
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4789A, #B84E78)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '1.8rem',
            boxShadow: '0 8px 32px rgba(212,120,154,0.4)',
          }}>🎁</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif", fontSize: '1.8rem', color: '#D4789A', margin: '0 0 0.25rem', letterSpacing: '0.15em' }}>
            HAMPIOUS
          </h1>
          <p style={{ color: 'rgba(255,245,248,0.4)', fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0 }}>
            Admin Portal
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem',
            color: '#FCA5A5', fontSize: '0.85rem', lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {[
            { label: 'Email Address', type: 'email', value: email, setter: setEmail, placeholder: 'team.hampious@gmail.com' },
            { label: 'Password', type: 'password', value: password, setter: setPassword, placeholder: '••••••••' },
          ].map(({ label, type, value, setter, placeholder }) => (
            <div key={label} style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: 'rgba(255,245,248,0.6)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {label}
              </label>
              <input
                type={type} value={value} required
                onChange={e => setter(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,245,248,0.06)',
                  border: '1px solid rgba(212,120,154,0.25)',
                  borderRadius: 10, padding: '0.85rem 1rem',
                  color: '#FFF5F8', fontSize: '0.9rem',
                  outline: 'none', fontFamily: "'Jost', sans-serif",
                }}
                onFocus={e => e.target.style.borderColor = '#D4789A'}
                onBlur={e => e.target.style.borderColor = 'rgba(212,120,154,0.25)'}
              />
            </div>
          ))}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', marginTop: '0.5rem',
              background: loading ? 'rgba(212,120,154,0.5)' : 'linear-gradient(135deg, #D4789A, #B84E78)',
              color: '#fff', border: 'none', borderRadius: 50,
              padding: '0.9rem', fontFamily: "'Jost', sans-serif",
              fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(184,78,120,0.35)',
              transition: 'all 0.25s ease',
            }}
          >
            {loading ? 'Signing In…' : 'Sign In to Admin'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'rgba(255,245,248,0.25)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Authorised access only
        </p>
      </div>
    </div>
  );
}
