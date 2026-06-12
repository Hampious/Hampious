import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import { Award, Truck, Sparkles, ChevronDown, ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Star } from 'lucide-react';
import { toast } from 'sonner';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────────── */
const BLUSH   = '#FFF5F8';
const PLUM    = '#1A0F15';
const PINK    = '#D4789A';
const ROSE    = '#B84E78';

const heroSlides = [
  {
    id: 1,
    title: 'Period Care', subtitle: 'Hamper',
    tag: 'Wellness & Comfort',
    description: 'Pampered wellness essentials curated with love. Premium comfort products for her wellbeing.',
    bg: '/periods.png',
    cta: 'Explore Hamper', category: 'period',
    textSide: 'right',
  },
  {
    id: 2,
    title: 'I Love You', subtitle: 'Hamper',
    tag: 'Love Expressed Beautifully',
    description: 'Express your deepest feelings through thoughtfully curated gifts — premium hampers filled with elegance.',
    bg: '/iloveyou.png',
    cta: 'Explore Hamper', category: 'love',
    textSide: 'right',
  },
  {
    id: 3,
    title: 'Birthday', subtitle: 'Hamper',
    tag: 'Celebrate Her Uniqueness',
    description: 'Celebrate another year of memories. Luxury gifts curated to make birthdays truly unforgettable.',
    bg: '/birthday.png',
    cta: 'Explore Hamper', category: 'birthday',
    textSide: 'right',
  },
  {
    id: 4,
    title: 'Sorry', subtitle: 'Hamper',
    tag: 'Reconciliation with Sincerity',
    description: 'Sometimes actions speak louder than words. Premium hampers designed to mend bonds with grace.',
    bg: '/sorry.png',
    cta: 'Explore Hamper', category: 'sorry',
    textSide: 'right',
  },
];

const occasions = [
  { emoji: '🎂', name: 'Birthday',    sub: 'Celebrate her day',       category: 'birthday', grad: 'linear-gradient(135deg, #FFE0EC 0%, #FCCDE0 100%)', border: 'rgba(212,120,154,0.3)'  },
  { emoji: '❤️', name: 'I Love You',  sub: 'Express your heart',      category: 'love',     grad: 'linear-gradient(135deg, #FFD6E7 0%, #FFA8CC 100%)', border: 'rgba(184,78,120,0.35)' },
  { emoji: '🌸', name: 'Period Care', sub: 'Comfort & wellness',       category: 'period',   grad: 'linear-gradient(135deg, #FFE8F0 0%, #FECFE3 100%)', border: 'rgba(212,120,154,0.25)' },
  { emoji: '💝', name: 'Sorry',       sub: 'Mend bonds with grace',    category: 'sorry',    grad: 'linear-gradient(135deg, #FFDDE8 0%, #FFBAD4 100%)', border: 'rgba(184,78,120,0.3)'  },
];

const valueProps = [
  { Icon: Award,    title: 'Premium Selection', desc: 'Hand-picked luxury items curated for unforgettable moments'        },
  { Icon: Truck,    title: 'Express Delivery',  desc: 'Swift delivery with care — COD available across India'             },
  { Icon: Sparkles, title: 'Crafted with Love', desc: 'Every hamper assembled with attention to detail and genuine care'  },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 1.6, ease: [0.19, 1, 0.22, 1] } },
};
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.22, delayChildren: 0.2 } },
};

/* ── Top Selling Products Section ─────────────────────────────────────────── */
function TopRatedSection({ navigate }) {
  const { addToCart } = useCart();
  const { user }      = useAuth();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r    = await API.get('/products');
        const all  = Array.isArray(r.data) ? r.data : [];
        // Top rated = featured OR highest stock → take first 4
        const top  = all.filter(p => p.stock > 0).slice(0, 4);
        setProducts(top.length ? top : all.slice(0, 4));
      } catch {
        // Fallback: localStorage products
        const local = JSON.parse(localStorage.getItem('hamp_products') || '[]');
        setProducts(local.filter(p => Number(p.stock || 0) > 0).slice(0, 4));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    if (!user) { toast.error('Please sign in to add items to cart'); navigate('/auth'); return; }
    if (!product || (product.stock != null && Number(product.stock) <= 0)) { toast.error('Out of stock'); return; }
    try {
      await addToCart(product.id, 1, product.discount_price || product.price);
      toast.success('Added to cart!');
    } catch { toast.error('Failed to add to cart'); }
  };

  const handleBuyNow = async (e, product) => {
    e.stopPropagation();
    if (!user) { toast.error('Please sign in to continue'); navigate('/auth'); return; }
    if (!product || (product.stock != null && Number(product.stock) <= 0)) { toast.error('Out of stock'); return; }
    try {
      await addToCart(product.id, 1, product.discount_price || product.price);
      navigate('/checkout');
    } catch { toast.error('Failed to proceed'); }
  };

  if (loading) return null;
  if (!products.length) return null;

  return (
    <section style={{ background: '#fff', padding: 'clamp(2.5rem, 8vw, 5rem) clamp(1rem, 4vw, 1.5rem)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ marginBottom: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 500, color: PLUM, margin: '8px 0 0', lineHeight: 1.05 }}>
              Best Sellers
            </h2>
          </div>
          <button onClick={() => navigate('/products')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1.5px solid ${PINK}`, borderRadius: 50, padding: '10px 22px', cursor: 'pointer', color: ROSE, fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' }}>
            View All <ArrowRight size={14} />
          </button>
        </motion.div>

        {/* Products Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="sm:grid-cols-2 lg:!grid-cols-4">
          {products.map((product, i) => {
            const image    = product.images?.[0] || product.image_url || null;
            const price    = Number(product.discount_price || product.price || 0);
            const original = Number(product.original_price || 0);
            const hasDisc  = original > price && price > 0;
            const pct      = hasDisc ? Math.round((original - price) / original * 100) : 0;
            const stock    = Number(product.stock || 0);
            const isOut    = stock === 0;

            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.6 }}
                onClick={() => navigate(`/products/${product.id}`)}
                style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(212,120,154,0.15)', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 16px rgba(26,15,21,0.06)', transition: 'all 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(184,78,120,0.18)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 16px rgba(26,15,21,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Image */}
                <div style={{ position: 'relative', aspectRatio: '1', background: '#FCEAF1', overflow: 'hidden' }}>
                  {image ? (
                    <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>🎁</div>
                  )}
                  {/* Badges */}
                  {hasDisc && !isOut && (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: ROSE, color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                      -{pct}%
                    </div>
                  )}
                  {isOut && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,245,248,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, color: 'rgba(26,15,21,0.5)', border: '1px solid rgba(212,120,154,0.25)', padding: '4px 12px', borderRadius: 4, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Out of Stock</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '18px 18px 20px' }}>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 600, color: PLUM, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.name}
                  </p>
                  {product.description && (
                    <p style={{ fontSize: 12, color: '#a0728a', margin: '0 0 10px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {product.description}
                    </p>
                  )}
                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: ROSE, fontFamily: 'Jost, sans-serif' }}>₹{price.toLocaleString('en-IN')}</span>
                    {hasDisc && <span style={{ fontSize: 13, color: '#a0728a', textDecoration: 'line-through', fontFamily: 'Jost, sans-serif' }}>₹{original.toLocaleString('en-IN')}</span>}
                  </div>
                  {/* Buttons */}
                  {!isOut ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={e => handleAddToCart(e, product)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#FFF5F8', color: ROSE, border: `1.5px solid ${PINK}`, borderRadius: 10, padding: '10px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Jost, sans-serif', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = PINK; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#FFF5F8'; e.currentTarget.style.color = ROSE; }}>
                        <ShoppingCart size={13} /> Add to Cart
                      </button>
                      <button onClick={e => handleBuyNow(e, product)}
                        style={{ flex: 1, background: ROSE, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Jost, sans-serif', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#9b3d63'}
                        onMouseLeave={e => e.currentTarget.style.background = ROSE}>
                        Buy Now
                      </button>
                    </div>
                  ) : (
                    <button disabled style={{ width: '100%', background: '#f3f4f6', color: '#9ca3af', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 600, cursor: 'not-allowed', fontFamily: 'Jost, sans-serif' }}>
                      Out of Stock
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories]             = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured]   = useState(true);
  const [currentSlide, setCurrentSlide]         = useState(0);
  const [isMobile, setIsMobile]                 = useState(window.innerWidth < 768);
  const [imagesLoaded, setImagesLoaded]         = useState({});

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentSlide(p => (p + 1) % heroSlides.length), 5500);
    return () => clearInterval(t);
  }, []);

  // Preload all hero images eagerly and track when they're ready
  useEffect(() => {
    heroSlides.forEach((slide, idx) => {
      const img = new Image();
      img.onload = () => setImagesLoaded(prev => ({ ...prev, [idx]: true }));
      img.src = slide.bg;
    });
  }, []);
  const nextSlide = useCallback(() => setCurrentSlide(p => (p + 1) % heroSlides.length), []);
  const prevSlide = useCallback(() => setCurrentSlide(p => (p - 1 + heroSlides.length) % heroSlides.length), []);

  useEffect(() => { fetchCategories(); fetchFeaturedProducts(); }, []);

  const fetchCategories = async () => {
    try { const r = await API.get('/categories'); setCategories(Array.isArray(r.data) ? r.data : []); }
    catch { setCategories([]); }
  };

  const fetchFeaturedProducts = async () => {
    setLoadingFeatured(true);
    try {
      const r = await API.get('/products');
      const all = Array.isArray(r.data) ? r.data : [];
      // Cache all products so Collection page works instantly for new users
      if (all.length > 0) {
        try { localStorage.setItem('hamp_products', JSON.stringify(all)); } catch {}
      }
      setFeaturedProducts(all.filter(p => p.is_active !== false && p.featured === true).slice(0, 6));
    } catch { setFeaturedProducts([]); }
    finally  { setLoadingFeatured(false); }
  };

  const handleOccasionClick = (keyword) => {
    // First try to find category by ID from loaded categories
    const cat = categories.find(c =>
      c.name.toLowerCase().includes(keyword.toLowerCase()) ||
      c.slug?.toLowerCase().includes(keyword.toLowerCase())
    );
    if (cat) navigate(`/products?category=${cat.id}`);
    else navigate(`/products?category=${keyword}`); // fallback to slug
  };

  return (
    <div style={{ background: BLUSH, minHeight: '100vh', overflow: 'hidden' }}>
      <div className="grain-overlay" />

      {/* ══════════════════════════════════════════════════════
          1 — HERO SLIDER
          ══════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ height: isMobile ? 'auto' : 'min(92vh, 100svh)' }}
        data-testid="hero-slider"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className={isMobile ? 'relative w-full' : 'absolute inset-0'}
          >
            {/* Mobile: real <img> tag so full image always shows */}
            {isMobile ? (
              <div style={{ position: 'relative', width: '100%', backgroundColor: '#FCEAF1' }}>
                <img
                  src={heroSlides[currentSlide].bg}
                  alt={heroSlides[currentSlide].title}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            ) : (
              /* Desktop: background-image with cover */
              <div className="absolute inset-0 bg-no-repeat"
                   style={{
                     backgroundImage: imagesLoaded[currentSlide] ? `url(${heroSlides[currentSlide].bg})` : 'none',
                     backgroundSize: 'cover',
                     backgroundPosition: 'center top',
                     backgroundColor: '#FCEAF1',
                     transition: 'background-image 0.3s',
                   }} />
            )}
            {/* Gradients — desktop only, the img tag on mobile doesn't need overlays */}
            {!isMobile && (
              <>
                <div className="absolute inset-0" style={{
                  background: heroSlides[currentSlide].textSide === 'right'
                    ? 'linear-gradient(to left, rgba(10,5,8,0.75) 0%, rgba(10,5,8,0.45) 40%, rgba(10,5,8,0.05) 70%)'
                    : 'linear-gradient(110deg, rgba(26,15,21,0.68) 0%, rgba(26,15,21,0.32) 55%, rgba(26,15,21,0.02) 100%)'
                }} />
                <div className="absolute bottom-0 left-0 right-0 h-28"
                     style={{ background: `linear-gradient(to top, ${BLUSH}, transparent)` }} />
              </>
            )}

            {/* Poster slides: title badge top-right */}
            {heroSlides[currentSlide].textSide === 'right' && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 1.4, ease: [0.19, 1, 0.22, 1] }}
                className="absolute top-10 right-6 z-10 text-right hidden md:block"
              >
                <span style={{
                  display: 'inline-block',
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: PINK,
                  fontFamily: 'Jost, sans-serif',
                  background: 'rgba(255,245,248,0.12)',
                  backdropFilter: 'blur(6px)',
                  padding: '4px 14px', borderRadius: '2px',
                  border: '1px solid rgba(212,120,154,0.3)',
                  marginBottom: 10, display: 'block'
                }}>
                  {heroSlides[currentSlide].tag}
                </span>
                <h2 style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: 'clamp(2.2rem, 5vw, 4.5rem)',
                  fontWeight: 300, lineHeight: 0.95,
                  color: 'rgba(255,245,248,0.95)',
                  textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                  margin: '8px 0 0',
                }}>
                  {heroSlides[currentSlide].title}
                  <span style={{ display: 'block', fontStyle: 'italic', color: PINK, fontSize: '88%' }}>
                    {heroSlides[currentSlide].subtitle}
                  </span>
                </h2>
              </motion.div>
            )}


            <div className={`relative z-10 h-full flex items-center px-8 md:px-16 lg:px-24 ${heroSlides[currentSlide].textSide === 'right' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-xl" style={{ textAlign: heroSlides[currentSlide].textSide === 'right' ? 'right' : 'left' }}>

                {heroSlides[currentSlide].textSide !== 'right' && (
                  <>
                    <motion.span
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6, duration: 1.2 }}
                      className="eyebrow block mb-6"
                    >
                      {heroSlides[currentSlide].tag}
                    </motion.span>
                    <motion.h2
                      initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ delay: 0.9, duration: 1.6, ease: [0.19, 1, 0.22, 1] }}
                      className="font-heading font-light leading-[0.92] mb-7"
                      style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)', color: 'rgba(255,245,248,0.95)' }}
                    >
                      {heroSlides[currentSlide].title}
                      <span className="block italic" style={{ color: PINK, fontSize: '88%' }}>
                        {heroSlides[currentSlide].subtitle}
                      </span>
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2, duration: 1.2 }}
                      className="text-[0.88rem] leading-[1.85] mb-10 max-w-sm"
                      style={{ color: 'rgba(255,245,248,0.7)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}
                    >
                      {heroSlides[currentSlide].description}
                    </motion.p>
                  </>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 1.0 }}
                  className={`flex gap-4 flex-wrap ${heroSlides[currentSlide].textSide === 'right' ? 'hidden' : 'flex'}`}
                >
                  <button
                    onClick={() => {
                      const kw = heroSlides[currentSlide].category;
                      if (kw && categories.length > 0) handleOccasionClick(kw);
                      else navigate('/products');
                    }}
                    style={{
                      background: PINK,
                      border: `1px solid ${PINK}`,
                      color: '#FFFFFF',
                      fontFamily: 'Jost, sans-serif',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      padding: '0.75rem 2rem',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      transition: 'all 0.35s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = ROSE; e.currentTarget.style.borderColor = ROSE; }}
                    onMouseLeave={e => { e.currentTarget.style.background = PINK; e.currentTarget.style.borderColor = PINK; }}
                  >
                    {heroSlides[currentSlide].cta} <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={() => navigate('/products')}
                    style={{
                      background: 'rgba(255,255,255,0.22)',
                      border: '1.5px solid rgba(255,255,255,0.95)',
                      color: '#FFFFFF',
                      fontFamily: 'Jost, sans-serif',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      padding: '0.75rem 2rem',
                      borderRadius: '2px',
                      transition: 'all 0.35s ease',
                      cursor: 'pointer',
                      backdropFilter: 'blur(6px)',
                      textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.38)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                  >
                    All Products
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* CTA buttons — desktop: absolute overlay | mobile: flow below image */}
        {isMobile ? (
          <div style={{ display: 'flex', gap: 12, padding: '14px 16px', background: BLUSH, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { const kw = heroSlides[currentSlide].category; handleOccasionClick(kw || 'all'); }}
              style={{ flex: 1, minWidth: 140, background: PINK, border: 'none', color: '#fff', fontFamily: 'Jost, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.8rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              {heroSlides[currentSlide].cta} <ArrowRight size={13} />
            </button>
            <button
              onClick={() => navigate('/products')}
              style={{ flex: 1, minWidth: 140, background: 'transparent', border: `1.5px solid ${ROSE}`, color: ROSE, fontFamily: 'Jost, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.8rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
            >
              All Products
            </button>
          </div>
        ) : (
          <div className="absolute bottom-20 left-0 right-0 z-30 flex flex-wrap justify-center gap-3 px-6">
            <button
              onClick={() => { const kw = heroSlides[currentSlide].category; handleOccasionClick(kw || 'all'); }}
              style={{ background: PINK, border: `1.5px solid ${PINK}`, color: '#fff', fontFamily: 'Jost, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.75rem 1.5rem', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', transition: 'all 0.35s ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = ROSE; }}
              onMouseLeave={e => { e.currentTarget.style.background = PINK; }}
            >
              {heroSlides[currentSlide].cta} <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/products')}
              style={{ background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.95)', color: '#fff', fontFamily: 'Jost, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.75rem 1.5rem', borderRadius: '2px', cursor: 'pointer', backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'all 0.35s ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
            >
              All Products
            </button>
          </div>
        )}

        {/* Slide arrows — desktop only */}
        {!isMobile && [{ fn: prevSlide, side: 'left-4 md:left-8', Icon: ChevronLeft, test: 'slider-prev' },
          { fn: nextSlide, side: 'right-4 md:right-8', Icon: ChevronRight, test: 'slider-next' }].map(({ fn, side, Icon, test }) => (
          <button
            key={test}
            onClick={fn}
            data-testid={test}
            className={`absolute ${side} top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center transition-all duration-300`}
            style={{
              border: '1px solid rgba(255,245,248,0.25)',
              background: 'rgba(26,15,21,0.35)',
              backdropFilter: 'blur(8px)',
              borderRadius: '2px',
              color: 'rgba(255,245,248,0.7)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.color = PINK; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,245,248,0.25)'; e.currentTarget.style.color = 'rgba(255,245,248,0.7)'; }}
          >
            <Icon size={16} />
          </button>
        ))}

        {/* Dots + progress bar — desktop only */}
        {!isMobile && (
          <>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {heroSlides.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)}
                  style={{
                    height: '1px', border: 'none',
                    width: i === currentSlide ? '2rem' : '0.75rem',
                    background: i === currentSlide ? 'rgba(212,120,154,0.9)' : 'rgba(212,120,154,0.3)',
                    transition: 'all 0.5s ease',
                  }}
                />
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'rgba(212,120,154,0.12)' }}>
              <motion.div key={currentSlide} style={{ background: PINK, height: '100%' }}
                initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 5.5, ease: 'linear' }} />
            </div>
          </>
        )}
        {/* Mobile: dots below buttons */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '8px 0 12px', background: BLUSH }}>
            {heroSlides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                style={{ height: '2px', border: 'none', borderRadius: 2, width: i === currentSlide ? '2rem' : '0.75rem', background: i === currentSlide ? PINK : 'rgba(212,120,154,0.3)', transition: 'all 0.5s ease', cursor: 'pointer' }}
              />
            ))}
          </div>
        )}

        {/* Scroll cue — desktop only */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 scroll-indicator cursor-pointer"
            onClick={() => document.getElementById('tagline')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <ChevronDown size={20} style={{ color: 'rgba(212,120,154,0.6)' }} />
          </motion.div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          2 — TOP RATED PRODUCTS (moved above tagline)
          ══════════════════════════════════════════════════════ */}
      <TopRatedSection navigate={navigate} />

      {/* ══════════════════════════════════════════════════════
          3 — TAGLINE / BRAND STATEMENT
          ══════════════════════════════════════════════════════ */}
      <section id="tagline" className="py-16 md:py-44 px-6 md:px-12 lg:px-24 text-center"
               style={{ background: BLUSH }}>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.span variants={fadeUp} className="eyebrow">Premium Gift Hampers</motion.span>

          <motion.h1
            variants={fadeUp}
            className="font-heading font-light mx-auto mt-2"
            style={{ fontSize: 'clamp(3.5rem, 12vw, 10.5rem)', lineHeight: 0.9, letterSpacing: '-0.02em', color: 'rgba(30,26,23,0.88)' }}
          >
            Moments
          </motion.h1>
          <motion.h1
            variants={fadeUp}
            className="font-heading italic mx-auto"
            style={{ fontSize: 'clamp(3.5rem, 12vw, 10.5rem)', lineHeight: 0.9, letterSpacing: '-0.02em', fontWeight: 300, color: ROSE }}
          >
            Matter.
          </motion.h1>

          <motion.div variants={fadeUp} className="gold-line max-w-[5rem] mx-auto mt-10 mb-10" />

          <motion.p
            variants={fadeUp}
            className="mx-auto text-[0.95rem] leading-[2] max-w-md"
            style={{ color: 'rgba(30,26,23,0.42)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}
          >
            Curated hampers that speak what words cannot.<br />
            Delivered with intention. Crafted with love.
          </motion.p>

          <motion.div variants={fadeUp} className="flex justify-center gap-4 mt-12 flex-wrap">
            <button onClick={() => navigate('/products')} className="btn-dark flex items-center gap-2.5"
                    style={{ borderRadius: '2px' }} data-testid="hero-cta-btn">
              Explore Collection <ArrowRight size={13} />
            </button>
            <button
              onClick={() => document.getElementById('occasions')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-ghost-gold" style={{ borderRadius: '2px' }}
            >
              Shop by Occasion
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3 — VALUE PROPOSITIONS
          ══════════════════════════════════════════════════════ */}
      <section style={{ background: '#FCEAF1', borderTop: '1px solid rgba(212,120,154,0.18)', borderBottom: '1px solid rgba(212,120,154,0.18)' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3"
        >
          {valueProps.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={i} variants={fadeUp}
              className="group flex flex-col items-center text-center px-6 py-10 md:px-10 md:py-14"
              style={{
                borderRight: i < 2 ? '1px solid rgba(212,120,154,0.15)' : 'none',
                transition: 'background 0.4s ease',
              }}
              whileHover={{ backgroundColor: '#FFF5F8' }}
            >
              {/* Icon circle */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: `2px solid ${PINK}`,
                background: 'rgba(212,120,154,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                flexShrink: 0,
              }}>
                <Icon size={26} style={{ color: ROSE }} strokeWidth={1.5} />
              </div>

              <h3 style={{
                fontFamily: "'Cormorant', Georgia, serif",
                fontWeight: 600,
                fontSize: '1.45rem',
                color: '#3D1A2A',
                marginBottom: '0.75rem',
                letterSpacing: '0.01em',
              }}>
                {title}
              </h3>

              <p style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: '0.88rem',
                lineHeight: '1.85',
                color: 'rgba(30,26,23,0.55)',
                fontWeight: 400,
              }}>
                {desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          4 — SHOP BY OCCASION
          ══════════════════════════════════════════════════════ */}
      <section id="occasions" className="py-16 md:py-40 px-6 md:px-12 lg:px-24"
               style={{ background: BLUSH }}>
        <motion.div variants={stagger} initial="hidden" whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }} className="max-w-7xl mx-auto">
          <div className="mb-16">
            <motion.span variants={fadeUp} className="eyebrow">Explore</motion.span>
            <motion.h2 variants={fadeUp} className="font-heading font-light mt-2"
                       style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)', color: 'rgba(30,26,23,0.85)', lineHeight: 1.05 }}>
              Shop by Occasion
            </motion.h2>
            <motion.div variants={fadeUp} className="gold-line-left mt-5" style={{ width: '3rem' }} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {occasions.map((occ, i) => (
              <motion.button
                key={i} variants={fadeUp}
                onClick={() => handleOccasionClick(occ.category)}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                data-testid={`occasion-${occ.name.toLowerCase().replace(' ', '-')}`}
                style={{
                  background: occ.grad,
                  border: `1.5px solid ${occ.border}`,
                  borderRadius: '20px',
                  padding: isMobile ? '1.5rem 1rem 1.25rem' : '2.5rem 1.5rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.19,1,0.22,1)',
                  boxShadow: '0 4px 20px rgba(212,120,154,0.1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(184,78,120,0.22)'; e.currentTarget.style.borderColor = ROSE; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,120,154,0.1)'; e.currentTarget.style.borderColor = occ.border; }}
              >
                {/* Emoji in soft circle */}
                <div style={{
                  width: isMobile ? '56px' : '80px', height: isMobile ? '56px' : '80px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isMobile ? '1.6rem' : '2.4rem',
                  marginBottom: isMobile ? '0.75rem' : '1.25rem',
                  boxShadow: '0 4px 16px rgba(184,78,120,0.12)',
                }}>
                  {occ.emoji}
                </div>

                <h3 style={{
                  fontFamily: "'Cormorant', Georgia, serif",
                  fontWeight: 600,
                  fontSize: isMobile ? '1rem' : '1.3rem',
                  color: '#3D1A2A',
                  marginBottom: '0.4rem',
                  letterSpacing: '0.02em',
                }}>
                  {occ.name}
                </h3>

                <p style={{
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '0.72rem',
                  color: 'rgba(92,45,68,0.65)',
                  letterSpacing: '0.06em',
                  fontWeight: 400,
                }}>
                  {occ.sub}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          5 — EDITORIAL BANNER (Period Care)
          ══════════════════════════════════════════════════════ */}
      <section className="px-6 md:px-12 lg:px-24 py-6" style={{ background: BLUSH }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
          className="max-w-7xl mx-auto relative overflow-hidden"
          style={{
            background: PLUM,
            borderRadius: '2px',
            padding: 'clamp(3rem, 6vw, 5rem) clamp(2rem, 6vw, 5rem)',
          }}
        >
          {/* Decorative corner brackets */}
          {[
            'top-5 left-5 border-t border-l',
            'top-5 right-5 border-t border-r',
            'bottom-5 left-5 border-b border-l',
            'bottom-5 right-5 border-b border-r',
          ].map((cls, i) => (
            <div key={i} className={`absolute w-7 h-7 ${cls}`}
                 style={{ borderColor: 'rgba(212,120,154,0.35)' }} />
          ))}

          <div className="text-center relative z-10 max-w-xl mx-auto">
            <span className="eyebrow block mb-6">Period Care — Featured Collection</span>
            <h2 className="font-heading font-light italic my-5"
                style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3.5rem)', color: 'rgba(255,245,248,0.9)', lineHeight: 1.12 }}>
              She deserves comfort, every single month.
            </h2>
            <p className="text-[0.82rem] leading-[1.9] mb-9"
               style={{ color: 'rgba(255,245,248,0.35)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}>
              Our Period Care Hamper is a carefully assembled collection of premium wellness essentials designed
              to provide comfort, care, and confidence during every cycle.
            </p>
            <button
              onClick={() => handleOccasionClick('period')}
              style={{
                background: PINK,
                border: `1.5px solid ${PINK}`,
                color: '#FFFFFF',
                fontFamily: 'Jost, sans-serif',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                padding: '0.85rem 2.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.35s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = ROSE; e.currentTarget.style.borderColor = ROSE; e.currentTarget.style.boxShadow = '0 8px 28px rgba(212,120,154,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = PINK; e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Shop Period Care
            </button>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6 — FEATURED PRODUCTS
          ══════════════════════════════════════════════════════ */}
      {!loadingFeatured && featuredProducts.length > 0 && (
        <section className="py-16 md:py-40 px-6 md:px-12 lg:px-24"
                 style={{ background: '#F9E5EE' }}
                 data-testid="featured-products-section">
          <motion.div variants={stagger} initial="hidden" whileInView="visible"
                      viewport={{ once: true, margin: '-80px' }} className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
              <div>
                <motion.span variants={fadeUp} className="eyebrow">Curated</motion.span>
                <motion.h2 variants={fadeUp} className="font-heading font-light mt-2"
                           style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)', color: 'rgba(30,26,23,0.85)', lineHeight: 1.05 }}>
                  Bestselling Hampers
                </motion.h2>
                <motion.div variants={fadeUp} className="gold-line-left mt-5" style={{ width: '3rem' }} />
              </div>
              <motion.div variants={fadeUp}>
                <button onClick={() => navigate('/products')} className="btn-ghost-gold flex items-center gap-2.5"
                        style={{ borderRadius: '2px' }}>
                  View All <ArrowRight size={13} />
                </button>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredProducts.map((product, i) => (
                <motion.div key={product.id} variants={fadeUp} custom={i}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          7 — FINAL CTA
          ══════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-44 px-6 md:px-12 lg:px-24 text-center"
               style={{ background: BLUSH, borderTop: '1px solid rgba(212,120,154,0.12)' }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
          className="max-w-3xl mx-auto"
        >
          <span className="eyebrow">Begin Here</span>
          <h2 className="font-heading font-light my-6"
              style={{ fontSize: 'clamp(2.5rem, 7.5vw, 6.5rem)', color: 'rgba(30,26,23,0.88)', lineHeight: 0.95, letterSpacing: '-0.01em' }}>
            Create Moments<br />
            <span className="italic" style={{ color: ROSE }}>That Last Forever</span>
          </h2>
          <div className="gold-line max-w-[5rem] mx-auto my-8" />
          <p className="text-[0.85rem] leading-[2] mb-12 max-w-md mx-auto"
             style={{ color: 'rgba(30,26,23,0.38)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}>
            Every hamper carries your feelings.<br />
            Every delivery creates a memory.
          </p>
          <button
            onClick={() => navigate('/products')}
            className="btn-dark inline-flex items-center gap-3"
            style={{ borderRadius: '2px', padding: '0.9rem 2.8rem', fontSize: '0.7rem' }}
            data-testid="cta-shop-now-btn"
          >
            Start Gifting Today <ArrowRight size={14} />
          </button>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
          ══════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 1.5rem)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: PINK, fontFamily: 'Jost, sans-serif', fontWeight: 600 }}>
              Happy Customers
            </span>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 500, color: PLUM, margin: '8px 0 0', lineHeight: 1.1 }}>
              What They Say
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px,100%), 1fr))', gap: 24 }}>
            {[
              { name: 'Priya S.', location: 'Bangalore', text: 'Ordered the birthday hamper for my best friend — she literally cried happy tears! The packaging was so beautiful and everything inside felt so premium. Will definitely order again.', stars: 5 },
              { name: 'Riya M.', location: 'Bangalore', text: 'The period care hamper is such a thoughtful idea. Sent it to my sister and she loved every single item. Delivery was super fast and the box looked gorgeous.', stars: 5 },
              { name: 'Sneha K.', location: 'Bangalore', text: 'Got the I Love You hamper for my boyfriend\'s birthday. He was totally surprised! The handwritten card touch made it extra special. 10/10 experience.', stars: 5 },
              { name: 'Anjali R.', location: 'Bangalore', text: 'Hampious made gifting so easy. I didn\'t know what to get my mom and the hamper was perfect. Customer service was also very responsive. Highly recommend!', stars: 5 },
            ].map((review, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ background: BLUSH, borderRadius: 16, padding: '28px 24px', border: '1px solid rgba(212,120,154,0.15)' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                  {[...Array(review.stars)].map((_, j) => <Star key={j} size={14} fill="#D4789A" color="#D4789A" />)}
                </div>
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 14, color: '#4a3040', lineHeight: 1.7, marginBottom: 18 }}>
                  "{review.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${PINK}, ${ROSE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 14 }}>
                    {review.name[0]}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: PLUM }}>{review.name}</div>
                    <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#9a7080' }}>{review.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
