// Toast.jsx
import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', isVisible, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px 20px',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 9999,
      minWidth: '300px',
      maxWidth: '500px',
      animation: 'slideInRight 0.3s ease-out',
      fontWeight: '500'
    };

    const typeStyles = {
      success: {
        background: '#10b981',
        color: 'white',
        border: '1px solid #059669'
      },
      error: {
        background: '#ef4444',
        color: 'white',
        border: '1px solid #dc2626'
      },
      warning: {
        background: '#f59e0b',
        color: 'white',
        border: '1px solid #d97706'
      },
      info: {
        background: '#3b82f6',
        color: 'white',
        border: '1px solid #2563eb'
      }
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  const getIcon = () => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type];
  };

  return (
    <>
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={getToastStyles()}>
        <span style={{ fontSize: '18px' }}>{getIcon()}</span>
        <span style={{ flex: 1 }}>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
            marginLeft: '8px'
          }}
        >
          ×
        </button>
      </div>
    </>
  );
};

// Toast Manager Hook
export const useToast = () => {
  const [toast, setToast] = useState({
    message: '',
    type: 'success',
    isVisible: false
  });

  const showToast = (message, type = 'success') => {
    setToast({
      message,
      type,
      isVisible: true
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const ToastComponent = () => (
    <Toast
      message={toast.message}
      type={toast.type}
      isVisible={toast.isVisible}
      onClose={hideToast}
    />
  );

  return {
    showToast,
    hideToast,
    ToastComponent
  };
};

export default Toast;