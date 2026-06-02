import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import { Award, Truck, Sparkles, ChevronDown, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ProductCard } from '../components/ProductCard';

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
    bg: '/period-care-hero.png',
    cta: 'Explore Hamper', category: 'period',
  },
  {
    id: 2,
    title: 'I Love You', subtitle: 'Hamper',
    tag: 'Love Expressed Beautifully',
    description: 'Express your deepest feelings through thoughtfully curated gifts — premium hampers filled with elegance.',
    bg: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1920&auto=format&fit=crop&q=85',
    cta: 'Explore Hamper', category: 'love',
  },
  {
    id: 3,
    title: 'Birthday', subtitle: 'Hamper',
    tag: 'Celebrate Her Uniqueness',
    description: 'Celebrate another year of memories. Luxury gifts curated to make birthdays truly unforgettable.',
    bg: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1920&auto=format&fit=crop&q=85',
    cta: 'Explore Hamper', category: 'birthday',
  },
  {
    id: 4,
    title: 'Sorry', subtitle: 'Hamper',
    tag: 'Reconciliation with Sincerity',
    description: 'Sometimes actions speak louder than words. Premium hampers designed to mend bonds with grace.',
    bg: '/sorry-hero.png',
    cta: 'Explore Hamper', category: 'sorry',
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
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.19, 1, 0.22, 1] } },
};
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.13, delayChildren: 0.15 } },
};

/* ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories]             = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured]   = useState(true);
  const [currentSlide, setCurrentSlide]         = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrentSlide(p => (p + 1) % heroSlides.length), 6000);
    return () => clearInterval(t);
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
      setFeaturedProducts(all.filter(p => p.is_active !== false && p.featured === true).slice(0, 6));
    } catch { setFeaturedProducts([]); }
    finally  { setLoadingFeatured(false); }
  };

  const handleOccasionClick = (keyword) => {
    const cat = categories.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()));
    if (cat) navigate(`/products?category=${cat.id}`);
    else     navigate('/products');
  };

  return (
    <div style={{ background: BLUSH, minHeight: '100vh', overflow: 'hidden' }}>
      <div className="grain-overlay" />

      {/* ══════════════════════════════════════════════════════
          1 — HERO SLIDER
          ══════════════════════════════════════════════════════ */}
      <section className="relative h-[92vh] overflow-hidden" data-testid="hero-slider">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.19, 1, 0.22, 1] }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-cover bg-center"
                 style={{ backgroundImage: `url(${heroSlides[currentSlide].bg})` }} />
            <div className="absolute inset-0"
                 style={{ background: 'linear-gradient(110deg, rgba(26,15,21,0.55) 0%, rgba(26,15,21,0.25) 55%, rgba(26,15,21,0.05) 100%)' }} />
            {/* Bottom fade to blush */}
            <div className="absolute bottom-0 left-0 right-0 h-28"
                 style={{ background: `linear-gradient(to top, ${BLUSH}, transparent)` }} />

            <div className="relative z-10 h-full flex items-center px-8 md:px-16 lg:px-24">
              <div className="max-w-xl">
                <motion.span
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="eyebrow block mb-6"
                >
                  {heroSlides[currentSlide].tag}
                </motion.span>

                <motion.h2
                  initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.6, duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
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
                  transition={{ delay: 0.9, duration: 1 }}
                  className="text-[0.88rem] leading-[1.85] mb-10 max-w-sm"
                  style={{ color: 'rgba(255,245,248,0.55)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}
                >
                  {heroSlides[currentSlide].description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.9 }}
                  className="flex gap-4 flex-wrap"
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
                      background: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.7)',
                      color: '#FFFFFF',
                      fontFamily: 'Jost, sans-serif',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      padding: '0.75rem 2rem',
                      borderRadius: '2px',
                      transition: 'all 0.35s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                  >
                    All Products
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide arrows */}
        {[{ fn: prevSlide, side: 'left-4 md:left-8', Icon: ChevronLeft, test: 'slider-prev' },
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

        {/* Dots */}
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

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'rgba(212,120,154,0.12)' }}>
          <motion.div key={currentSlide} style={{ background: PINK, height: '100%' }}
            initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 6, ease: 'linear' }} />
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 scroll-indicator cursor-pointer"
          onClick={() => document.getElementById('tagline')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <ChevronDown size={20} style={{ color: 'rgba(212,120,154,0.6)' }} />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2 — TAGLINE / BRAND STATEMENT
          ══════════════════════════════════════════════════════ */}
      <section id="tagline" className="py-32 md:py-44 px-6 md:px-12 lg:px-24 text-center"
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
              className="group flex flex-col items-center text-center px-10 py-14"
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
      <section id="occasions" className="py-32 md:py-40 px-6 md:px-12 lg:px-24"
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
                  padding: '2.5rem 1.5rem 2rem',
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
                  width: '80px', height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.4rem',
                  marginBottom: '1.25rem',
                  boxShadow: '0 4px 16px rgba(184,78,120,0.12)',
                }}>
                  {occ.emoji}
                </div>

                <h3 style={{
                  fontFamily: "'Cormorant', Georgia, serif",
                  fontWeight: 600,
                  fontSize: '1.3rem',
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
        <section className="py-32 md:py-40 px-6 md:px-12 lg:px-24"
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
      <section className="py-32 md:py-44 px-6 md:px-12 lg:px-24 text-center"
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

    </div>
  );
}
