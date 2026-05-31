import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

// ── localStorage helpers for offline fallback ──────────────────────────────
const LS_KEY = 'hamp_cart';
const readLocal  = ()      => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '{"items":[]}'); } catch { return { items: [] }; } };
const writeLocal = (cart)  => { try { localStorage.setItem(LS_KEY, JSON.stringify(cart)); } catch {} };

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(readLocal());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart({ items: [] });
      writeLocal({ items: [] });
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await API.get('/cart');
      const data = response.data || { items: [] };
      setCart(data);
      writeLocal(data);
    } catch (error) {
      // Backend unavailable — use localStorage cart
      const local = readLocal();
      setCart(local);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity, price) => {
    try {
      const response = await API.post('/cart/add', { product_id: productId, quantity, price });
      const data = response.data || { items: [] };
      setCart(data);
      writeLocal(data);
    } catch (error) {
      // Fallback: add to local cart
      const local = readLocal();
      const existing = local.items.find(i => String(i.product_id) === String(productId));
      if (existing) {
        existing.quantity += quantity;
      } else {
        local.items.push({ product_id: productId, quantity, price, added_at: new Date().toISOString() });
      }
      writeLocal(local);
      setCart({ ...local });
      // Re-throw only if it's a real auth error, otherwise swallow
      if (error.response?.status === 401) throw error;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await API.post(`/cart/remove/${productId}`);
      const data = response.data || { items: [] };
      setCart(data);
      writeLocal(data);
    } catch (error) {
      // Fallback: remove from local cart
      const local = readLocal();
      local.items = local.items.filter(i => String(i.product_id) !== String(productId));
      writeLocal(local);
      setCart({ ...local });
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const response = await API.put(`/cart/update/${productId}`, { quantity });
      const data = response.data || { items: [] };
      setCart(data);
      writeLocal(data);
    } catch (error) {
      const local = readLocal();
      if (quantity <= 0) {
        local.items = local.items.filter(i => String(i.product_id) !== String(productId));
      } else {
        const item = local.items.find(i => String(i.product_id) === String(productId));
        if (item) item.quantity = quantity;
      }
      writeLocal(local);
      setCart({ ...local });
    }
  };

  const clearCart = async () => {
    try {
      await API.post('/cart/clear');
    } catch {}
    const empty = { items: [] };
    setCart(empty);
    writeLocal(empty);
  };

  const getCartTotal = () =>
    (cart.items || []).reduce((total, item) => total + (item.price * item.quantity), 0);

  const getCartCount = () =>
    (cart.items || []).reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      fetchCart,
      getCartTotal,
      getCartCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
