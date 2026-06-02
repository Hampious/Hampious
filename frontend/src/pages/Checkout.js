import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { MapPin, Tag, Package, Loader2, User, CreditCard, Check, ShieldCheck, ArrowRight } from 'lucide-react';

const RAZORPAY_KEY_ID = 'rzp_live_SwaqpwcGpYEzEj';

// Pincode prefix → { state, city hint }
// First 3 digits of Indian pincode uniquely identify region
const PINCODE_MAP = {
  '110':'Delhi','111':'Delhi','112':'Delhi',
  '120':'Haryana','121':'Haryana','122':'Haryana','123':'Haryana','124':'Haryana','125':'Haryana','126':'Haryana','127':'Haryana','128':'Haryana','129':'Haryana','130':'Haryana','131':'Haryana','132':'Haryana','133':'Haryana','134':'Haryana','135':'Haryana','136':'Haryana',
  '140':'Punjab','141':'Punjab','142':'Punjab','143':'Punjab','144':'Punjab','145':'Punjab','146':'Punjab','147':'Punjab','148':'Punjab','149':'Punjab',
  '150':'Punjab','151':'Punjab','152':'Punjab','153':'Punjab','154':'Punjab','155':'Punjab','156':'Punjab','157':'Punjab','158':'Punjab',
  '160':'Punjab','161':'Punjab','162':'Punjab','163':'Punjab','164':'Punjab',
  '170':'Himachal Pradesh','171':'Himachal Pradesh','172':'Himachal Pradesh','173':'Himachal Pradesh','174':'Himachal Pradesh','175':'Himachal Pradesh','176':'Himachal Pradesh','177':'Himachal Pradesh',
  '180':'Jammu & Kashmir','181':'Jammu & Kashmir','182':'Jammu & Kashmir','183':'Jammu & Kashmir','184':'Jammu & Kashmir','185':'Jammu & Kashmir','186':'Jammu & Kashmir','187':'Jammu & Kashmir','188':'Jammu & Kashmir','189':'Jammu & Kashmir','190':'Jammu & Kashmir','191':'Jammu & Kashmir','192':'Jammu & Kashmir','193':'Jammu & Kashmir','194':'Jammu & Kashmir','195':'Jammu & Kashmir',
  '201':'Uttar Pradesh','202':'Uttar Pradesh','203':'Uttar Pradesh','204':'Uttar Pradesh','205':'Uttar Pradesh','206':'Uttar Pradesh','207':'Uttar Pradesh','208':'Uttar Pradesh','209':'Uttar Pradesh',
  '210':'Uttar Pradesh','211':'Uttar Pradesh','212':'Uttar Pradesh','213':'Uttar Pradesh','214':'Uttar Pradesh','215':'Uttar Pradesh','216':'Uttar Pradesh','217':'Uttar Pradesh','218':'Uttar Pradesh','219':'Uttar Pradesh',
  '220':'Uttar Pradesh','221':'Uttar Pradesh','222':'Uttar Pradesh','223':'Uttar Pradesh','224':'Uttar Pradesh','225':'Uttar Pradesh','226':'Uttar Pradesh','227':'Uttar Pradesh','228':'Uttar Pradesh','229':'Uttar Pradesh',
  '230':'Uttar Pradesh','231':'Uttar Pradesh','232':'Uttar Pradesh','233':'Uttar Pradesh','234':'Uttar Pradesh','235':'Uttar Pradesh','236':'Uttar Pradesh','237':'Uttar Pradesh','238':'Uttar Pradesh','239':'Uttar Pradesh',
  '240':'Uttar Pradesh','241':'Uttar Pradesh','242':'Uttar Pradesh','243':'Uttar Pradesh','244':'Uttar Pradesh','245':'Uttar Pradesh','246':'Uttar Pradesh','247':'Uttar Pradesh','248':'Uttarakhand','249':'Uttarakhand',
  '250':'Uttar Pradesh','251':'Uttar Pradesh','261':'Uttar Pradesh','262':'Uttar Pradesh','263':'Uttarakhand','264':'Uttarakhand','265':'Uttarakhand',
  '271':'Uttar Pradesh','272':'Uttar Pradesh','273':'Uttar Pradesh','274':'Uttar Pradesh','275':'Uttar Pradesh','276':'Uttar Pradesh','277':'Uttar Pradesh','278':'Uttar Pradesh','281':'Uttar Pradesh','282':'Uttar Pradesh','283':'Uttar Pradesh','284':'Uttar Pradesh','285':'Uttar Pradesh',
  '301':'Rajasthan','302':'Rajasthan','303':'Rajasthan','304':'Rajasthan','305':'Rajasthan','306':'Rajasthan','307':'Rajasthan','308':'Rajasthan','309':'Rajasthan',
  '311':'Rajasthan','312':'Rajasthan','313':'Rajasthan','314':'Rajasthan','321':'Rajasthan','322':'Rajasthan','323':'Rajasthan','324':'Rajasthan','325':'Rajasthan','326':'Rajasthan','327':'Rajasthan','328':'Rajasthan','329':'Rajasthan',
  '331':'Rajasthan','332':'Rajasthan','333':'Rajasthan','334':'Rajasthan','335':'Rajasthan','341':'Rajasthan','342':'Rajasthan','343':'Rajasthan','344':'Rajasthan','345':'Rajasthan',
  '360':'Gujarat','361':'Gujarat','362':'Gujarat','363':'Gujarat','364':'Gujarat','365':'Gujarat','366':'Gujarat','367':'Gujarat','368':'Gujarat','369':'Gujarat',
  '370':'Gujarat','371':'Gujarat','372':'Gujarat','373':'Gujarat','374':'Gujarat','375':'Gujarat','376':'Gujarat','377':'Gujarat',
  '380':'Gujarat','381':'Gujarat','382':'Gujarat','383':'Gujarat','384':'Gujarat','385':'Gujarat','386':'Gujarat','387':'Gujarat','388':'Gujarat','389':'Gujarat','390':'Gujarat','391':'Gujarat','392':'Gujarat','393':'Gujarat','394':'Gujarat','395':'Gujarat','396':'Gujarat',
  '400':'Maharashtra','401':'Maharashtra','402':'Maharashtra','403':'Goa','404':'Maharashtra','405':'Maharashtra','406':'Maharashtra','407':'Maharashtra','408':'Maharashtra','409':'Maharashtra',
  '410':'Maharashtra','411':'Maharashtra','412':'Maharashtra','413':'Maharashtra','414':'Maharashtra','415':'Maharashtra','416':'Maharashtra','417':'Maharashtra','418':'Maharashtra','419':'Maharashtra',
  '421':'Maharashtra','422':'Maharashtra','423':'Maharashtra','424':'Maharashtra','425':'Maharashtra','426':'Maharashtra','427':'Maharashtra','431':'Maharashtra','432':'Maharashtra','433':'Maharashtra','434':'Maharashtra','440':'Maharashtra','441':'Maharashtra','442':'Maharashtra','443':'Maharashtra','444':'Maharashtra','445':'Maharashtra',
  '450':'Madhya Pradesh','451':'Madhya Pradesh','452':'Madhya Pradesh','453':'Madhya Pradesh','454':'Madhya Pradesh','455':'Madhya Pradesh','456':'Madhya Pradesh','457':'Madhya Pradesh','458':'Madhya Pradesh','460':'Madhya Pradesh','461':'Madhya Pradesh','462':'Madhya Pradesh','463':'Madhya Pradesh','464':'Madhya Pradesh','465':'Madhya Pradesh','466':'Madhya Pradesh','467':'Madhya Pradesh','468':'Madhya Pradesh','469':'Madhya Pradesh','470':'Madhya Pradesh','471':'Madhya Pradesh','472':'Madhya Pradesh','473':'Madhya Pradesh','474':'Madhya Pradesh','475':'Madhya Pradesh','476':'Madhya Pradesh','477':'Madhya Pradesh','478':'Madhya Pradesh','480':'Madhya Pradesh','481':'Madhya Pradesh','482':'Madhya Pradesh','483':'Madhya Pradesh','484':'Madhya Pradesh','485':'Madhya Pradesh','486':'Madhya Pradesh','487':'Madhya Pradesh','488':'Madhya Pradesh','489':'Madhya Pradesh','490':'Chhattisgarh','491':'Chhattisgarh','492':'Chhattisgarh','493':'Chhattisgarh','494':'Chhattisgarh','495':'Chhattisgarh','496':'Chhattisgarh','497':'Chhattisgarh',
  '500':'Telangana','501':'Telangana','502':'Telangana','503':'Telangana','504':'Telangana','505':'Telangana','506':'Telangana','507':'Telangana','508':'Telangana','509':'Telangana',
  '515':'Andhra Pradesh','516':'Andhra Pradesh','517':'Andhra Pradesh','518':'Andhra Pradesh','519':'Andhra Pradesh','520':'Andhra Pradesh','521':'Andhra Pradesh','522':'Andhra Pradesh','523':'Andhra Pradesh','524':'Andhra Pradesh','525':'Andhra Pradesh','526':'Andhra Pradesh','527':'Andhra Pradesh','528':'Andhra Pradesh','530':'Andhra Pradesh','531':'Andhra Pradesh','532':'Andhra Pradesh','533':'Andhra Pradesh','534':'Andhra Pradesh','535':'Andhra Pradesh',
  '560':'Karnataka','561':'Karnataka','562':'Karnataka','563':'Karnataka','564':'Karnataka','565':'Karnataka','566':'Karnataka','567':'Karnataka','568':'Karnataka','569':'Karnataka',
  '570':'Karnataka','571':'Karnataka','572':'Karnataka','573':'Karnataka','574':'Karnataka','575':'Karnataka','576':'Karnataka','577':'Karnataka','578':'Karnataka','579':'Karnataka',
  '580':'Karnataka','581':'Karnataka','582':'Karnataka','583':'Karnataka','584':'Karnataka','585':'Karnataka','586':'Karnataka','587':'Karnataka',
  '600':'Tamil Nadu','601':'Tamil Nadu','602':'Tamil Nadu','603':'Tamil Nadu','604':'Tamil Nadu','605':'Tamil Nadu','606':'Tamil Nadu','607':'Tamil Nadu','608':'Tamil Nadu','609':'Tamil Nadu',
  '610':'Tamil Nadu','611':'Tamil Nadu','612':'Tamil Nadu','613':'Tamil Nadu','614':'Tamil Nadu','615':'Tamil Nadu','616':'Tamil Nadu','617':'Tamil Nadu','618':'Tamil Nadu','619':'Tamil Nadu',
  '620':'Tamil Nadu','621':'Tamil Nadu','622':'Tamil Nadu','623':'Tamil Nadu','624':'Tamil Nadu','625':'Tamil Nadu','626':'Tamil Nadu','627':'Tamil Nadu','628':'Tamil Nadu','629':'Tamil Nadu',
  '630':'Tamil Nadu','631':'Tamil Nadu','632':'Tamil Nadu','633':'Tamil Nadu','634':'Tamil Nadu','635':'Tamil Nadu','636':'Tamil Nadu','637':'Tamil Nadu','638':'Tamil Nadu','639':'Tamil Nadu',
  '641':'Tamil Nadu','642':'Tamil Nadu','643':'Tamil Nadu','644':'Tamil Nadu','645':'Tamil Nadu','646':'Tamil Nadu',
  '670':'Kerala','671':'Kerala','672':'Kerala','673':'Kerala','674':'Kerala','675':'Kerala','676':'Kerala','677':'Kerala','678':'Kerala','679':'Kerala','680':'Kerala','681':'Kerala','682':'Kerala','683':'Kerala','684':'Kerala','685':'Kerala','686':'Kerala','687':'Kerala','688':'Kerala','689':'Kerala','690':'Kerala','691':'Kerala','692':'Kerala','695':'Kerala',
  '700':'West Bengal','701':'West Bengal','702':'West Bengal','703':'West Bengal','704':'West Bengal','705':'West Bengal','706':'West Bengal','707':'West Bengal','708':'West Bengal','711':'West Bengal','712':'West Bengal','713':'West Bengal','714':'West Bengal','721':'West Bengal','722':'West Bengal','723':'West Bengal','731':'West Bengal','732':'West Bengal','733':'West Bengal','734':'West Bengal','735':'West Bengal','736':'West Bengal','737':'Sikkim',
  '751':'Odisha','752':'Odisha','753':'Odisha','754':'Odisha','755':'Odisha','756':'Odisha','757':'Odisha','758':'Odisha','759':'Odisha','760':'Odisha','761':'Odisha','762':'Odisha','763':'Odisha','764':'Odisha','765':'Odisha','766':'Odisha','767':'Odisha','768':'Odisha','769':'Odisha','770':'Odisha','771':'Odisha',
  '781':'Assam','782':'Assam','783':'Assam','784':'Assam','785':'Assam','786':'Assam','787':'Assam','788':'Assam',
  '790':'Arunachal Pradesh','791':'Arunachal Pradesh','792':'Arunachal Pradesh',
  '793':'Meghalaya','794':'Meghalaya','795':'Manipur','796':'Mizoram','797':'Nagaland','798':'Nagaland',
  '800':'Bihar','801':'Bihar','802':'Bihar','803':'Bihar','804':'Bihar','805':'Bihar','806':'Bihar','811':'Bihar','812':'Bihar','813':'Bihar','814':'Bihar','815':'Bihar','816':'Bihar','821':'Bihar','822':'Bihar','823':'Bihar','824':'Bihar','825':'Jharkhand','826':'Jharkhand','827':'Jharkhand','828':'Jharkhand','829':'Jharkhand','830':'Jharkhand','831':'Jharkhand','832':'Jharkhand','833':'Jharkhand','834':'Jharkhand','835':'Jharkhand',
  '841':'Bihar','842':'Bihar','843':'Bihar','844':'Bihar','845':'Bihar','846':'Bihar','847':'Bihar','848':'Bihar','851':'Bihar','852':'Bihar','853':'Bihar','854':'Bihar','855':'Bihar',
  '560001': { state: 'Karnataka', city: 'Bangalore' },
  '400001': { state: 'Maharashtra', city: 'Mumbai' },
  '110001': { state: 'Delhi', city: 'New Delhi' },
  '600001': { state: 'Tamil Nadu', city: 'Chennai' },
  '700001': { state: 'West Bengal', city: 'Kolkata' },
  '500001': { state: 'Telangana', city: 'Hyderabad' },
  '411001': { state: 'Maharashtra', city: 'Pune' },
  '380001': { state: 'Gujarat', city: 'Ahmedabad' },
  '302001': { state: 'Rajasthan', city: 'Jaipur' },
  '226001': { state: 'Uttar Pradesh', city: 'Lucknow' },
  '208001': { state: 'Uttar Pradesh', city: 'Kanpur' },
  '440001': { state: 'Maharashtra', city: 'Nagpur' },
  '682001': { state: 'Kerala', city: 'Kochi' },
  '695001': { state: 'Kerala', city: 'Thiruvananthapuram' },
  '641001': { state: 'Tamil Nadu', city: 'Coimbatore' },
  '530001': { state: 'Andhra Pradesh', city: 'Visakhapatnam' },
  '248001': { state: 'Uttarakhand', city: 'Dehradun' },
  '462001': { state: 'Madhya Pradesh', city: 'Bhopal' },
  '452001': { state: 'Madhya Pradesh', city: 'Indore' },
  '474001': { state: 'Madhya Pradesh', city: 'Gwalior' },
  '492001': { state: 'Chhattisgarh', city: 'Raipur' },
  '751001': { state: 'Odisha', city: 'Bhubaneswar' },
  '781001': { state: 'Assam', city: 'Guwahati' },
  '800001': { state: 'Bihar', city: 'Patna' },
  '834001': { state: 'Jharkhand', city: 'Ranchi' },
  '160017': { state: 'Punjab', city: 'Chandigarh' },
  '122001': { state: 'Haryana', city: 'Gurugram' },
  '201301': { state: 'Uttar Pradesh', city: 'Noida' },
};

function lookupPincode(pincode) {
  // Try exact 6-digit match first
  if (PINCODE_MAP[pincode] && typeof PINCODE_MAP[pincode] === 'object') {
    return PINCODE_MAP[pincode];
  }
  // Try 3-digit prefix for state
  const prefix3 = pincode.slice(0, 3);
  const state = PINCODE_MAP[prefix3];
  if (state && typeof state === 'string') {
    return { state, city: '' };
  }
  return null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.19, 1, 0.22, 1] }
  }
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState({});
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  
  const [customerDetails, setCustomerDetails] = useState({
    fullName: user?.name || (user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : ''),
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    pincode: '',
    city: '',
    state: '',
    country: 'India'
  });

  useEffect(() => {
    if (cart.items.length === 0) {
      navigate('/cart');
      return;
    }
    fetchProductDetails();
  }, [cart]);

  const fetchProductDetails = async () => {
    try {
      const productIds = cart.items.map(item => item.product_id);
      
      const productPromises = productIds.map(id => 
        API.get(`/products/${id}`).catch(() => null)
      );
      
      const responses = await Promise.all(productPromises);
      
      const productsMap = {};
      responses.forEach(response => {
        if (response?.data) {
          productsMap[response.data.id] = response.data;
        }
      });
      setProducts(productsMap);
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    }
  };

  const handlePincodeChange = async (pincode) => {
    setShippingInfo(prev => ({ ...prev, pincode }));

    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      setPincodeLoading(true);

      // ── Step 1: instant local lookup (no network) ──────────────────────────
      const local = lookupPincode(pincode);
      if (local) {
        setShippingInfo(prev => ({
          ...prev,
          pincode,
          city:    local.city  || prev.city,
          state:   local.state || prev.state,
          country: 'India',
        }));
        if (local.city) {
          toast.success(`📍 ${local.city}, ${local.state}`);
          setPincodeLoading(false);
          // Try backend in background to get more specific city name
          try {
            const res = await API.get(`/pincode/${pincode}`);
            if (res.data?.success && res.data.city) {
              setShippingInfo(prev => ({
                ...prev,
                city:  res.data.city  || prev.city,
                state: res.data.state || prev.state,
              }));
            }
          } catch {}
          return;
        }
        // State found but no city — show state, still try backend for city
        toast.success(`📍 ${local.state} — please enter your city`);
      }

      // ── Step 2: try backend proxy (gets exact city name) ───────────────────
      try {
        const res = await API.get(`/pincode/${pincode}`);
        if (res.data?.success) {
          setShippingInfo(prev => ({
            ...prev,
            pincode,
            city:    res.data.city    || prev.city,
            state:   res.data.state   || prev.state,
            country: 'India',
          }));
          toast.success(`📍 ${res.data.city}, ${res.data.state}`);
        } else if (!local) {
          toast.error('Pincode not found. Please enter city & state manually.');
        }
      } catch {
        if (!local) {
          toast.error('Could not auto-detect location. Please enter manually.');
        }
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    try {
      const response = await API.get(`/coupons/validate/${couponCode}?amount=${getCartTotal()}`);
      setDiscount(response.data.discount);
      setAppliedCoupon(response.data.coupon);
      toast.success('Coupon applied successfully!');
    } catch (error) {
      // Safe error handling for React
      const msg = typeof error.response?.data?.detail === 'string' 
        ? error.response?.data?.detail 
        : (error.response?.data?.message || 'Invalid coupon code');
      toast.error(msg);
      
      setDiscount(0);
      setAppliedCoupon(null);
    }
  };

  const validateForm = () => {
    if (!customerDetails.fullName.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!customerDetails.email.trim() || !/\S+@\S+\.\S+/.test(customerDetails.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!customerDetails.phone.trim() || customerDetails.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return false;
    }
    if (!shippingInfo.address.trim()) {
      toast.error('Please enter your address');
      return false;
    }
    if (!shippingInfo.pincode.trim() || shippingInfo.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }
    if (!shippingInfo.city.trim() || !shippingInfo.state.trim()) {
      toast.error('Please enter city and state');
      return false;
    }
    return true;
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ── helper: save order locally + navigate to success ─────────────────────
  const completeOrder = async (paymentId = 'mock') => {
    const finalAmount = getCartTotal() - discount;
    const orderItems = cart.items.map(item => ({
      product_id:   item.product_id,
      product_name: products[item.product_id]?.name || 'Product',
      quantity:     item.quantity,
      price:        item.price,
    }));
    const shippingAddress = {
      ...shippingInfo,
      full_name: customerDetails.fullName,
      phone:     customerDetails.phone,
      email:     customerDetails.email,
    };

    // Try backend order creation; always also save to localStorage for admin
    let orderId = `ORD-${Date.now()}`;
    const orderPayload = {
      customer_name:    customerDetails.fullName,
      customer_email:   customerDetails.email,
      customer_phone:   customerDetails.phone,
      items:            orderItems,
      total_amount:     getCartTotal(),
      discount_amount:  discount,
      final_amount:     finalAmount,
      total:            finalAmount,
      shipping_address: shippingAddress,
      payment_method:   'razorpay',
      payment_id:       paymentId,
      payment_status:   'paid',
      status:           'pending',
      coupon_code:      appliedCoupon?.code || null,
      created_at:       new Date().toISOString(),
    };

    try {
      const res = await API.post('/orders/create', orderPayload);
      if (res.data?.id) orderId = res.data.id;
    } catch {}

    // Always save to localStorage so admin Orders tab shows it
    const localOrders = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
    const existingIdx = localOrders.findIndex(o => String(o.id) === String(orderId));
    const newOrder = { ...orderPayload, id: orderId };
    if (existingIdx >= 0) localOrders[existingIdx] = newOrder;
    else localOrders.push(newOrder);
    localStorage.setItem('hamp_orders', JSON.stringify(localOrders));

    await clearCart();
    toast.success('🎉 Order placed successfully!');
    navigate(`/order-success?order_id=${orderId}`);
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    setLoading(true);

    const finalAmount = getCartTotal() - discount;

    // ── Step 1: Try to load Razorpay ───────────────────────────────────────
    const scriptLoaded = await loadRazorpayScript();

    // ── Step 2: Create Razorpay order from backend ────────────────────────
    if (!scriptLoaded) {
      toast.error('Payment gateway failed to load. Please refresh and try again.');
      setLoading(false);
      return;
    }

    let razorpayOrder = null;
    try {
      const res = await API.post('/payment/create-razorpay-order', { amount: finalAmount });
      if (res.data?.id) {
        razorpayOrder = res.data;
      } else {
        throw new Error('Invalid order response');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Could not create payment order';
      toast.error(`Payment error: ${msg}`);
      setLoading(false);
      return;
    }

    // ── Step 3a: Real Razorpay flow ────────────────────────────────────────
    if (scriptLoaded && razorpayOrder) {
      const options = {
        key:         RAZORPAY_KEY_ID,
        amount:      razorpayOrder.amount,
        currency:    'INR',
        order_id:    razorpayOrder.id,
        name:        'Hampious',
        description: 'Premium Gift Hamper',
        image:       `${window.location.origin}/logo.jpg`,
        prefill: {
          name:    customerDetails.fullName,
          email:   customerDetails.email,
          contact: customerDetails.phone.replace(/\D/g, '').slice(-10),
        },
        notes: {
          address:  shippingInfo.address,
          order_id: razorpayOrder.id,
        },
        theme: { color: '#D4789A' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error('Payment cancelled. Your order was not placed.');
          },
          animation: true,
        },
        handler: async (response) => {
          try {
            // Verify signature on backend first
            const verifyRes = await API.post('/payment/verify', {
              payment_id:        response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              signature:         response.razorpay_signature,
            });

            if (!verifyRes.data?.verified) {
              toast.error('Payment verification failed. Contact support with Payment ID: ' + response.razorpay_payment_id);
              setLoading(false);
              return;
            }

            await completeOrder(response.razorpay_payment_id);
          } catch (err) {
            console.error('Payment handler error:', err);
            setLoading(false);
            // Payment went through but order creation failed — still show payment ID
            toast.error(`Payment received (${response.razorpay_payment_id}) but order creation failed. Please contact support.`);
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
      return; // wait for handler callback
    }

    // Should never reach here with live keys
    toast.error('Payment could not be initiated. Please try again.');
    setLoading(false);
  };

  const finalAmount = getCartTotal() - discount;

  return (
    <div className="min-h-screen bg-background py-10 md:py-16 px-6 md:px-12 lg:px-24" data-testid="checkout-page">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-10">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your order details below</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section - Customer & Shipping Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details */}
            <motion.div variants={itemVariants} className="checkout-card">
              <div className="flex items-center gap-4 mb-6">
                <div className="checkout-step-indicator">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-foreground">Customer Details</h2>
                  <p className="text-sm text-muted-foreground">Your contact information</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div>
                  <Label htmlFor="fullName" className="text-sm font-medium text-foreground">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={customerDetails.fullName}
                    onChange={(e) => setCustomerDetails({...customerDetails, fullName: e.target.value})}
                    className="mt-2 input-premium"
                    data-testid="fullname-input"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                      className="mt-2 input-premium"
                      data-testid="email-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                      className="mt-2 input-premium"
                      data-testid="phone-input"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Shipping Address */}
            <motion.div variants={itemVariants} className="checkout-card">
              <div className="flex items-center gap-4 mb-6">
                <div className="checkout-step-indicator">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-foreground">Shipping Address</h2>
                  <p className="text-sm text-muted-foreground">Where should we deliver?</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-foreground">Address Line *</Label>
                  <Input
                    id="address"
                    placeholder="House No., Street, Area"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                    className="mt-2 input-premium"
                    data-testid="address-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="pincode" className="text-sm font-medium text-foreground flex items-center gap-2">
                      Pincode *
                      {pincodeLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    </Label>
                    <Input
                      id="pincode"
                      placeholder="123456"
                      maxLength={6}
                      value={shippingInfo.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      className="mt-2 input-premium"
                      data-testid="pincode-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-foreground">City *</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                      className="mt-2 input-premium"
                      data-testid="city-input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium text-foreground">State *</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                      className="mt-2 input-premium"
                      data-testid="state-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" className="text-sm font-medium text-foreground">Country *</Label>
                    <Input
                      id="country"
                      value={shippingInfo.country}
                      onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                      className="mt-2 input-premium"
                      data-testid="country-input"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Section - Order Summary */}
          <div className="lg:col-span-1">
            <motion.div variants={itemVariants} className="checkout-card sticky top-24" data-testid="order-summary">
              <h2 className="font-heading text-xl font-semibold mb-6 text-foreground">Order Summary</h2>
              
              {/* Products List */}
              <div className="space-y-4 mb-6 pb-6 border-b border-border">
                {cart.items.map((item) => {
                  const product = products[item.product_id];
                  if (!product) return null;
                  return (
                    <motion.div 
                      key={item.product_id} 
                      className="flex gap-4"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                        <img
                          src={product.images?.[0] || product.image_url || ''}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-foreground mt-1">₹{(item.price * item.quantity).toFixed(0)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Coupon Code */}
              <div className="mb-6 pb-6 border-b border-border">
                <Label className="text-sm font-medium flex items-center gap-2 mb-3 text-foreground">
                  <Tag className="h-4 w-4 text-primary" />
                  Apply Coupon
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="h-11 rounded-xl text-sm"
                    data-testid="coupon-input"
                    disabled={!!appliedCoupon}
                  />
                  {appliedCoupon ? (
                    <Button 
                      onClick={() => {
                        setAppliedCoupon(null);
                        setDiscount(0);
                        setCouponCode('');
                      }}
                      variant="outline" 
                      className="rounded-xl px-4 h-11"
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleApplyCoupon} 
                      variant="outline" 
                      className="rounded-xl px-4 h-11"
                      data-testid="apply-coupon-btn"
                    >
                      Apply
                    </Button>
                  )}
                </div>
                {appliedCoupon && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-emerald-600 mt-2 flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Coupon "{appliedCoupon.code}" applied
                  </motion.p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">₹{getCartTotal().toFixed(0)}</span>
                </div>
                {discount > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-between text-sm text-emerald-600"
                  >
                    <span>Discount</span>
                    <span className="font-medium">-₹{discount.toFixed(0)}</span>
                  </motion.div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-emerald-600">FREE</span>
                </div>
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Total Payable</span>
                    <span className="font-bold text-xl text-primary" data-testid="total-amount">₹{finalAmount.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full button-premium bg-primary hover:bg-primary/90 h-14 rounded-full text-base font-semibold"
                  data-testid="place-order-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay ₹{finalAmount.toFixed(0)}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Secure payment via Razorpay</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}