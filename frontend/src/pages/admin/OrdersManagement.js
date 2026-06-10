import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminGet, adminPut, adminPost, handleUnauth, parseError } from '../../utils/adminApi';

const PLUM = '#1A0F15';
const PINK = '#D4789A';
const ROSE = '#B84E78';
const BLUSH = '#FFF5F8';

const STATUS_CONFIG = {
  pending:    { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  processing: { bg: '#DBEAFE', color: '#1E40AF', label: 'Processing' },
  shipped:    { bg: '#EDE9FE', color: '#5B21B6', label: 'Shipped' },
  delivered:  { bg: '#D1FAE5', color: '#065F46', label: 'Delivered' },
  cancelled:  { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' },
};

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const COURIERS = ['Delhivery', 'BlueDart', 'India Post', 'FedEx', 'DTDC', 'Ekart', 'Xpressbees', 'Other'];

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

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

const drawerInputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #f3d0dd',
  fontFamily: 'Jost, sans-serif', fontSize: 14, color: PLUM, background: BLUSH,
  outline: 'none', boxSizing: 'border-box',
};
const drawerLabelStyle = {
  fontSize: 12, fontWeight: 600, color: '#7c5a6a', textTransform: 'uppercase',
  letterSpacing: '0.05em', display: 'block', marginBottom: 6,
};

function OrderDrawer({ order, onClose, onUpdated }) {
  const [form, setForm] = useState({ status: 'pending', tracking_number: '', courier: 'Delhivery', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [shipResult, setShipResult] = useState(null);

  useEffect(() => {
    if (order) {
      setForm({
        status: order.status || 'pending',
        tracking_number: order.tracking_number || order.tracking_id || '',
        courier: order.courier || order.carrier_name || 'Delhivery',
        notes: order.notes || '',
      });
      setError('');
      setSuccess(false);
      setShipResult(null);
    }
  }, [order]);

  const handleShipViaShiprocket = async () => {
    setShipping(true);
    setError('');
    setShipResult(null);
    const token = localStorage.getItem('admin_token') || '';
    try {
      const res = await fetch(`${(process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000/api')}/shiprocket/ship-order?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || 'Failed to create Shiprocket shipment');
        return;
      }
      const data = await res.json();
      setShipResult(data);
      // Update local form status to shipped
      setForm(f => ({ ...f, status: 'shipped', tracking_number: data.awb_code || '', courier: data.courier_name || 'Shiprocket' }));
      // Update localStorage
      const localOrders = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
      const idx = localOrders.findIndex(o => String(o.id) === String(order.id));
      if (idx >= 0) {
        localOrders[idx] = { ...localOrders[idx], status: 'shipped', tracking_number: data.awb_code, courier: data.courier_name };
        localStorage.setItem('hamp_orders', JSON.stringify(localOrders));
      }
      setTimeout(() => onUpdated(), 2500);
    } catch (e) {
      setError('Network error — could not reach Shiprocket');
    } finally {
      setShipping(false);
    }
  };

  const handleUpdate = async () => {
    setError('');
    setSuccess(false);
    setSaving(true);

    const payload = {
      status:          form.status,
      tracking_number: form.tracking_number,
      courier:         form.courier,
      notes:           form.notes,
      updated_at:      new Date().toISOString(),
    };

    // ── 1. Update localStorage immediately (optimistic) ──────────────────
    const localOrders = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
    const idx = localOrders.findIndex(o => String(o.id) === String(order.id));
    if (idx >= 0) {
      localOrders[idx] = { ...localOrders[idx], ...payload };
    } else {
      // Order not in localStorage yet — add it now
      localOrders.push({ ...order, ...payload });
    }
    localStorage.setItem('hamp_orders', JSON.stringify(localOrders));

    // ── 2. Also try backend (best effort) ────────────────────────────────
    try {
      const res = await adminPut(`/orders/${order.id}/status`, payload);
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin';
        return;
      }
      // If backend succeeded, update localStorage with backend response
      if (res.ok) {
        try {
          const updated = await res.json();
          const ls = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
          const i  = ls.findIndex(o => String(o.id) === String(order.id));
          if (i >= 0) ls[i] = { ...ls[i], ...updated, id: String(updated.id || order.id) };
          localStorage.setItem('hamp_orders', JSON.stringify(ls));
        } catch {}
      }
    } catch {
      // Backend unavailable — localStorage update already done above
    }

    setSuccess(true);
    setSaving(false);
    setTimeout(() => onUpdated(), 1000);
  };

  if (!order) return null;

  const addr = order.shipping_address || {};
  const customerName = addr.full_name || order.customer_name || '—';
  const customerEmail = order.customer_email || addr.email || '';
  const customerPhone = addr.phone || order.customer_phone || '';
  const isShipped = form.status === 'shipped' || form.status === 'processing';

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(26,15,21,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ background: '#fff', width: '100%', maxWidth: 520, height: '100vh', overflowY: 'auto', padding: 32, boxShadow: '-8px 0 40px rgba(26,15,21,0.15)' }}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 600, color: PLUM, margin: 0 }}>
              Order #{String(order.id || '').slice(0, 8).toUpperCase()}
            </h2>
            <p style={{ color: '#7c5a6a', fontSize: 13, margin: '4px 0 0' }}>
              {order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: BLUSH, border: 'none', cursor: 'pointer', fontSize: 20, color: '#7c5a6a', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
            ✓ Order updated successfully!
          </div>
        )}

        {/* Customer Info */}
        <div style={{ background: BLUSH, borderRadius: 14, padding: 18, marginBottom: 18 }}>
          <p style={{ ...drawerLabelStyle, marginBottom: 10 }}>Customer Information</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: PLUM, margin: '0 0 6px' }}>{customerName}</p>
          {customerEmail && <p style={{ fontSize: 13, color: '#7c5a6a', margin: '0 0 4px' }}>📧 {customerEmail}</p>}
          {customerPhone && <p style={{ fontSize: 13, color: '#7c5a6a', margin: 0 }}>📞 {customerPhone}</p>}
        </div>

        {/* Gift Personalisation */}
        {(order.gift_message || order.spotify_link || order.qr_code) && (
          <div style={{ background: 'linear-gradient(135deg,#FFF5F8,#FCEAF1)', borderRadius: 14, padding: 18, marginBottom: 18, border: '1px solid #f3d0dd' }}>
            <p style={{ ...drawerLabelStyle, marginBottom: 12, color: '#B84E78' }}>🎁 Gift Personalisation</p>

            {order.gift_message && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#7c5a6a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px' }}>💌 Gift Message</p>
                <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', border: '1px solid #f3d0dd' }}>
                  <p style={{ fontSize: 13, color: PLUM, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>"{order.gift_message}"</p>
                </div>
              </div>
            )}

            {order.spotify_link && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#7c5a6a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px' }}>🎵 Spotify Link</p>
                <a href={order.spotify_link} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1DB954', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  ▶ Open Playlist
                </a>
                <p style={{ fontSize: 11, color: '#a0728a', margin: '4px 0 0', wordBreak: 'break-all' }}>{order.spotify_link}</p>
              </div>
            )}

            {order.qr_code && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#7c5a6a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>📱 Custom QR Code</p>
                <img src={order.qr_code} alt="QR Code" style={{ width: 100, height: 100, borderRadius: 10, border: '1px solid #f3d0dd', objectFit: 'contain', background: '#fff', padding: 4 }} />
              </div>
            )}
          </div>
        )}

        {/* Shipping Address */}
        <div style={{ background: BLUSH, borderRadius: 14, padding: 18, marginBottom: 18 }}>
          <p style={{ ...drawerLabelStyle, marginBottom: 10 }}>Shipping Address</p>
          <p style={{ fontSize: 13, color: PLUM, lineHeight: 1.8, margin: 0 }}>
            {addr.address || addr.street || addr.line1 || '—'}
            {(addr.city || addr.state || addr.pincode) && (
              <>
                <br />
                {[addr.city, addr.state].filter(Boolean).join(', ')}
                {addr.pincode && ` — ${addr.pincode}`}
              </>
            )}
            <br />
            {addr.country || 'India'}
          </p>
        </div>

        {/* Order Items */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ ...drawerLabelStyle, marginBottom: 10 }}>Order Items</p>
          <div style={{ background: '#fff', border: '1px solid #f3d0dd', borderRadius: 12, overflow: 'hidden' }}>
            {(order.items || []).length > 0 ? (
              <>
                {(order.items || []).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: i < (order.items.length - 1) ? '1px solid #fdeef3' : 'none',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: PLUM, margin: '0 0 2px' }}>
                        {item.product_name || item.name || 'Product'}
                      </p>
                      <p style={{ fontSize: 12, color: '#7c5a6a', margin: 0 }}>Qty: {item.quantity || 1}</p>
                    </div>
                    <span style={{ fontWeight: 700, color: ROSE, fontSize: 14 }}>
                      ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: BLUSH, borderTop: '2px solid #f3d0dd' }}>
                  <span style={{ fontWeight: 700, color: PLUM }}>Total</span>
                  <span style={{ fontWeight: 800, color: ROSE, fontSize: 18 }}>
                    ₹{(order.final_amount || order.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#a0728a', fontSize: 13 }}>
                No item details available
              </div>
            )}
          </div>
        </div>

        {/* Update Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={drawerLabelStyle}>Update Status</label>
            <select
              style={drawerInputStyle}
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
              ))}
            </select>
          </div>

          {/* Show tracking fields only when shipped */}
          {isShipped && (
            <>
              <div>
                <label style={drawerLabelStyle}>Tracking Number</label>
                <input
                  style={drawerInputStyle}
                  value={form.tracking_number}
                  onChange={e => setForm(f => ({ ...f, tracking_number: e.target.value }))}
                  placeholder="e.g. DL1234567890"
                />
              </div>
              <div>
                <label style={drawerLabelStyle}>Courier</label>
                <input
                  style={drawerInputStyle}
                  value={form.courier}
                  onChange={e => setForm(f => ({ ...f, courier: e.target.value }))}
                  placeholder="e.g. Delhivery, BlueDart, DTDC..."
                />
              </div>
            </>
          )}

          <div>
            <label style={drawerLabelStyle}>Notes (internal)</label>
            <textarea
              rows={3}
              style={{ ...drawerInputStyle, resize: 'vertical' }}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Internal notes about this order..."
            />
          </div>

          {/* Shiprocket shipping */}
          {(form.status === 'pending' || form.status === 'processing') && !shipResult && (
            <div style={{ border: '1px solid #c4b5fd', borderRadius: 12, padding: 16, background: '#F5F3FF' }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#5B21B6' }}>🚚 Ship via Shiprocket</p>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#7C3AED', lineHeight: 1.6 }}>
                Automatically create a Shiprocket order, assign AWB, request pickup, and email the customer their tracking details.
              </p>
              <button
                onClick={handleShipViaShiprocket}
                disabled={shipping}
                style={{
                  width: '100%', background: shipping ? '#a78bfa' : '#7C3AED',
                  color: '#fff', border: 'none', borderRadius: 10, padding: '12px',
                  fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 600,
                  cursor: shipping ? 'not-allowed' : 'pointer',
                }}
              >
                {shipping ? '⏳ Creating Shipment...' : '🚀 Ship via Shiprocket'}
              </button>
            </div>
          )}

          {/* Shiprocket success result */}
          {shipResult && (
            <div style={{ border: '1px solid #6ee7b7', borderRadius: 12, padding: 16, background: '#ECFDF5' }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#065F46' }}>✅ Shipment Created!</p>
              {shipResult.awb_code && (
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#065F46' }}>
                  AWB: <strong style={{ fontFamily: 'monospace', letterSpacing: 2 }}>{shipResult.awb_code}</strong>
                </p>
              )}
              <p style={{ margin: '0 0 4px', fontSize: 12, color: '#047857' }}>Courier: {shipResult.courier_name}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#047857' }}>📧 Shipping email sent to customer</p>
              {shipResult.label_url && (
                <a href={shipResult.label_url} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-block', marginTop: 10, background: '#065F46', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 600 }}>
                  📄 Download Label
                </a>
              )}
            </div>
          )}

          <p style={{ fontSize: 12, color: '#7c5a6a', textAlign: 'center', margin: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span>📧</span>
            <span>Customer will receive an email notification on update</span>
          </p>

          <button
            onClick={handleUpdate}
            disabled={saving || success}
            style={{
              background: success ? '#065F46' : (saving ? '#c4849e' : ROSE),
              color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
              fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 600,
              cursor: (saving || success) ? 'not-allowed' : 'pointer',
            }}
          >
            {success ? '✓ Updated!' : (saving ? 'Updating...' : 'Update Order')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
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

      let backendOrders = [];
      if (res.ok) {
        const data = await res.json();
        backendOrders = Array.isArray(data) ? data : (data.orders || []);
        // Cache backend orders to localStorage
        const existing = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
        backendOrders.forEach(bo => {
          const idx = existing.findIndex(e => String(e.id) === String(bo.id));
          if (idx >= 0) {
            // Keep whichever has newer updated_at
            const localNewer = existing[idx].updated_at && bo.updated_at &&
              new Date(existing[idx].updated_at) > new Date(bo.updated_at);
            if (!localNewer) existing[idx] = { ...bo, id: String(bo.id) };
          } else {
            existing.push({ ...bo, id: String(bo.id) });
          }
        });
        localStorage.setItem('hamp_orders', JSON.stringify(existing));
      }

      // Always render from localStorage (single source of truth after merge)
      const localOrders = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
      const sorted = [...localOrders].sort((a, b) =>
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setOrders(sorted.map(o => ({ ...o, id: String(o.id || '') })));

      if (!res.ok && localOrders.length === 0) {
        setError(`Failed to load orders (HTTP ${res.status})`);
      }
    } catch (e) {
      const localOrders = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
      setOrders(localOrders.map(o => ({ ...o, id: String(o.id || '') })));
      if (localOrders.length === 0) setError('Network error — could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const tabFiltered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);
  const filtered = tabFiltered.filter(o => {
    const q = search.toLowerCase();
    return (
      String(o.id || '').toLowerCase().includes(q) ||
      (o.shipping_address?.full_name || o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1200, margin: '0 auto', fontFamily: 'Jost, sans-serif' }}>
      <AnimatePresence>
        {selectedOrder && (
          <OrderDrawer
            key="order-drawer"
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdated={() => { setSelectedOrder(null); fetchOrders(); }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 600, color: PLUM, margin: 0 }}>Orders</h1>
        <p style={{ color: '#7c5a6a', marginTop: 6, fontSize: 14 }}>Manage and update customer orders</p>
      </motion.div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const count = tab.key === 'all' ? orders.length : orders.filter(o => o.status === tab.key).length;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: active ? ROSE : '#fff',
                color: active ? '#fff' : '#7c5a6a',
                border: `1px solid ${active ? ROSE : '#f3d0dd'}`,
                borderRadius: 20, padding: '7px 16px',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                fontFamily: 'Jost, sans-serif', transition: 'all 0.2s',
              }}
            >
              {tab.label}{count > 0 && <span style={{ opacity: 0.8 }}> ({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#a0728a', pointerEvents: 'none' }}>🔍</span>
        <input
          placeholder="Search by Order ID, customer name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: 12, border: '1px solid #f3d0dd', fontFamily: 'Jost, sans-serif', fontSize: 14, color: PLUM, background: '#fff', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 18px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
          {error}{' '}
          <button onClick={fetchOrders} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {/* Table */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <p style={{ color: '#7c5a6a', fontSize: 15 }}>No orders found</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,15,21,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: BLUSH }}>
                  {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Action'].map(h => (
                    <th
                      key={h}
                      style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#7c5a6a', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    style={{ borderTop: '1px solid #fdeef3' }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: PLUM, fontSize: 13, whiteSpace: 'nowrap' }}>
                      #{String(order.id || '').slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: PLUM, margin: 0 }}>
                        {order.shipping_address?.full_name || order.customer_name || '—'}
                      </p>
                      <p style={{ fontSize: 11, color: '#7c5a6a', margin: 0 }}>
                        {order.customer_email || order.shipping_address?.email || ''}
                      </p>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#7c5a6a' }}>
                      {order.items?.length
                        ? `${order.items[0].product_name || order.items[0].name || 'Item'}${order.items.length > 1 ? ` +${order.items.length - 1}` : ''}`
                        : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: ROSE, fontSize: 14, whiteSpace: 'nowrap' }}>
                      ₹{(order.final_amount || order.total || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#7c5a6a', whiteSpace: 'nowrap' }}>
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={{ background: BLUSH, color: ROSE, border: `1px solid ${PINK}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Jost, sans-serif', whiteSpace: 'nowrap' }}
                      >
                        Manage
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
