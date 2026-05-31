import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, MessageCircle, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
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

const contactInfo = [
  {
    icon: Mail,
    title: 'Email',
    value: 'support@hampious.com',
    href: 'mailto:support@hampious.com',
    description: 'Send us an email anytime'
  },
  {
    icon: Phone,
    title: 'Phone',
    value: '+91 7428601664',
    href: 'tel:+917428601664',
    description: 'Call us for instant support'
  },
  {
    icon: Clock,
    title: 'Working Hours',
    value: 'Mon - Sun: 10AM - 7PM',
    href: null,
    description: 'We\'re available all week'
  },
  {
    icon: MapPin,
    title: 'Location',
    value: 'Mumbai, Maharashtra, India',
    href: null,
    description: 'Our headquarters'
  }
];

export default function ContactUs() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background py-16 md:py-24 px-6 md:px-12 lg:px-24" data-testid="contact-page">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-16">
          <motion.span 
            className="inline-block font-body text-xs uppercase tracking-[0.4em] text-primary mb-4"
          >
            Get in Touch
          </motion.span>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>

        {/* Contact Cards */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16"
        >
          {contactInfo.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-card rounded-2xl p-6 border border-border/50 text-center group hover:border-primary/30 transition-all duration-500"
            >
              <motion.div 
                className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <item.icon className="h-6 w-6 text-primary" />
              </motion.div>
              <h3 className="font-heading text-lg font-medium text-foreground mb-2">{item.title}</h3>
              {item.href ? (
                <a 
                  href={item.href} 
                  className="text-sm text-primary font-medium hover:underline block mb-1"
                >
                  {item.value}
                </a>
              ) : (
                <p className="text-sm text-primary font-medium mb-1">{item.value}</p>
              )}
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact Form */}
        <motion.div variants={itemVariants} className="max-w-2xl mx-auto">
          <div className="bg-card rounded-3xl p-8 md:p-10 border border-border/50 shadow-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold text-foreground">Send us a Message</h2>
                <p className="text-sm text-muted-foreground">We'll get back to you within 24 hours</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Your Name</Label>
                  <Input
                    id="name"
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-2 input-premium"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-2 input-premium"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                <Input
                  id="subject"
                  required
                  placeholder="How can we help you?"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="mt-2 input-premium"
                />
              </div>
              <div>
                <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                <Textarea
                  id="message"
                  required
                  placeholder="Tell us more about your inquiry..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="mt-2 min-h-[150px] rounded-xl"
                />
              </div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full button-premium bg-primary hover:bg-primary/90 h-12 rounded-full font-medium"
                >
                  {loading ? (
                    'Sending...'
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
