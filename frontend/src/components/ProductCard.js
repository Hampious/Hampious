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
      className="cursor-pointer bg-white rounded-xl overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid rgba(212,120,154,0.12)' }}
      onClick={handleCardClick}
      data-testid={`product-card-${product.id}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', background: '#FFF5F8' }}>

        {/* Wishlist button */}
        <button
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          data-testid={`wishlist-btn-${product.id}`}
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: isWishlisted ? PINK : 'rgba(255,255,255,0.9)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
          }}
        >
          <Heart size={13} style={{ color: isWishlisted ? '#fff' : PINK, fill: isWishlisted ? '#fff' : 'none' }} />
        </button>

        {/* Discount badge */}
        {hasDiscount && !isOutOfStock && (
          <div className="absolute top-2 left-2 z-20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
               style={{ background: ROSE }}>
            -{discountPercent}%
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-30 flex items-center justify-center"
               style={{ background: 'rgba(255,245,248,0.75)' }}>
            <span className="text-[10px] tracking-widest uppercase font-medium px-3 py-1 rounded"
                  style={{ color: '#B84E78', border: '1px solid rgba(212,120,154,0.3)' }}>
              Out of Stock
            </span>
          </div>
        )}

        {/* Product image */}
        {(product.images?.[0] || product.image_url) ? (
          <img
            src={product.images?.[0] || product.image_url}
            alt={product.name}
            className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
            style={{ transition: 'transform 0.4s ease' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#FFF5F8,#FCEAF1)' }}>
            <span style={{ fontSize: 11, color: PINK, fontFamily: 'Jost,sans-serif', letterSpacing: '0.1em' }}>HAMPIOUS</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 10px 12px' }}>
        <h3 style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 600, color: '#1A0F15',
                     lineHeight: 1.3, marginBottom: 6, overflow: 'hidden', display: '-webkit-box',
                     WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
            data-testid={`product-name-${product.id}`}>
          {product.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 800, color: ROSE }}
                data-testid={`product-price-${product.id}`}>
            ₹{Number(displayPrice).toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#999', textDecoration: 'line-through' }}>
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

        {/* Add to Cart button */}
        {!isOutOfStock && (
          <button
            onClick={handleAddToCart}
            data-testid={`add-to-cart-btn-${product.id}`}
            className="w-full flex items-center justify-center gap-1.5"
            style={{ background: '#FFF0F5', border: `1px solid ${PINK}`, borderRadius: 8,
                     padding: '7px 0', fontFamily: 'Jost, sans-serif', fontSize: 12,
                     fontWeight: 700, color: ROSE, cursor: 'pointer' }}>
            <ShoppingCart size={12} />
            Add to Cart
          </button>
        )}
      </div>
    </motion.div>
  );
};
