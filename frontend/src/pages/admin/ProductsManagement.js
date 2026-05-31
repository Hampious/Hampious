import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminGet, adminPost, adminPut, adminDelete, handleUnauth, parseError } from '../../utils/adminApi';

const PLUM = '#1A0F15';
const PINK = '#D4789A';
const ROSE = '#B84E78';
const BLUSH = '#FFF5F8';

const DEFAULT_CATEGORIES = ['birthday', 'love', 'period', 'sorry', 'festive', 'self-care', 'other'];

function getCategories() {
  try {
    const stored = JSON.parse(localStorage.getItem('hamp_categories') || '[]');
    if (stored.length > 0) return stored.map(c => c.slug || c.name);
  } catch {}
  return DEFAULT_CATEGORIES;
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #f3d0dd', borderTopColor: PINK, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StockBadge({ stock }) {
  if (stock === 0) return <span style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Out of Stock</span>;
  if (stock <= 3) return <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Only {stock} left</span>;
  return <span style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>In Stock</span>;
}

const emptyForm = {
  name: '', price: '', original_price: '', category: '', description: '',
  images: [''], stock: '', tags: '', is_featured: false,
};

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #f3d0dd',
  fontFamily: 'Jost, sans-serif', fontSize: 14, color: PLUM, background: BLUSH,
  outline: 'none', boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: 12, fontWeight: 600, color: '#7c5a6a', textTransform: 'uppercase',
  letterSpacing: '0.05em', display: 'block', marginBottom: 6,
};

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState(getCategories());

  useEffect(() => {
    // Refresh categories from backend or localStorage when modal opens
    adminGet('/categories').then(async (res) => {
      if (res.ok) {
        const data = await res.json().catch(() => []);
        const list = Array.isArray(data) ? data : (data.categories || []);
        if (list.length > 0) {
          localStorage.setItem('hamp_categories', JSON.stringify(list));
          setCategories(list.map(c => c.slug || c.name));
        }
      } else {
        setCategories(getCategories());
      }
    }).catch(() => setCategories(getCategories()));
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        price: product.price ?? '',
        original_price: product.original_price ?? '',
        category: product.category || '',
        description: product.description || '',
        images: product.images?.length ? [...product.images] : [''],
        stock: product.stock ?? '',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
        is_featured: product.is_featured || false,
      });
    } else {
      setForm(emptyForm);
    }
  }, [product]);

  const handleFileUpload = (i, file) => {
    if (!file) return;
    // Compress image to max 800px and ~80% quality to keep size manageable
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.80);
        setForm(f => {
          const imgs = [...f.images];
          imgs[i] = compressed;
          return { ...f, images: imgs };
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const addImageSlot = () => setForm(f => ({ ...f, images: [...f.images, ''] }));

  const removeImage = (i) => setForm(f => ({
    ...f,
    images: f.images.length > 1 ? f.images.filter((_, idx) => idx !== i) : [''],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token') || '';
      const API = 'http://localhost:8000/api/admin';

      const payload = {
        name: form.name,
        price: parseFloat(form.price) || 0,
        original_price: form.original_price !== '' ? (parseFloat(form.original_price) || null) : null,
        category: form.category,
        description: form.description,
        images: form.images.filter(Boolean),
        stock: parseInt(form.stock) || 0,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        is_featured: form.is_featured,
      };

      const saveLocalProduct = (savedProduct) => {
        const stored = JSON.parse(localStorage.getItem('hamp_products') || '[]');
        if (product) {
          const idx = stored.findIndex(p => p.id === product.id);
          if (idx >= 0) stored[idx] = savedProduct;
          else stored.push(savedProduct);
        } else {
          stored.push(savedProduct);
        }
        localStorage.setItem('hamp_products', JSON.stringify(stored));
      };

      let res;
      let networkFailed = false;

      if (product) {
        // ── Edit: try JSON body first, then query-params fallback ──
        try {
          res = await adminPut(`/products/${product.id}`, payload);
        } catch { networkFailed = true; }
        if (!networkFailed && res.status === 422) {
          const p = new URLSearchParams({ token, name: payload.name, price: String(payload.price), category: payload.category, stock: String(payload.stock), description: payload.description || '' });
          res = await fetch(`${API}/products/${product.id}?${p}`, { method: 'PUT' });
        }
      } else {
        // ── Create: try JSON body first ──
        try {
          res = await adminPost('/products', payload);
        } catch { networkFailed = true; }
        if (!networkFailed && res.status === 422) {
          const p = new URLSearchParams({ token, name: payload.name, price: String(payload.price), category: payload.category, stock: String(payload.stock), description: payload.description || '' });
          res = await fetch(`${API}/products?${p}`, { method: 'POST' });
        }
      }

      if (networkFailed) {
        // Backend not reachable — save locally
        const localProduct = { ...payload, id: product ? product.id : Date.now() };
        saveLocalProduct(localProduct);
        onSave();
        return;
      }

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin';
        return;
      }
      if (!res.ok) {
        const msg = await parseError(res);
        setError(msg);
        return;
      }

      // Sync successful response to localStorage
      try {
        const saved = await res.clone().json();
        saveLocalProduct(saved);
      } catch { saveLocalProduct({ ...payload, id: product ? product.id : Date.now() }); }

      onSave();
    } catch (err) {
      setError(err.message || 'Connection error — is the backend running?');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,15,21,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(26,15,21,0.2)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 600, color: PLUM, margin: 0 }}>
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#7c5a6a', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Product Name */}
          <div>
            <label style={labelStyle}>Product Name *</label>
            <input
              required
              style={inputStyle}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Luxury Gift Hamper"
            />
          </div>

          {/* Price Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Price (₹) *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                style={inputStyle}
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="1999"
              />
            </div>
            <div>
              <label style={labelStyle}>Original Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                style={inputStyle}
                value={form.original_price}
                onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))}
                placeholder="2499 (strikethrough)"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <select
              style={inputStyle}
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              <option value="">Select category</option>
              {categories.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Product description..."
            />
          </div>

          {/* Images */}
          <div>
            <label style={labelStyle}>Product Images</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 8 }}>
              {form.images.map((img, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative', borderRadius: 12,
                    border: `2px dashed ${img ? PINK : '#f3d0dd'}`,
                    overflow: 'hidden', background: BLUSH,
                    aspectRatio: '1', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexDirection: 'column',
                  }}
                >
                  {img ? (
                    <>
                      <img
                        src={img}
                        alt={`product-${i}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          background: 'rgba(220,38,38,0.9)', color: '#fff',
                          border: 'none', borderRadius: '50%', width: 22, height: 22,
                          cursor: 'pointer', fontSize: 12, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', zIndex: 2,
                        }}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: 8 }}>
                      <span style={{ fontSize: 28, marginBottom: 4 }}>📷</span>
                      <span style={{ fontSize: 10, color: '#a0728a', textAlign: 'center', fontWeight: 600, letterSpacing: '0.05em' }}>TAP TO UPLOAD</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleFileUpload(i, e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
              ))}
              {/* Add more slot */}
              <button
                type="button"
                onClick={addImageSlot}
                style={{
                  aspectRatio: '1', borderRadius: 12,
                  border: `2px dashed ${PINK}`,
                  background: 'rgba(212,120,154,0.05)',
                  color: ROSE, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600,
                  fontFamily: 'Jost, sans-serif',
                }}
              >
                <span style={{ fontSize: 24 }}>+</span>
                <span style={{ fontSize: 10, letterSpacing: '0.05em' }}>ADD MORE</span>
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#a0728a', margin: 0 }}>First image is the main product photo.</p>
          </div>

          {/* Stock & Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Stock Quantity *</label>
              <input
                required
                type="number"
                min="0"
                style={inputStyle}
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                placeholder="50"
              />
            </div>
            <div>
              <label style={labelStyle}>Tags (comma-separated)</label>
              <input
                style={inputStyle}
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="gift, luxury, premium"
              />
            </div>
          </div>

          {/* Featured checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              id="is_featured"
              checked={form.is_featured}
              onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: PINK }}
            />
            <label htmlFor="is_featured" style={{ fontSize: 14, color: PLUM, fontWeight: 500, cursor: 'pointer' }}>
              Featured on Homepage
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            style={{
              background: saving ? '#c4849e' : ROSE, color: '#fff', border: 'none',
              borderRadius: 12, padding: '14px', fontFamily: 'Jost, sans-serif',
              fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 4,
            }}
          >
            {saving ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { navigate('/admin'); return; }
    fetchProducts();
  }, [navigate]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGet('/products');
      if (handleUnauth(res, navigate)) return;
      if (!res.ok) {
        const stored = JSON.parse(localStorage.getItem('hamp_products') || '[]');
        if (stored.length > 0) { setProducts(stored); return; }
        setError(`Failed to load products (HTTP ${res.status})`);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.products || []);
      setProducts(list);
      localStorage.setItem('hamp_products', JSON.stringify(list));
    } catch (e) {
      const stored = JSON.parse(localStorage.getItem('hamp_products') || '[]');
      setProducts(stored);
      if (stored.length === 0) setError('Network error — could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      let useLocal = false;
      try {
        const res = await adminDelete(`/products/${id}`);
        if (handleUnauth(res, navigate)) return;
        if (!res.ok) useLocal = true;
      } catch { useLocal = true; }
      if (useLocal) {
        const stored = JSON.parse(localStorage.getItem('hamp_products') || '[]');
        localStorage.setItem('hamp_products', JSON.stringify(stored.filter(p => p.id !== id)));
      }
      setDeleteId(null);
      fetchProducts();
    } catch (e) { console.error(e); }
  };

  const handleToggleFeatured = async (product) => {
    try {
      const res = await adminPut(`/products/${product.id}`, { ...product, is_featured: !product.is_featured });
      if (handleUnauth(res, navigate)) return;
      fetchProducts();
    } catch (e) { console.error(e); }
  };

  const openAdd = () => { setEditProduct(null); setShowModal(true); };
  const openEdit = (p) => { setEditProduct(p); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditProduct(null); };
  const handleSaved = () => { closeModal(); fetchProducts(); };

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1200, margin: '0 auto', fontFamily: 'Jost, sans-serif' }}>
      <AnimatePresence>
        {(showModal || editProduct) && (
          <ProductModal
            key="product-modal"
            product={editProduct}
            onClose={closeModal}
            onSave={handleSaved}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm Dialog */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,15,21,0.55)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: '#fff', borderRadius: 18, padding: 32, maxWidth: 380, width: '90%', textAlign: 'center' }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: PLUM, margin: '0 0 10px' }}>Delete Product?</h3>
              <p style={{ color: '#7c5a6a', fontSize: 14, marginBottom: 24 }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => setDeleteId(null)}
                  style={{ background: BLUSH, color: PLUM, border: '1px solid #f3d0dd', borderRadius: 10, padding: '10px 22px', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 600, color: PLUM, margin: 0 }}>Products</h1>
          <p style={{ color: '#7c5a6a', marginTop: 6, fontSize: 14 }}>{products.length} products total</p>
        </div>
        <button
          onClick={openAdd}
          style={{ background: ROSE, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          + Add Product
        </button>
      </motion.div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#a0728a', pointerEvents: 'none' }}>🔍</span>
        <input
          placeholder="Search by name or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: 12, border: '1px solid #f3d0dd', fontFamily: 'Jost, sans-serif', fontSize: 14, color: PLUM, background: '#fff', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 18px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
          {error}{' '}
          <button onClick={fetchProducts} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {/* Grid */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛍️</div>
          <p style={{ color: '#7c5a6a', fontSize: 15 }}>No products found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 18 }}>
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,15,21,0.05)' }}
            >
              {/* Product Image */}
              <div style={{ position: 'relative', height: 180, background: BLUSH }}>
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🛍️</div>
                )}
                {product.is_featured && (
                  <span style={{ position: 'absolute', top: 10, left: 10, background: PINK, color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                    ✨ Featured
                  </span>
                )}
              </div>

              <div style={{ padding: 16 }}>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 600, color: PLUM, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: 12, color: '#a0728a', margin: '0 0 8px' }}>{product.category || 'Uncategorised'}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, color: ROSE, fontSize: 16 }}>₹{(product.price || 0).toLocaleString('en-IN')}</span>
                  {product.original_price && product.original_price > product.price && (
                    <span style={{ textDecoration: 'line-through', color: '#a0728a', fontSize: 13 }}>₹{product.original_price.toLocaleString('en-IN')}</span>
                  )}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <StockBadge stock={product.stock ?? 0} />
                </div>

                {/* Featured toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div
                    onClick={() => handleToggleFeatured(product)}
                    role="switch"
                    aria-checked={product.is_featured}
                    style={{
                      width: 36, height: 20, borderRadius: 10, cursor: 'pointer', position: 'relative',
                      background: product.is_featured ? PINK : '#e5e7eb', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 2, left: product.is_featured ? 18 : 2,
                      width: 16, height: 16, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#7c5a6a' }}>Featured</span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openEdit(product)}
                    style={{ flex: 1, background: BLUSH, color: ROSE, border: `1px solid ${PINK}`, borderRadius: 9, padding: '8px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Jost, sans-serif' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(product.id)}
                    style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 9, padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
