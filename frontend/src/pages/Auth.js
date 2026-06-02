import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Gift, ArrowRight, Mail, Lock, User, Phone, Sparkles, X, KeyRound } from 'lucide-react';
import AuthCallback from '../components/AuthCallback';


// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.5 }
  })
};

// Google Icon SVG Component
const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function Auth() {
  const location = useLocation();
  
  // Check for session_id in URL fragment synchronously during render (prevents race conditions)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return <AuthForm />;
}

function AuthForm() {
  const [isSignUp, setIsSignUp]   = useState(false);
  const [authMode, setAuthMode]   = useState('password'); // 'password' | 'otp'
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // OTP state
  const [otpEmail, setOtpEmail]   = useState('');
  const [otpCode,  setOtpCode]    = useState('');
  const [otpStep,  setOtpStep]    = useState('email'); // 'email' | 'verify'
  const [otpLoading, setOtpLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!otpEmail.trim()) { toast.error('Enter your email'); return; }
    setOtpLoading(true);
    try {
      await API.post('/auth/send-otp', { email: otpEmail });
      setOtpStep('verify');
      toast.success(`OTP sent to ${otpEmail}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    } finally { setOtpLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) { toast.error('Enter the OTP'); return; }
    setOtpLoading(true);
    try {
      const res = await API.post('/auth/verify-otp', { email: otpEmail, otp: otpCode });
      login(res.data.token, res.data.user);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    } finally { setOtpLoading(false); }
  };

  const [signUpData, setSignUpData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: ''
  });

  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await API.post('/auth/forgot-password', { email: forgotEmail });
    } catch (_) {}
    // Always show success to avoid email enumeration
    setTimeout(() => { setForgotLoading(false); setForgotSent(true); }, 800);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await API.post("/auth/signup", signUpData);
      login(response.data.token, response.data.user);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await API.post("/auth/signin", signInData);
      login(response.data.token, response.data.user);
      toast.success('Signed in successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    const redirectUrl = window.location.origin + '/auth';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-16 px-6 relative overflow-hidden" data-testid="auth-page">
      {/* Background decorative elements */}
      <motion.div
        className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Brand */}
        <motion.div 
          className="text-center mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          <motion.div
            className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5"
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <Gift className="h-10 w-10 text-primary" />
          </motion.div>
          <h1 className="font-heading text-3xl font-semibold text-primary">Hampious</h1>
          <p className="text-sm text-muted-foreground mt-2">Premium Gift Hampers</p>
        </motion.div>

        {/* Auth Card */}
        <motion.div 
          className="bg-card p-8 rounded-3xl border border-border/50 premium-shadow-lg"
          layout
        >
          <motion.div
            className="text-center mb-6"
            key={isSignUp ? 'signup-header' : 'signin-header'}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isSignUp ? 'Sign up to start gifting' : 'Sign in to your account'}
            </p>
          </motion.div>

          {/* Auth Mode Toggle — only show on sign-in */}
          {!isSignUp && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#f8f0f4', borderRadius: 12, padding: 4 }}>
              <button type="button"
                onClick={() => { setAuthMode('password'); setOtpStep('email'); setOtpCode(''); }}
                style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                  background: authMode === 'password' ? '#fff' : 'transparent',
                  color: authMode === 'password' ? '#B84E78' : '#7c5a6a',
                  boxShadow: authMode === 'password' ? '0 2px 8px rgba(26,15,21,0.08)' : 'none' }}>
                🔑 Password
              </button>
              <button type="button"
                onClick={() => { setAuthMode('otp'); setOtpStep('email'); }}
                style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                  background: authMode === 'otp' ? '#fff' : 'transparent',
                  color: authMode === 'otp' ? '#B84E78' : '#7c5a6a',
                  boxShadow: authMode === 'otp' ? '0 2px 8px rgba(26,15,21,0.08)' : 'none' }}>
                📧 Email OTP
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ── OTP Login Flow ── */}
            {!isSignUp && authMode === 'otp' && (
              <motion.div key="otp-form"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                {otpStep === 'email' ? (
                  <form onSubmit={handleSendOtp} className="space-y-5">
                    <div>
                      <Label className="text-sm font-medium text-foreground">Email Address</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="email" required placeholder="your@email.com" value={otpEmail}
                          onChange={e => setOtpEmail(e.target.value)}
                          className="pl-10 h-12 rounded-xl input-premium" />
                      </div>
                    </div>
                    <Button type="submit" disabled={otpLoading}
                      className="w-full button-premium bg-primary hover:bg-primary/90 h-12 rounded-full font-semibold">
                      {otpLoading ? 'Sending OTP...' : 'Send OTP to Email →'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div style={{ background: '#D1FAE5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#065F46' }}>
                      ✅ OTP sent to <strong>{otpEmail}</strong>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground">Enter 6-digit OTP</Label>
                      <Input type="text" required maxLength={6} placeholder="• • • • • •"
                        value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="mt-2 h-14 rounded-xl text-center text-2xl font-bold tracking-widest input-premium" />
                    </div>
                    <Button type="submit" disabled={otpLoading || otpCode.length !== 6}
                      className="w-full button-premium bg-primary hover:bg-primary/90 h-12 rounded-full font-semibold">
                      {otpLoading ? 'Verifying...' : 'Verify & Sign In'}
                    </Button>
                    <button type="button" onClick={() => { setOtpStep('email'); setOtpCode(''); }}
                      className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors">
                      ← Change email / Resend OTP
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {isSignUp ? (
              <motion.form 
                key="signup-form"
                onSubmit={handleSignUp} 
                className="space-y-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                data-testid="signup-form"
              >
                <div className="grid grid-cols-2 gap-4">
                  <motion.div custom={0} variants={itemVariants} initial="hidden" animate="visible">
                    <Label htmlFor="first_name" className="text-sm font-medium text-foreground">First Name</Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="first_name"
                        required
                        value={signUpData.first_name}
                        onChange={(e) => setSignUpData({...signUpData, first_name: e.target.value})}
                        className="pl-10 input-premium"
                        placeholder="John"
                        data-testid="signup-firstname-input"
                      />
                    </div>
                  </motion.div>
                  <motion.div custom={1} variants={itemVariants} initial="hidden" animate="visible">
                    <Label htmlFor="last_name" className="text-sm font-medium text-foreground">Last Name</Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="last_name"
                        required
                        value={signUpData.last_name}
                        onChange={(e) => setSignUpData({...signUpData, last_name: e.target.value})}
                        className="pl-10 input-premium"
                        placeholder="Doe"
                        data-testid="signup-lastname-input"
                      />
                    </div>
                  </motion.div>
                </div>
                <motion.div custom={2} variants={itemVariants} initial="hidden" animate="visible">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                      className="pl-10 input-premium"
                      placeholder="john@example.com"
                      data-testid="signup-email-input"
                    />
                  </div>
                </motion.div>
                <motion.div custom={3} variants={itemVariants} initial="hidden" animate="visible">
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      required
                      value={signUpData.phone}
                      onChange={(e) => setSignUpData({...signUpData, phone: e.target.value})}
                      className="pl-10 input-premium"
                      placeholder="+91 9876543210"
                      data-testid="signup-phone-input"
                    />
                  </div>
                </motion.div>
                <motion.div custom={4} variants={itemVariants} initial="hidden" animate="visible">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      required
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                      className="pl-10 input-premium"
                      placeholder="••••••••"
                      data-testid="signup-password-input"
                    />
                  </div>
                </motion.div>
                <motion.div 
                  custom={5} 
                  variants={itemVariants} 
                  initial="hidden" 
                  animate="visible"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full button-premium bg-primary hover:bg-primary/90 h-12 rounded-full font-semibold mt-2"
                    data-testid="signup-submit-btn"
                  >
                    {loading ? (
                      'Creating Account...'
                    ) : (
                      <>
                        Create Account
                        <Sparkles className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            ) : authMode === 'password' ? (
              <motion.form
                key="signin-form"
                onSubmit={handleSignIn}
                className="space-y-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                data-testid="signin-form"
              >
                <motion.div custom={0} variants={itemVariants} initial="hidden" animate="visible">
                  <Label htmlFor="signin_email" className="text-sm font-medium text-foreground">Email</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin_email"
                      type="email"
                      required
                      value={signInData.email}
                      onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                      className="pl-10 input-premium"
                      placeholder="john@example.com"
                      data-testid="signin-email-input"
                    />
                  </div>
                </motion.div>
                <motion.div custom={1} variants={itemVariants} initial="hidden" animate="visible">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin_password" className="text-sm font-medium text-foreground">Password</Label>
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(true); setForgotSent(false); setForgotEmail(''); }}
                      style={{
                        fontFamily: 'Jost, sans-serif',
                        fontSize: '0.72rem',
                        color: '#B84E78',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin_password"
                      type="password"
                      required
                      value={signInData.password}
                      onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                      className="pl-10 input-premium"
                      placeholder="••••••••"
                      data-testid="signin-password-input"
                    />
                  </div>
                </motion.div>
                <motion.div
                  custom={2} 
                  variants={itemVariants} 
                  initial="hidden" 
                  animate="visible"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full button-premium bg-primary hover:bg-primary/90 h-12 rounded-full font-semibold mt-2"
                    data-testid="signin-submit-btn"
                  >
                    {loading ? (
                      'Signing In...'
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Google Sign In Divider */}
                <motion.div 
                  custom={3} 
                  variants={itemVariants} 
                  initial="hidden" 
                  animate="visible"
                  className="relative my-6"
                >
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground">Or continue with</span>
                  </div>
                </motion.div>

                {/* Google Sign In Button */}
                <motion.div
                  custom={4} 
                  variants={itemVariants} 
                  initial="hidden" 
                  animate="visible"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    disabled={googleLoading}
                    onClick={handleGoogleSignIn}
                    className="w-full h-12 rounded-full font-medium border-2 hover:bg-secondary/50"
                    data-testid="google-signin-btn"
                  >
                    {googleLoading ? (
                      'Redirecting...'
                    ) : (
                      <>
                        <GoogleIcon />
                        Sign in with Google
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            ) : null}
          </AnimatePresence>

          {/* Toggle Auth Mode */}
          <motion.div 
            className="mt-8 pt-6 border-t border-border text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <motion.button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-2 text-primary font-semibold hover:underline"
                data-testid="auth-toggle-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </motion.button>
            </p>
          </motion.div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div 
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-primary hover:underline">Terms</a>
            {' '}and{' '}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </motion.div>

      {/* ── Forgot Password Modal ── */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(26,15,21,0.55)',
              zIndex: 50, backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowForgotPassword(false); }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1,   y: 0  }}
              exit={{   opacity: 0, scale: 0.92, y: 20  }}
              transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '100%', maxWidth: '420px',
                background: '#FFFFFF', borderRadius: '20px',
                padding: '2.5rem 2rem',
                boxShadow: '0 24px 60px rgba(26,15,21,0.2)',
                border: '1px solid rgba(212,120,154,0.2)',
              }}
            >
              {/* Close */}
              <button
                onClick={() => setShowForgotPassword(false)}
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: 'rgba(212,120,154,0.1)', border: 'none',
                  borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#B84E78',
                }}
              >
                <X size={15} />
              </button>

              {/* Icon */}
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(212,120,154,0.1)',
                border: '2px solid rgba(212,120,154,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}>
                <KeyRound size={22} style={{ color: '#B84E78' }} strokeWidth={1.5} />
              </div>

              {forgotSent ? (
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: '1.6rem', fontWeight: 600, color: '#3D1A2A', marginBottom: '0.75rem' }}>
                    Check Your Email
                  </h3>
                  <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.88rem', color: 'rgba(30,26,23,0.55)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                    If <strong style={{ color: '#B84E78' }}>{forgotEmail}</strong> is registered, a password reset link has been sent. Please check your inbox.
                  </p>
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    style={{
                      background: '#D4789A', border: '1.5px solid #D4789A',
                      color: '#FFFFFF', fontFamily: 'Jost, sans-serif',
                      fontSize: '0.72rem', fontWeight: 600,
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      padding: '0.75rem 2rem', borderRadius: '50px',
                      cursor: 'pointer', width: '100%',
                    }}
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <h3 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: '1.6rem', fontWeight: 600, color: '#3D1A2A', marginBottom: '0.5rem', textAlign: 'center' }}>
                    Forgot Password?
                  </h3>
                  <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.84rem', color: 'rgba(30,26,23,0.5)', lineHeight: 1.7, marginBottom: '1.5rem', textAlign: 'center' }}>
                    Enter your registered email and we'll send you a reset link.
                  </p>

                  <Label style={{ fontFamily: 'Jost, sans-serif', fontSize: '0.78rem', color: '#3D1A2A', fontWeight: 500 }}>Email Address</Label>
                  <div style={{ position: 'relative', marginTop: '0.5rem', marginBottom: '1.25rem' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#B84E78' }} />
                    <Input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-10 input-premium"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{
                      background: forgotLoading ? 'rgba(212,120,154,0.6)' : '#D4789A',
                      border: '1.5px solid #D4789A',
                      color: '#FFFFFF', fontFamily: 'Jost, sans-serif',
                      fontSize: '0.72rem', fontWeight: 600,
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      padding: '0.8rem 2rem', borderRadius: '50px',
                      cursor: forgotLoading ? 'not-allowed' : 'pointer',
                      width: '100%', transition: 'all 0.3s ease',
                    }}
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
