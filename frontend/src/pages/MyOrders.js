import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api'; // Replaced axios import
import { 
  Package, Clock, CheckCircle, Truck, XCircle, MapPin, Star, Camera, 
  RotateCcw, ChevronDown, ChevronUp, AlertCircle, X, Upload, Send
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

// Removed const API_URL = process.env.REACT_APP_BACKEND_URL;

const statusConfig = {
  pending:           { color: 'bg-yellow-500', label: 'Pending Payment',   step: 0 },
  payment_confirmed: { color: 'bg-blue-500',   label: 'Payment Confirmed', step: 1 },
  processing:        { color: 'bg-blue-600',   label: 'Order Confirmed',   step: 2 },
  confirmed:         { color: 'bg-blue-600',   label: 'Order Confirmed',   step: 2 },
  packed:            { color: 'bg-indigo-500', label: 'Packed',            step: 3 },
  shipped:           { color: 'bg-purple-500', label: 'Shipped',           step: 4 },
  out_for_delivery:  { color: 'bg-orange-500', label: 'Out for Delivery',  step: 5 },
  delivered:         { color: 'bg-green-500',  label: 'Delivered',         step: 6 },
  cancelled:         { color: 'bg-red-500',    label: 'Cancelled',         step: -1 },
  returned:          { color: 'bg-gray-500',   label: 'Returned',          step: -1 },
  refunded:          { color: 'bg-teal-500',   label: 'Refunded',          step: -1 },
};

const timelineSteps = [
  { key: 'confirmed', label: 'Ordered', icon: Package },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle }
];

// Star Rating Component
const StarRating = ({ rating, setRating, interactive = false }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-6 w-6 ${
          star <= rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400 transition-colors' : ''}`}
        onClick={() => interactive && setRating(star)}
      />
    ))}
  </div>
);

// Order Timeline Component
const OrderTimeline = ({ status }) => {
  const currentStep = statusConfig[status]?.step || 0;
  
  if (currentStep < 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <XCircle className="h-5 w-5 text-red-500" />
        <span>Order {status}</span>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {timelineSteps.map((step, index) => {
          const isCompleted = currentStep >= (index + 2);
          const isCurrent = currentStep === (index + 2);
          const StepIcon = step.icon;
          
          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div className="relative flex items-center justify-center w-full">
                {index > 0 && (
                  <div 
                    className={`absolute left-0 right-1/2 h-1 -translate-y-1/2 top-4 ${
                      isCompleted || isCurrent ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
                {index < timelineSteps.length - 1 && (
                  <div 
                    className={`absolute left-1/2 right-0 h-1 -translate-y-1/2 top-4 ${
                      isCompleted ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
                <div 
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted || isCurrent 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <StepIcon className="h-4 w-4" />
                </div>
              </div>
              <span className={`text-xs mt-2 text-center ${
                isCompleted || isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Return Request Modal
const ReturnModal = ({ order, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    try {
      const response = await API.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImages([...images, ...response.data.urls]);
      toast.success('Images uploaded');
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for return');
      return;
    }
    
    setSubmitting(true);
    try {
      await onSubmit({ reason, images });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="return-modal"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading text-xl font-semibold">Request Return</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Order #{String(order.id).slice(0, 8).toUpperCase()}
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Reason for Return *
            </label>
            <Textarea
              placeholder="Please describe why you want to return this order..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
              data-testid="return-reason-input"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Upload Images (optional)
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="return-images"
                disabled={uploading}
              />
              <label 
                htmlFor="return-images" 
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Uploading...' : 'Click to upload images'}
                </span>
              </label>
            </div>
            
            {images.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {images.map((url, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={url} 
                      alt={`Return ${index + 1}`} 
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
            className="w-full bg-primary hover:bg-primary/90"
            data-testid="submit-return-btn"
          >
            {submitting ? 'Submitting...' : 'Submit Return Request'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Review Modal
const ReviewModal = ({ order, productId, productName, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    try {
      const response = await API.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImages([...images, ...response.data.urls]);
      toast.success('Images uploaded');
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment, review_images: images, productId });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="review-modal"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading text-xl font-semibold">Write a Review</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">{productName}</p>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Your Rating *
            </label>
            <StarRating rating={rating} setRating={setRating} interactive />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Your Review
            </label>
            <Textarea
              placeholder="Share your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
              data-testid="review-comment-input"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Add Photos (optional)
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="review-images"
                disabled={uploading}
              />
              <label 
                htmlFor="review-images" 
                className="flex flex-col items-center cursor-pointer"
              >
                <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Uploading...' : 'Click to add photos'}
                </span>
              </label>
            </div>
            
            {images.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {images.map((url, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={url} 
                      alt={`Review ${index + 1}`} 
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full bg-primary hover:bg-primary/90"
            data-testid="submit-review-btn"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Order Card Component
const OrderCard = ({ order, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [returnEligibility, setReturnEligibility] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`http://localhost:8000/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (res.ok) {
        setShowCancelModal(false);
        setCancelReason('');
        onRefresh();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to cancel order');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setCancelling(false);
    }
  };
  
  // Defensive coding: Ensure items is always an array
  const items = Array.isArray(order.items) ? order.items : [];

  // Determine effective status: if payment not paid, always show Pending Payment
  const effectiveStatus = (order.payment_status !== 'paid' && order.status !== 'delivered' && order.status !== 'shipped')
    ? 'pending'
    : order.status;
  const status = statusConfig[effectiveStatus] || statusConfig.pending;

  useEffect(() => {
    const checkReturnEligibility = async () => {
      try {
        const response = await API.get(`/orders/${order.id}/return-eligibility`);
        setReturnEligibility(response.data);
      } catch (error) {
        console.error('Error checking return eligibility:', error);
      }
    };

    const fetchTracking = async () => {
      try {
        const response = await API.get(`/shiprocket/track/${order.tracking_id}`);
        setTrackingInfo(response.data);
      } catch (error) {
        console.warn('Tracking temporarily unavailable for', order.tracking_id);
        setTrackingInfo({
          note: 'Tracking will be available soon'
        });
      }
    };

    if (order.status === 'delivered' && (!order.return_status || order.return_status === 'none')) {
      checkReturnEligibility();
    }
    if (order.tracking_id) {
      fetchTracking();
    }
  }, [order.id, order.status, order.return_status, order.tracking_id]);

  const handleReturnSubmit = async (data) => {
    try {
      await API.post(`/orders/${order.id}/request-return`, data);
      toast.success('Return request submitted successfully');
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit return request');
    }
  };

  const handleReviewSubmit = async (data) => {
    try {
      await API.post(`/products/${data.productId}/reviews`, {
        rating: data.rating,
        comment: data.comment,
        review_images: data.review_images
      });
      toast.success('Review submitted for approval');
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    }
  };

  const openReviewModal = (item) => {
    setSelectedProduct(item);
    setShowReviewModal(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/20 transition-all"
        data-testid={`order-card-${order.id}`}
      >
        {/* Order Header */}
        <div className="p-4 md:p-5 border-b border-border/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Order Items Preview */}
              <div className="flex -space-x-2">
                {items.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 rounded-lg bg-secondary border-2 border-card overflow-hidden flex items-center justify-center"
                  >
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 border-2 border-card flex items-center justify-center text-xs font-medium text-primary">
                    +{items.length - 3}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-foreground">
                  Order #{String(order.id).slice(0, 8).toUpperCase()}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color} text-white`}>
                  {status.label}
                </span>
                <p className="font-semibold text-lg text-primary mt-1">
                  ₹{Number(order.final_amount ?? order.total ?? 0).toFixed(0)}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpanded(!expanded)}
                data-testid={`expand-order-${order.id}`}
              >
                {expanded ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Order Timeline */}
              {status.step >= 0 && (
                <div className="p-4 md:p-5 border-b border-border/50 bg-secondary/30">
                  <OrderTimeline status={order.status} />
                </div>
              )}

              {/* Tracking Info */}
              {(order.tracking_number || order.tracking_id) && (
                <div className="p-4 md:p-5 border-b border-border/50 bg-blue-50/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-700">Tracking:</span>
                    <span className="text-blue-600">{order.tracking_number || order.tracking_id}</span>
                    {(order.courier || order.carrier_name) && (
                      <span className="text-muted-foreground">via {order.courier || order.carrier_name}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="p-4 md:p-5 space-y-4">
                {items.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl"
                    data-testid={`order-item-${item.product_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-card border border-border overflow-hidden flex items-center justify-center">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × ₹{Number(item.price ?? 0).toFixed(0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">
                        ₹{(Number(item.price ?? 0) * Number(item.quantity ?? 1)).toFixed(0)}
                      </span>
                      {order.status === 'delivered' && !order.rating_submitted && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReviewModal(item)}
                          className="text-xs"
                          data-testid={`review-btn-${item.product_id}`}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Rate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              <div className="p-4 md:p-5 border-t border-border/50">
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                  <div className="text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Delivery Address</p>
                    <p>{order.shipping_address?.full_name || order.customer_name || 'Customer'}</p>
                    <p>{order.shipping_address?.address || order.shipping_address?.line1 || ''}</p>
                    <p>
                      {[order.shipping_address?.city, order.shipping_address?.state].filter(Boolean).join(', ')}
                      {order.shipping_address?.pincode ? ` - ${order.shipping_address.pincode}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancel Section */}
              {['pending', 'processing'].includes(order.status) && (
                <div className="p-4 md:p-5 border-t border-border/50 bg-red-50/40">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Need to cancel this order?</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCancelModal(true)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      ✕ Cancel Order
                    </Button>
                  </div>
                </div>
              )}

              {/* Cancel Confirmation Modal */}
              {showCancelModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                  <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#1A0F15', margin: '0 0 0.5rem' }}>Cancel Order?</h3>
                    <p style={{ color: '#7c5a6a', fontSize: '0.9rem', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
                      Are you sure you want to cancel order <strong>#{String(order.id).slice(0,8).toUpperCase()}</strong>? This action cannot be undone.
                    </p>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#7c5a6a', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                        Reason for cancellation (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                        placeholder="e.g. Ordered by mistake, found better price..."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #f3d0dd', fontFamily: 'Jost, sans-serif', fontSize: 14, color: '#1A0F15', background: '#FFF5F8', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                        style={{ flex: 1, background: '#FFF5F8', color: '#B84E78', border: '1px solid #f3d0dd', borderRadius: 10, padding: '11px', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Keep Order
                      </button>
                      <button
                        onClick={handleCancelOrder}
                        disabled={cancelling}
                        style={{ flex: 1, background: cancelling ? '#fca5a5' : '#EF4444', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 600, cursor: cancelling ? 'not-allowed' : 'pointer' }}
                      >
                        {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Return Section */}
              {order.status === 'delivered' && (
                <div className="p-4 md:p-5 border-t border-border/50 bg-secondary/20">
                  {order.return_status && order.return_status !== 'none' ? (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className={`h-4 w-4 ${
                        order.return_status === 'approved' ? 'text-green-600' :
                        order.return_status === 'rejected' ? 'text-red-600' :
                        'text-yellow-600'
                      }`} />
                      <span className="text-muted-foreground">
                        Return Status: <span className="font-medium capitalize">{order.return_status}</span>
                      </span>
                      {order.razorpay_refund_id && (
                        <span className="text-green-600 text-xs">
                          (Refund ID: {order.razorpay_refund_id})
                        </span>
                      )}
                    </div>
                  ) : returnEligibility?.eligible ? (
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="text-muted-foreground">
                          Return window closes in <span className="font-medium text-foreground">{returnEligibility.remaining_hours} hours</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowReturnModal(true)}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        data-testid={`return-btn-${order.id}`}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Request Return
                      </Button>
                    </div>
                  ) : returnEligibility ? (
                    <p className="text-sm text-muted-foreground">
                      {returnEligibility.reason}
                    </p>
                  ) : null}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showReturnModal && (
          <ReturnModal
            order={order}
            onClose={() => setShowReturnModal(false)}
            onSubmit={handleReturnSubmit}
          />
        )}
        {showReviewModal && selectedProduct && (
          <ReviewModal
            order={order}
            productId={selectedProduct.product_id}
            productName={selectedProduct.product_name}
            onClose={() => {
              setShowReviewModal(false);
              setSelectedProduct(null);
            }}
            onSubmit={handleReviewSubmit}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      // Get current user email from localStorage
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const userEmail = user?.email || '';

      // Try backend first
      let backendOrders = [];
      try {
        const response = await API.get('/orders/my');
        backendOrders = Array.isArray(response.data) ? response.data : [];
      } catch {}

      // Merge with localStorage orders filtered by this user's email
      const localOrders = JSON.parse(localStorage.getItem('hamp_orders') || '[]');
      const myLocalOrders = userEmail
        ? localOrders.filter(o => o.customer_email === userEmail)
        : localOrders;

      const backendIds = new Set(backendOrders.map(o => String(o.id)));
      const localOnly  = myLocalOrders.filter(o => !backendIds.has(String(o.id)));
      const merged     = [...backendOrders, ...localOnly];

      // Normalize fields so OrderCard never crashes
      const normalized = merged.map(o => ({
        ...o,
        id:           String(o.id || ''),
        status:       o.status || 'pending',
        final_amount: o.final_amount ?? o.total ?? o.total_amount ?? 0,
        created_at:   o.created_at || new Date().toISOString(),
        items:        Array.isArray(o.items) ? o.items.map(item => ({
          ...item,
          price:        item.price ?? 0,
          quantity:     item.quantity ?? 1,
          product_name: item.product_name || item.name || 'Product',
        })) : [],
        shipping_address: o.shipping_address || {},
      }));

      // Sort newest first
      normalized.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(normalized);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery'].includes(order.status);
    if (filter === 'delivered') return order.status === 'delivered';
    if (filter === 'cancelled') return ['cancelled', 'returned', 'refunded'].includes(order.status);
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner-premium" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 md:px-8 lg:px-16" data-testid="my-orders-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track, manage returns, and rate your orders</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'active', label: 'Active' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'cancelled', label: 'Cancelled/Returns' }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(tab.key)}
              className={`rounded-full whitespace-nowrap ${
                filter === tab.key ? 'bg-primary' : ''
              }`}
              data-testid={`filter-${tab.key}`}
            >
              {tab.label}
              {tab.key === 'all' && ` (${orders.length})`}
            </Button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div 
            className="text-center py-16 bg-card rounded-3xl border border-border/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-testid="no-orders"
          >
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-heading text-2xl font-medium text-foreground mb-2">
              {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            </h2>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'When you place an order, it will appear here'
                : 'Try selecting a different filter'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4" data-testid="orders-list">
            {filteredOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onRefresh={fetchOrders}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}