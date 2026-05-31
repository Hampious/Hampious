import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Gift, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

export default function PeriodCareHero({ onShopNow }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] },
    },
  };

  const floatVariants = {
    animate: {
      y: [-15, 15, -15],
      transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 3, repeat: Infinity },
    },
  };

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-white via-pink-50/30 to-white">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-0 left-10 w-72 h-72 bg-pink-200/20 rounded-full blur-3xl"
        animate={{ y: [-50, 50, -50] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl"
        animate={{ y: [50, -50, 50] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          {/* Left Content */}
          <motion.div variants={itemVariants} className="space-y-8">
            {/* Tag */}
            <motion.span
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100/80 backdrop-blur-sm rounded-full text-pink-700 text-sm font-semibold border border-pink-200"
            >
              <Heart className="h-4 w-4 fill-current" />
              Sister Care Collection
            </motion.span>

            {/* Heading */}
            <motion.div variants={itemVariants}>
              <h2 className="font-heading text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                <span className="bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 bg-clip-text text-transparent">
                  Care for Her
                </span>
                <br />
                <span className="text-gray-800">Every Month</span>
              </h2>
            </motion.div>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-lg text-gray-600 leading-relaxed max-w-lg"
            >
              Hampious Period Care Hampers are thoughtfully curated with premium products to care for your sister, mother, or loved one during their period. Because every woman deserves to feel pampered and cared for.
            </motion.p>

            {/* Features */}
            <motion.div variants={itemVariants} className="space-y-4">
              {[
                { icon: Gift, text: 'Premium, comfort-focused products' },
                { icon: Sparkles, text: 'Beautifully packaged with love' },
                { icon: Heart, text: 'Discreet, caring delivery' },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center gap-3"
                  whileHover={{ x: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-pink-600" />
                  </div>
                  <span className="text-gray-700 font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div variants={itemVariants} className="pt-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={onShopNow}
                  className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white h-14 px-10 rounded-full text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Explore Hampers
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Message */}
            <motion.p
              variants={itemVariants}
              className="text-sm text-gray-500 italic pt-4"
            >
              ✨ Delivered with Love - Because care matters
            </motion.p>
          </motion.div>

          {/* Right Visual */}
          <motion.div variants={itemVariants} className="relative h-96 md:h-full">
            {/* Decorative shapes */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              variants={floatVariants}
              animate="animate"
            >
              {/* Main hamper illustration box */}
              <motion.div
                className="relative w-64 h-80 bg-gradient-to-br from-pink-100 to-rose-100 rounded-3xl shadow-2xl border-2 border-pink-200/50 backdrop-blur-sm flex items-center justify-center overflow-hidden"
                variants={pulseVariants}
                animate="animate"
              >
                {/* Decorative heart */}
                <motion.div
                  className="absolute top-6 right-6 text-pink-400 text-5xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  ❤️
                </motion.div>

                {/* Decorative sparkles */}
                <motion.div
                  className="absolute top-8 left-8 text-yellow-400 text-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  ✨
                </motion.div>

                {/* Main content */}
                <div className="text-center space-y-4 z-10">
                  <motion.div
                    className="text-6xl"
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    🎁
                  </motion.div>
                  <p className="text-gray-700 font-semibold text-lg">
                    Premium Care Hamper
                  </p>
                  <p className="text-sm text-gray-500">
                    Luxury products for comfort
                  </p>
                </div>

                {/* Animated border */}
                <motion.div
                  className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 bg-clip-border opacity-0"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </motion.div>
            </motion.div>

            {/* Floating icons around */}
            {[
              { icon: '🌸', delay: 0 },
              { icon: '💝', delay: 0.2 },
              { icon: '✨', delay: 0.4 },
              { icon: '🌷', delay: 0.6 },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="absolute text-4xl"
                style={{
                  top: `${Math.random() * 60 + 10}%`,
                  left: `${Math.random() * 60 + 15}%`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 6 + idx,
                  repeat: Infinity,
                  delay: item.delay,
                }}
              >
                {item.icon}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
