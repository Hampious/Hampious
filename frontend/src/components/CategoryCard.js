import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const CategoryCard = ({ category }) => {
  const navigate = useNavigate();

  // Safety fallback if category missing
  if (!category) return null;

  const handleClick = () => {
    navigate(`/products?category=${encodeURIComponent(category.id)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl cursor-pointer group aspect-[4/3]"
      onClick={handleClick}
      data-testid={`category-card-${category.id}`}
    >
      <img
        src={category.image_url || 'https://via.placeholder.com/600x400?text=No+Image'}
        alt={category.name || 'Category'}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/600x400?text=Image+Error';
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3
          className="font-heading text-2xl md:text-3xl font-normal text-white"
          data-testid={`category-name-${category.id}`}
        >
          {category.name || 'Unnamed Category'}
        </h3>

        {category.description && (
          <p className="text-white/80 text-sm mt-2">
            {category.description}
          </p>
        )}
      </div>
    </motion.div>
  );
};
