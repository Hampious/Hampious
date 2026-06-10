import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api'; // Replaced axios import
import { ShoppingCart, ChevronLeft, ChevronRight, Minus, Plus, Heart, Package, Truck, Shield, Star, Send, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// Removed const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [canReview, setCanReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Reset image index when product ID changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [id]);

  useEffect(() => {
    fetchProduct();
    fetchSimilarProducts();
    fetchReviews();
    if (user) checkCanReview();
  }, [id, user]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      let found = null;

      // 1. Try backend
      try {
        const response = await API.get(`/products/${id}`);
        if (response.data) found = response.data;
      } catch {}

      // 2. Fallback: search hamp_products localStorage
      if (!found) {
        const local = JSON.parse(localStorage.getItem('hamp_products') || '[]');
        found = local.find(p => String(p.id) === String(id)) || null;
      }

      if (found) {
        // Normalise fields so the page never crashes
        setProduct({
          ...found,
          price:         Number(found.price || 0),
          discount_price: found.discount_price ? Number(found.discount_price) : null,
          original_price: found.original_price ? Number(found.original_price) : null,
          stock:         found.stock != null ? Number(found.stock) : null,
          images:        Array.isArray(found.images) && found.images.length > 0
                           ? found.images
                           : (found.image_url ? [found.image_url] : []),
        });
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarProducts = async () => {
    try {
      // Try backend; fall back to products in same category from localStorage
      const response = await API.get(`/products/${id}/similar`);
      setSimilarProducts(Array.isArray(response.data) ? response.data : []);
    } catch {
      try {
        const local  = JSON.parse(localStorage.getItem('hamp_products') || '[]');
        const cur    = local.find(p => String(p.id) === String(id));
        const similar = cur
          ? local.filter(p => String(p.id) !== String(id) && p.category === cur.category).slice(0, 4)
          : [];
        setSimilarProducts(similar);
      } catch {}
    }
  };

  const fetchReviews = async () => {
    try {
      // Replaced axios with API
      const response = await API.get(`/products/${id}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const checkCanReview = async () => {
    try {
      // Replaced axios with API
      const response = await API.get(`/users/can-review/${id}`);
      setCanReview(response.data.can_review);
    } catch (error) {
      setCanReview(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please login to submit a review');
      navigate('/auth');
      return;
    }
    if (!reviewForm.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }
    
    setSubmittingReview(true);
    try {
      // Replaced axios with API
      await API.post(`/products/${id}/reviews`, reviewForm);
      toast.success('Review submitted successfully!');
      setReviewForm({ rating: 5, comment: '' });
      fetchReviews();
      fetchProduct(); // Update avg rating
      setCanReview(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/auth');
      return;
    }
    
    // Safety check for stock — null means stock not tracked, treat as available
    if (!product || (product.stock != null && product.stock <= 0)) {
      toast.error('This product is out of stock');
      return;
    }

    try {
      const price = product.discount_price || product.price;
      await addToCart(product.id, quantity, price);
      toast.success(`Added ${quantity} item(s) to cart!`);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please login to continue');
      navigate('/auth');
      return;
    }

    // Safety check for stock — null means stock not tracked, treat as available
    if (!product || (product.stock != null && product.stock <= 0)) {
      toast.error('This product is out of stock');
      return;
    }

    try {
      const price = product.discount_price || product.price;
      await addToCart(product.id, quantity, price);
      navigate('/checkout');
    } catch (error) {
      toast.error('Failed to proceed');
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      navigate('/auth');
      return;
    }
    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product.id);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const renderStars = (rating, interactive = false, onSelect = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onSelect && onSelect(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              className={`h-5 w-5 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner-premium" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">Product not found</p>
          <Button onClick={() => navigate('/products')} variant="outline" className="rounded-full">Browse Products</Button>
        </div>
      </div>
    );
  }

  // Selling price = discount_price if set, otherwise price field
  // MRP (crossed-out) = original_price if higher than selling price
  const displayPrice    = Number(product.discount_price || product.price || 0);
  const mrpPrice        = Number(product.original_price || 0);
  const hasDiscount     = mrpPrice > 0 && mrpPrice > displayPrice;
  const discountPercent = hasDiscount ? Math.round(((mrpPrice - displayPrice) / mrpPrice) * 100) : 0;
  const avgRating = product.average_rating || 0;
  const reviewCount = product.review_count || reviews.length;
  
  // Safe images array
  const images = Array.isArray(product.images) && product.images.filter(Boolean).length > 0
    ? product.images.filter(Boolean)
    : null;

  return (
    <div className="min-h-screen bg-background py-10 md:py-16 px-6 md:px-12 lg:px-24" data-testid="product-details-page">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 rounded-full hover:bg-secondary">
          <ChevronLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Image Gallery */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="relative aspect-square rounded-3xl overflow-hidden mb-4 bg-card border border-border/30 premium-shadow">
              {images ? (
                <img
                  src={images[currentImageIndex] || images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-pink-50">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none"><rect width="80" height="80" rx="20" fill="#F9DDE8"/><path d="M18 56l16-22 10 14 8-10 14 18H18z" fill="#D4789A" fillOpacity=".4"/><circle cx="56" cy="28" r="6" fill="#D4789A" fillOpacity=".6"/></svg>
                  <span style={{ fontSize: 12, color: '#D4789A', marginTop: 10, fontFamily: 'Jost,sans-serif', letterSpacing: '0.1em' }}>HAMPIOUS</span>
                </div>
              )}
              {hasDiscount && <div className="absolute top-5 left-5 badge-discount">{discountPercent}% OFF</div>}
              {images && images.length > 1 && (
                <>
                  <button onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full p-2.5 transition-all premium-shadow">
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </button>
                  <button onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full p-2.5 transition-all premium-shadow">
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </button>
                </>
              )}
            </div>
            {images && images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button key={index} onClick={() => setCurrentImageIndex(index)} className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-border/50 opacity-70 hover:opacity-100'}`}>
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="space-y-6">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">{product.name}</h1>
              {/* Rating */}
              {reviewCount > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  {renderStars(avgRating)}
                  <span className="text-sm text-muted-foreground">({avgRating.toFixed(1)}) · {reviewCount} reviews</span>
                </div>
              )}
              <div className="flex items-baseline gap-4 mb-4">
                <span className="font-body text-3xl font-bold text-primary">₹{Number(displayPrice).toFixed(0)}</span>
                {hasDiscount && <span className="text-xl text-muted-foreground line-through">₹{Number(mrpPrice).toFixed(0)}</span>}
                {hasDiscount && <span className="text-sm font-bold px-2 py-1 rounded" style={{ background: 'rgba(184,78,120,0.12)', color: '#B84E78' }}>{discountPercent}% off</span>}
              </div>
              {product.stock > 0 ? (
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  <Package className="h-4 w-4" /> In Stock ({product.stock} available)
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-sm font-medium">Out of Stock</div>
              )}
            </div>

            <div className="border-t border-b border-border py-6">
              <h3 className="font-heading text-lg font-medium mb-3 text-foreground">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Free Shipping</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">7 Days Return</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
                <Package className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Secure Payment</span>
              </div>
            </div>

            {/* Actions Section - Only if stock > 0 */}
            <div className="space-y-5 pt-4">
              {product.stock > 0 ? (
                <>
                  <div className="flex items-center gap-4">
                    <label className="font-body font-medium text-foreground">Quantity:</label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="rounded-full h-10 w-10 p-0 border-border">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold text-lg text-foreground">{quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock} className="rounded-full h-10 w-10 p-0 border-border">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleBuyNow} className="flex-1 button-premium bg-primary hover:bg-primary/90 h-14 rounded-full text-base font-medium">Buy Now</Button>
                    <Button onClick={handleAddToCart} variant="outline" className="flex-1 h-14 rounded-full text-base font-medium border-2 border-border hover:border-primary/30 hover:bg-secondary">
                      <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
                    </Button>
                    <Button onClick={handleToggleWishlist} variant="outline" className={`h-14 w-14 rounded-full p-0 border-2 ${isInWishlist(product.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/30'}`}>
                      <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-3">
                  <Button disabled className="flex-1 h-14 rounded-full text-base font-medium bg-secondary text-muted-foreground">
                    Out of Stock
                  </Button>
                  <Button onClick={handleToggleWishlist} variant="outline" className={`h-14 w-14 rounded-full p-0 border-2 ${isInWishlist(product.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/30'}`}>
                    <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <section className="py-16 border-t border-border" data-testid="reviews-section">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-8">Customer Reviews</h2>

            {/* Write Review Form */}
            {canReview && (
              <div className="bg-card rounded-2xl p-6 border border-border/50 mb-8">
                <h3 className="font-heading text-lg font-semibold mb-4 text-foreground">Write a Review</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Your Rating</label>
                    {renderStars(reviewForm.rating, true, (star) => setReviewForm({...reviewForm, rating: star}))}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Your Review</label>
                    <Textarea
                      placeholder="Share your experience with this product..."
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                      className="min-h-[100px] rounded-xl"
                    />
                  </div>
                  <Button onClick={handleSubmitReview} disabled={submittingReview} className="bg-primary hover:bg-primary/90 rounded-full">
                    {submittingReview ? 'Submitting...' : <><Send className="h-4 w-4 mr-2" /> Submit Review</>}
                  </Button>
                </div>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-card p-5 rounded-2xl border border-border/50">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">{review.user_name}</h4>
                          <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        {renderStars(review.rating)}
                        <p className="text-muted-foreground mt-2">{review.comment}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </motion.div>
        </section>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="py-16 border-t border-border">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-8">You May Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarProducts.map((product, index) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>
        )}
      </motion.div>
    </div>
  );
}