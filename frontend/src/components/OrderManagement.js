import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminManagement.css';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.get('http://localhost:8000/api/admin/orders', {
        params: { token }
      });
      setOrders(response.data);
    } catch (err) {
      localStorage.removeItem('admin_token');
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(`http://localhost:8000/api/admin/orders/${orderId}`,
        { status: newStatus },
        { params: { token } }
      );
      fetchOrders();
    } catch (err) {
      alert('Error updating order');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        const token = localStorage.getItem('admin_token');
        await axios.delete(`http://localhost:8000/api/admin/orders/${id}`, {
          params: { token }
        });
        fetchOrders();
      } catch (err) {
        alert('Error deleting order');
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
          <Link to="/admin/products" className="nav-link">
            📦 Products
          </Link>
          <Link to="/admin/orders" className="nav-link active">
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
          <h1>Order Management</h1>
          <p>Total Orders: {orders.length}</p>
        </div>

        <div className="table-container">
          <table className="management-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer_email}</td>
                  <td>${order.total}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="processing">⚙️ Processing</option>
                      <option value="shipped">📦 Shipped</option>
                      <option value="delivered">✅ Delivered</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
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
