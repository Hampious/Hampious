import React from 'react';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
  return (
    <div className="py-20 px-6 md:px-12 lg:px-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="font-heading text-4xl md:text-6xl font-medium mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p className="text-sm">Last updated: January 2026</p>
          
          <h2 className="font-heading text-2xl font-normal text-foreground mt-8 mb-4">Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, including your name, email address, phone number, 
            shipping address, and payment information when you create an account or place an order.
          </p>
          
          <h2 className="font-heading text-2xl font-normal text-foreground mt-8 mb-4">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Process and fulfill your orders</li>
            <li>Send you order confirmations and updates</li>
            <li>Respond to your comments and questions</li>
            <li>Improve our website and services</li>
            <li>Prevent fraud and ensure security</li>
          </ul>
          
          <h2 className="font-heading text-2xl font-normal text-foreground mt-8 mb-4">Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information. However, no method of 
            transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
          </p>
          
          <h2 className="font-heading text-2xl font-normal text-foreground mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:team.hampious@gmail.com" className="text-primary hover:underline">team.hampious@gmail.com</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
