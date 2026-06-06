/** @type {import('tailwindcss').Config} */
const { designTokens } = require('./src/theme/designTokens');

module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        heading: ['Cormorant', 'Georgia', 'serif'],
        body: ['Jost', 'system-ui', 'sans-serif'],
        accent: ['Cormorant', 'Georgia', 'serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          light: '#F8E1E4',
          DEFAULT: "hsl(var(--primary))",
          dark: '#D4A5AC',
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          light: '#A8B89F',
          DEFAULT: "hsl(var(--secondary))",
          dark: '#7F8B6F',
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          light: '#7B2D3F',
          DEFAULT: "hsl(var(--accent))",
          dark: '#5A1E2E',
          foreground: "hsl(var(--accent-foreground))",
        },
        neutral: {
          cream: '#FAF6F0',
          light: '#F5F1EB',
          lighter: '#F0EBE5',
          border: '#E8E3DD',
          muted: '#D4CFC9',
          medium: '#A89F96',
          dark: '#6B5F54',
          darker: '#3D3530',
          black: '#1A1513',
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      spacing: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '2.5rem',
        '3xl': '3rem',
        '4xl': '4rem',
      },
      borderRadius: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        '3xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 2px 4px rgba(0, 0, 0, 0.05)',
        sm: '0 4px 6px rgba(0, 0, 0, 0.07)',
        md: '0 8px 12px rgba(0, 0, 0, 0.1)',
        lg: '0 12px 24px rgba(0, 0, 0, 0.12)',
        premium: '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.05)',
        'premium-lg': '0 20px 25px rgba(0, 0, 0, 0.08), 0 8px 10px rgba(0, 0, 0, 0.06)',
        'premium-xl': '0 25px 50px rgba(0, 0, 0, 0.15)',
        cinematic: '0 30px 60px rgba(0, 0, 0, 0.2)',
        'glow-pink': '0 0 20px rgba(248, 225, 228, 0.4), 0 0 40px rgba(248, 225, 228, 0.2)',
        'glow-green': '0 0 20px rgba(168, 184, 159, 0.3), 0 0 40px rgba(168, 184, 159, 0.15)',
        'hover-lift': '0 20px 50px rgba(0, 0, 0, 0.1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
        slower: '400ms',
      },
      transitionTimingFunction: {
        cinematic: 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          from: { opacity: '0', transform: 'translateY(-40px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          from: { opacity: '0', transform: 'translateX(-40px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          from: { opacity: '0', transform: 'translateX(40px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-down": "fadeInDown 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-left": "fadeInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-right": "fadeInRight 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}