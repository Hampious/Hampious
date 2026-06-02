import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminGet, adminPut, handleUnauth } from '../../utils/adminApi';

const PLUM  = '#1A0F15';
const PINK  = '#D4789A';
const ROSE  = '#B84E78';
const BLUSH = '#FFF5F8';
const API   = 'http://localhost:8000/api';

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

// ── Shiprocket create + book shipment ────────────────────────────────────────
function ShiprocketForm({ order, onSuccess, onCancel }) {
  const [status, setStatus]   = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const [result, setResult]   = useState(null);

  const handleBook = async () => {
    setStatus('loading');
    setMessage('Creating Shiprocket order...');
    try {
      const token = localStorage.getItem('admin_token') || '';
      const res = await fetch(`${API}/shiprocket/create-order?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setStatus('success');
      setMessage('');

      // Update order in admin with AWB + courier
      const payload = {
        status:          'shipped',
        tracking_number: data.awb_code || data.shipment_id || '',
        courier:         data.courier_name || 'Shiprocket',
        notes:           `Shiprocket Order: ${data.shiprocket_order_id} | Shipment: ${data.shipment_id}`,
      };

      // Update localStorage
      const localOrders = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
      const idx = localOrders.findIndex(o => String(o.id) === String(order.id));
      if (idx >= 0) localOrders[idx] = { ...localOrders[idx], ...payload, updated_at: new Date().toISOString() };
      else localOrders.push({ ...order, ...payload });
      localStorage.setItem('hamp_orders', JSON.stringify(localOrders));

      // Try backend update
      adminPut(`/orders/${order.id}/status`, payload).catch(() => {});

      setTimeout(() => onSuccess(data), 1500);

    } catch (e) {
      setStatus('error');
      setMessage(e.message || 'Failed to create shipment');
    }
  };

  if (status === 'idle') {
    return (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
        <div style={{ marginTop: 14, padding: 18, background: BLUSH, borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: '#3d1f2f', margin: '0 0 6px', fontWeight: 600 }}>📦 Book via Shiprocket</p>
          <p style={{ fontSize: 12, color: '#7c5a6a', margin: '0 0 14px' }}>
            Shiprocket will auto-assign the best courier, generate AWB & request pickup.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleBook}
              style={{ background: ROSE, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 22px', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 600 }}
            >
              🚀 Book Shipment
            </button>
            <button
              onClick={onCancel}
              style={{ background: '#fff', color: '#7c5a6a', border: '1px solid #f3d0dd', borderRadius: 9, padding: '10px 16px', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 13 }}
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (status === 'loading') {
    return (
      <div style={{ marginTop: 14, padding: 18, background: BLUSH, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '3px solid #f3d0dd', borderTopColor: ROSE, animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ fontSize: 13, color: '#3d1f2f' }}>{message}</span>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ marginTop: 14, padding: 18, background: '#D1FAE5', borderRadius: 12, border: '1px solid #6EE7B7' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#065F46', margin: '0 0 8px' }}>✅ Shipment Booked!</p>
        {result?.awb_code && <p style={{ fontSize: 13, color: '#065F46', margin: '0 0 4px' }}>AWB: <strong>{result.awb_code}</strong></p>}
        {result?.courier_name && <p style={{ fontSize: 13, color: '#065F46', margin: '0 0 4px' }}>Courier: <strong>{result.courier_name}</strong></p>}
        {result?.label_url && (
          <a href={result.label_url} target="_blank" rel="noreferrer"
            style={{ display: 'inline-block', marginTop: 8, background: '#065F46', color: '#fff', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            🖨️ Print Label
          </a>
        )}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ marginTop: 14, padding: 18, background: '#FEE2E2', borderRadius: 12, border: '1px solid #FCA5A5' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', margin: '0 0 8px' }}>❌ Shiprocket Error</p>
        <p style={{ fontSize: 12, color: '#991B1B', margin: '0 0 12px' }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setStatus('idle')}
            style={{ background: ROSE, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Jost, sans-serif' }}>
            Try Again
          </button>
          <button onClick={onCancel}
            style={{ background: '#fff', color: '#7c5a6a', border: '1px solid #f3d0dd', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'Jost, sans-serif' }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }
  return null;
}

// ── Tracking drawer ───────────────────────────────────────────────────────────
function TrackingDrawer({ awbCode, onClose }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem('admin_token') || '';
        const res = await fetch(`${API}/shiprocket/track/${awbCode}?token=${encodeURIComponent(token)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setTracking(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [awbCode]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,15,21,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: 28, width: '100%', maxWidth: 540, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: PLUM, margin: 0 }}>📦 Tracking: {awbCode}</h3>
          <button onClick={onClose} style={{ background: BLUSH, border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: 16, color: '#7c5a6a' }}>✕</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 20 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '3px solid #f3d0dd', borderTopColor: ROSE, animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <span style={{ color: '#7c5a6a', fontSize: 13 }}>Fetching tracking info...</span>
          </div>
        ) : error ? (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: 16, borderRadius: 10, fontSize: 13 }}>
            {error} — Check AWB code or try again later.
          </div>
        ) : tracking ? (
          <div>
            <div style={{ background: BLUSH, borderRadius: 12, padding: 16, marginBottom: 18, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div><p style={{ fontSize: 11, color: '#7c5a6a', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: PLUM, margin: 0 }}>{tracking.status}</p></div>
              {tracking.courier && <div><p style={{ fontSize: 11, color: '#7c5a6a', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Courier</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: PLUM, margin: 0 }}>{tracking.courier}</p></div>}
              {tracking.eta && <div><p style={{ fontSize: 11, color: '#7c5a6a', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ETA</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: PLUM, margin: 0 }}>{tracking.eta}</p></div>}
            </div>

            {tracking.activities?.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#7c5a6a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px' }}>Activity Timeline</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {tracking.activities.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 14 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? ROSE : '#f3d0dd', flexShrink: 0, marginTop: 3 }} />
                        {i < tracking.activities.length - 1 && <div style={{ width: 2, flex: 1, background: '#f3d0dd', minHeight: 20 }} />}
                      </div>
                      <div style={{ flex: 1, paddingBottom: 2 }}>
                        <p style={{ fontSize: 13, fontWeight: i === 0 ? 700 : 500, color: PLUM, margin: '0 0 2px' }}>{a.activity}</p>
                        <p style={{ fontSize: 11, color: '#7c5a6a', margin: 0 }}>{a.location} {a.date && `· ${a.date}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Shipments() {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [openBookId, setOpenBookId]   = useState(null);
  const [trackingAwb, setTrackingAwb] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) { navigate('/admin'); return; }
    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      // Merge backend + localStorage orders
      let allOrders = [];
      try {
        const res = await adminGet('/orders');
        if (handleUnauth(res, navigate)) return;
        if (res.ok) {
          const data = await res.json();
          allOrders = Array.isArray(data) ? data : (data.orders || []);
        }
      } catch {}

      const localOrders = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
      const backendIds  = new Set(allOrders.map(o => String(o.id)));
      allOrders = [...allOrders, ...localOrders.filter(o => !backendIds.has(String(o.id)))];

      // Only show processing + shipped
      const relevant = allOrders
        .filter(o => o.status === 'processing' || o.status === 'shipped')
        .map(o => ({ ...o, id: String(o.id || '') }))
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      setOrders(relevant);
    } catch (e) {
      setError('Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  const needsShipping  = orders.filter(o => o.status === 'processing');
  const activeShipments = orders.filter(o => o.status === 'shipped');
  const getCustomerName = o => o.shipping_address?.full_name || o.customer_name || '—';

  const cardStyle = {
    background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd',
    padding: 20, boxShadow: '0 2px 10px rgba(26,15,21,0.05)',
  };

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Jost, sans-serif' }}>
      <AnimatePresence>
        {trackingAwb && (
          <TrackingDrawer key="tracking" awbCode={trackingAwb} onClose={() => setTrackingAwb(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 600, color: PLUM, margin: 0 }}>Shipments</h1>
          <p style={{ color: '#7c5a6a', marginTop: 6, fontSize: 14 }}>Powered by Shiprocket · Auto AWB · Live Tracking</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>
            🚀 Shiprocket Connected
          </div>
        </div>
      </motion.div>

      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 18px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
          {error} <button onClick={fetchOrders} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          {/* ── Section 1: Needs Shipping ─────────────────────────────────── */}
          {needsShipping.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: PLUM, margin: 0 }}>
                  Ready to Ship
                </h2>
                <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                  {needsShipping.length} order{needsShipping.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {needsShipping.map((order, i) => {
                  const isOpen = openBookId === order.id;
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}
                      style={{ ...cardStyle, border: '1px solid #FDE68A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span style={{ fontWeight: 800, color: PLUM, fontSize: 15 }}>#{order.id.slice(0, 10).toUpperCase()}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#3d1f2f', margin: '0 0 2px' }}>{getCustomerName(order)}</p>
                          <p style={{ fontSize: 12, color: '#7c5a6a', margin: 0 }}>
                            {order.shipping_address?.city && `${order.shipping_address.city}, `}
                            {order.shipping_address?.state} {order.shipping_address?.pincode && `· ${order.shipping_address.pincode}`}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <span style={{ fontWeight: 700, color: ROSE, fontSize: 15 }}>
                            ₹{(order.final_amount || order.total || 0).toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => setOpenBookId(isOpen ? null : order.id)}
                            style={{ background: isOpen ? '#fff' : ROSE, color: isOpen ? '#7c5a6a' : '#fff', border: `1px solid ${isOpen ? '#f3d0dd' : ROSE}`, borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Jost, sans-serif', whiteSpace: 'nowrap' }}
                          >
                            {isOpen ? 'Cancel' : '🚀 Ship via Shiprocket'}
                          </button>
                        </div>
                      </div>

                      {/* Items preview */}
                      {order.items?.length > 0 && (
                        <div style={{ marginTop: 12, fontSize: 12, color: '#7c5a6a', borderTop: '1px solid #fdeef3', paddingTop: 10 }}>
                          📦 {order.items.map(it => `${it.product_name || it.name} ×${it.quantity}`).join(' · ')}
                        </div>
                      )}

                      <AnimatePresence>
                        {isOpen && (
                          <ShiprocketForm
                            key={`book-${order.id}`}
                            order={order}
                            onSuccess={() => { setOpenBookId(null); fetchOrders(); }}
                            onCancel={() => setOpenBookId(null)}
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Section 2: Active Shipments ───────────────────────────────── */}
          {activeShipments.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: PLUM, margin: 0 }}>
                  Active Shipments
                </h2>
                <span style={{ background: '#EDE9FE', color: '#5B21B6', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                  {activeShipments.length} order{activeShipments.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeShipments.map((order, i) => {
                  const awb     = order.tracking_number || order.tracking_id || order.awb_code;
                  const courier = order.courier || order.carrier_name;
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}
                      style={cardStyle}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span style={{ fontWeight: 800, color: PLUM, fontSize: 15 }}>#{order.id.slice(0, 10).toUpperCase()}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#3d1f2f', margin: '0 0 2px' }}>{getCustomerName(order)}</p>
                          <p style={{ fontSize: 12, color: '#7c5a6a', margin: '0 0 8px' }}>
                            {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </p>
                          {awb && (
                            <div style={{ background: BLUSH, borderRadius: 8, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 11, color: '#7c5a6a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AWB</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: PLUM, fontFamily: 'monospace' }}>{awb}</span>
                              {courier && <span style={{ fontSize: 11, color: '#a0728a' }}>· {courier}</span>}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                          <span style={{ fontWeight: 700, color: ROSE, fontSize: 15 }}>
                            ₹{(order.final_amount || order.total || 0).toLocaleString('en-IN')}
                          </span>
                          {awb && (
                            <button
                              onClick={() => setTrackingAwb(awb)}
                              style={{ background: BLUSH, color: ROSE, border: `1px solid ${PINK}`, borderRadius: 9, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Jost, sans-serif' }}
                            >
                              📍 Live Track
                            </button>
                          )}
                          {order.label_url && (
                            <a href={order.label_url} target="_blank" rel="noreferrer"
                              style={{ background: PLUM, color: '#fff', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                              🖨️ Label
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Empty ─────────────────────────────────────────────────────── */}
          {orders.length === 0 && (
            <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🚚</div>
              <p style={{ color: PLUM, fontSize: 20, fontWeight: 600, margin: '0 0 8px', fontFamily: 'Cormorant Garamond, serif' }}>No shipments yet</p>
              <p style={{ color: '#7c5a6a', fontSize: 14 }}>When orders are in "Processing" status they'll appear here for shipping.</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
