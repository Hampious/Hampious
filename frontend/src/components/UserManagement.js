import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000/api'}/admin/users`, {
        params: { token }
      });
      setUsers(response.data);
    } catch (err) {
      localStorage.removeItem('admin_token');
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('admin_token');
        await axios.delete(`${(process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000/api'}`)}/admin/users/${id}`, {
          params: { token }
        });
        fetchUsers();
        alert('User deleted successfully');
      } catch (err) {
        alert('Error deleting user');
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
          <Link to="/admin/orders" className="nav-link">
            🛒 Orders
          </Link>
          <Link to="/admin/users" className="nav-link active">
            👥 Users
          </Link>
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          🚪 Logout
        </button>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <h1>User Management</h1>
          <p>Total Users: {users.length}</p>
        </div>

        <div className="table-container">
          <table className="management-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
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
