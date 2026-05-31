import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminGet, adminPut, handleUnauth, parseError } from '../../utils/adminApi';

const PLUM = '#1A0F15';
const PINK = '#D4789A';
const ROSE = '#B84E78';
const BLUSH = '#FFF5F8';

const COURIERS = ['Delhivery', 'BlueDart', 'India Post', 'FedEx', 'DTDC', 'Ekart', 'Xpressbees', 'Other'];

const STATUS_CONFIG = {
  pending:    { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  processing: { bg: '#DBEAFE', color: '#1E40AF', label: 'Processing' },
  shipped:    { bg: '#EDE9FE', color: '#5B21B6', label: 'Shipped' },
  delivered:  { bg: '#D1FAE5', color: '#065F46', label: 'Delivered' },
  cancelled:  { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' },
};

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #f3d0dd', borderTopColor: PINK, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatusBadge({ status }) {
  const sc = STATUS_CONFIG[status] || { bg: '#f3f4f6', color: '#374151', label: status };
  return (
    <span style={{ background: sc.bg, color: sc.color, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {sc.label}
    </span>
  );
}

const trackingInputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #f3d0dd',
  fontFamily: 'Jost, sans-serif', fontSize: 13, color: PLUM, background: BLUSH,
  outline: 'none', boxSizing: 'border-box',
};

function TrackingForm({ orderId, onSuccess, onCancel }) {
  const [form, setForm] = useState({ tracking_number: '', courier: 'Delhivery' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tracking_number.trim()) { setError('Tracking number is required'); return; }
    setError('');
    setSaving(true);
    try {
      const res = await adminPut(`/orders/${orderId}/status`, {
        status: 'shipped',
        tracking_number: form.tracking_number.trim(),
        courier: form.courier,
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin';
        return;
      }
      if (!res.ok) {
        const msg = await parseError(res);
        setError(msg);
        return;
      }
      onSuccess();
    } catch (e) {
      setError(e.message || 'Failed to update shipment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{ overflow: 'hidden' }}
    >
      <form onSubmit={handleSubmit} style={{ marginTop: 14, padding: 16, background: BLUSH, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#7c5a6a', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>
              Tracking Number *
            </label>
            <input
              required
              style={trackingInputStyle}
              value={form.tracking_number}
              onChange={e => setForm(f => ({ ...f, tracking_number: e.target.value }))}
              placeholder="e.g. DL1234567890"
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#7c5a6a', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>
              Courier
            </label>
            <select
              style={trackingInputStyle}
              value={form.courier}
              onChange={e => setForm(f => ({ ...f, courier: e.target.value }))}
            >
              {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="submit"
            disabled={saving}
            style={{ background: saving ? '#c4849e' : ROSE, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 20px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            🚚 {saving ? 'Saving...' : 'Mark as Shipped'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{ background: '#fff', color: '#7c5a6a', border: '1px solid #f3d0dd', borderRadius: 9, padding: '9px 16px', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 13 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: PLUM, margin: '0 0 16px' }}>
      {children}
    </h2>
  );
}

export default function Shipments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openTrackingId, setOpenTrackingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { navigate('/admin'); return; }
    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGet('/orders');
      if (handleUnauth(res, navigate)) return;
      if (!res.ok) { setError(`Failed to load orders (HTTP ${res.status})`); return; }
      const data = await res.json();
      const allOrders = Array.isArray(data) ? data : (data.orders || []);
      // Filter to only shipped and processing
      setOrders(allOrders.filter(o => o.status === 'shipped' || o.status === 'processing'));
    } catch (e) {
      setError('Network error — could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  // Section 1: processing orders without tracking
  const needsTracking = orders.filter(o => o.status === 'processing' && !o.tracking_number && !o.tracking_id);

  // Section 2: shipped orders (have tracking or marked shipped)
  const activeShipments = orders.filter(o => o.status === 'shipped');

  const getCustomerName = (order) => order.shipping_address?.full_name || order.customer_name || '—';

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Jost, sans-serif' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 600, color: PLUM, margin: 0 }}>Shipments</h1>
        <p style={{ color: '#7c5a6a', marginTop: 6, fontSize: 14 }}>Track and manage order shipments</p>
      </motion.div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 18px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
          {error}{' '}
          <button onClick={fetchOrders} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {loading ? <Spinner /> : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚚</div>
          <p style={{ color: PLUM, fontSize: 18, fontWeight: 600, margin: '0 0 8px', fontFamily: 'Cormorant Garamond, serif' }}>No shipments yet</p>
          <p style={{ color: '#7c5a6a', fontSize: 14 }}>Orders that are shipped or processing will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          {/* Section 1: Needs Tracking */}
          {needsTracking.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <SectionTitle>Needs Tracking</SectionTitle>
                <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                  {needsTracking.length} order{needsTracking.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {needsTracking.map((order, i) => {
                  const isOpen = openTrackingId === order.id;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.3) }}
                      style={{ background: '#fff', borderRadius: 16, border: '1px solid #FDE68A', padding: 20, boxShadow: '0 2px 10px rgba(26,15,21,0.05)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span style={{ fontWeight: 800, color: PLUM, fontSize: 15 }}>#{(order.id || '').slice(0, 8).toUpperCase()}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#3d1f2f', margin: '0 0 2px' }}>{getCustomerName(order)}</p>
                          <p style={{ fontSize: 12, color: '#7c5a6a', margin: 0 }}>
                            {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <span style={{ fontWeight: 700, color: ROSE, fontSize: 15 }}>
                            ₹{(order.final_amount || order.total || 0).toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => setOpenTrackingId(isOpen ? null : order.id)}
                            style={{ background: isOpen ? '#fff' : BLUSH, color: ROSE, border: `1px solid ${PINK}`, borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Jost, sans-serif', whiteSpace: 'nowrap' }}
                          >
                            {isOpen ? 'Cancel' : '+ Add Tracking'}
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isOpen && (
                          <TrackingForm
                            key={`tracking-${order.id}`}
                            orderId={order.id}
                            onSuccess={() => { setOpenTrackingId(null); fetchOrders(); }}
                            onCancel={() => setOpenTrackingId(null)}
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Active Shipments */}
          {activeShipments.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <SectionTitle>Active Shipments</SectionTitle>
                <span style={{ background: '#EDE9FE', color: '#5B21B6', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                  {activeShipments.length} order{activeShipments.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeShipments.map((order, i) => {
                  const tracking = order.tracking_number || order.tracking_id;
                  const courier = order.courier || order.carrier_name;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.3) }}
                      style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd', padding: 20, boxShadow: '0 2px 10px rgba(26,15,21,0.05)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, color: PLUM, fontSize: 15 }}>#{(order.id || '').slice(0, 8).toUpperCase()}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#3d1f2f', margin: '0 0 2px' }}>{getCustomerName(order)}</p>
                          <p style={{ fontSize: 12, color: '#7c5a6a', margin: 0 }}>
                            {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                          {tracking && (
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 11, color: '#7c5a6a', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking</p>
                              <p style={{ fontSize: 14, fontWeight: 700, color: PLUM, margin: 0, fontFamily: 'monospace' }}>{tracking}</p>
                              {courier && <p style={{ fontSize: 12, color: '#a0728a', margin: 0 }}>via {courier}</p>}
                            </div>
                          )}
                          <div style={{ fontWeight: 700, color: ROSE, fontSize: 15 }}>
                            ₹{(order.final_amount || order.total || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty sections message */}
          {needsTracking.length === 0 && activeShipments.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ color: '#7c5a6a', fontSize: 15 }}>All shipments are up to date</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
