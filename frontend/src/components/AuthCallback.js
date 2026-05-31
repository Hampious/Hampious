import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api'; // ✅ Use centralized API
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// ❗ DO NOT HARDCODE OR ADD REDIRECT URL FALLBACKS

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id from URL fragment (#session_id=xxxx)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          toast.error('No session found');
          navigate('/auth');
          return;
        }

        // Exchange session_id for JWT token
        const response = await API.post('/auth/google/login', {
          id_token: sessionId
        });

        const { token, user } = response.data || {};

        if (!token || !user) {
          throw new Error('Invalid server response');
        }

        // Save auth state
        login(token, user);
        toast.success('Signed in with Google successfully!');

        // Clear URL fragment safely
        window.history.replaceState(null, '', window.location.pathname);

        // Navigate home
        navigate('/');
      } catch (error) {
        console.error('Google auth error:', error);

        toast.error(
          error.response?.data?.detail || 
          'Failed to sign in with Google'
        );

        navigate('/auth');
      }
    };

    processSession();
  }, [navigate, login]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center" data-testid="auth-callback">
      <div className="text-center">
        <div className="spinner-premium mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
