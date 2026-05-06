import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../context/ThemeContext';

const Modal = ({ 
  isOpen, 
  onClose, 
  title,
  children,
  size = 'md',
  showClose = true,
}) => {
  const { isDarkMode } = useTheme();
  
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${
        isDarkMode ? 'bg-slate-950/50' : 'bg-black/50'
      } backdrop-blur-sm animate-fade-in`}
      onClick={onClose}
    >
      <div 
        className={`${sizes[size]} w-full rounded-2xl shadow-2xl overflow-hidden animate-scale-in ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700' 
            : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={`flex items-center justify-between px-6 py-5 border-b ${
            isDarkMode ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-xl font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{title}</h3>
            {showClose && (
              <button
                onClick={onClose}
                className={`p-1 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;