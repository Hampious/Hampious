import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import API from '../../api'; // ✅ ADDED: Centralized API import
import { 
  Image, Video, Save, Upload, Settings, FileText, Type, Phone, Mail, 
  Globe, RefreshCw, Check
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';

// ❌ DELETED: const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CMSManagement() {
  const [settings, setSettings] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_image: '',
    hero_video: '',
    about_title: '',
    about_description: '',
    about_video: '',
    return_policy: '',
    contact_email: '',
    contact_phone: '',
    social_links: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      // ✅ UPDATED: Using API instance
      const response = await API.get('/cms/settings');
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Failed to fetch CMS settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // ✅ UPDATED: PUT request
      await API.put('/cms/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (endpoint, field, file) => {
    if (!file) return;
    
    setUploading(prev => ({ ...prev, [field]: true }));
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // ✅ UPDATED: POST request for file upload
      const response = await API.post(`/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSettings(prev => ({ ...prev, [field]: response.data.url }));
      toast.success('Media uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload media');
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner-premium" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 md:px-8 lg:px-16" data-testid="cms-management">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
              <Settings className="inline-block h-8 w-8 mr-3 text-primary" />
              Site Settings
            </h1>
            <p className="text-muted-foreground">Manage your website content and media</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-primary hover:bg-primary/90"
            data-testid="save-settings-btn"
          >
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>

        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="bg-secondary/50 p-1 rounded-xl">
            <TabsTrigger value="hero" className="rounded-lg px-4">
              <Image className="h-4 w-4 mr-2" /> Hero Section
            </TabsTrigger>
            <TabsTrigger value="about" className="rounded-lg px-4">
              <Video className="h-4 w-4 mr-2" /> About Page
            </TabsTrigger>
            <TabsTrigger value="policy" className="rounded-lg px-4">
              <FileText className="h-4 w-4 mr-2" /> Return Policy
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-lg px-4">
              <Phone className="h-4 w-4 mr-2" /> Contact Info
            </TabsTrigger>
          </TabsList>

          {/* Hero Section */}
          <TabsContent value="hero">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card p-6 rounded-2xl border border-border/50 space-y-6"
            >
              <h2 className="font-heading text-xl font-semibold text-foreground flex items-center">
                <Type className="h-5 w-5 mr-2 text-primary" /> Hero Content
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Hero Title</Label>
                  <Input
                    value={settings.hero_title}
                    onChange={(e) => handleChange('hero_title', e.target.value)}
                    placeholder="Premium Gift Hampers"
                    className="mt-2"
                    data-testid="hero-title-input"
                  />
                </div>
                <div>
                  <Label>Hero Subtitle</Label>
                  <Input
                    value={settings.hero_subtitle}
                    onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                    placeholder="Curated with love"
                    className="mt-2"
                    data-testid="hero-subtitle-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hero Image */}
                <div className="space-y-3">
                  <Label>Hero Background Image</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-4">
                    {settings.hero_image ? (
                      <div className="relative">
                        <img src={settings.hero_image} alt="Hero" className="w-full h-40 object-cover rounded-lg" />
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => handleChange('hero_image', '')}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer py-6">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          {uploading.hero_image ? 'Uploading...' : 'Click to upload image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload('cms/upload-hero', 'hero_image', e.target.files?.[0])}
                          disabled={uploading.hero_image}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Hero Video */}
                <div className="space-y-3">
                  <Label>Hero Background Video (Optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-4">
                    {settings.hero_video ? (
                      <div className="relative">
                        <video src={settings.hero_video} className="w-full h-40 object-cover rounded-lg" controls />
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => handleChange('hero_video', '')}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer py-6">
                        <Video className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          {uploading.hero_video ? 'Uploading...' : 'Click to upload video'}
                        </span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload('cms/upload-hero', 'hero_video', e.target.files?.[0])}
                          disabled={uploading.hero_video}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* About Page */}
          <TabsContent value="about">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card p-6 rounded-2xl border border-border/50 space-y-6"
            >
              <h2 className="font-heading text-xl font-semibold text-foreground">About Page Content</h2>
              
              <div>
                <Label>About Title</Label>
                <Input
                  value={settings.about_title}
                  onChange={(e) => handleChange('about_title', e.target.value)}
                  placeholder="Our Story"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>About Description</Label>
                <Textarea
                  value={settings.about_description}
                  onChange={(e) => handleChange('about_description', e.target.value)}
                  placeholder="Tell your brand story..."
                  className="mt-2 min-h-[150px]"
                />
              </div>

              <div className="space-y-3">
                <Label>About Page Video</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-4">
                  {settings.about_video ? (
                    <div className="relative">
                      <video src={settings.about_video} className="w-full h-48 object-cover rounded-lg" controls />
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => handleChange('about_video', '')}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer py-8">
                      <Video className="h-10 w-10 text-muted-foreground mb-3" />
                      <span className="text-sm text-muted-foreground">
                        {uploading.about_video ? 'Uploading...' : 'Click to upload about video'}
                      </span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload('cms/upload-about-video', 'about_video', e.target.files?.[0])}
                        disabled={uploading.about_video}
                      />
                    </label>
                  )}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Return Policy */}
          <TabsContent value="policy">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card p-6 rounded-2xl border border-border/50 space-y-6"
            >
              <h2 className="font-heading text-xl font-semibold text-foreground">Return Policy</h2>
              <p className="text-sm text-muted-foreground">
                This content will be displayed on the Return Policy page. Use markdown formatting.
              </p>
              
              <Textarea
                value={settings.return_policy}
                onChange={(e) => handleChange('return_policy', e.target.value)}
                placeholder="Enter your return policy..."
                className="min-h-[300px] font-mono text-sm"
              />
            </motion.div>
          </TabsContent>

          {/* Contact Info */}
          <TabsContent value="contact">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card p-6 rounded-2xl border border-border/50 space-y-6"
            >
              <h2 className="font-heading text-xl font-semibold text-foreground">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" /> Support Email
                  </Label>
                  <Input
                    value={settings.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    placeholder="support@hampious.com"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" /> Contact Phone
                  </Label>
                  <Input
                    value={settings.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    placeholder="+91 7428601664"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="font-medium text-foreground mb-4 flex items-center">
                  <Globe className="h-4 w-4 mr-2" /> Social Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['instagram', 'facebook', 'twitter', 'youtube'].map((platform) => (
                    <div key={platform}>
                      <Label className="capitalize">{platform}</Label>
                      <Input
                        value={settings.social_links?.[platform] || ''}
                        onChange={(e) => handleChange('social_links', {
                          ...settings.social_links,
                          [platform]: e.target.value
                        })}
                        placeholder={`https://${platform}.com/hampious`}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Save Button (Bottom) */}
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            {saving ? 'Saving Changes...' : 'Save All Changes'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}