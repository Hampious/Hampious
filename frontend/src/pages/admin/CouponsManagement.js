import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminGet, adminPost, adminPut, adminDelete, handleUnauth } from '../../utils/adminApi';

const PLUM  = '#1A0F15';
const PINK  = '#D4789A';
const ROSE  = '#B84E78';
const BLUSH = '#FFF5F8';

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid #f3d0dd', fontFamily: 'Jost, sans-serif',
  fontSize: 14, color: PLUM, background: BLUSH,
  outline: 'none', boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: 12, fontWeight: 600, color: '#7c5a6a',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  display: 'block', marginBottom: 6,
};

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #f3d0dd', borderTopColor: PINK, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const EMPTY_FORM = { code: '', discount_percent: '', min_order_amount: '', max_uses: '', expires_at: '', description: '' };

export default function CouponsManagement() {
  const [coupons, setCoupons]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { navigate('/admin'); return; }
    fetchCoupons();
  }, [navigate]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await adminGet('/coupons');
      if (handleUnauth(res, navigate)) return;
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch { setCoupons([]); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    if (!form.code.trim()) { setError('Coupon code is required'); setSaving(false); return; }
    if (!form.discount_percent || isNaN(form.discount_percent) || Number(form.discount_percent) <= 0 || Number(form.discount_percent) > 100) {
      setError('Discount must be between 1 and 100'); setSaving(false); return;
    }
    try {
      const res = await adminPost('/coupons', {
        ...form,
        code:             form.code.trim().toUpperCase(),
        discount_percent: Number(form.discount_percent),
        min_order_amount: Number(form.min_order_amount) || 0,
        max_uses:         form.max_uses ? Number(form.max_uses) : null,
        expires_at:       form.expires_at || null,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || 'Failed to create coupon');
      } else {
        setSuccess('Coupon created!');
        setForm(EMPTY_FORM);
        setShowForm(false);
        fetchCoupons();
      }
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (coupon) => {
    try {
      await adminPut(`/coupons/${coupon.id}`, { is_active: !coupon.is_active });
      fetchCoupons();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await adminDelete(`/coupons/${id}`);
      fetchCoupons();
    } catch {}
  };

  const isExpired = (c) => {
    if (!c.expires_at) return false;
    return new Date(c.expires_at) < new Date();
  };

  const isMaxed = (c) => c.max_uses && c.times_used >= c.max_uses;

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Jost, sans-serif' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 600, color: PLUM, margin: 0 }}>Coupons</h1>
          <p style={{ color: '#7c5a6a', marginTop: 6, fontSize: 14 }}>Create and manage discount coupon codes</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}
          style={{ background: ROSE, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          + New Coupon
        </button>
      </motion.div>

      {/* Success */}
      {success && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '12px 18px', borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
          ✓ {success}
        </div>
      )}

      {/* Add Coupon Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd', padding: 28, marginBottom: 28, boxShadow: '0 4px 20px rgba(212,120,154,0.1)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: PLUM, margin: 0 }}>New Coupon</h2>
              <button onClick={() => setShowForm(false)} style={{ background: BLUSH, border: 'none', cursor: 'pointer', fontSize: 18, color: '#7c5a6a', width: 36, height: 36, borderRadius: 8 }}>✕</button>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Coupon Code *</label>
                  <input style={inputStyle} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE20" required />
                </div>
                <div>
                  <label style={labelStyle}>Discount % *</label>
                  <input style={inputStyle} type="number" min="1" max="100" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))} placeholder="e.g. 20" required />
                </div>
                <div>
                  <label style={labelStyle}>Min Order Amount (₹)</label>
                  <input style={inputStyle} type="number" min="0" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} placeholder="0 = no minimum" />
                </div>
                <div>
                  <label style={labelStyle}>Max Uses</label>
                  <input style={inputStyle} type="number" min="1" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Leave blank = unlimited" />
                </div>
                <div>
                  <label style={labelStyle}>Expiry Date</label>
                  <input style={inputStyle} type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label style={labelStyle}>Description (internal)</label>
                  <input style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Summer sale coupon" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ background: BLUSH, color: ROSE, border: `1px solid ${PINK}`, borderRadius: 10, padding: '11px 24px', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ background: saving ? '#c4849e' : ROSE, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coupons Table */}
      {loading ? <Spinner /> : coupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎟️</div>
          <p style={{ color: '#7c5a6a', fontSize: 15 }}>No coupons yet. Create your first one!</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,15,21,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
              <thead>
                <tr style={{ background: BLUSH }}>
                  {['Code', 'Discount', 'Min Order', 'Usage', 'Expiry', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#7c5a6a', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map((c, i) => {
                  const expired = isExpired(c);
                  const maxed   = isMaxed(c);
                  const working = c.is_active && !expired && !maxed;
                  return (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} style={{ borderTop: '1px solid #fdeef3' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: PLUM, letterSpacing: 2, background: BLUSH, padding: '4px 10px', borderRadius: 6 }}>{c.code}</span>
                        {c.description && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#a0728a' }}>{c.description}</p>}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: ROSE, fontSize: 18 }}>{c.discount_percent}%</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#7c5a6a' }}>
                        {c.min_order_amount > 0 ? `₹${Number(c.min_order_amount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#7c5a6a' }}>
                        {c.times_used || 0}{c.max_uses ? ` / ${c.max_uses}` : ' / ∞'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: expired ? '#991B1B' : '#7c5a6a', whiteSpace: 'nowrap' }}>
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No expiry'}
                        {expired && <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#991B1B' }}>EXPIRED</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => toggleActive(c)}
                          style={{
                            background: working ? '#D1FAE5' : '#FEE2E2',
                            color: working ? '#065F46' : '#991B1B',
                            border: 'none', borderRadius: 20, padding: '5px 14px',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          {working ? '✓ Active' : (expired ? 'Expired' : maxed ? 'Maxed' : 'Inactive')}
                        </button>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handleDelete(c.id)}
                          style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Jost, sans-serif' }}
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
