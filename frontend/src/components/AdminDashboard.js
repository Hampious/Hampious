import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.get('http://localhost:8000/api/admin/dashboard', {
        params: { token }
      });
      setDashboard(response.data);
    } catch (err) {
      localStorage.removeItem('admin_token');
      navigate('/admin/login');
    } finally {
      setLoading(false);
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
          <Link to="/admin/dashboard" className="nav-link active">
            📊 Dashboard
          </Link>
          <Link to="/admin/products" className="nav-link">
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
          <h1>Dashboard</h1>
          <p>Welcome to Hampious Admin Panel</p>
        </div>

        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>Total Products</h3>
              <p className="stat-number">{dashboard?.total_products || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🛒</div>
            <div className="stat-info">
              <h3>Total Orders</h3>
              <p className="stat-number">{dashboard?.total_orders || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Total Users</h3>
              <p className="stat-number">{dashboard?.total_users || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>Total Revenue</h3>
              <p className="stat-number">${dashboard?.total_revenue?.toFixed(2) || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <h3>Pending Orders</h3>
              <p className="stat-number">{dashboard?.pending_orders || 0}</p>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/admin/products" className="action-btn add-btn">
              ➕ Add Product
            </Link>
            <Link to="/admin/orders" className="action-btn view-btn">
              👁️ View Orders
            </Link>
            <Link to="/admin/users" className="action-btn manage-btn">
              ⚙️ Manage Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
