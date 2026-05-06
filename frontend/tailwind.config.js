/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode
        light: {
          bg: '#FFFFFF',
          card: '#F2F2F2',
          text: '#333333',
          textSecondary: '#666666',
          border: '#E5E5E5',
        },
        // Dark mode
        dark: {
          50: '#2A2A2D',
          100: '#3A3A3E',
          200: '#4A4A4F',
          300: '#5A5A60',
          400: '#7A7A80',
          500: '#6A6A70',
          600: '#5A5A60',
          700: '#4A4A4F',
          800: '#252528',
          900: '#1B1B1D',
          bg: '#1B1B1D',
          card: '#252528',
          text: '#EEEEEE',
          textSecondary: '#BBBBBB',
          border: '#3A3A3E',
        },
        // Primary accent
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#2D7FFD',
          300: '#357BF1',
          400: '#2D7FFD',
          500: '#2D7FFD',
          600: '#1d5fd4',
          700: '#1547b0',
          800: '#0d3b8c',
          900: '#052e68',
        },
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(45, 127, 253, 0.15)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};