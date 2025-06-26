import React from 'react';

const NotificationModal = ({ isOpen, onClose, type, title, message, details }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': 
        return {
          bg: '#f0f9ff',
          border: '#3b82f6',
          text: '#1e40af',
          button: '#3b82f6'
        };
      case 'error':
        return {
          bg: '#fef2f2',
          border: '#ef4444',
          text: '#dc2626',
          button: '#ef4444'
        };
      case 'warning':
        return {
          bg: '#fffbeb',
          border: '#f59e0b',
          text: '#d97706',
          button: '#f59e0b'
        };
      default:
        return {
          bg: '#f8f9fa',
          border: '#6b7280',
          text: '#374151',
          button: '#6b7280'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: '500px',
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {getIcon()}
          </div>
          
          <h3 style={{ 
            color: colors.text, 
            marginBottom: '8px',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            {title}
          </h3>
          
          <p style={{ 
            color: colors.text, 
            margin: '0 0 16px 0',
            fontSize: '16px'
          }}>
            {message}
          </p>
          
          {details && (
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '6px',
              border: `1px solid ${colors.border}`,
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              <strong style={{ color: colors.text }}>Details:</strong>
              <ul style={{ 
                margin: '8px 0 0 0', 
                paddingLeft: '20px',
                color: colors.text 
              }}>
                {Array.isArray(details) ? (
                  details.map((detail, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{detail}</li>
                  ))
                ) : (
                  <li>{details}</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            onClick={onClose}
            style={{
              width: '100%',
              background: colors.button,
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.9'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            {type === 'success' ? 'Great!' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
