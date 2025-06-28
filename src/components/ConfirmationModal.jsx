// ConfirmationModal.jsx
import React from 'react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger' // 'danger', 'warning', 'info'
}) => {
  if (!isOpen) return null;

  const getModalStyles = () => {
    const typeStyles = {
      danger: {
        iconColor: '#ef4444',
        icon: '⚠️',
        confirmBg: '#ef4444',
        confirmHover: '#dc2626'
      },
      warning: {
        iconColor: '#f59e0b',
        icon: '⚠️',
        confirmBg: '#f59e0b',
        confirmHover: '#d97706'
      },
      info: {
        iconColor: '#3b82f6',
        icon: 'ℹ️',
        confirmBg: '#3b82f6',
        confirmHover: '#2563eb'
      }
    };
    return typeStyles[type];
  };

  const styles = getModalStyles();

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          animation: 'modalSlideIn 0.2s ease-out'
        }}
      >
        <style>
          {`
            @keyframes modalSlideIn {
              from {
                transform: scale(0.9);
                opacity: 0;
              }
              to {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}
        </style>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div 
            style={{
              fontSize: '48px',
              marginBottom: '16px',
              color: styles.iconColor
            }}
          >
            {styles.icon}
          </div>
          <h3 
            style={{
              margin: '0 0 12px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937'
            }}
          >
            {title}
          </h3>
          <p 
            style={{
              margin: 0,
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
          >
            {message}
          </p>
        </div>

        <div 
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              minWidth: '80px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f9fafb';
              e.target.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#d1d5db';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              background: styles.confirmBg,
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              minWidth: '80px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = styles.confirmHover;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = styles.confirmBg;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Confirmation Hook
export const useConfirmation = () => {
  const [confirmation, setConfirmation] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger'
  });

  const showConfirmation = ({ 
    title, 
    message, 
    onConfirm, 
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
  }) => {
    setConfirmation({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
      type
    });
  };

  const hideConfirmation = () => {
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    confirmation.onConfirm();
    hideConfirmation();
  };

  const ConfirmationComponent = () => (
    <ConfirmationModal
      {...confirmation}
      onClose={hideConfirmation}
      onConfirm={handleConfirm}
    />
  );

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationComponent
  };
};

export default ConfirmationModal;