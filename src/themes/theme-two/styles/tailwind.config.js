/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/themes/theme-two/**/*.{js,ts,jsx,tsx}",
    "./src/themes/theme-two/**/*.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
        'inter': ['Outfit', 'sans-serif'], // Keep inter alias for backward compatibility
      },
      colors: {
        // Theme Two Color Palette
        'theme-two': {
          // Primary Colors
          'primary': {
            50: '#f3f0ff',
            100: '#e9e3ff',
            200: '#d6ccff',
            300: '#b8a6ff',
            400: '#9575ff',
            500: '#7D37FF', // Main primary color
            600: '#6B2FE6',
            700: '#5A28CC',
            800: '#4A21B3',
            900: '#3D1A99',
          },
          // Secondary Colors (from gradient)
          'secondary': {
            50: '#fff5f5',
            100: '#ffe8e8',
            200: '#ffd6d6',
            300: '#ffb8b8',
            400: '#ff9b9b',
            500: '#FFAEA5', // Main secondary color
            600: '#ff8a7a',
            700: '#ff6b5a',
            800: '#ff4d3a',
            900: '#ff2f1a',
          },
          // Text Colors
          'text': {
            'heading': '#101828',
            'paragraph': '#667085',
            'primary': '#101828',
            'secondary': '#667085',
            'tertiary': '#94a3b8',
            'muted': '#cbd5e1',
          },
          // Background Colors
          'bg': {
            'primary': '#ffffff',
            'secondary': '#f8fafc',
            'tertiary': '#f1f5f9',
          },
          // Border Colors
          'border': {
            'primary': '#e2e8f0',
            'secondary': '#cbd5e1',
          }
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(90deg, #7D37FF 0%, #FFAEA5 100%)',
        'gradient-primary-hover': 'linear-gradient(90deg, #6B2FE6 0%, #FF9B8F 100%)',
      },
      boxShadow: {
        'theme-two': '0 4px 12px rgba(125, 55, 255, 0.3)',
        'theme-two-lg': '0 8px 24px rgba(125, 55, 255, 0.2)',
      },
      animation: {
        'theme-two-bounce': 'bounce 0.5s ease-in-out',
        'theme-two-fade': 'fadeIn 0.3s ease-in-out',
        'theme-two-slide': 'slideIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
