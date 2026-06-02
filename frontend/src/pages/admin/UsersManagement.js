import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminGet, adminDelete, handleUnauth } from '../../utils/adminApi';

const PLUM = '#1A0F15';
const PINK = '#D4789A';
const ROSE = '#B84E78';
const BLUSH = '#FFF5F8';

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #f3d0dd', borderTopColor: PINK, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: `linear-gradient(135deg, ${PINK}, ${ROSE})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0,
      fontFamily: 'Jost, sans-serif',
    }}>
      {initials}
    </div>
  );
}

export default function UsersManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { navigate('/admin'); return; }
    fetchCustomers();
  }, [navigate]);

  // Build unique customers from hamp_orders localStorage
  const buildCustomersFromOrders = () => {
    const orders = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
    const map = {};
    orders.forEach(order => {
      const email = order.customer_email || order.shipping_address?.email || '';
      if (!email) return;
      if (!map[email]) {
        map[email] = {
          id:           email,
          email,
          name:         order.customer_name || order.shipping_address?.full_name || 'Customer',
          phone:        order.customer_phone || order.shipping_address?.phone || '',
          total_orders: 0,
          total_spent:  0,
          created_at:   order.created_at || new Date().toISOString(),
        };
      }
      map[email].total_orders += 1;
      map[email].total_spent  += Number(order.final_amount || order.total || 0);
      // Keep earliest order date
      if (order.created_at && order.created_at < map[email].created_at) {
        map[email].created_at = order.created_at;
      }
    });
    return Object.values(map).sort((a, b) => b.total_spent - a.total_spent);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      // Always start with customers extracted from orders
      const fromOrders = buildCustomersFromOrders();

      // Try backend
      let backendList = [];
      try {
        let res = await adminGet('/customers');
        if (handleUnauth(res, navigate)) return;
        if (res.status === 404) res = await adminGet('/users');
        if (res.ok) {
          const data = await res.json();
          backendList = Array.isArray(data) ? data : (data.customers || data.users || []);
        }
      } catch {}

      // Merge: backend customers take priority, then add order-derived ones not in backend
      const backendEmails = new Set(backendList.map(c => c.email));
      const orderOnly     = fromOrders.filter(c => !backendEmails.has(c.email));
      const merged        = [...backendList, ...orderOnly];

      // Also merge with hamp_customers localStorage
      const storedCustomers = JSON.parse(localStorage.getItem('hamp_customers') || '[]');
      const storedEmails    = new Set(merged.map(c => c.email));
      const storedOnly      = storedCustomers.filter(c => !storedEmails.has(c.email));
      const final           = [...merged, ...storedOnly];

      setCustomers(final.length > 0 ? final : fromOrders);

      // Cache the merged list
      if (final.length > 0) {
        localStorage.setItem('hamp_customers', JSON.stringify(final));
      }
    } catch {
      const fromOrders = buildCustomersFromOrders();
      setCustomers(fromOrders);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      let res;
      try {
        res = await adminDelete(`/customers/${id}`);
        if (handleUnauth(res, navigate)) return;
      } catch { res = { ok: false }; }

      // Also remove from localStorage cache
      const stored = JSON.parse(localStorage.getItem('hamp_customers') || '[]');
      localStorage.setItem('hamp_customers', JSON.stringify(stored.filter(c => c.id !== id)));

      setDeleteId(null);
      fetchCustomers();
    } catch (e) { console.error(e); }
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const name = `${c.first_name || ''} ${c.last_name || ''} ${c.name || ''}`.trim().toLowerCase();
    return (
      name.includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  });

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Jost, sans-serif' }}>

      {/* Delete Confirm Dialog */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,15,21,0.55)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: '#fff', borderRadius: 18, padding: 32, maxWidth: 380, width: '90%', textAlign: 'center' }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: PLUM, margin: '0 0 10px' }}>Delete Customer?</h3>
              <p style={{ color: '#7c5a6a', fontSize: 14, marginBottom: 24 }}>This will permanently remove the customer and their data.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => setDeleteId(null)}
                  style={{ background: BLUSH, color: PLUM, border: '1px solid #f3d0dd', borderRadius: 10, padding: '10px 22px', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 600, color: PLUM, margin: 0 }}>Customers</h1>
        <p style={{ color: '#7c5a6a', marginTop: 6, fontSize: 14 }}>{customers.length} registered customers</p>
      </motion.div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#a0728a', pointerEvents: 'none' }}>🔍</span>
        <input
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: 12, border: '1px solid #f3d0dd', fontFamily: 'Jost, sans-serif', fontSize: 14, color: PLUM, background: '#fff', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 18px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
          {error}{' '}
          <button onClick={fetchCustomers} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {/* Table */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
          <p style={{ color: '#7c5a6a', fontSize: 15 }}>
            {search ? 'No customers match your search' : 'No customers yet'}
          </p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,15,21,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: BLUSH }}>
                  {['Customer', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'Joined', 'Actions'].map(h => (
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
                {filtered.map((customer, i) => {
                  const name = customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown';
                  return (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      style={{ borderTop: '1px solid #fdeef3' }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar name={name} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: PLUM }}>{name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#3d1f2f' }}>{customer.email || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#7c5a6a', whiteSpace: 'nowrap' }}>{customer.phone || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: PLUM, textAlign: 'center' }}>
                        {customer.total_orders ?? customer.order_count ?? 0}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: ROSE, whiteSpace: 'nowrap' }}>
                        ₹{(customer.total_spent || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#7c5a6a', whiteSpace: 'nowrap' }}>
                        {customer.created_at
                          ? new Date(customer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => setDeleteId(customer.id)}
                          style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Jost, sans-serif', whiteSpace: 'nowrap' }}
                        >
                          🗑️ Delete
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
