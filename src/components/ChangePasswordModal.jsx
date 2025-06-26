import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setErrors([]);
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = () => {
    const newErrors = [];
    
    if (!formData.current_password.trim()) {
      newErrors.push('Current password is required');
    }
    
    if (!formData.new_password.trim()) {
      newErrors.push('New password is required');
    } else if (formData.new_password.length < 8) {
      newErrors.push('New password must be at least 8 characters long');
    }
    
    if (!formData.confirm_password.trim()) {
      newErrors.push('Password confirmation is required');
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.push('New password and confirmation do not match');
    }
    
    if (formData.current_password === formData.new_password) {
      newErrors.push('New password must be different from current password');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors([]);

    try {
      await apiService.changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      });
      
      onSuccess && onSuccess();
      handleClose();
      
    } catch (error) {
      console.error('Failed to change password:', error);
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.errors?.join(', ') || 
                      error.message;
      setErrors([errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setErrors([]);
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    onClose();
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: '' };
    
    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ];
    
    strength = checks.filter(Boolean).length;
    
    const labels = {
      0: '',
      1: 'Very Weak',
      2: 'Weak',
      3: 'Fair',
      4: 'Good',
      5: 'Strong'
    };
    
    const colors = {
      0: '#e5e7eb',
      1: '#ef4444',
      2: '#f59e0b',
      3: '#eab308',
      4: '#10b981',
      5: '#059669'
    };
    
    return {
      strength,
      label: labels[strength],
      color: colors[strength],
      percentage: (strength / 5) * 100
    };
  };

  const passwordStrength = getPasswordStrength(formData.new_password);

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3>🔐 Change Password</h3>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>
        
        {errors.length > 0 && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {errors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Current Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                className="form-input"
                value={formData.current_password}
                onChange={(e) => handleInputChange('current_password', e.target.value)}
                placeholder="Enter your current password"
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {showPasswords.current ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">New Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                className="form-input"
                value={formData.new_password}
                onChange={(e) => handleInputChange('new_password', e.target.value)}
                placeholder="Enter your new password"
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {showPasswords.new ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.new_password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Password Strength</span>
                  <span style={{ color: passwordStrength.color, fontWeight: '500' }}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '4px', 
                  background: '#e5e7eb', 
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${passwordStrength.percentage}%`,
                      background: passwordStrength.color,
                      transition: 'width 0.3s ease, background-color 0.3s ease'
                    }}
                  ></div>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Password should include uppercase, lowercase, numbers, and special characters
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                className="form-input"
                value={formData.confirm_password}
                onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                placeholder="Confirm your new password"
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {formData.confirm_password && (
              <div style={{ 
                fontSize: '12px', 
                marginTop: '4px',
                color: formData.new_password === formData.confirm_password ? '#10b981' : '#ef4444'
              }}>
                {formData.new_password === formData.confirm_password ? '✅ Passwords match' : '❌ Passwords do not match'}
              </div>
            )}
          </div>

          {/* Security Tips */}
          <div style={{ 
            padding: '12px', 
            background: '#f0f9ff', 
            borderRadius: '6px', 
            marginBottom: '20px',
            fontSize: '12px',
            color: '#1e40af'
          }}>
            <strong>Password Security Tips:</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
              <li>Use at least 8 characters</li>
              <li>Include both uppercase and lowercase letters</li>
              <li>Add numbers and special characters</li>
              <li>Avoid common words or personal information</li>
            </ul>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleClose} 
              className="action-button secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="action-button primary"
              disabled={loading || formData.new_password !== formData.confirm_password}
              style={{ opacity: loading || formData.new_password !== formData.confirm_password ? 0.6 : 1 }}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;