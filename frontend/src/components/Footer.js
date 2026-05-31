import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Instagram, Facebook, Twitter, Mail, Phone, MapPin, Clock } from 'lucide-react';

const col = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const Footer = () => (
  <footer className="footer-premium mt-20">

    {/* ── Top decorative rule ────────────────────────────── */}
    <div className="gold-line" />

    {/* ── Main grid ──────────────────────────────────────── */}
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ staggerChildren: 0.1 }}
      className="px-6 md:px-12 lg:px-20 py-16"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

        {/* Brand */}
        <motion.div variants={col} transition={{ duration: 0.7 }}>
          <Link to="/" className="inline-block mb-5">
            <span className="font-heading font-light text-2xl tracking-[0.12em]" style={{ color: '#C8A96E' }}>
              HAMPIOUS
            </span>
          </Link>
          <div className="gold-line-left mb-5" style={{ width: '2rem' }} />
          <p className="text-[0.8rem] leading-[1.8] mb-7" style={{ color: 'rgba(242,234,216,0.35)' }}>
            Curating moments of joy through thoughtfully designed gift hampers for every special occasion.
          </p>
          <div className="flex items-center gap-3">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <motion.a
                key={i}
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Social"
                whileHover={{ y: -3, color: '#C8A96E' }}
                className="w-8 h-8 border border-[rgba(200,169,110,0.15)] rounded-sm flex items-center justify-center
                           text-[rgba(242,234,216,0.3)] hover:text-[#C8A96E] hover:border-[rgba(200,169,110,0.4)]
                           transition-all duration-300"
              >
                <Icon size={13} />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Shop */}
        <motion.div variants={col} transition={{ duration: 0.7, delay: 0.08 }}>
          <h4 className="font-heading font-light text-base tracking-[0.2em] uppercase mb-5"
              style={{ color: 'rgba(242,234,216,0.7)' }}>
            Shop
          </h4>
          <div className="gold-line-left mb-5" style={{ width: '1.5rem' }} />
          <div className="space-y-3.5">
            {[
              { to: '/products', label: 'All Products' },
              { to: '/products?featured=true', label: 'Bestsellers' },
              { to: '/my-orders', label: 'My Orders' },
              { to: '/wishlist', label: 'Wishlist' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} className="footer-link block">{label}</Link>
            ))}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div variants={col} transition={{ duration: 0.7, delay: 0.16 }}>
          <h4 className="font-heading font-light text-base tracking-[0.2em] uppercase mb-5"
              style={{ color: 'rgba(242,234,216,0.7)' }}>
            Information
          </h4>
          <div className="gold-line-left mb-5" style={{ width: '1.5rem' }} />
          <div className="space-y-3.5">
            {[
              { to: '/about', label: 'About Us' },
              { to: '/contact', label: 'Contact Us' },
              { to: '/return-policy', label: 'Returns & Refunds' },
              { to: '/privacy', label: 'Privacy Policy' },
              { to: '/terms', label: 'Terms & Conditions' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} className="footer-link block">{label}</Link>
            ))}
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div variants={col} transition={{ duration: 0.7, delay: 0.24 }}>
          <h4 className="font-heading font-light text-base tracking-[0.2em] uppercase mb-5"
              style={{ color: 'rgba(242,234,216,0.7)' }}>
            Get in Touch
          </h4>
          <div className="gold-line-left mb-5" style={{ width: '1.5rem' }} />
          <div className="space-y-4">
            {[
              { Icon: Mail,  href: 'mailto:support@hampious.com', text: 'support@hampious.com' },
              { Icon: Phone, href: 'tel:+917428601664',          text: '+91 7428601664' },
              { Icon: Clock, href: null,                         text: 'Mon – Sun: 10 AM – 7 PM' },
              { Icon: MapPin,href: null,                         text: 'Mumbai, Maharashtra, India' },
            ].map(({ Icon, href, text }, i) => {
              const content = (
                <span className="footer-link flex items-start gap-3 group">
                  <Icon size={13} className="mt-0.5 shrink-0" style={{ color: 'rgba(200,169,110,0.6)' }} />
                  <span>{text}</span>
                </span>
              );
              return href
                ? <a key={i} href={href}>{content}</a>
                : <div key={i}>{content}</div>;
            })}
          </div>
        </motion.div>

      </div>
    </motion.div>

    {/* ── Bottom bar ─────────────────────────────────────── */}
    <div style={{ borderTop: '1px solid rgba(200,169,110,0.06)' }}>
      <div className="px-6 md:px-12 lg:px-20 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[0.72rem] tracking-[0.05em] flex items-center gap-2"
             style={{ color: 'rgba(242,234,216,0.2)' }}>
            © {new Date().getFullYear()} Hampious. Crafted with
            <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Heart size={11} style={{ color: '#C8A96E', fill: '#C8A96E' }} />
            </motion.span>
            in India
          </p>
          <div className="flex items-center gap-6">
            {[
              { to: '/privacy', label: 'Privacy' },
              { to: '/terms',   label: 'Terms' },
              { to: '/return-policy', label: 'Returns' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="text-[0.7rem] tracking-[0.08em] uppercase transition-colors duration-300"
                style={{ color: 'rgba(242,234,216,0.18)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(200,169,110,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(242,234,216,0.18)')}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>

  </footer>
);
