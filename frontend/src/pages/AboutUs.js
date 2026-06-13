import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gift, Heart, Truck, Star, Users, Sparkles, ArrowRight } from 'lucide-react';

const BLUSH  = '#FFF5F8';
const PINK   = '#D4789A';
const ROSE   = '#B84E78';
const PLUM   = '#1A0F15';

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.19, 1, 0.22, 1] } },
};
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } },
};

const values = [
  { Icon: Heart,    title: 'Made with Love',    desc: 'Every hamper curated with genuine care and thoughtful intention.' },
  { Icon: Star,     title: 'Premium Quality',   desc: 'Only the finest, hand-picked products make it into our collections.' },
  { Icon: Truck,    title: 'Express Delivery',  desc: 'Express shipping across India with Cash on Delivery available.' },
  { Icon: Users,    title: 'Customer First',    desc: 'Dedicated support to make your gifting experience truly perfect.' },
];

const promises = [
  'Premium, hand-picked products from trusted sources',
  'Thoughtful, elegant packaging that truly delights',
  'Express delivery across India with COD',
  'Secure and seamless checkout experience',
  'Dedicated customer support, always here for you',
  '100% satisfaction guarantee on every order',
];

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div style={{ background: BLUSH, minHeight: '100vh' }} data-testid="about-page">

      {/* ══════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${PLUM} 0%, #3D1A2A 50%, #2A1020 100%)`,
        padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 8vw, 6rem)',
        textAlign: 'center',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,120,154,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(184,78,120,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px',
          background: `linear-gradient(to top, ${BLUSH}, transparent)`,
          pointerEvents: 'none',
        }} />

        <motion.div initial="hidden" animate="visible" variants={stagger} style={{ position: 'relative', zIndex: 10 }}>

          {/* Icon */}
          <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              width: '76px', height: '76px', borderRadius: '50%',
              border: `2px solid rgba(212,120,154,0.6)`,
              background: 'rgba(212,120,154,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Gift size={30} style={{ color: PINK }} strokeWidth={1.5} />
            </div>
          </motion.div>

          <motion.span variants={fadeUp} style={{
            fontFamily: 'Jost, sans-serif', fontSize: '0.62rem', fontWeight: 500,
            letterSpacing: '0.42em', textTransform: 'uppercase', color: PINK,
            display: 'block', marginBottom: '1.25rem',
          }}>
            Our Story
          </motion.span>

          <motion.h1 variants={fadeUp} style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontSize: 'clamp(3.2rem, 8vw, 6.5rem)',
            fontWeight: 300,
            color: '#FFFFFF',
            lineHeight: 1.0,
            marginBottom: '1.75rem',
            letterSpacing: '-0.01em',
          }}>
            About{' '}
            <span style={{ color: PINK, fontStyle: 'italic' }}>Hampious</span>
          </motion.h1>

          {/* Divider line */}
          <motion.div variants={fadeUp} style={{
            width: '60px', height: '1px',
            background: `linear-gradient(to right, transparent, ${PINK}, transparent)`,
            margin: '0 auto 1.75rem',
          }} />

          <motion.p variants={fadeUp} style={{
            fontFamily: 'Jost, sans-serif', fontSize: '1.05rem', fontWeight: 300,
            color: 'rgba(255,245,248,0.72)', lineHeight: 1.95,
            maxWidth: '520px', margin: '0 auto',
          }}>
            Where every gift tells a story and every hamper is curated with love.
            We believe that gifting is an art form.
          </motion.p>

        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          OUR JOURNEY
          ══════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 8vw, 6rem)', background: '#FFFFFF' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '2rem', alignItems: 'center' }}
        >
          {/* Image panel */}
          <motion.div variants={fadeUp} style={{ position: 'relative' }}>
            <div style={{
              borderRadius: '20px', overflow: 'hidden',
              border: `2px solid rgba(212,120,154,0.2)`,
              boxShadow: '0 20px 60px rgba(184,78,120,0.15)',
            }}>
              <img
                src="/About.png"
                alt="Hampious luxury gift hamper"
                style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block' }}
              />
            </div>
            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', bottom: '-20px', right: '-20px',
                background: ROSE, borderRadius: '16px',
                padding: '1.2rem 1.5rem', textAlign: 'center',
                boxShadow: '0 8px 30px rgba(184,78,120,0.35)',
              }}
            >
              <div style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: '2rem', fontWeight: 700, color: '#FFF5F8', lineHeight: 1 }}>100%</div>
              <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,245,248,0.75)', marginTop: '0.2rem' }}>Handcrafted</div>
            </motion.div>
          </motion.div>

          {/* Text */}
          <motion.div variants={fadeUp}>
            <span style={{
              fontFamily: 'Jost, sans-serif', fontSize: '0.62rem', fontWeight: 500,
              letterSpacing: '0.38em', textTransform: 'uppercase', color: PINK,
              display: 'block', marginBottom: '1rem',
            }}>
              Since Day One
            </span>
            <h2 style={{
              fontFamily: "'Cormorant', Georgia, serif",
              fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
              fontWeight: 400, color: '#3D1A2A',
              lineHeight: 1.1, marginBottom: '1.5rem',
            }}>
              Our Journey of<br />
              <span style={{ fontStyle: 'italic', color: ROSE }}>Curated Love</span>
            </h2>

            <div style={{ height: '2px', width: '3rem', background: `linear-gradient(to right, ${PINK}, transparent)`, marginBottom: '1.5rem' }} />

            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.92rem', lineHeight: '1.95', color: 'rgba(30,26,23,0.55)', marginBottom: '1rem', fontWeight: 300 }}>
              Founded with a passion for creating meaningful connections, Hampious was born from
              the simple idea that gifts should express emotions, celebrate relationships, and
              create lasting memories.
            </p>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.92rem', lineHeight: '1.95', color: 'rgba(30,26,23,0.55)', fontWeight: 300 }}>
              Each hamper in our collection is carefully curated to bring joy, comfort, and love
              to your special ones. We source only the finest products and present them in
              beautiful, thoughtful packaging.
            </p>

            <motion.button
              onClick={() => navigate('/products')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                marginTop: '2rem',
                background: PINK, border: `1.5px solid ${PINK}`,
                color: '#FFFFFF',
                fontFamily: 'Jost, sans-serif', fontSize: '0.68rem', fontWeight: 600,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                padding: '0.8rem 2rem', borderRadius: '4px',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = ROSE; e.currentTarget.style.borderColor = ROSE; }}
              onMouseLeave={e => { e.currentTarget.style.background = PINK; e.currentTarget.style.borderColor = PINK; }}
            >
              Explore Collection <ArrowRight size={13} />
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          VALUES
          ══════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 8vw, 6rem)', background: '#FCEAF1' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          style={{ maxWidth: '1100px', margin: '0 auto' }}
        >
          {/* Header */}
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              fontFamily: 'Jost, sans-serif', fontSize: '0.62rem', fontWeight: 500,
              letterSpacing: '0.38em', textTransform: 'uppercase', color: PINK,
              display: 'block', marginBottom: '0.75rem',
            }}>
              What We Stand For
            </span>
            <h2 style={{
              fontFamily: "'Cormorant', Georgia, serif",
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 400, color: '#3D1A2A', lineHeight: 1.1,
            }}>
              Our Core <span style={{ fontStyle: 'italic', color: ROSE }}>Values</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '1.5rem' }}>
            {values.map(({ Icon, title, desc }, i) => (
              <motion.div
                key={i} variants={fadeUp}
                whileHover={{ y: -8, boxShadow: '0 16px 40px rgba(184,78,120,0.18)' }}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid rgba(212,120,154,0.15)',
                  borderRadius: '20px',
                  padding: '2.5rem 1.75rem',
                  textAlign: 'center',
                  transition: 'all 0.4s cubic-bezier(0.19,1,0.22,1)',
                  boxShadow: '0 4px 20px rgba(212,120,154,0.08)',
                }}
              >
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  border: `2px solid ${PINK}`,
                  background: 'rgba(212,120,154,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}>
                  <Icon size={24} style={{ color: ROSE }} strokeWidth={1.5} />
                </div>
                <h3 style={{
                  fontFamily: "'Cormorant', Georgia, serif",
                  fontSize: '1.4rem', fontWeight: 600,
                  color: '#3D1A2A', marginBottom: '0.75rem',
                }}>
                  {title}
                </h3>
                <p style={{
                  fontFamily: 'Jost, sans-serif', fontSize: '0.84rem',
                  lineHeight: '1.8', color: 'rgba(30,26,23,0.5)', fontWeight: 300,
                }}>
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          PROMISE
          ══════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 8vw, 6rem)', background: '#FFFFFF' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          style={{ maxWidth: '900px', margin: '0 auto' }}
        >
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              fontFamily: 'Jost, sans-serif', fontSize: '0.62rem', fontWeight: 500,
              letterSpacing: '0.38em', textTransform: 'uppercase', color: PINK,
              display: 'block', marginBottom: '0.75rem',
            }}>
              Our Commitment
            </span>
            <h2 style={{
              fontFamily: "'Cormorant', Georgia, serif",
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 400, color: '#3D1A2A', lineHeight: 1.1,
            }}>
              The Hampious <span style={{ fontStyle: 'italic', color: ROSE }}>Promise</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1rem' }}>
            {promises.map((item, i) => (
              <motion.div
                key={i} variants={fadeUp}
                whileHover={{ x: 6 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: '#FFF5F8',
                  border: '1px solid rgba(212,120,154,0.15)',
                  borderRadius: '12px',
                  padding: '1.1rem 1.4rem',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  width: '36px', height: '36px', flexShrink: 0,
                  borderRadius: '50%',
                  background: 'rgba(212,120,154,0.12)',
                  border: `1.5px solid ${PINK}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={14} style={{ color: ROSE }} />
                </div>
                <span style={{
                  fontFamily: 'Jost, sans-serif', fontSize: '0.88rem',
                  color: 'rgba(30,26,23,0.72)', fontWeight: 400, lineHeight: 1.5,
                }}>
                  {item}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA
          ══════════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 8vw, 6rem)',
        background: PLUM, textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Corner brackets */}
        {['top-6 left-6 border-t border-l','top-6 right-6 border-t border-r','bottom-6 left-6 border-b border-l','bottom-6 right-6 border-b border-r'].map((cls, i) => (
          <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: 'rgba(212,120,154,0.3)' }} />
        ))}

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
          style={{ position: 'relative', zIndex: 10, maxWidth: '600px', margin: '0 auto' }}
        >
          <span style={{
            fontFamily: 'Jost, sans-serif', fontSize: '0.62rem', fontWeight: 500,
            letterSpacing: '0.38em', textTransform: 'uppercase', color: PINK,
            display: 'block', marginBottom: '1.25rem',
          }}>
            Begin Your Journey
          </span>
          <h2 style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontSize: 'clamp(2.2rem, 5vw, 4rem)',
            fontWeight: 300, color: 'rgba(255,245,248,0.92)',
            lineHeight: 1.1, marginBottom: '1.5rem',
          }}>
            Ready to Create <span style={{ fontStyle: 'italic', color: PINK }}>Unforgettable</span> Moments?
          </h2>
          <p style={{
            fontFamily: 'Jost, sans-serif', fontSize: '0.88rem', fontWeight: 300,
            color: 'rgba(255,245,248,0.45)', lineHeight: 1.9, marginBottom: '2.5rem',
          }}>
            Explore our curated collection of luxury hampers and find the perfect gift for every occasion.
          </p>
          <motion.button
            onClick={() => navigate('/products')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: PINK, border: `1.5px solid ${PINK}`,
              color: '#FFFFFF',
              fontFamily: 'Jost, sans-serif', fontSize: '0.72rem', fontWeight: 600,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              padding: '0.9rem 2.8rem', borderRadius: '4px',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = ROSE; e.currentTarget.style.borderColor = ROSE; }}
            onMouseLeave={e => { e.currentTarget.style.background = PINK; e.currentTarget.style.borderColor = PINK; }}
          >
            Shop Now <ArrowRight size={14} />
          </motion.button>
        </motion.div>
      </section>

    </div>
  );
}
