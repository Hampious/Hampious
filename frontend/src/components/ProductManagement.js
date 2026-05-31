import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminManagement.css';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    description: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.get('http://localhost:8000/api/admin/products', {
        params: { token }
      });
      setProducts(response.data);
    } catch (err) {
      localStorage.removeItem('admin_token');
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post('http://localhost:8000/api/admin/products', formData, {
        params: { token }
      });
      fetchProducts();
      setShowForm(false);
      setFormData({
        name: '',
        price: '',
        category: '',
        stock: '',
        description: ''
      });
    } catch (err) {
      alert('Error adding product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        const token = localStorage.getItem('admin_token');
        await axios.delete(`http://localhost:8000/api/admin/products/${id}`, {
          params: { token }
        });
        fetchProducts();
      } catch (err) {
        alert('Error deleting product');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <img src="/logo.jpg" alt="Hampious" className="sidebar-logo" />
          <h2>Hampious</h2>
          <p>Admin Panel</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/admin/dashboard" className="nav-link">
            📊 Dashboard
          </Link>
          <Link to="/admin/products" className="nav-link active">
            📦 Products
          </Link>
          <Link to="/admin/orders" className="nav-link">
            🛒 Orders
          </Link>
          <Link to="/admin/users" className="nav-link">
            👥 Users
          </Link>
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          🚪 Logout
        </button>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <h1>Product Management</h1>
          <button onClick={() => setShowForm(!showForm)} className="add-btn">
            ➕ Add New Product
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddProduct} className="management-form">
            <input
              type="text"
              placeholder="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <input
              type="number"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              required
            />
            <input
              type="number"
              placeholder="Stock"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
            <button type="submit">Save Product</button>
            <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </form>
        )}

        <div className="table-container">
          <table className="management-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>${product.price}</td>
                  <td>{product.category}</td>
                  <td>{product.stock}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="delete-btn"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
