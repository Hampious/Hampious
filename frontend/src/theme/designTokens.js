/**
 * HAMPIOUS - Design Tokens
 * Complete design system: colors, typography, spacing, shadows, animations
 */

export const designTokens = {
  // ============================================
  // COLOR PALETTE
  // ============================================
  colors: {
    // Brand Primary
    primary: {
      light: '#F8E1E4', // Blush pink
      DEFAULT: '#F8E1E4',
      dark: '#D4A5AC',
      darker: '#AD7378',
    },

    // Brand Secondary
    secondary: {
      light: '#A8B89F', // Sage green
      DEFAULT: '#A8B89F',
      dark: '#7F8B6F',
      darker: '#5C6550',
    },

    // Brand Accent
    accent: {
      light: '#7B2D3F', // Deep maroon
      DEFAULT: '#7B2D3F',
      dark: '#5A1E2E',
      darker: '#3D141F',
    },

    // Neutral
    neutral: {
      cream: '#FAF6F0',
      white: '#FFFFFF',
      light: '#F5F1EB',
      lighter: '#F0EBE5',
      border: '#E8E3DD',
      muted: '#D4CFC9',
      medium: '#A89F96',
      dark: '#6B5F54',
      darker: '#3D3530',
      black: '#1A1513',
    },

    // Semantic
    success: {
      light: '#D4EDDA',
      DEFAULT: '#198754',
      dark: '#0F5132',
    },
    warning: {
      light: '#FFF3CD',
      DEFAULT: '#FFC107',
      dark: '#997404',
    },
    error: {
      light: '#F8D7DA',
      DEFAULT: '#DC3545',
      dark: '#842029',
    },
    info: {
      light: '#D1ECF1',
      DEFAULT: '#17A2B8',
      dark: '#0C5460',
    },
  },

  // ============================================
  // TYPOGRAPHY
  // ============================================
  typography: {
    fontFamily: {
      heading: "'Playfair Display', serif",
      body: "'DM Sans', sans-serif",
      accent: "'Cormorant Garamond', serif",
    },

    fontSize: {
      // Display sizes
      display: { size: '3.5rem', lineHeight: '4.25rem', weight: '700' }, // 56px
      h1: { size: '2.75rem', lineHeight: '3.25rem', weight: '700' }, // 44px
      h2: { size: '2.25rem', lineHeight: '2.75rem', weight: '700' }, // 36px
      h3: { size: '1.875rem', lineHeight: '2.25rem', weight: '600' }, // 30px
      h4: { size: '1.5rem', lineHeight: '2rem', weight: '600' }, // 24px
      h5: { size: '1.25rem', lineHeight: '1.75rem', weight: '600' }, // 20px
      h6: { size: '1rem', lineHeight: '1.5rem', weight: '600' }, // 16px

      // Body text
      body: { size: '1rem', lineHeight: '1.6rem', weight: '400' }, // 16px
      bodyMedium: { size: '0.9375rem', lineHeight: '1.5rem', weight: '400' }, // 15px
      bodySmall: { size: '0.875rem', lineHeight: '1.35rem', weight: '400' }, // 14px
      bodyXSmall: { size: '0.8125rem', lineHeight: '1.25rem', weight: '400' }, // 13px

      // Special
      label: { size: '0.875rem', lineHeight: '1.25rem', weight: '600' }, // 14px
      labelSmall: { size: '0.8125rem', lineHeight: '1.125rem', weight: '600' }, // 13px
      button: { size: '1rem', lineHeight: '1.5rem', weight: '600' }, // 16px
      buttonSmall: { size: '0.875rem', lineHeight: '1.25rem', weight: '600' }, // 14px
    },

    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '900',
    },
  },

  // ============================================
  // SPACING SYSTEM (8px base)
  // ============================================
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',   // 48px
    '4xl': '4rem',   // 64px
  },

  // ============================================
  // BORDER RADIUS
  // ============================================
  borderRadius: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    '3xl': '2.5rem', // 40px
    full: '9999px',
  },

  // ============================================
  // SHADOWS
  // ============================================
  shadows: {
    // Soft/subtle shadows
    soft: '0 2px 4px rgba(0, 0, 0, 0.05)',

    // Standard shadows
    sm: '0 4px 6px rgba(0, 0, 0, 0.07)',
    md: '0 8px 12px rgba(0, 0, 0, 0.1)',
    lg: '0 12px 24px rgba(0, 0, 0, 0.12)',

    // Premium/cinematic shadows
    premium: '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.05)',
    premiumLg: '0 20px 25px rgba(0, 0, 0, 0.08), 0 8px 10px rgba(0, 0, 0, 0.06)',
    premiumXl: '0 25px 50px rgba(0, 0, 0, 0.15)',
    cinematic: '0 30px 60px rgba(0, 0, 0, 0.2)',

    // Colored glows
    glowPink: '0 0 20px rgba(248, 225, 228, 0.4), 0 0 40px rgba(248, 225, 228, 0.2)',
    glowGreen: '0 0 20px rgba(168, 184, 159, 0.3), 0 0 40px rgba(168, 184, 159, 0.15)',
    glowMaroon: '0 0 20px rgba(123, 45, 63, 0.3), 0 0 40px rgba(123, 45, 63, 0.15)',

    // Hover states
    hoverLift: '0 20px 50px rgba(0, 0, 0, 0.1)',
  },

  // ============================================
  // TRANSITIONS & ANIMATIONS
  // ============================================
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slower: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
    cinematic: '600ms cubic-bezier(0.19, 1, 0.22, 1)',
  },

  // ============================================
  // BREAKPOINTS (Mobile-first)
  // ============================================
  breakpoints: {
    mobile: '320px',
    mobileLg: '480px',
    tablet: '768px',
    desktop: '1024px',
    desktopLg: '1280px',
    desktopXl: '1536px',
  },

  // ============================================
  // Z-INDEX SCALE
  // ============================================
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    backdrop: '1040',
    modal: '1050',
    popover: '1060',
    tooltip: '1070',
  },

  // ============================================
  // LAYOUT
  // ============================================
  layout: {
    maxWidth: '1400px',
    containerPadding: '1.5rem',
    gutter: '1.5rem',
  },
};

// Export individual token groups for convenience
export const {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  layout,
} = designTokens;
