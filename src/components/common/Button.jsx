import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  const { isDarkMode } = useTheme();

  const variants = {
    primary: isDarkMode
      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all'
      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all',
    secondary: isDarkMode
      ? 'border border-slate-600 text-slate-200 hover:bg-slate-800 transition-all'
      : 'border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all',
    danger: 'bg-red-500 text-white hover:bg-red-600 transition-all',
    ghost: isDarkMode
      ? 'text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        variants[variant]
      } ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
};

export default Button;