import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import API from '../api';

const ROSE  = '#B84E78';
const PINK  = '#D4789A';
const PLUM  = '#1A0F15';
const BLUSH = '#FFF5F8';

const RAZORPAY_KEY_ID = 'rzp_live_SwaqpwcGpYEzEj';

export default function PaymentMethod() {
  const navigate  = useNavigate();
  const { clearCart } = useCart();

  const [orderData,   setOrderData]   = useState(null);
  const [method,      setMethod]      = useState('');   // upi | card | cod | gift
  const [coupon,      setCoupon]      = useState('');
  const [giftCard,    setGiftCard]    = useState('');
  const [discount,    setDiscount]    = useState(0);
  const [appliedCode, setAppliedCode] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  // Load pending order from sessionStorage
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_order');
    if (!pending) { navigate('/checkout'); return; }
    setOrderData(JSON.parse(pending));
  }, [navigate]);

  if (!orderData) return null;

  const baseTotal   = Number(orderData.final_amount || orderData.total || 0);
  const finalTotal  = Math.max(0, baseTotal - discount);

  // ── Coupon apply ───────────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!coupon.trim()) { toast.error('Enter a coupon code'); return; }
    setCouponLoading(true);
    try {
      const res = await API.get(`/coupons/validate/${coupon}?amount=${baseTotal}`);
      setDiscount(res.data.discount || 0);
      setAppliedCode(coupon);
      toast.success('Coupon applied!');
    } catch {
      // Simple local coupon fallback
      const code = coupon.toUpperCase();
      if (code === 'HAMPIOUS10') { setDiscount(Math.round(baseTotal * 0.10)); setAppliedCode(code); toast.success('10% off applied!'); }
      else if (code === 'FIRST50') { setDiscount(50); setAppliedCode(code); toast.success('₹50 off applied!'); }
      else toast.error('Invalid coupon code');
    } finally { setCouponLoading(false); }
  };

  const handleRemoveCoupon = () => { setDiscount(0); setAppliedCode(''); setCoupon(''); };

  // ── Complete order (after payment or COD) ──────────────────────────────────
  const completeOrder = async (paymentId = 'cod', paymentMethod = 'cod') => {
    const orderCompletedRef = { current: true };
    const fullPayload = {
      ...orderData,
      final_amount:   finalTotal,
      total:          finalTotal,
      discount_amount: discount,
      coupon_code:    appliedCode || null,
      payment_method: paymentMethod,
      payment_id:     paymentId,
      payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
      status:         'processing',
      created_at:     new Date().toISOString(),
    };

    // Save to localStorage
    const orderId     = fullPayload.id || `ORD-${Date.now()}`;
    fullPayload.id    = orderId;
    const localOrders = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
    const idx         = localOrders.findIndex(o => String(o.id) === String(orderId));
    if (idx >= 0) localOrders[idx] = fullPayload;
    else localOrders.push(fullPayload);
    localStorage.setItem('hamp_orders', JSON.stringify(localOrders));

    // Try backend
    try { await API.post('/orders/create', fullPayload); } catch {}

    sessionStorage.removeItem('pending_order');
    await clearCart();
    toast.success('🎉 Order placed successfully!');
    navigate(`/order-success?order_id=${orderId}`);
  };

  // ── Load Razorpay script ───────────────────────────────────────────────────
  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  // ── Pay via Razorpay ───────────────────────────────────────────────────────
  const handleRazorpay = async () => {
    setLoading(true);
    const ok = await loadRazorpay();
    if (!ok) { toast.error('Could not load payment gateway. Try again.'); setLoading(false); return; }

    let rzpOrderId = null;
    let rzpAmount  = Math.round(finalTotal * 100);
    try {
      const res = await API.post('/payment/create-razorpay-order', { amount: finalTotal });
      if (res.data?.id) { rzpOrderId = res.data.id; rzpAmount = res.data.amount; }
    } catch {}

    const options = {
      key:         RAZORPAY_KEY_ID,
      amount:      rzpAmount,
      currency:    'INR',
      name:        'Hampious',
      description: 'Premium Gift Hamper',
      image:       `${window.location.origin}/logo.jpg`,
      prefill: {
        name:    orderData.customer_name    || '',
        email:   orderData.customer_email   || '',
        contact: (orderData.customer_phone  || '').replace(/\D/g, '').slice(-10),
      },
      theme: { color: '#D4789A' },
      modal: { ondismiss: () => { setLoading(false); toast.error('Payment cancelled.'); }, animation: true },
      handler: async (response) => {
        try {
          if (rzpOrderId) {
            await API.post('/payment/verify', {
              payment_id:        response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              signature:         response.razorpay_signature,
            }).catch(() => {});
          }
          await completeOrder(response.razorpay_payment_id, method === 'upi' ? 'upi' : 'card');
        } catch {
          setLoading(false);
          toast.error(`Payment received (ID: ${response.razorpay_payment_id}). Contact support.`);
        }
      },
    };
    if (rzpOrderId) options.order_id = rzpOrderId;

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', () => { toast.error('Payment failed. Please try again.'); setLoading(false); });
    rzp.open();
  };

  // ── Handle Pay button ──────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!method) { toast.error('Please select a payment method'); return; }
    if (method === 'cod') {
      setLoading(true);
      await completeOrder('cod', 'cod');
      setLoading(false);
    } else {
      await handleRazorpay();
    }
  };

  const methods = [
    { id: 'upi',  icon: '📱', label: 'UPI',       sub: 'Google Pay, PhonePe, Paytm, BHIM'  },
    { id: 'card', icon: '💳', label: 'Card',       sub: 'Credit card / Debit card'           },
    { id: 'cod',  icon: '💵', label: 'Cash on Delivery', sub: 'Pay when your order arrives' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BLUSH, padding: '40px 16px', fontFamily: 'Jost, sans-serif' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#D4789A,#B84E78)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>🎁</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 30, fontWeight: 600, color: PLUM, margin: 0 }}>Complete Your Order</h1>
          <p style={{ color: '#7c5a6a', fontSize: 14, margin: '6px 0 0' }}>Choose how you'd like to pay</p>
        </div>

        {/* Order Summary */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f3d0dd', padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#7c5a6a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Order Summary</p>
          {(orderData.items || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: PLUM, padding: '4px 0', borderBottom: i < (orderData.items?.length - 1) ? '1px solid #fdeef3' : 'none' }}>
              <span>{item.product_name || item.name || 'Gift Hamper'} ×{item.quantity}</span>
              <span style={{ fontWeight: 600 }}>₹{(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '2px solid #f3d0dd' }}>
            <span style={{ fontWeight: 700, color: PLUM }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: ROSE }}>₹{finalTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Coupon */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f3d0dd', padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#7c5a6a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>🏷️ Coupon / Gift Card</p>
          {appliedCode ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#D1FAE5', borderRadius: 10, padding: '10px 14px' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46', margin: 0 }}>✓ {appliedCode} applied</p>
                <p style={{ fontSize: 12, color: '#065F46', margin: '2px 0 0' }}>₹{discount} discount</p>
              </div>
              <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Remove</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Enter coupon or gift card code"
                value={coupon}
                onChange={e => setCoupon(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #f3d0dd', fontFamily: 'Jost, sans-serif', fontSize: 14, color: PLUM, background: BLUSH, outline: 'none' }}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                style={{ background: ROSE, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Jost, sans-serif', whiteSpace: 'nowrap' }}>
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f3d0dd', padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#7c5a6a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>💳 Payment Method</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {methods.map(m => (
              <motion.button
                key={m.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMethod(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                  border: method === m.id ? `2px solid ${ROSE}` : '2px solid #f3d0dd',
                  background: method === m.id ? '#FFF5F8' : '#fff',
                  transition: 'all 0.2s', textAlign: 'left', width: '100%',
                }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: method === m.id ? '#fdeef3' : '#f8f0f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {m.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: PLUM, margin: 0 }}>{m.label}</p>
                  <p style={{ fontSize: 12, color: '#7c5a6a', margin: '2px 0 0' }}>{m.sub}</p>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${method === m.id ? ROSE : '#f3d0dd'}`, background: method === m.id ? ROSE : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {method === m.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Pay Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePay}
          disabled={loading || !method}
          style={{
            width: '100%', padding: '16px', borderRadius: 50,
            background: !method ? '#c4849e' : loading ? '#c4849e' : `linear-gradient(135deg, ${PINK}, ${ROSE})`,
            color: '#fff', border: 'none', cursor: !method || loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Jost, sans-serif', fontSize: 17, fontWeight: 700,
            letterSpacing: '0.05em', boxShadow: !method ? 'none' : '0 8px 24px rgba(184,78,120,0.35)',
            transition: 'all 0.3s',
          }}>
          {loading ? '⏳ Processing...' :
           !method  ? 'Select a payment method' :
           method === 'cod' ? `📦 Place Order — ₹${finalTotal.toLocaleString('en-IN')} (COD)` :
           `🔒 Pay ₹${finalTotal.toLocaleString('en-IN')} via ${method === 'upi' ? 'UPI' : 'Card'}`}
        </motion.button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          <span style={{ fontSize: 11, color: '#a0728a' }}>🔒 Secure payments via Razorpay · Trusted by 10M+ Indians</span>
        </div>

        <button
          onClick={() => navigate('/checkout')}
          style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: '#a0728a', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
          ← Edit order details
        </button>
      </motion.div>
    </div>
  );
}
