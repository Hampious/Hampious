import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../api'; // ✅ FIX 1: Use centralized API
import { FileText, Clock, Package, RefreshCw, Mail, Phone } from 'lucide-react';

export default function ReturnPolicy() {
  const [policy, setPolicy] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        // ✅ FIX 2: Consistent API usage
        const response = await API.get('/return-policy');
        setPolicy(response.data?.policy || '');
      } catch (error) {
        console.error('Failed to fetch return policy:', error);
        setPolicy(''); // Ensure state is clean on error
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner-premium" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 md:px-8 lg:px-16" data-testid="return-policy-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <FileText className="h-10 w-10 text-primary" />
          </motion.div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            Return Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Your satisfaction is our priority
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card p-5 rounded-2xl border border-border/50 text-center"
          >
            <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">3-Day Window</h3>
            <p className="text-sm text-muted-foreground">Request within 3 days of delivery</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card p-5 rounded-2xl border border-border/50 text-center"
          >
            <Package className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Easy Process</h3>
            <p className="text-sm text-muted-foreground">Request from My Orders page</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card p-5 rounded-2xl border border-border/50 text-center"
          >
            <RefreshCw className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Quick Refund</h3>
            <p className="text-sm text-muted-foreground">5-7 business days processing</p>
          </motion.div>
        </div>

        {/* Policy Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card p-8 md:p-10 rounded-3xl border border-border/50"
        >
          <div 
            className="prose prose-lg max-w-none
              prose-headings:font-heading prose-headings:text-foreground
              prose-p:text-muted-foreground
              prose-strong:text-foreground
              prose-li:text-muted-foreground
              prose-a:text-primary"
            // ✅ FIX 3: Safe Rendering with Fallback
            dangerouslySetInnerHTML={{ 
              __html: policy
                ? policy
                    .replace(/## (.*)/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
                    .replace(/### (.*)/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/- (.*)/g, '<li class="ml-4">$1</li>')
                    .replace(/\n\n/g, '</p><p class="mb-4">')
                    .replace(/\n/g, '<br/>')
                : '<p class="text-center text-muted-foreground italic">No return policy details available at the moment. Please contact support for assistance.</p>'
            }}
          />
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <h3 className="font-heading text-xl font-semibold text-foreground mb-4">
            Need Help?
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a 
              href="mailto:support@hampious.com" 
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="h-5 w-5" />
              support@hampious.com
            </a>
            <a 
              href="tel:+917428601664" 
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Phone className="h-5 w-5" />
              +91 7428601664
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}