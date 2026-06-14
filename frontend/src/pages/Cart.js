import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Trash2, ShoppingBag, ArrowRight, Plus, Minus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, fetchCart, getCartTotal } = useCart();
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, [cart]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);

      const productIds = cart.items.map(item => item.product_id);

      // Load localStorage products as base fallback
      const localProducts = JSON.parse(localStorage.getItem('hamp_products') || '[]');
      const productsMap = {};
      localProducts.forEach(p => {
        productsMap[String(p.id)] = p;
      });

      // Try backend for each product (overrides localStorage if found)
      const productPromises = productIds.map(id =>
        API.get(`/products/${id}`).catch(() => null)
      );
      const responses = await Promise.all(productPromises);
      responses.forEach(response => {
        if (response?.data) {
          productsMap[String(response.data.id)] = response.data;
        }
      });

      setProducts(productsMap);
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner-premium" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 md:py-16 px-6 md:px-12 lg:px-24" data-testid="cart-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {cart.items.length === 0 ? (
          <motion.div 
            className="text-center py-20 bg-card rounded-3xl border border-border/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-testid="empty-cart"
          >
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-medium text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet</p>
            <Button
              onClick={() => navigate('/products')}
              className="button-premium bg-primary hover:bg-primary/90 h-12 px-8 rounded-full"
              data-testid="continue-shopping-btn"
            >
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4" data-testid="cart-items">
              {cart.items.map((item, index) => {
                const product = products[String(item.product_id)];
                const name    = product?.name || item?.product_name || `Product #${item.product_id}`;
                const image   = product?.images?.[0] || product?.image_url || null;
                const price   = Number(item.price || 0);
                const qty     = Number(item.quantity || 1);

                return (
                  <motion.div
                    key={item.product_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-5 p-5 bg-card rounded-2xl border border-border/50 hover:border-primary/20 transition-colors"
                    data-testid={`cart-item-${item.product_id}`}
                  >
                    {/* Product image / placeholder */}
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                      {image ? (
                        <img
                          src={image}
                          alt={name}
                          className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <ShoppingBag className="h-10 w-10 text-muted-foreground opacity-40" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-lg font-medium text-foreground mb-1 truncate">{name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">₹{price.toFixed(0)} each</p>

                      {/* Quantity controls + price */}
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => qty <= 1 ? handleRemove(item.product_id) : updateQuantity(item.product_id, qty - 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors"
                            style={{ borderColor: '#D4789A', color: '#B84E78', background: '#fff' }}
                            data-testid={`decrease-qty-${item.product_id}`}
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center font-semibold text-foreground">{qty}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, qty + 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors"
                            style={{ borderColor: '#D4789A', color: '#fff', background: '#D4789A' }}
                            data-testid={`increase-qty-${item.product_id}`}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <span className="font-bold text-lg" style={{ color: '#B84E78' }}>
                          ₹{(price * qty).toFixed(0)}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.product_id)}
                      className="rounded-full h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                      data-testid={`remove-item-btn-${item.product_id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="checkout-card sticky top-24"
                data-testid="order-summary"
              >
                <h2 className="font-heading text-xl font-medium mb-6 text-foreground">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({cart.items.length} items)</span>
                    <span className="font-medium text-foreground" data-testid="cart-subtotal">₹{getCartTotal().toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-emerald-600">FREE</span>
                  </div>
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Total</span>
                      <span className="font-semibold text-xl text-primary" data-testid="cart-total">₹{getCartTotal().toFixed(0)}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => navigate('/checkout')}
                  className="w-full button-premium bg-primary hover:bg-primary/90 h-14 rounded-full text-base font-medium"
                  data-testid="proceed-to-checkout-btn"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <button
                  onClick={() => navigate('/products')}
                  className="w-full text-center text-sm text-muted-foreground hover:text-primary mt-4 transition-colors"
                >
                  Continue Shopping
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}