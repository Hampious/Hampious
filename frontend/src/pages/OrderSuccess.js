import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import confetti from 'canvas-confetti';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] }
  }
};

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#C98B8B', '#E8D4D4', '#F5F0F0']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#C98B8B', '#E8D4D4', '#F5F0F0']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-16 px-6" data-testid="order-success-page">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          variants={itemVariants}
          className="mb-8"
        >
          <motion.div
            className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.5 }}
            >
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Success Message */}
        <motion.div variants={itemVariants}>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Order Placed Successfully!
          </h1>
          <p className="text-muted-foreground text-lg mb-2">
            Thank you for shopping with Hampious
          </p>
          {orderId && (
            <p className="text-sm text-muted-foreground">
              Order ID: <span className="font-medium text-foreground">{orderId.slice(0, 8).toUpperCase()}</span>
            </p>
          )}
        </motion.div>

        {/* Info Card */}
        <motion.div
          variants={itemVariants}
          className="bg-card rounded-2xl p-6 border border-border/50 mt-8 mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-foreground">What's Next?</h3>
              <p className="text-sm text-muted-foreground">Your order is being processed</p>
            </div>
          </div>
          <div className="space-y-3 text-left text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">1</span>
              </div>
              <p className="text-muted-foreground">You'll receive an order confirmation email shortly</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">2</span>
              </div>
              <p className="text-muted-foreground">We'll notify you when your order ships</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">3</span>
              </div>
              <p className="text-muted-foreground">Track your order anytime in "My Orders"</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="space-y-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => navigate('/my-orders')}
              className="w-full button-premium bg-primary hover:bg-primary/90 h-12 rounded-full font-medium"
              data-testid="view-orders-btn"
            >
              View My Orders
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full h-12 rounded-full font-medium border-2"
              data-testid="continue-shopping-btn"
            >
              <Home className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
