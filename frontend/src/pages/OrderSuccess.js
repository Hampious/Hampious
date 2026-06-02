import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, MapPin, CreditCard, ArrowRight, Home, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button';
import confetti from 'canvas-confetti';

const PINK = '#D4789A';
const ROSE = '#B84E78';
const PLUM = '#1A0F15';

export default function OrderSuccess() {
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId   = searchParams.get('order_id');
  const [order, setOrder] = useState(null);

  // ── Load order from localStorage ────────────────────────────────────────
  useEffect(() => {
    if (!orderId) return;
    try {
      const stored = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
      const found  = stored.find(o => String(o.id) === String(orderId));
      if (found) setOrder(found);
    } catch {}
  }, [orderId]);

  // ── Confetti ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const end = Date.now() + 3000;
    const burst = () => {
      confetti({ particleCount: 4, angle: 60,  spread: 55, origin: { x: 0 }, colors: ['#D4789A','#FFF5F8','#B84E78'] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#D4789A','#FFF5F8','#B84E78'] });
      if (Date.now() < end) requestAnimationFrame(burst);
    };
    burst();
  }, []);

  const addr  = order?.shipping_address || {};
  const items = order?.items || [];
  const total = Number(order?.final_amount ?? order?.total ?? 0);

  return (
    <div className="min-h-screen bg-background py-10 px-4 md:px-8" data-testid="order-success-page">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* ── Success Banner ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ background: 'linear-gradient(135deg, #1A0F15 0%, #3D1A2A 100%)', borderRadius: 24, padding: '40px 32px', textAlign: 'center', marginBottom: 24 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            style={{ width: 80, height: 80, background: 'rgba(212,120,154,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid rgba(212,120,154,0.4)' }}
          >
            <CheckCircle size={40} color="#D4789A" />
          </motion.div>

          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 600, color: '#FFF5F8', margin: '0 0 10px' }}>
            Order Confirmed! 🎉
          </h1>
          <p style={{ color: 'rgba(255,245,248,0.65)', fontSize: 15, margin: '0 0 20px' }}>
            Thank you for shopping with Hampious
          </p>

          {orderId && (
            <div style={{ background: 'rgba(212,120,154,0.15)', borderRadius: 12, padding: '12px 20px', display: 'inline-block', border: '1px solid rgba(212,120,154,0.3)' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,245,248,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Order ID</span>
              <p style={{ fontSize: 18, fontWeight: 700, color: PINK, margin: '4px 0 0', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                {String(orderId).slice(0, 12).toUpperCase()}
              </p>
            </div>
          )}
        </motion.div>

        {/* ── Order Items ────────────────────────────────────────────────── */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ background: '#fff', borderRadius: 20, border: '1px solid #f3d0dd', overflow: 'hidden', marginBottom: 16 }}
          >
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #fdeef3', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShoppingBag size={18} color={ROSE} />
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600, color: PLUM }}>
                Items Ordered
              </span>
            </div>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: i < items.length - 1 ? '1px solid #fdeef3' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FFF5F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                    🎁
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: PLUM, margin: 0 }}>{item.product_name || item.name || 'Gift Hamper'}</p>
                    <p style={{ fontSize: 12, color: '#7c5a6a', margin: 0 }}>Qty: {item.quantity}</p>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: ROSE, fontSize: 14 }}>
                  ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            <div style={{ padding: '14px 22px', background: '#FFF5F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: PLUM, fontSize: 15 }}>Total Paid</span>
              <span style={{ fontWeight: 800, color: ROSE, fontSize: 20 }}>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </motion.div>
        )}

        {/* ── Shipping Address ───────────────────────────────────────────── */}
        {(addr.full_name || addr.address || addr.city) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ background: '#fff', borderRadius: 20, border: '1px solid #f3d0dd', padding: '18px 22px', marginBottom: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <MapPin size={18} color={ROSE} />
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600, color: PLUM }}>Delivery Address</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: PLUM, margin: '0 0 4px' }}>{addr.full_name || order?.customer_name || ''}</p>
            <p style={{ fontSize: 13, color: '#7c5a6a', margin: 0, lineHeight: 1.7 }}>
              {addr.address || addr.line1 || ''}
              {(addr.city || addr.state) && <><br />{[addr.city, addr.state].filter(Boolean).join(', ')}{addr.pincode && ` — ${addr.pincode}`}</>}
              <br />India
            </p>
            {(addr.phone || order?.customer_phone) && (
              <p style={{ fontSize: 13, color: '#7c5a6a', margin: '6px 0 0' }}>📞 {addr.phone || order?.customer_phone}</p>
            )}
          </motion.div>
        )}

        {/* ── Payment Info ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ background: '#fff', borderRadius: 20, border: '1px solid #f3d0dd', padding: '18px 22px', marginBottom: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <CreditCard size={18} color={ROSE} />
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600, color: PLUM }}>What's Next?</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: 1, t: 'Payment confirmed', d: 'Your payment has been received successfully' },
              { n: 2, t: 'Order processing', d: 'We\'re preparing your gift hamper with care' },
              { n: 3, t: 'Shipping update', d: 'You\'ll get an email when your order ships' },
              { n: 4, t: 'Track anytime', d: 'Check order status in My Orders' },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FFF5F8', border: `2px solid ${PINK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: ROSE }}>{step.n}</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: PLUM, margin: 0 }}>{step.t}</p>
                  <p style={{ fontSize: 13, color: '#7c5a6a', margin: '2px 0 0' }}>{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <Button
            onClick={() => navigate('/my-orders')}
            className="w-full h-14 rounded-full text-base font-semibold"
            style={{ background: ROSE, color: '#fff', border: 'none' }}
            data-testid="view-orders-btn"
          >
            <Package className="mr-2 h-5 w-5" />
            View My Orders
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full h-14 rounded-full text-base font-medium border-2"
            data-testid="continue-shopping-btn"
          >
            <Home className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
