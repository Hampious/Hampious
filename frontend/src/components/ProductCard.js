import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const PINK = '#D4789A';
const ROSE = '#B84E78';
const BLUSH = '#FFF5F8';

export const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const isWishlisted  = isInWishlist(product.id);
  const isOutOfStock  = product.stock <= 0;

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (isOutOfStock) { toast.error('This product is out of stock'); return; }
    if (!user) { toast.error('Please sign in to add items to cart'); navigate('/auth'); return; }
    try {
      await addToCart(product.id, 1, product.discount_price || product.price);
      toast.success('Added to cart');
    } catch { toast.error('Failed to add to cart'); }
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    if (wishlistLoading) return;
    if (!user) { toast.error('Please sign in to use wishlist'); navigate('/auth'); return; }
    setWishlistLoading(true);
    try {
      if (isWishlisted) { await removeFromWishlist(product.id); toast.success('Removed from wishlist'); }
      else              { await addToWishlist(product.id);      toast.success('Added to wishlist'); }
    } catch { toast.error('Failed to update wishlist'); }
    finally  { setWishlistLoading(false); }
  };

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    window.scrollTo(0, 0);
    navigate(`/products/${product.id}`);
  };

  // Selling price = discount_price if set, otherwise price
  // MRP (crossed-out) = original_price if higher than selling price
  const displayPrice    = Number(product.discount_price || product.price || 0);
  const mrpPrice        = Number(product.original_price || 0);
  const hasDiscount     = mrpPrice > 0 && mrpPrice > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((mrpPrice - displayPrice) / mrpPrice) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
      className="group cursor-pointer card-luxury rounded-sm overflow-hidden"
      onClick={handleCardClick}
      data-testid={`product-card-${product.id}`}
    >
      {/* Image */}
      <div className="relative aspect-square img-zoom overflow-hidden" style={{ background: '#FCEAF1' }}>

        {/* Out of stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(255,245,248,0.82)]">
            <span className="text-[0.62rem] tracking-[0.2em] uppercase font-medium"
                  style={{ color: 'rgba(30,26,23,0.4)', border: '1px solid rgba(212,120,154,0.2)', padding: '0.3rem 0.8rem', borderRadius: '2px' }}>
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <motion.button
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          data-testid={`wishlist-btn-${product.id}`}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-300"
          style={{
            background: isWishlisted ? 'rgba(212,120,154,0.9)' : 'rgba(255,245,248,0.9)',
            border: isWishlisted ? '1px solid transparent' : '1px solid rgba(212,120,154,0.3)',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 2px 10px rgba(30,26,23,0.07)',
          }}
        >
          <Heart
            size={13}
            style={{
              color: isWishlisted ? '#FFF5F8' : PINK,
              fill: isWishlisted ? '#FFF5F8' : 'none',
            }}
          />
        </motion.button>

        {/* Discount badge */}
        {hasDiscount && !isOutOfStock && (
          <div className="absolute top-3 left-3 z-20 badge-discount">
            -{discountPercent}%
          </div>
        )}

        {/* Product image */}
        {(product.images?.[0] || product.image_url) ? (
          <img
            src={product.images?.[0] || product.image_url}
            alt={product.name}
            className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
            style={{ transition: 'transform 1.2s cubic-bezier(0.19,1,0.22,1)' }}
          />
        ) : null}
        {/* Fallback placeholder when no image */}
        <div
          style={{
            display: (product.images?.[0] || product.image_url) ? 'none' : 'flex',
            position: 'absolute', inset: 0,
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #FFF5F8 0%, #FCEAF1 100%)',
          }}
        >
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="56" height="56" rx="16" fill="#F9DDE8"/>
            <path d="M14 38l10-14 7 9 5-6 10 11H14z" fill="#D4789A" fillOpacity="0.35"/>
            <circle cx="38" cy="20" r="4" fill="#D4789A" fillOpacity="0.5"/>
          </svg>
          <span style={{ fontSize: 10, color: '#D4789A', marginTop: 8, fontFamily: 'Jost,sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>
            Hampious
          </span>
        </div>

        {/* Hover overlay — Add to Cart */}
        {!isOutOfStock && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col justify-end p-4"
            style={{ background: 'linear-gradient(to top, rgba(26,15,21,0.72) 0%, rgba(26,15,21,0.22) 55%, transparent 100%)' }}
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              onClick={handleAddToCart}
              initial={{ y: 12, opacity: 0 }}
              whileHover={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
              data-testid={`add-to-cart-btn-${product.id}`}
              className="w-full flex items-center justify-center gap-2 text-[0.65rem] font-semibold tracking-[0.18em] uppercase transition-all duration-300"
              style={{
                background: 'rgba(255,245,248,0.96)',
                border: '1px solid rgba(255,245,248,0.5)',
                color: '#1A0F15',
                padding: '0.65rem 1rem',
                borderRadius: '2px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = PINK; e.currentTarget.style.borderColor = PINK; e.currentTarget.style.color = '#FFF5F8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,245,248,0.96)'; e.currentTarget.style.borderColor = 'rgba(255,245,248,0.5)'; e.currentTarget.style.color = '#1A0F15'; }}
            >
              <ShoppingCart size={13} />
              Add to Cart
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-4 space-y-2 bg-white" style={{ borderTop: '1px solid rgba(212,120,154,0.08)' }}>
        <h3
          className="font-heading font-light text-[1.1rem] leading-tight line-clamp-2 transition-colors duration-400"
          style={{ color: 'rgba(30,26,23,0.82)' }}
          onMouseEnter={e => (e.currentTarget.style.color = ROSE)}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(30,26,23,0.82)')}
          data-testid={`product-name-${product.id}`}
        >
          {product.name}
        </h3>

        {product.description && (
          <p className="text-[0.74rem] leading-relaxed line-clamp-2"
             style={{ color: 'rgba(30,26,23,0.38)', fontFamily: 'Jost, sans-serif' }}>
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <span
            className="font-heading text-[1.35rem] font-semibold"
            style={{ color: ROSE, fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            data-testid={`product-price-${product.id}`}
          >
            ₹{Number(displayPrice).toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <span className="text-[0.82rem] line-through"
                  style={{ color: 'rgba(30,26,23,0.38)', fontFamily: 'Jost, sans-serif' }}>
              ₹{Number(mrpPrice).toLocaleString('en-IN')}
            </span>
          )}
          {hasDiscount && (
            <span className="text-[0.7rem] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(184,78,120,0.12)', color: '#B84E78', fontFamily: 'Jost, sans-serif' }}>
              {discountPercent}% off
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
