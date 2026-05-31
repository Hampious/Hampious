import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Not logged in → Redirect to login, preserve destination
  if (!user) {
    return (
      <Navigate 
        to="/auth" 
        replace 
        state={{ from: location.pathname }} 
      />
    );
  }

  // Admin route protection
  if (adminOnly && !isAdmin()) {
    return (
      <Navigate 
        to="/" 
        replace 
      />
    );
  }

  return children;
};
