import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminGet, adminPost, adminPut, adminDelete, handleUnauth, parseError } from '../../utils/adminApi';

const PLUM = '#1A0F15';
const PINK = '#D4789A';
const ROSE = '#B84E78';
const BLUSH = '#FFF5F8';

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #f3d0dd', borderTopColor: PINK, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #f3d0dd',
  fontFamily: 'Jost, sans-serif', fontSize: 14, color: PLUM, background: BLUSH,
  outline: 'none', boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: 12, fontWeight: 600, color: '#7c5a6a', textTransform: 'uppercase',
  letterSpacing: '0.05em', display: 'block', marginBottom: 6,
};

const emptyForm = { name: '', slug: '', description: '', icon: '🛍️' };

function CategoryModal({ category, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        icon: category.icon || '🛍️',
      });
    } else {
      setForm(emptyForm);
    }
  }, [category]);

  const handleNameChange = (val) => {
    setForm(f => ({ ...f, name: val, slug: slugify(val) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let usedLocalStorage = false;

      const saveToLocalStorage = () => {
        const stored = JSON.parse(localStorage.getItem('hamp_categories') || '[]');
        if (category) {
          const idx = stored.findIndex(c => c.id === category.id);
          if (idx >= 0) stored[idx] = { ...stored[idx], ...form };
          else stored.push({ id: category.id, ...form });
        } else {
          stored.push({ id: Date.now(), ...form });
        }
        localStorage.setItem('hamp_categories', JSON.stringify(stored));
        usedLocalStorage = true;
      };

      let res;
      try {
        res = category
          ? await adminPut(`/categories/${category.id}`, form)
          : await adminPost('/categories', form);
      } catch (netErr) {
        // Network error — fall back to localStorage
        saveToLocalStorage();
        onSave();
        return;
      }

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin';
        return;
      }

      // Backend doesn't have /categories endpoint (old version) — use localStorage
      if (res.status === 404 || res.status === 422 || res.status === 405) {
        saveToLocalStorage();
        onSave();
        return;
      }

      if (!res.ok) {
        const msg = await parseError(res);
        setError(msg);
        return;
      }

      // Success from backend — also sync to localStorage for consistency
      const data = await res.json().catch(() => null);
      if (data) {
        const stored = JSON.parse(localStorage.getItem('hamp_categories') || '[]');
        if (category) {
          const idx = stored.findIndex(c => c.id === category.id);
          if (idx >= 0) stored[idx] = data;
          else stored.push(data);
        } else {
          stored.push(data);
        }
        localStorage.setItem('hamp_categories', JSON.stringify(stored));
      }

      onSave();
    } catch (e) {
      setError(e.message || 'An unexpected error occurred');
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
        style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(26,15,21,0.2)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 600, color: PLUM, margin: 0 }}>
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#7c5a6a', lineHeight: 1, padding: 4 }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Icon */}
          <div>
            <label style={labelStyle}>Icon (Emoji)</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                style={{ ...inputStyle, width: 70, textAlign: 'center', fontSize: 22 }}
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="🛍️"
                maxLength={4}
              />
              <span style={{ fontSize: 13, color: '#7c5a6a' }}>Paste or type an emoji for this category</span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>Category Name *</label>
            <input
              required
              style={inputStyle}
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Birthday Gifts"
            />
          </div>

          {/* Slug */}
          <div>
            <label style={labelStyle}>Slug (auto-generated, editable)</label>
            <input
              style={{ ...inputStyle, background: '#f8f0f4', color: '#a0728a' }}
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="birthday-gifts"
            />
            <span style={{ fontSize: 11, color: '#a0728a', marginTop: 4, display: 'block' }}>Used in URLs. Auto-generated from name.</span>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of this category..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              background: saving ? '#c4849e' : ROSE,
              color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
              fontFamily: 'Jost, sans-serif', fontSize: 15, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', marginTop: 4,
            }}
          >
            {saving ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) { navigate('/admin'); return; }
    fetchCategories();
  }, [navigate]);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGet('/categories');
      if (handleUnauth(res, navigate)) return;

      if (res.status === 404 || res.status === 405 || res.status === 422) {
        // Old backend — load from localStorage
        const stored = JSON.parse(localStorage.getItem('hamp_categories') || '[]');
        setCategories(stored);
        return;
      }

      if (!res.ok) {
        // Try localStorage fallback
        const stored = JSON.parse(localStorage.getItem('hamp_categories') || '[]');
        if (stored.length > 0) { setCategories(stored); return; }
        setError(`Failed to load categories (HTTP ${res.status})`);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.categories || []);
      setCategories(list);
      // Sync to localStorage
      localStorage.setItem('hamp_categories', JSON.stringify(list));
    } catch (e) {
      // Network error — use localStorage
      const stored = JSON.parse(localStorage.getItem('hamp_categories') || '[]');
      setCategories(stored);
      if (stored.length === 0) setError('Network error — could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      let useLocal = false;
      try {
        const res = await adminDelete(`/categories/${id}`);
        if (handleUnauth(res, navigate)) return;
        if (res.status === 404 || res.status === 405 || res.status === 422) useLocal = true;
      } catch {
        useLocal = true;
      }
      if (useLocal) {
        const stored = JSON.parse(localStorage.getItem('hamp_categories') || '[]');
        localStorage.setItem('hamp_categories', JSON.stringify(stored.filter(c => c.id !== id)));
      }
      setDeleteId(null);
      fetchCategories();
    } catch (e) { console.error(e); }
  };

  const openAdd = () => { setEditCategory(null); setShowModal(true); };
  const openEdit = (cat) => { setEditCategory(cat); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditCategory(null); };
  const handleSaved = () => { closeModal(); fetchCategories(); };

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Jost, sans-serif' }}>
      <AnimatePresence>
        {(showModal || editCategory) && (
          <CategoryModal
            key="category-modal"
            category={editCategory}
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
              style={{ background: '#fff', borderRadius: 18, padding: 32, maxWidth: 360, width: '90%', textAlign: 'center' }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: PLUM, margin: '0 0 10px' }}>Delete Category?</h3>
              <p style={{ color: '#7c5a6a', fontSize: 14, marginBottom: 24 }}>This may affect products in this category.</p>
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
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 600, color: PLUM, margin: 0 }}>Categories</h1>
          <p style={{ color: '#7c5a6a', marginTop: 6, fontSize: 14 }}>{categories.length} categories</p>
        </div>
        <button
          onClick={openAdd}
          style={{ background: ROSE, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          + Add Category
        </button>
      </motion.div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 18px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
          {error}{' '}
          <button onClick={fetchCategories} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {loading ? <Spinner /> : categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <p style={{ color: '#7c5a6a', fontSize: 15 }}>No categories yet. Create your first one!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
              style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3d0dd', padding: 24, boxShadow: '0 2px 12px rgba(26,15,21,0.05)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: BLUSH, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                  {cat.icon || '🛍️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 19, fontWeight: 600, color: PLUM, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.name}
                  </h3>
                  <span style={{ fontSize: 11, color: '#a0728a', fontFamily: 'monospace', background: '#f8f0f4', padding: '2px 8px', borderRadius: 6 }}>
                    /{cat.slug}
                  </span>
                </div>
              </div>
              {cat.description && (
                <p style={{ fontSize: 13, color: '#7c5a6a', margin: '0 0 16px', lineHeight: 1.5 }}>{cat.description}</p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => openEdit(cat)}
                  style={{ flex: 1, background: BLUSH, color: ROSE, border: `1px solid ${PINK}`, borderRadius: 9, padding: '8px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Jost, sans-serif' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(cat.id)}
                  style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 9, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  🗑️
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
