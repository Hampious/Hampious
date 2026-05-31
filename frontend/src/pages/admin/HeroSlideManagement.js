import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../../api'; // ✅ Replaced axios import
import { Plus, Edit, Trash } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';

// ✅ Removed API_URL constant

export default function HeroSlideManagement() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    cta_text: '',
    cta_link: '',
    order: 0
  });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      // ✅ Updated to use API instance
      const response = await API.get('/hero-slides');
      setSlides(response.data);
    } catch (error) {
      console.error('Failed to fetch hero slides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSlide) {
        // ✅ Updated to use API instance
        await API.put(`/hero-slides/${editingSlide.id}`, formData);
        toast.success('Hero slide updated successfully');
      } else {
        // ✅ Updated to use API instance
        await API.post('/hero-slides', formData);
        toast.success('Hero slide created successfully');
      }
      setOpen(false);
      setEditingSlide(null);
      resetForm();
      fetchSlides();
    } catch (error) {
      toast.error('Failed to save hero slide');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      cta_text: '',
      cta_link: '',
      order: 0
    });
  };

  const handleEdit = (slide) => {
    setEditingSlide(slide);
    setFormData(slide);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hero slide?')) return;
    
    try {
      // ✅ Updated to use API instance
      await API.delete(`/hero-slides/${id}`);
      toast.success('Hero slide deleted');
      fetchSlides();
    } catch (error) {
      toast.error('Failed to delete hero slide');
    }
  };

  return (
    <div className="py-20 px-6 md:px-12 lg:px-24" data-testid="hero-slide-management">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="flex items-center justify-between mb-12">
          <h1 className="font-heading text-4xl md:text-6xl font-medium">Hero Slides</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 rounded-full" data-testid="add-slide-btn">
                <Plus className="h-5 w-5 mr-2" />
                Add Slide
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSlide ? 'Edit Hero Slide' : 'Add Hero Slide'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="mt-2"
                    data-testid="slide-title-input"
                  />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Textarea
                    value={formData.subtitle}
                    onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                    className="mt-2"
                    data-testid="slide-subtitle-input"
                  />
                </div>
                <div>
                  <Label>Image URL</Label>
                  <Input
                    required
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="mt-2"
                    data-testid="slide-image-input"
                  />
                </div>
                <div>
                  <Label>CTA Text</Label>
                  <Input
                    value={formData.cta_text}
                    onChange={(e) => setFormData({...formData, cta_text: e.target.value})}
                    className="mt-2"
                    data-testid="slide-cta-text-input"
                  />
                </div>
                <div>
                  <Label>CTA Link</Label>
                  <Input
                    value={formData.cta_link}
                    onChange={(e) => setFormData({...formData, cta_link: e.target.value})}
                    className="mt-2"
                    data-testid="slide-cta-link-input"
                  />
                </div>
                <div>
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                    className="mt-2"
                    data-testid="slide-order-input"
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" data-testid="slide-submit-btn">
                  {editingSlide ? 'Update' : 'Create'}
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
          <div className="space-y-4" data-testid="slides-list">
            {slides.map((slide) => (
              <div key={slide.id} className="bg-card p-6 rounded-2xl border border-border" data-testid={`slide-${slide.id}`}>
                <div className="flex gap-4">
                  <img src={slide.image_url} alt={slide.title} className="w-32 h-20 object-cover rounded-lg" />
                  <div className="flex-1">
                    <h3 className="font-heading text-xl font-normal mb-1">{slide.title}</h3>
                    <p className="text-sm text-muted-foreground">{slide.subtitle}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(slide)} className="rounded-full" data-testid={`edit-slide-${slide.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(slide.id)} className="rounded-full" data-testid={`delete-slide-${slide.id}`}>
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