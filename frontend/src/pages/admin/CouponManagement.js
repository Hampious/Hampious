import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../../api'; // ✅ Replaced axios import
import { Plus, Edit, Trash } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';

// ✅ Removed API_URL constant

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_purchase: 0,
    max_discount: 0,
    expiry_date: '',
    usage_limit: 0
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      // ✅ Updated to use API instance
      const response = await API.get('/coupons');
      setCoupons(response.data);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const couponData = {
        ...formData,
        expiry_date: formData.expiry_date || null,
        max_discount: formData.max_discount || null,
        usage_limit: formData.usage_limit || null
      };

      if (editingCoupon) {
        // ✅ Updated to use API instance
        await API.put(`/coupons/${editingCoupon.id}`, couponData);
        toast.success('Coupon updated successfully');
      } else {
        // ✅ Updated to use API instance
        await API.post('/coupons', couponData);
        toast.success('Coupon created successfully');
      }
      setOpen(false);
      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save coupon');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_purchase: 0,
      max_discount: 0,
      expiry_date: '',
      usage_limit: 0
    });
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase || 0,
      max_discount: coupon.max_discount || 0,
      expiry_date: coupon.expiry_date?.split('T')[0] || '',
      usage_limit: coupon.usage_limit || 0
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      // ✅ Updated to use API instance
      await API.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div className="py-20 px-6 md:px-12 lg:px-24" data-testid="coupon-management">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="flex items-center justify-between mb-12">
          <h1 className="font-heading text-4xl md:text-6xl font-medium">Coupons</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 rounded-full" data-testid="add-coupon-btn">
                <Plus className="h-5 w-5 mr-2" />
                Add Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Coupon Code</Label>
                  <Input
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="mt-2"
                    data-testid="coupon-code-input"
                  />
                </div>
                <div>
                  <Label>Discount Type</Label>
                  <Select value={formData.discount_type} onValueChange={(value) => setFormData({...formData, discount_type: value})}>
                    <SelectTrigger className="mt-2" data-testid="discount-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: parseFloat(e.target.value)})}
                    className="mt-2"
                    data-testid="discount-value-input"
                  />
                </div>
                <div>
                  <Label>Minimum Purchase</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({...formData, min_purchase: parseFloat(e.target.value)})}
                    className="mt-2"
                    data-testid="min-purchase-input"
                  />
                </div>
                <div>
                  <Label>Max Discount (optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({...formData, max_discount: parseFloat(e.target.value)})}
                    className="mt-2"
                    data-testid="max-discount-input"
                  />
                </div>
                <div>
                  <Label>Expiry Date (optional)</Label>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    className="mt-2"
                    data-testid="expiry-date-input"
                  />
                </div>
                <div>
                  <Label>Usage Limit (optional)</Label>
                  <Input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({...formData, usage_limit: parseInt(e.target.value)})}
                    className="mt-2"
                    data-testid="usage-limit-input"
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" data-testid="coupon-submit-btn">
                  {editingCoupon ? 'Update' : 'Create'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4" data-testid="coupons-list">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="bg-card p-6 rounded-2xl border border-border" data-testid={`coupon-${coupon.id}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-xl font-medium mb-2">{coupon.code}</h3>
                    <p className="text-sm text-muted-foreground">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Min Purchase: ₹{coupon.min_purchase} | Used: {coupon.usage_count} times
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)} className="rounded-full" data-testid={`edit-coupon-${coupon.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(coupon.id)} className="rounded-full" data-testid={`delete-coupon-${coupon.id}`}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}