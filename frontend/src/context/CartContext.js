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
      if (data.items && data.items.length > 0) {
        // Backend has real data — use it and sync to localStorage
        setCart(data);
        writeLocal(data);
      } else {
        // Backend returned empty — keep any existing localStorage cart
        const local = readLocal();
        setCart(local);
      }
    } catch (error) {
      // Backend unavailable — use localStorage cart
      const local = readLocal();
      setCart(local);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity, price) => {
    // Optimistically update localStorage and state immediately
    const local = readLocal();
    const existing = local.items.find(i => String(i.product_id) === String(productId));
    if (existing) {
      existing.quantity += quantity;
    } else {
      local.items.push({ product_id: productId, quantity, price, added_at: new Date().toISOString() });
    }
    writeLocal(local);
    setCart({ ...local });

    // Sync to backend (best effort — don't let backend errors undo the local add)
    try {
      const response = await API.post('/cart/add', { product_id: productId, quantity, price });
      const data = response.data;
      if (data?.items?.length > 0) {
        // Backend confirmed with real data — use that as source of truth
        setCart(data);
        writeLocal(data);
      }
    } catch (error) {
      // Re-throw only for auth errors so callers can redirect to login
      if (error.response?.status === 401) throw error;
      // Otherwise keep the optimistic local state
    }
  };

  const removeFromCart = async (productId) => {
    // Remove locally first
    const local = readLocal();
    local.items = local.items.filter(i => String(i.product_id) !== String(productId));
    writeLocal(local);
    setCart({ ...local });
    // Sync to backend best-effort
    try { await API.post(`/cart/remove/${productId}`); } catch {}
  };

  const updateQuantity = async (productId, quantity) => {
    // Update locally first
    const local = readLocal();
    if (quantity <= 0) {
      local.items = local.items.filter(i => String(i.product_id) !== String(productId));
    } else {
      const item = local.items.find(i => String(i.product_id) === String(productId));
      if (item) item.quantity = quantity;
    }
    writeLocal(local);
    setCart({ ...local });
    // Sync to backend best-effort
    try { await API.put(`/cart/update/${productId}`, { quantity }); } catch {}
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
