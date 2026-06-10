import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminLogin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', email);

      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000/api'}`}/admin/login`, {
        email,
        password
      }, {
        timeout: 5000
      });

      console.log('Login response:', response.data);

      if (response.data.access_token) {
        localStorage.setItem('admin_token', response.data.access_token);
        console.log('Token saved, navigating...');
        navigate('/admin/dashboard');
      } else {
        setError('No token received from server');
      }
    } catch (err) {
      console.error('Login error:', err);

      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Backend server not responding.');
      } else if (!err.response) {
        setError('Cannot connect to backend server. Make sure it\'s running on http://localhost:8000');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError(err.response?.data?.detail || 'Login failed. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="logo-section">
          <img src="/logo.jpg" alt="Hampious" className="login-logo" />
        </div>
        <h1>Hampious Admin</h1>
        <p className="subtitle">Management System</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="team.hampious@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
