import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminGet, handleUnauth } from '../../utils/adminApi';

const PLUM = '#1A0F15';
const PINK = '#D4789A';
const ROSE = '#B84E78';
const BLUSH = '#FFF5F8';

const statusColors = {
  pending:    { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  processing: { bg: '#DBEAFE', color: '#1E40AF', label: 'Processing' },
  shipped:    { bg: '#EDE9FE', color: '#5B21B6', label: 'Shipped' },
  delivered:  { bg: '#D1FAE5', color: '#065F46', label: 'Delivered' },
  cancelled:  { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' },
};

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '4px solid #f3d0dd',
        borderTopColor: PINK,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '24px 20px',
        boxShadow: '0 2px 12px rgba(26,15,21,0.07)',
        border: '1px solid #f3d0dd',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: color + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>{icon}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: PLUM, fontFamily: 'Jost, sans-serif', marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#7c5a6a', fontFamily: 'Jost, sans-serif', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#a0728a', fontFamily: 'Jost, sans-serif' }}>{sub}</div>}
    </motion.div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { navigate('/admin'); return; }
    fetchDashboard();
  }, [navigate]);

  // Build stats from localStorage when backend is offline
  const buildLocalStats = () => {
    const orders    = JSON.parse(localStorage.getItem('hamp_orders')    || '[]');
    const products  = JSON.parse(localStorage.getItem('hamp_products')  || '[]');
    const customers = JSON.parse(localStorage.getItem('hamp_customers') || '[]');
    const revenue   = orders.filter(o => o.payment_status === 'paid')
                            .reduce((s, o) => s + Number(o.final_amount || o.total || 0), 0);
    return {
      total_products:    products.length,
      total_orders:      orders.length,
      total_customers:   customers.length,
      total_revenue:     revenue,
      pending_orders:    orders.filter(o => o.status === 'pending').length,
      processing_orders: orders.filter(o => o.status === 'processing').length,
      shipped_orders:    orders.filter(o => o.status === 'shipped').length,
      delivered_orders:  orders.filter(o => o.status === 'delivered').length,
      low_stock_products:products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 3).length,
      recent_orders:     [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
    };
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGet('/dashboard');
      if (handleUnauth(res, navigate)) return;
      if (res.ok) {
        const data = await res.json();
        // Merge backend data with localStorage for completeness
        const local = buildLocalStats();
        setStats({
          ...data,
          recent_orders: data.recent_orders || local.recent_orders,
        });
      } else {
        // Backend returned error — use localStorage
        setStats(buildLocalStats());
      }
    } catch {
      // Backend offline — build stats from localStorage
      setStats(buildLocalStats());
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  const hasStockWarning = (stats?.low_stock_products > 0) || (stats?.out_of_stock_products > 0);

  const cards = [
    { label: 'Total Revenue', value: `₹${(stats?.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: '💰', color: '#10b981', delay: 0.05 },
    { label: 'Total Orders', value: stats?.total_orders || 0, sub: stats?.pending_orders ? `${stats.pending_orders} pending` : null, icon: '📦', color: '#3b82f6', delay: 0.1 },
    { label: 'Products', value: stats?.total_products || 0, sub: stats?.out_of_stock_products ? `${stats.out_of_stock_products} out of stock` : null, icon: '🛍️', color: PINK, delay: 0.15 },
    { label: 'Customers', value: stats?.total_customers ?? stats?.total_users ?? 0, icon: '👤', color: '#8b5cf6', delay: 0.2 },
    { label: 'Shipped', value: stats?.shipped_orders || 0, icon: '🚚', color: '#6366f1', delay: 0.25 },
    { label: 'Delivered', value: stats?.delivered_orders || 0, icon: '✅', color: '#059669', delay: 0.3 },
  ];

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1200, margin: '0 auto', fontFamily: 'Jost, sans-serif' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 600, color: PLUM, margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ color: '#7c5a6a', marginTop: 6, fontSize: 14 }}>
          Welcome back! Here's an overview of your store.
        </p>
      </motion.div>

      {/* Warning Banner */}
      {hasStockWarning && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12,
            padding: '14px 20px', marginBottom: 24, display: 'flex',
            alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          }}
        >
          <span style={{ color: '#92400E', fontWeight: 500, fontSize: 14 }}>
            ⚠️ Stock Alert:{' '}
            {stats?.out_of_stock_products > 0 && `${stats.out_of_stock_products} products out of stock`}
            {stats?.out_of_stock_products > 0 && stats?.low_stock_products > 0 && ', '}
            {stats?.low_stock_products > 0 && `${stats.low_stock_products} products low on stock`}
          </span>
          <Link to="/admin/products" style={{ color: '#92400E', fontWeight: 600, fontSize: 13, textDecoration: 'underline' }}>
            View Products →
          </Link>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 36 }}>
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 600, color: PLUM, margin: 0 }}>
            Recent Orders
          </h2>
          <Link to="/admin/orders" style={{ color: ROSE, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
            View All →
          </Link>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,15,21,0.05)' }}>
          {stats?.recent_orders && stats.recent_orders.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr style={{ background: BLUSH }}>
                    {['Order ID', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#7c5a6a', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_orders.map((order) => {
                    const sc = statusColors[order.status] || { bg: '#f3f4f6', color: '#374151', label: order.status };
                    return (
                      <tr key={order.id} style={{ borderTop: '1px solid #fdeef3' }}>
                        <td style={{ padding: '14px 18px', fontSize: 13, color: PLUM, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          #{(order.id || '').slice(0, 8).toUpperCase()}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 13, color: '#3d1f2f' }}>
                          {order.shipping_address?.full_name || order.customer_name || '—'}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: ROSE, whiteSpace: 'nowrap' }}>
                          ₹{(order.final_amount || order.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            background: sc.bg, color: sc.color,
                            borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                          }}>
                            {sc.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 12, color: '#7c5a6a', whiteSpace: 'nowrap' }}>
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center', color: '#a0728a' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <p style={{ fontSize: 15, fontWeight: 500 }}>No recent orders</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
