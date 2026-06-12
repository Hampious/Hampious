import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api';
import { ProductCard } from '../components/ProductCard';
import { SlidersHorizontal, Grid3X3, LayoutGrid } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';


export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  const DEFAULT_CATEGORIES = [
    { id: 'period',   name: 'Period Care' },
    { id: 'love',     name: 'I Love You' },
    { id: 'birthday', name: 'Birthday' },
    { id: 'sorry',    name: 'Sorry' },
    { id: 'selfcare', name: 'Self Care' },
    { id: 'festive',  name: 'Festive' },
  ];

  const fetchCategories = async () => {
    try {
      const response = await API.get('/categories');
      const list = Array.isArray(response.data) ? response.data : [];
      if (list.length > 0) {
        setCategories(list);
      } else {
        const local = JSON.parse(localStorage.getItem('hamp_categories') || '[]');
        setCategories(local.length > 0 ? local : DEFAULT_CATEGORIES);
      }
    } catch (error) {
      const local = JSON.parse(localStorage.getItem('hamp_categories') || '[]');
      setCategories(local.length > 0 ? local : DEFAULT_CATEGORIES);
    }
  };

  const fetchProducts = async () => {
    try {
      // Always show cached products instantly — no loading state if cache exists
      const cached = (() => { try { return JSON.parse(localStorage.getItem('hamp_products') || '[]'); } catch { return []; } })();
      if (cached.length > 0) {
        setProducts(cached);
        setLoading(false);
      } else {
        setLoading(true); // only show skeleton on very first ever visit
      }

      const response = await API.get('/products');
      let data = Array.isArray(response.data) ? response.data : [];

      // Merge with cached to preserve images if new response somehow lacks them
      if (data.length > 0) {
        const cachedMap = (() => {
          try {
            const c = JSON.parse(localStorage.getItem('hamp_products') || '[]');
            return Object.fromEntries(c.map(p => [p.id, p]));
          } catch { return {}; }
        })();
        data = data.map(p => {
          const cached = cachedMap[p.id];
          // Use cached images if new product has none
          if ((!p.images || !p.images.length) && cached?.images?.length) {
            return { ...p, images: cached.images };
          }
          return p;
        });
        try { localStorage.setItem('hamp_products', JSON.stringify(data)); } catch {}
      }

      // Filter by category (frontend) — handle both category_id (int) and category (string slug)
      if (selectedCategory !== 'all') {
        data = data.filter(product =>
          product.category_id == selectedCategory ||
          product.category === selectedCategory
        );
      }

      // Sorting (frontend)
      if (sortBy === 'created_at') {
        data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      } else if (sortBy === 'price_asc') {
        data.sort((a, b) => (a.discount_price || a.original_price || a.price) - (b.discount_price || b.original_price || b.price));
      } else if (sortBy === 'price_desc') {
        data.sort((a, b) => (b.discount_price || b.original_price || b.price) - (a.discount_price || a.original_price || a.price));
      }

      setProducts(data);
    } catch (error) {
      // Backend unreachable — show cached products
      try {
        const localProducts = JSON.parse(localStorage.getItem('hamp_products') || '[]');
        setProducts(localProducts);
      } catch { setProducts([]); }
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('category');
    } else {
      params.set('category', value);
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background py-10 md:py-16 px-6 md:px-12 lg:px-24" data-testid="products-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Page Header */}
        <div className="mb-10">
          <motion.span 
            className="inline-block font-body text-xs uppercase tracking-[0.3em] text-primary mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Collection
          </motion.span>
          <motion.h1 
            className="font-heading text-4xl md:text-5xl font-semibold text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Our Hampers
          </motion.h1>
          <motion.p 
            className="font-body text-lg text-muted-foreground max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Discover our carefully curated selection of premium gift hampers for every occasion.
          </motion.p>
        </div>

        {/* Filters Bar */}
        <motion.div 
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          data-testid="products-filters"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filter:</span>
            </div>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px] rounded-xl border-border/50 bg-card h-10" data-testid="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()} className="rounded-lg">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] rounded-xl border-border/50 bg-card h-10" data-testid="sort-filter">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="created_at" className="rounded-lg">Newest First</SelectItem>
                <SelectItem value="price_asc" className="rounded-lg">Price: Low to High</SelectItem>
                <SelectItem value="price_desc" className="rounded-lg">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Results Count */}
        {!loading && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{products.length}</span> {products.length === 1 ? 'product' : 'products'}
            </p>
          </motion.div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-sm overflow-hidden bg-card border border-border/30 animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-5 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6" data-testid="products-grid">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * Math.min(index, 8), duration: 0.5 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            className="text-center py-20 bg-card rounded-3xl border border-border/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-testid="no-products"
          >
            <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No products found</p>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}