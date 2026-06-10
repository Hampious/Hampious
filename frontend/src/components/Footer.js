import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Instagram, Facebook, Mail, Phone, MapPin, Clock } from 'lucide-react';

// WhatsApp SVG icon (lucide doesn't have one)
const WhatsAppIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

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
            {[
              { Icon: Instagram,   href: 'https://www.instagram.com/hampious/',                        label: 'Instagram' },
              { Icon: Facebook,    href: 'https://www.facebook.com/profile.php?id=61589181085568',    label: 'Facebook'  },
              { Icon: WhatsAppIcon,href: 'https://wa.me/917076138777',                                label: 'WhatsApp'  },
            ].map(({ Icon, href, label }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                whileHover={{ y: -3 }}
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
