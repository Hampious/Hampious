import React from 'react';
import { motion } from 'framer-motion';

export default function TermsConditions() {
  return (
    <div className="py-20 px-6 md:px-12 lg:px-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="font-heading text-4xl md:text-6xl font-medium mb-8">Terms & Conditions</h1>
        
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p className="text-sm">Last updated: January 2026</p>
          
          <h2 className="font-heading text-2xl font-normal text-foreground mt-8 mb-4">Agreement to Terms</h2>
          <p>
            By accessing and using Hampious, you agree to be bound by these Terms and Conditions and all applicable 
            laws and regulations.
          </p>
          
          <h2 className="font-heading text-2xl font-normal text-foreground mt-8 mb-4">Use of Service</h2>
          <p>You agree to use our service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Use the service in any way that violates applicable laws</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with the proper functioning of the website</li>
            <li>Use automated systems to access the service</li>
          </ul>
          
          <h2 className="font-heading text-2xl font-normal text-foreground mt-8 mb-4">Orders and Payment</h2>
          <p>
            All orders are subject to acceptance and availability. We reserve the right to refuse any order. Prices are 
            subject to change without notice. Payment must be received before order processing.
          </p>
          
          <h2 className="font-heading text-2xl font-normal text-foreground mt-8 mb-4">Limitation of Liability</h2>
          <p>
            Hamptious shall not be liable for any indirect, incidental, special, or consequential damages arising from 
            your use of our service.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
