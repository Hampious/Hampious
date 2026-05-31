import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, LogOut, LayoutDashboard, Heart, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const PINK = '#D4789A';
const ROSE = '#B84E78';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    setTimeout(() => { logout(); navigate('/'); }, 100);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Collection' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  const iconBtn = (onClick, children, badge, testId, title) => (
    <motion.button
      onClick={onClick}
      title={title}
      data-testid={testId}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="relative w-9 h-9 flex items-center justify-center rounded-sm
                 border border-transparent hover:border-[rgba(212,120,154,0.3)]
                 transition-all duration-300"
      style={{ color: '#5C2D44' }}
      onMouseEnter={e => (e.currentTarget.style.color = PINK)}
      onMouseLeave={e => (e.currentTarget.style.color = '#5C2D44')}
    >
      {children}
      {badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 w-[14px] h-[14px]
                     text-[9px] font-bold rounded-full flex items-center justify-center"
          style={{ background: PINK, color: '#FFF5F8' }}
        >
          {badge > 9 ? '9+' : badge}
        </motion.span>
      )}
    </motion.button>
  );

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
      className="sticky top-0 z-40 navbar-glass"
      style={{
        boxShadow: scrolled ? '0 4px 30px rgba(212,120,154,0.1)' : 'none',
        transition: 'box-shadow 0.4s ease',
      }}
    >
      <div className="px-6 md:px-12 lg:px-20">
        <div className="flex items-center justify-between h-[68px]">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" data-testid="navbar-logo">
            <motion.img
              src="/logo.jpg"
              alt="Hampious"
              onError={e => { e.currentTarget.style.display = 'none'; }}
              className="h-8 w-8 object-contain"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
            <span
              style={{
                fontFamily: "'Garamond', 'Georgia', serif",
                fontWeight: 700,
                fontSize: '1.55rem',
                letterSpacing: '0.18em',
                color: ROSE,
              }}
            >
              HAMPIOUS
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                style={{ color: isActive(link.path) ? ROSE : '#5C2D44' }}
                onMouseEnter={e => (e.currentTarget.style.color = ROSE)}
                onMouseLeave={e => (e.currentTarget.style.color = isActive(link.path) ? ROSE : '#5C2D44')}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/my-orders"
                data-testid="nav-orders-link"
                className={`nav-link ${isActive('/my-orders') ? 'active' : ''}`}
                style={{ color: isActive('/my-orders') ? ROSE : '#5C2D44' }}
                onMouseEnter={e => (e.currentTarget.style.color = ROSE)}
                onMouseLeave={e => (e.currentTarget.style.color = '#5C2D44')}
              >
                Orders
              </Link>
            )}
          </div>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {isAdmin() && iconBtn(() => navigate('/admin/dashboard'), <LayoutDashboard size={16} />, 0, 'nav-admin-btn', 'Admin')}
                {iconBtn(() => navigate('/wishlist'), <Heart size={16} />, wishlistCount, 'nav-wishlist-btn', 'Wishlist')}
                {iconBtn(() => navigate('/cart'), <ShoppingCart size={16} />, cartCount, 'nav-cart-btn', 'Cart')}
                {iconBtn(() => navigate('/profile'), <User size={16} />, 0, 'nav-profile-btn', 'Profile')}
                {iconBtn(handleLogout, <LogOut size={16} />, 0, 'nav-logout-btn', 'Sign out')}
              </>
            ) : (
              <motion.button
                onClick={() => navigate('/auth')}
                data-testid="nav-signin-btn"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-gold"
                style={{ borderRadius: '2px', padding: '0.5rem 1.5rem' }}
              >
                Sign In
              </motion.button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="md:hidden w-9 h-9 flex items-center justify-center transition-colors duration-300"
            style={{ color: 'rgba(30,26,23,0.45)' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen
                ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><X size={20} /></motion.div>
                : <motion.div key="menu"  initial={{ rotate:  90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate:-90, opacity: 0 }} transition={{ duration: 0.2 }}><Menu size={20} /></motion.div>
              }
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
              className="md:hidden overflow-hidden"
              style={{ borderTop: '1px solid rgba(212,120,154,0.12)' }}
            >
              <div className="py-5 space-y-0.5">
                {navLinks.map((link, i) => (
                  <motion.div key={link.path} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <Link
                      to={link.path}
                      className={`block py-3 px-3 text-[0.68rem] font-medium tracking-[0.2em] uppercase
                                  transition-colors duration-200 rounded-sm
                                  ${isActive(link.path) ? 'bg-[rgba(212,120,154,0.06)]' : 'text-[#5C2D44] hover:text-[#D4789A]'}`}
                      style={isActive(link.path) ? { color: ROSE } : {}}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {user && (
                  <>
                    <div className="gold-line my-3" />
                    {[
                      { to: '/my-orders', label: 'My Orders' },
                      { to: '/wishlist',  label: `Wishlist${wishlistCount > 0 ? ` (${wishlistCount})` : ''}` },
                      { to: '/cart',      label: `Cart${cartCount > 0 ? ` (${cartCount})` : ''}` },
                      { to: '/profile',   label: 'Profile' },
                    ].map(({ to, label }) => (
                      <Link key={to} to={to}
                        className="block py-3 px-3 text-[0.68rem] font-medium tracking-[0.2em] uppercase
                                   text-[#5C2D44] hover:text-[#D4789A] transition-colors"
                      >
                        {label}
                      </Link>
                    ))}
                    {isAdmin() && (
                      <Link to="/admin/dashboard"
                        className="block py-3 px-3 text-[0.68rem] font-medium tracking-[0.2em] uppercase"
                        style={{ color: ROSE }}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="gold-line my-3" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left py-3 px-3 text-[0.68rem] font-medium tracking-[0.2em] uppercase
                                 text-[rgba(220,38,38,0.5)] hover:text-[rgba(220,38,38,0.8)] transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                )}

                {!user && (
                  <div className="pt-3 pb-1">
                    <button
                      onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}
                      className="btn-gold w-full text-center"
                      style={{ borderRadius: '2px' }}
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};
