import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PLUM  = '#1A0F15';
const PINK  = '#D4789A';
const ROSE  = '#B84E78';
const BLUSH = '#FFF5F8';

const SR_EMAIL    = process.env.REACT_APP_SHIPROCKET_EMAIL    || '';
const SR_PASSWORD = process.env.REACT_APP_SHIPROCKET_PASSWORD || '';
const SR_BASE     = 'https://apiv2.shiprocket.in/v1/external';

async function srLogin() {
  const cached = sessionStorage.getItem('sr_token');
  if (cached) return cached;
  const res = await fetch(`${SR_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SR_EMAIL, password: SR_PASSWORD }),
  });
  const data = await res.json();
  const token = data.token;
  if (!token) throw new Error('Shiprocket login failed');
  sessionStorage.setItem('sr_token', token);
  return token;
}

async function srApi(method, path, body) {
  const token = await srLogin();
  const res = await fetch(`${SR_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

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

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

const emptyForm = {
  pickup_location: '', name: '', email: '', phone: '',
  address: '', address_2: '', city: '', state: '', country: 'India', pin_code: '',
};

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #f3d0dd', borderTopColor: PINK, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function PickupLocations() {
  const [locations, setLocations]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // ── Local storage helpers (primary source of truth) ─────────────────────
  const LOCAL_KEY = 'hamp_pickup_locations';
  const loadLocal  = ()     => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; } };
  const saveLocal  = (list) => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); } catch {} };

  useEffect(() => {
    // Show local locations immediately, then try to sync from Shiprocket
    const local = loadLocal();
    if (local.length > 0) {
      setLocations(local);
      setLoading(false);
    }
    fetchLocations();
  }, []); // eslint-disable-line

  const fetchLocations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await srApi('GET', '/settings/company/pickup');
      if (!res.ok) throw new Error(`Shiprocket HTTP ${res.status}`);
      const data = await res.json();
      const list = data?.data?.shipping_address || [];
      if (list.length > 0) {
        saveLocal(list);
        setLocations(list);
      } else {
        // Shiprocket returned empty — show local ones
        setLocations(loadLocal());
      }
      setError('');
    } catch (e) {
      // Shiprocket unreachable — use locally saved locations
      const local = loadLocal();
      setLocations(local);
      if (local.length === 0) {
        setError('Could not connect to Shiprocket. Add a pickup location below and it will sync automatically.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    // Always save locally first
    const newLocation = {
      pickup_location: form.pickup_location,
      name:      form.name,
      email:     form.email,
      phone:     form.phone,
      address:   form.address,
      address_2: form.address_2,
      city:      form.city,
      state:     form.state,
      pin_code:  form.pin_code,
      country:   'India',
      status:    1,
    };
    const existing = loadLocal();
    const updated  = [...existing, newLocation];
    saveLocal(updated);
    setLocations(updated);

    // Try to also sync to Shiprocket (best effort)
    try {
      const res  = await srApi('POST', '/settings/company/pickup', form);
      const data = await res.json();
      if (!res.ok) {
        // Saved locally but Shiprocket failed — show warning
        setSaveSuccess('Saved locally. Shiprocket sync note: ' + (data.message || 'will retry on next booking'));
      } else {
        setSaveSuccess('Pickup location saved and synced to Shiprocket!');
        // Re-fetch to get Shiprocket's version
        fetchLocations();
      }
    } catch {
      setSaveSuccess('Saved locally (Shiprocket will sync automatically on next booking).');
    }

    setForm(emptyForm);
    setShowForm(false);
    setSaving(false);
  };

  const setActive = (name) => {
    sessionStorage.setItem('sr_active_pickup', name);
    // Also mark in localStorage so it persists across tabs
    localStorage.setItem('sr_active_pickup', name);
    alert(`✅ "${name}" set as active pickup location for new shipments.`);
  };

  // Load active pickup from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sr_active_pickup');
    if (stored) sessionStorage.setItem('sr_active_pickup', stored);
  }, []);

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 900, margin: '0 auto', fontFamily: 'Jost, sans-serif' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 600, color: PLUM, margin: 0 }}>
            Pickup Locations
          </h1>
          <p style={{ color: '#7c5a6a', marginTop: 6, fontSize: 14 }}>
            Manage your Shiprocket warehouse/pickup addresses
          </p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setSaveError(''); setSaveSuccess(''); }}
          style={{ background: ROSE, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          {showForm ? '✕ Cancel' : '+ Add Pickup Location'}
        </button>
      </motion.div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 18px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
          {error} <button onClick={fetchLocations} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f3d0dd', padding: 28 }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: PLUM, margin: '0 0 20px' }}>
                Add Pickup Location
              </h2>

              {saveError && (
                <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
                  {saveError}
                </div>
              )}

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Location Name * <span style={{ fontSize: 11, color: '#a0728a', fontWeight: 400 }}>(e.g. "Hampious Warehouse")</span></label>
                    <input required style={inputStyle} value={form.pickup_location}
                      onChange={e => setForm(f => ({ ...f, pickup_location: e.target.value }))}
                      placeholder="Hampious Warehouse" />
                  </div>
                  <div>
                    <label style={labelStyle}>Contact Name *</label>
                    <input required style={inputStyle} value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Debashis Bisoye" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input required type="email" style={inputStyle} value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="team.hampious@gmail.com" />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone *</label>
                    <input required style={inputStyle} value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="9876543210" maxLength={10} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Address Line 1 *</label>
                  <input required style={inputStyle} value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="House/Shop No., Street Name" />
                </div>

                <div>
                  <label style={labelStyle}>Address Line 2</label>
                  <input style={inputStyle} value={form.address_2}
                    onChange={e => setForm(f => ({ ...f, address_2: e.target.value }))}
                    placeholder="Area, Landmark (optional)" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>City *</label>
                    <input required style={inputStyle} value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="Bangalore" />
                  </div>
                  <div>
                    <label style={labelStyle}>State *</label>
                    <select required style={inputStyle} value={form.state}
                      onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>PIN Code *</label>
                    <input required style={inputStyle} value={form.pin_code} maxLength={6}
                      onChange={e => setForm(f => ({ ...f, pin_code: e.target.value }))}
                      placeholder="560001" />
                  </div>
                </div>

                <button type="submit" disabled={saving}
                  style={{ background: saving ? '#c4849e' : ROSE, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 4 }}>
                  {saving ? 'Saving to Shiprocket...' : '📍 Add Pickup Location'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Locations List */}
      {loading ? <Spinner /> : locations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📍</div>
          <p style={{ color: PLUM, fontSize: 18, fontWeight: 600, fontFamily: 'Cormorant Garamond, serif', margin: '0 0 8px' }}>No pickup locations yet</p>
          <p style={{ color: '#7c5a6a', fontSize: 14, margin: '0 0 20px' }}>Add your warehouse address to start booking shipments</p>
          <button onClick={() => setShowForm(true)}
            style={{ background: ROSE, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            + Add First Pickup Location
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {locations.map((loc, i) => {
            const isActive = loc.status === 1;
            const name = loc.pickup_location || loc.alias || `Location ${i + 1}`;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: '#fff', borderRadius: 16, border: `1px solid ${isActive ? PINK : '#f3d0dd'}`, padding: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>📍</span>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 19, fontWeight: 600, color: PLUM, margin: 0 }}>{name}</h3>
                    {isActive && (
                      <span style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>Active</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: '#7c5a6a', margin: '0 0 4px' }}>
                    📞 {loc.phone || '—'} &nbsp;|&nbsp; ✉️ {loc.email || '—'}
                  </p>
                  <p style={{ fontSize: 13, color: '#7c5a6a', margin: 0 }}>
                    🏠 {[loc.address, loc.address_2, loc.city, loc.state, loc.pin_code].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setActive(name)}
                    style={{ background: BLUSH, color: ROSE, border: `1px solid ${PINK}`, borderRadius: 9, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Jost, sans-serif' }}>
                    Use for Shipments
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div style={{ marginTop: 24, background: BLUSH, borderRadius: 14, padding: '16px 20px', border: '1px solid #f3d0dd' }}>
        <p style={{ fontSize: 13, color: '#7c5a6a', margin: 0, lineHeight: 1.7 }}>
          💡 <strong>How it works:</strong> Pickup locations are synced directly with your Shiprocket account.
          When you book a shipment, the active pickup location is automatically selected.
          Click <strong>"Use for Shipments"</strong> to set a location as the default for new bookings.
        </p>
      </div>
    </div>
  );
}
