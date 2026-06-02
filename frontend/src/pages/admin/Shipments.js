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

// ── Shipment slip printer ─────────────────────────────────────────────────────
function printShipmentSlip(order, awbCode, courierName, shipmentId) {
  const addr      = order.shipping_address || {};
  const items     = order.items || [];
  const total     = Number(order.final_amount || order.total || 0);
  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const itemsHtml = items.map(it => {
    const name  = it.product_name || it.name || 'Gift Hamper';
    const qty   = Number(it.quantity || 1);
    const price = Number(it.price || 0);
    return `<tr><td style="padding:4px 0;border-bottom:1px solid #fdeef3">${name} x${qty}</td><td style="text-align:right;padding:4px 0;border-bottom:1px solid #fdeef3">Rs.${(price * qty).toLocaleString('en-IN')}</td></tr>`;
  }).join('');

  const customerAddr = [
    addr.full_name || order.customer_name || '',
    addr.address || addr.line1 || '',
    [addr.city, addr.state].filter(Boolean).join(', ') + (addr.pincode ? ' - ' + addr.pincode : ''),
    'Ph: ' + (addr.phone || order.customer_phone || ''),
    order.customer_email || addr.email || '',
  ].filter(Boolean).join('<br>');

  const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Shipment Slip</title>' +
  '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;background:#fff;color:#1A0F15}' +
  '.wrap{max-width:400px;margin:20px auto;border:2px solid #D4789A;border-radius:8px;overflow:hidden}' +
  '.hdr{background:#1A0F15;padding:14px;text-align:center}' +
  '.logo{font-size:22px;font-weight:bold;color:#D4789A;letter-spacing:5px}' +
  '.tag{font-size:8px;letter-spacing:3px;color:rgba(212,120,154,0.6);text-transform:uppercase;margin-top:2px}' +
  '.awb{background:#FFF5F8;border:2px dashed #D4789A;margin:12px;border-radius:6px;padding:10px;text-align:center}' +
  '.awb-n{font-size:24px;font-weight:bold;font-family:monospace;letter-spacing:3px;color:#1A0F15}' +
  '.awb-l{font-size:9px;color:#7c5a6a;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px}' +
  '.sec{margin:0 12px 10px}.sec-t{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#B84E78;font-weight:bold;border-bottom:1px solid #f3d0dd;padding-bottom:3px;margin-bottom:6px}' +
  '.addr{font-size:12px;line-height:1.8;font-weight:bold}' +
  'table{width:100%;font-size:11px;border-collapse:collapse}' +
  '.tot{font-weight:bold;font-size:13px;color:#B84E78;border-top:2px solid #D4789A;padding-top:4px}' +
  '.ftr{background:#FFF5F8;text-align:center;padding:10px;font-size:9px;color:#7c5a6a;border-top:1px dashed #f3d0dd}' +
  '.btn-bar{text-align:center;padding:12px;background:#f8f0f4;border-bottom:1px solid #f3d0dd}' +
  '@media print{.btn-bar{display:none}body{margin:0}.wrap{border:1px solid #D4789A;margin:0;max-width:100%}}' +
  '</style></head><body>' +
  '<div class="btn-bar">' +
  '<button onclick="window.print()" style="background:#B84E78;color:#fff;border:none;padding:9px 28px;border-radius:6px;font-size:14px;cursor:pointer;margin-right:8px;font-family:Georgia,serif">Print Slip</button>' +
  '<button onclick="window.close()" style="background:#f3d0dd;color:#1A0F15;border:none;padding:9px 18px;border-radius:6px;font-size:14px;cursor:pointer">Close</button>' +
  '</div>' +
  '<div class="wrap">' +
  '<div class="hdr"><div class="logo">HAMPIOUS</div><div class="tag">Premium Gift Hampers</div></div>' +
  '<div class="awb"><div class="awb-l">AWB / Tracking Number</div>' +
  '<div class="awb-n">' + (awbCode || shipmentId || '---') + '</div>' +
  '<div style="font-size:10px;color:#7c5a6a;margin-top:3px">via ' + (courierName || 'Shiprocket') + '</div></div>' +
  '<div style="display:flex;gap:0;margin:0 12px 10px">' +
  '<div style="flex:1;padding-right:8px;border-right:1px dashed #f3d0dd">' +
  '<div class="sec-t" style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#B84E78;font-weight:bold;border-bottom:1px solid #f3d0dd;padding-bottom:2px;margin-bottom:5px">From</div>' +
  '<div class="addr">Hampious<br>India<br>team.hampious@gmail.com</div></div>' +
  '<div style="flex:1;padding-left:8px">' +
  '<div class="sec-t" style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#B84E78;font-weight:bold;border-bottom:1px solid #f3d0dd;padding-bottom:2px;margin-bottom:5px">To</div>' +
  '<div class="addr">' + customerAddr + '</div></div></div>' +
  '<div class="sec"><div class="sec-t">Order Details</div>' +
  '<table><tr><td>Order ID</td><td style="text-align:right;font-weight:bold">' + String(order.id).toUpperCase() + '</td></tr>' +
  '<tr><td>Date</td><td style="text-align:right">' + orderDate + '</td></tr>' +
  '<tr><td>Payment</td><td style="text-align:right;color:green;font-weight:bold">Prepaid</td></tr></table></div>' +
  '<div class="sec"><div class="sec-t">Items</div>' +
  '<table>' + itemsHtml + '<tr class="tot"><td>Total Paid</td><td style="text-align:right">Rs.' + total.toLocaleString('en-IN') + '</td></tr></table></div>' +
  '<div class="ftr"><div style="font-size:13px;margin-bottom:3px">Thank you for choosing Hampious!</div>' +
  '<div>For queries: team.hampious@gmail.com</div>' +
  '<div style="margin-top:5px;color:#D4789A;font-size:10px">Premium Gift Hampers - Delivered with Love</div></div>' +
  '</div></body></html>';

  // Use Blob URL — works even with popup blockers
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) {
    // Popup blocked — download as HTML file instead
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shipment-slip-' + String(order.id) + '.html';
    a.click();
  }
  // Clean up blob URL after 60s
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ── Shiprocket credentials (direct API — no backend needed) ──────────────────
const SR_EMAIL    = process.env.REACT_APP_SHIPROCKET_EMAIL    || '';
const SR_PASSWORD = process.env.REACT_APP_SHIPROCKET_PASSWORD || '';
const SR_BASE     = 'https://apiv2.shiprocket.in/v1/external';

// Cache JWT in sessionStorage so we don't login on every booking
async function srLogin() {
  const cached = sessionStorage.getItem('sr_token');
  if (cached) return cached;
  const res = await fetch(`${SR_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SR_EMAIL, password: SR_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Shiprocket login failed (${res.status})`);
  const data = await res.json();
  const token = data.token;
  if (!token) throw new Error('Shiprocket login returned no token');
  sessionStorage.setItem('sr_token', token);
  return token;
}

async function srApi(method, path, body, token) {
  const res = await fetch(`${SR_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

// ── Shiprocket create + book shipment ────────────────────────────────────────
function ShiprocketForm({ order, onSuccess, onCancel }) {
  const [status, setStatus]   = useState('idle');
  const [message, setMessage] = useState('');
  const [result, setResult]   = useState(null);

  const handleBook = async () => {
    setStatus('loading');
    setMessage('Logging in to Shiprocket...');
    try {
      // ── Step 1: Login ────────────────────────────────────────────────────
      let srToken;
      try {
        srToken = await srLogin();
      } catch (e) {
        throw new Error(`Shiprocket login failed: ${e.message}\nCheck your email/password.`);
      }

      // ── Step 2: Get pickup location ──────────────────────────────────────
      setMessage('Fetching pickup address...');
      // Check if admin manually selected one from Pickup Locations tab
      let pickupLocation = sessionStorage.getItem('sr_active_pickup') || 'Primary';
      try {
        const pr = await srApi('GET', '/settings/company/pickup', null, srToken);
        if (pr.ok) {
          const pd = await pr.json();
          const addresses = pd?.data?.shipping_address || [];
          if (!sessionStorage.getItem('sr_active_pickup')) {
            const active = addresses.find(a => a.status === 1) || addresses[0];
            if (active) pickupLocation = active.pickup_location || active.alias || 'Primary';
          }
        }
      } catch {}

      // ── Step 3: Build order payload ──────────────────────────────────────
      setMessage('Creating Shiprocket order...');
      const addr  = order.shipping_address || {};
      const items = (order.items || []).map(item => ({
        name:          item.product_name || item.name || 'Gift Hamper',
        sku:           `HAMP-${item.product_id || '001'}`,
        units:         parseInt(item.quantity) || 1,
        selling_price: parseFloat(item.price) || 0,
        discount: 0, tax: 0,
      }));
      if (!items.length) items.push({ name: 'Gift Hamper', sku: 'HAMP-001', units: 1, selling_price: parseFloat(order.total || 0) });

      const customerName = addr.full_name || order.customer_name || 'Customer';
      const [firstName, ...rest] = customerName.split(' ');
      const phone = (addr.phone || order.customer_phone || '9999999999').replace(/\D/g, '').slice(-10);
      const orderId = String(order.id);

      const orderPayload = {
        order_id: orderId,
        order_date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        pickup_location: pickupLocation,
        comment: 'Hampious Gift Hamper',
        billing_customer_name: firstName,
        billing_last_name: rest.join(' ') || '.',
        billing_address: addr.address || addr.line1 || 'NA',
        billing_address_2: '',
        billing_city: addr.city || '',
        billing_pincode: String(addr.pincode || '400001'),
        billing_state: addr.state || '',
        billing_country: 'India',
        billing_email: order.customer_email || addr.email || '',
        billing_phone: phone,
        shipping_is_billing: true,
        order_items: items,
        payment_method: 'prepaid',
        sub_total: parseFloat(order.total || order.final_amount || 0),
        length: 20, breadth: 15, height: 10, weight: 0.5,
      };

      const orderRes = await srApi('POST', '/orders/create/adhoc', orderPayload, srToken);
      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        throw new Error(errData.message || errData.detail || `Order create failed (${orderRes.status})`);
      }
      const orderData = await orderRes.json();
      const shipmentId = orderData.shipment_id;
      const srOrderId  = orderData.order_id;

      if (!shipmentId) throw new Error('No shipment ID from Shiprocket — check pickup address is set up');

      // ── Step 4: Assign AWB ───────────────────────────────────────────────
      setMessage('Assigning courier & AWB...');
      let awbCode = '', courierName = 'Shiprocket', labelUrl = '';
      const awbRes = await srApi('POST', '/courier/assign/awb/shipment_id', { shipment_id: [shipmentId] }, srToken);
      if (awbRes.ok) {
        const awbData = (await awbRes.json())?.response?.data || {};
        awbCode     = awbData.awb_code || '';
        courierName = awbData.courier_name || 'Shiprocket';
      }

      // ── Step 5: Request pickup ───────────────────────────────────────────
      setMessage('Requesting pickup...');
      await srApi('POST', '/courier/generate/pickup', { shipment_id: [shipmentId] }, srToken).catch(() => {});

      // ── Step 6: Get label ────────────────────────────────────────────────
      const labelRes = await srApi('POST', '/courier/generate/label', { shipment_id: [shipmentId] }, srToken);
      if (labelRes.ok) labelUrl = (await labelRes.json()).label_url || '';

      const data = { success: true, shiprocket_order_id: srOrderId, shipment_id: shipmentId, awb_code: awbCode, courier_name: courierName, label_url: labelUrl };
      setResult(data);
      setStatus('success');
      setMessage('');

      // ── Update order status ──────────────────────────────────────────────
      const payload = {
        status:          'shipped',
        tracking_number: awbCode || String(shipmentId),
        courier:         courierName,
        notes:           `Shiprocket Order: ${srOrderId} | Shipment: ${shipmentId}`,
        updated_at:      new Date().toISOString(),
      };
      const localOrders = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
      const idx = localOrders.findIndex(o => String(o.id) === String(order.id));
      if (idx >= 0) localOrders[idx] = { ...localOrders[idx], ...payload };
      else localOrders.push({ ...order, ...payload });
      localStorage.setItem('hamp_orders', JSON.stringify(localOrders));
      adminPut(`/orders/${order.id}/status`, payload).catch(() => {});

      setTimeout(() => onSuccess(data), 1500);

    } catch (e) {
      sessionStorage.removeItem('sr_token'); // clear cached token on error
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
        <p style={{ fontSize: 14, fontWeight: 700, color: '#065F46', margin: '0 0 8px' }}>✅ Shipment Booked Successfully!</p>
        {result?.awb_code && <p style={{ fontSize: 13, color: '#065F46', margin: '0 0 4px' }}>AWB: <strong style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{result.awb_code}</strong></p>}
        {result?.courier_name && <p style={{ fontSize: 13, color: '#065F46', margin: '0 0 4px' }}>Courier: <strong>{result.courier_name}</strong></p>}
        {result?.shipment_id && <p style={{ fontSize: 13, color: '#065F46', margin: '0 0 10px' }}>Shipment ID: <strong>{result.shipment_id}</strong></p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Hampious branded shipment slip */}
          <button
            onClick={() => printShipmentSlip(order, result.awb_code, result.courier_name, result.shipment_id)}
            style={{ background: PLUM, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost, sans-serif' }}>
            🏷️ Print Shipment Slip
          </button>
          {/* Shiprocket official label */}
          {result?.label_url && (
            <a href={result.label_url} target="_blank" rel="noreferrer"
              style={{ display: 'inline-block', background: '#065F46', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              🖨️ Shiprocket Label
            </a>
          )}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ marginTop: 14, padding: 18, background: '#FEE2E2', borderRadius: 12, border: '1px solid #FCA5A5' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', margin: '0 0 8px' }}>❌ Shiprocket Error</p>
        <p style={{ fontSize: 12, color: '#991B1B', margin: '0 0 12px', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{message}</p>
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
    const fetchTracking = async () => {
      setLoading(true);
      setError('');
      try {
        // Login to Shiprocket directly (no backend needed)
        const srToken = await srLogin();

        // Try AWB tracking first
        let data = null;
        const awbRes = await fetch(`${SR_BASE}/courier/track/awb/${awbCode}`, {
          headers: { Authorization: `Bearer ${srToken}`, 'Content-Type': 'application/json' },
        });

        if (awbRes.ok) {
          const raw       = await awbRes.json();
          const trackData = raw.tracking_data || {};
          const shipment  = (trackData.shipment_track || [])[0] || {};
          const activities = (trackData.shipment_track_activities || []).slice(0, 15);
          data = {
            status:      shipment.current_status || 'In Transit',
            courier:     shipment.courier_name   || '',
            eta:         shipment.etd            || '',
            origin:      shipment.origin         || '',
            destination: shipment.destination    || '',
            activities:  activities.map(a => ({
              date:     a.date     || '',
              activity: a.activity || '',
              location: a.location || '',
            })),
          };
        }

        // If AWB not found, try by shipment ID
        if (!data || !data.status) {
          const shipRes = await fetch(`${SR_BASE}/courier/track/shipment/${awbCode}`, {
            headers: { Authorization: `Bearer ${srToken}`, 'Content-Type': 'application/json' },
          });
          if (shipRes.ok) {
            const raw = await shipRes.json();
            const shipment = (raw.tracking_data?.shipment_track || [])[0] || {};
            data = {
              status:      shipment.current_status || 'Processing',
              courier:     shipment.courier_name   || '',
              eta:         shipment.etd            || '',
              activities:  (raw.tracking_data?.shipment_track_activities || []).slice(0, 15).map(a => ({
                date: a.date || '', activity: a.activity || '', location: a.location || '',
              })),
            };
          }
        }

        if (data) setTracking(data);
        else setError('No tracking data found for this shipment yet. Check back after pickup is done.');
      } catch (e) {
        setError('Could not fetch tracking: ' + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();
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
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: 16, borderRadius: 10, fontSize: 13, lineHeight: 1.6 }}>
            {error}
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

      // Show: processing, shipped, OR pending-but-paid (payment went through)
      const relevant = allOrders
        .filter(o =>
          o.status === 'processing' ||
          o.status === 'shipped' ||
          (o.status === 'pending' && o.payment_status === 'paid')
        )
        .map(o => ({
          ...o,
          id: String(o.id || ''),
          // Treat paid-pending as processing for display
          status: (o.status === 'pending' && o.payment_status === 'paid') ? 'processing' : o.status,
        }))
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
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('admin_token') || '';
                const res = await fetch(`${API}/shiprocket/test-auth?token=${encodeURIComponent(token)}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const d = await res.json();
                if (d.success) {
                  const pickups = d.all_pickups?.length
                    ? '\n📍 Pickup locations: ' + d.all_pickups.join(', ')
                    : '\n⚠️ No pickup locations found — add one at app.shiprocket.in > Settings > Manage Pickup';
                  alert('✅ Shiprocket Connected!\nUsing pickup: ' + d.pickup_location + pickups);
                } else {
                  alert('❌ Shiprocket Error: ' + (d.detail || JSON.stringify(d)));
                }
              } catch (e) { alert('❌ Backend not reachable — start backend first.\n' + e.message); }
            }}
            style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            🚀 Test Shiprocket
          </button>
          <button onClick={fetchOrders}
            style={{ background: BLUSH, color: ROSE, border: `1px solid ${PINK}`, borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            🔄 Refresh
          </button>
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
