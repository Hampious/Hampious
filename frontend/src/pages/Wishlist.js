import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../api'; // ✅ FIX 1: Use centralized API
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

export default function Wishlist() {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState({});

  useEffect(() => {
    fetchProductDetails();
  }, [wishlist]);

  const fetchProductDetails = async () => {
    // ✅ FIX 2: Optimization - Don't call API if wishlist is empty
    if (!wishlist?.items?.length) {
      setProducts({});
      return;
    }

    try {
      const productIds = wishlist.items.map(item => item.product_id);
      
      // ✅ FIX 3: Use API instance instead of axios
      const productPromises = productIds.map(id => 
        API.get(`/products/${id}`).catch(() => null)
      );
      
      const responses = await Promise.all(productPromises);
      
      const productsMap = {};
      responses.forEach(response => {
        if (response?.data) {
          productsMap[response.data.id] = response.data;
        }
      });
      setProducts(productsMap);
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleMoveToCart = async (productId) => {
    try {
      const product = products[productId];
      
      // ✅ FIX 4: Safety Check - Prevent crash if product data isn't loaded
      if (!product) {
        toast.error('Product details not available');
        return;
      }

      const price = product.discount_price || product.price;
      await addToCart(productId, 1, price);
      await removeFromWishlist(productId);
      toast.success('Moved to cart!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to move to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="py-20 px-6 md:px-12 lg:px-24" data-testid="wishlist-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="font-heading text-4xl md:text-6xl font-medium mb-12">My Wishlist</h1>

        {!wishlist?.items?.length ? (
          <div className="text-center py-20" data-testid="empty-wishlist">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-6">Your wishlist is empty</p>
            <Button
              onClick={() => navigate('/products')}
              className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-full"
              data-testid="browse-products-btn"
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="wishlist-items">
            {wishlist.items.map((item) => {
              const product = products[item.product_id];
              // Don't render card until product data is fetched
              if (!product) return null;

              const displayPrice = product.discount_price || product.price;

              return (
                <motion.div
                  key={item.product_id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden group"
                  data-testid={`wishlist-item-${item.product_id}`}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {/* ✅ FIX 5: Safe Image Fallback */}
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/400?text=No+Image'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                      onClick={() => navigate(`/products/${product.id}`)}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Error'; }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.product_id);
                      }}
                      className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors shadow-sm"
                      data-testid={`remove-wishlist-${item.product_id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading text-lg font-normal mb-2 line-clamp-1">
                        {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {product.description}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-medium text-lg">₹{Number(displayPrice).toFixed(2)}</span>
                      {product.discount_price && (
                        <span className="text-sm line-through text-muted-foreground">
                          ₹{Number(product.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleMoveToCart(item.product_id)}
                      className="w-full bg-primary hover:bg-primary/90 rounded-full"
                      size="sm"
                      data-testid={`move-to-cart-${item.product_id}`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Move to Cart
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}