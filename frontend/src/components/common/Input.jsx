import React, { forwardRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

const Input = forwardRef(({ 
  label,
  error,
  className = '',
  ...props 
}, ref) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${
          isDarkMode ? 'text-slate-300' : 'text-gray-700'
        }`}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
          isDarkMode
            ? `bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 ${
                error ? 'border-red-500' : ''
              }`
            : `bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 ${
                error ? 'border-red-500' : ''
              }`
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;