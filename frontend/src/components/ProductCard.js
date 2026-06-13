import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const PINK = '#D4789A';
const ROSE = '#B84E78';

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

  const handleBuyNow = async (e) => {
    e.stopPropagation();
    if (isOutOfStock) { toast.error('This product is out of stock'); return; }
    if (!user) { toast.error('Please sign in to continue'); navigate('/auth'); return; }
    try {
      await addToCart(product.id, 1, product.discount_price || product.price);
      navigate('/checkout');
    } catch { toast.error('Failed to proceed'); }
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
    navigate(`/products/${product.id}`);
  };

  const displayPrice    = Number(product.discount_price || product.price || 0);
  const mrpPrice        = Number(product.original_price || 0);
  const hasDiscount     = mrpPrice > 0 && mrpPrice > displayPrice;
  const discountPercent = hasDiscount ? Math.round(((mrpPrice - displayPrice) / mrpPrice) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="cursor-pointer bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 2px 16px rgba(212,120,154,0.13)', border: '1px solid rgba(212,120,154,0.15)' }}
      onClick={handleCardClick}
      data-testid={`product-card-${product.id}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ width: '100%', paddingBottom: '100%', background: '#FFF5F8', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0 }}>

          {/* Wishlist button */}
          <button
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            data-testid={`wishlist-btn-${product.id}`}
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 20,
              width: 30, height: 30, borderRadius: '50%',
              background: isWishlisted ? PINK : 'rgba(255,255,255,0.92)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            <Heart size={14} style={{ color: isWishlisted ? '#fff' : PINK, fill: isWishlisted ? '#fff' : 'none' }} />
          </button>

          {/* Discount badge */}
          {hasDiscount && !isOutOfStock && (
            <div style={{
              position: 'absolute', top: 8, left: 8, zIndex: 20,
              background: ROSE, color: '#fff', fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 20, fontFamily: 'Jost, sans-serif',
            }}>
              -{discountPercent}%
            </div>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 30,
              background: 'rgba(255,245,248,0.78)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
                             color: '#B84E78', border: '1px solid rgba(212,120,154,0.3)',
                             padding: '4px 10px', borderRadius: 4, fontFamily: 'Jost, sans-serif' }}>
                Out of Stock
              </span>
            </div>
          )}

          {/* Product image */}
          {(product.images?.[0] || product.image_url) ? (
            <img
              src={product.images?.[0] || product.image_url}
              alt={`${product.name} - Gift Hamper in Bangalore | Hampious`}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                objectPosition: 'center top',
                filter: isOutOfStock ? 'grayscale(0.5) opacity(0.7)' : 'none',
              }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg,#FFF5F8,#FCEAF1)',
            }}>
              <span style={{ fontSize: 11, color: PINK, fontFamily: 'Jost,sans-serif', letterSpacing: '0.1em' }}>HAMPIOUS</span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 10px 12px' }}>
        {/* Name */}
        <h3 style={{
          fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 600, color: '#1A0F15',
          lineHeight: 1.35, marginBottom: 5,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}
          data-testid={`product-name-${product.id}`}>
          {product.name}
        </h3>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 800, color: ROSE }}
                data-testid={`product-price-${product.id}`}>
            ₹{Number(displayPrice).toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#aaa', textDecoration: 'line-through' }}>
              ₹{Number(mrpPrice).toLocaleString('en-IN')}
            </span>
          )}
          {hasDiscount && (
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, fontWeight: 700,
                           color: '#2e7d32', background: '#e8f5e9', borderRadius: 4, padding: '1px 5px' }}>
              {discountPercent}% off
            </span>
          )}
        </div>

        {/* Buttons */}
        {!isOutOfStock && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleAddToCart}
              data-testid={`add-to-cart-btn-${product.id}`}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                background: '#fff', border: `1.5px solid ${PINK}`, borderRadius: 10,
                padding: '8px 0', fontFamily: 'Jost, sans-serif', fontSize: 11,
                fontWeight: 700, color: ROSE, cursor: 'pointer',
              }}>
              <ShoppingCart size={11} />
              Cart
            </button>
            <button
              onClick={handleBuyNow}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${PINK}, ${ROSE})`,
                border: 'none', borderRadius: 10,
                padding: '8px 0', fontFamily: 'Jost, sans-serif', fontSize: 11,
                fontWeight: 700, color: '#fff', cursor: 'pointer',
              }}>
              Buy Now
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
