import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import API from '../api';
import { toast } from 'sonner';

const ROSE = '#B84E78';
const PINK = '#D4789A';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword]   = useState('');
  const [confirm,  setConfirm]    = useState('');
  const [showPw,   setShowPw]     = useState(false);
  const [showCf,   setShowCf]     = useState(false);
  const [loading,  setLoading]    = useState(false);
  const [done,     setDone]       = useState(false);
  const [invalid,  setInvalid]    = useState(false);

  useEffect(() => {
    if (!token) setInvalid(true);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token, new_password: password });
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/auth'), 2500);
    } catch (err) {
      const msg = err.response?.data?.detail || 'This link is invalid or has expired.';
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setInvalid(true);
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#FFF5F8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(1rem,4vw,2rem)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
        style={{
          width: '100%', maxWidth: 420,
          background: '#fff', borderRadius: 24,
          boxShadow: '0 8px 48px rgba(184,78,120,0.12)',
          border: '1px solid rgba(212,120,154,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ background: '#1A0F15', padding: '1.75rem 2rem', textAlign: 'center' }}>
          <img
            src="/logo.jpg" alt="Hampious"
            onError={e => { e.currentTarget.style.display = 'none'; }}
            style={{ height: 48, width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
          />
          <span style={{ color: PINK, fontFamily: "'Cormorant', Georgia, serif", fontSize: '1.6rem', letterSpacing: '0.16em' }}>
            HAMPIOUS
          </span>
          <p style={{ color: 'rgba(255,245,248,0.45)', fontSize: '0.7rem', letterSpacing: '0.22em', margin: '4px 0 0', textTransform: 'uppercase' }}>
            Premium Gift Hampers
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          {invalid ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
              <XCircle size={56} style={{ color: '#EF4444', margin: '0 auto 1rem' }} />
              <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: '1.5rem', color: '#3D1A2A', margin: '0 0 0.75rem' }}>
                Link Expired
              </h2>
              <p style={{ color: 'rgba(30,26,23,0.55)', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
                This reset link is invalid or has already been used. Please request a new one.
              </p>
              <Button onClick={() => navigate('/auth')} style={{ background: ROSE, color: '#fff', borderRadius: 50, padding: '0.75rem 2rem', fontWeight: 600 }}>
                Back to Sign In
              </Button>
            </motion.div>
          ) : done ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
              <CheckCircle size={56} style={{ color: '#10B981', margin: '0 auto 1rem' }} />
              <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: '1.5rem', color: '#3D1A2A', margin: '0 0 0.5rem' }}>
                Password Reset!
              </h2>
              <p style={{ color: 'rgba(30,26,23,0.55)', fontSize: '0.9rem' }}>
                Redirecting you to sign in…
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', border: `2px solid ${PINK}`, background: 'rgba(212,120,154,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '1.6rem' }}>🔑</div>
                <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: '1.5rem', color: '#3D1A2A', margin: '0 0 0.4rem' }}>
                  Set New Password
                </h2>
                <p style={{ color: 'rgba(30,26,23,0.5)', fontSize: '0.85rem', margin: 0 }}>
                  Choose a strong password for your account
                </p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <Label htmlFor="password" style={{ fontSize: '0.82rem', color: '#5C2D44', fontWeight: 500, marginBottom: 6, display: 'block' }}>
                  New Password
                </Label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(30,26,23,0.3)', pointerEvents: 'none' }} />
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    style={{ paddingLeft: 36, paddingRight: 40, borderColor: 'rgba(212,120,154,0.3)', borderRadius: 10 }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(30,26,23,0.4)', padding: 0 }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <Label htmlFor="confirm" style={{ fontSize: '0.82rem', color: '#5C2D44', fontWeight: 500, marginBottom: 6, display: 'block' }}>
                  Confirm Password
                </Label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(30,26,23,0.3)', pointerEvents: 'none' }} />
                  <Input
                    id="confirm"
                    type={showCf ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    style={{ paddingLeft: 36, paddingRight: 40, borderColor: confirm && confirm !== password ? 'rgba(239,68,68,0.5)' : 'rgba(212,120,154,0.3)', borderRadius: 10 }}
                  />
                  <button type="button" onClick={() => setShowCf(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(30,26,23,0.4)', padding: 0 }}>
                    {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 4 }}>Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                style={{ width: '100%', background: ROSE, color: '#fff', borderRadius: 50, padding: '0.85rem', fontWeight: 600, fontSize: '0.95rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Resetting…' : 'Reset Password'}
              </Button>

              <button type="button" onClick={() => navigate('/auth')}
                style={{ width: '100%', marginTop: '0.75rem', background: 'none', border: 'none', color: ROSE, fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
