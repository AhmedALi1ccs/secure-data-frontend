import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AddEmployeeModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'user', // System role (admin or user)
    job_role: 'technician', // Job role (technician, manager, etc.)
    hourly_rate: '',
    contract_type: 'PAG'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'user',
      job_role: 'technician',
      hourly_rate: '',
      contract_type: 'PAG'
    });
    setErrors([]);
    setGeneratedPassword('');
    setShowSuccess(false);
  };

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
    
    if (!formData.first_name.trim()) {
      newErrors.push('First name is required');
    }
    
    if (!formData.last_name.trim()) {
      newErrors.push('Last name is required');
    }
    
    if (!formData.email.trim()) {
      newErrors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push('Please enter a valid email address');
    }
    
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.push('Please enter a valid phone number');
    }
    
    if (formData.hourly_rate && (isNaN(formData.hourly_rate) || parseFloat(formData.hourly_rate) < 0)) {
      newErrors.push('Hourly rate must be a valid positive number');
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
      const response = await apiService.createUser({
         ...formData,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null
      });
      
      
      setGeneratedPassword(response.temporary_password);
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Failed to create employee:', error);
      const errorMsg = error.response?.data?.errors?.join(', ') || 
                      error.response?.data?.error || 
                      error.message;
      setErrors([errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (showSuccess) {
      onSuccess && onSuccess();
    }
    resetForm();
    onClose();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  if (showSuccess) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ color: '#10b981', marginBottom: '16px' }}>Employee Created Successfully!</h3>
            
            <div style={{ 
              background: '#f0fdf4', 
              border: '2px solid #10b981', 
              borderRadius: '8px', 
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#065f46' }}>Login Credentials</h4>
              <div style={{ marginBottom: '8px' }}>
                <strong>Email:</strong> {formData.email}
                <button
                  onClick={() => copyToClipboard(formData.email)}
                  style={{
                    marginLeft: '8px',
                    background: 'none',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Copy
                </button>
              </div>
              <div>
                <strong>Temporary Password:</strong> {generatedPassword}
                <button
                  onClick={() => copyToClipboard(generatedPassword)}
                  style={{
                    marginLeft: '8px',
                    background: 'none',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div style={{ 
              background: '#fffbeb', 
              border: '1px solid #f59e0b', 
              borderRadius: '6px', 
              padding: '12px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#92400e'
            }}>
              <strong>⚠️ Important:</strong> Please share these credentials with the employee securely. 
              They should change their password upon first login.
            </div>
            
            <button 
              onClick={handleClose}
              className="action-button primary"
              style={{ width: '100%' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3>👤 Add New Employee</h3>
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
          {/* Personal Information */}
          <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>👤 Personal Information</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="employee@company.com"
                  required
                />
                <small style={{ color: '#6b7280' }}>This will be their login username</small>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+966 50 123 4567"
                />
              </div>
            </div>
          </div>

          {/* System Access & Role */}
          <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>🔐 System Access & Role</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">System Role *</label>
                <select
                  className="form-input"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  required
                >
                  <option value="user">Employee</option>
                  <option value="admin">Administrator</option>
                  <option value="viewer">Team Leader</option>
                </select>
                <small style={{ color: '#6b7280' }}>
                  {formData.role === 'admin' && 'Full system access including user management'}
                  {formData.role === 'user' && 'Standard access to orders, inventory, and finance'}
                  {formData.role === 'viewer' && 'Read-only access to system data'}
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Job Role</label>
                <select
                  className="form-input"
                  value={formData.job_role}
                  onChange={(e) => handleInputChange('job_role', e.target.value)}
                >
                  <option value="technician">Technician</option>
                  <option value="manager">Manager</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="coordinator">Event Coordinator</option>
                  <option value="installer">Installation Specialist</option>
                  <option value="support">Support Staff</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div style={{ marginBottom: '24px', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>💼 Employment Details</h4>
            
            <div className="form-group">
              <label className="form-label">Hourly Rate (SAR)</label>
              <input
                type="number"
                className="form-input"
                value={formData.hourly_rate}
                onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <small style={{ color: '#6b7280' }}>Optional - can be set later</small>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Contract Type</label>
            <select
              className="form-input"
              value={formData.contract_type}
              onChange={(e) => handleInputChange('contract_type', e.target.value)}
            >
              <option value="PAG">Pay As You Go</option>
              <option value="LT">Long-Term</option>
            </select>
          </div>


          {/* Account Creation Notice */}
          <div style={{ 
            background: '#fffbeb', 
            border: '1px solid #f59e0b', 
            borderRadius: '6px', 
            padding: '12px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#92400e'
          }}>
            <strong>📧 Account Creation:</strong> A user account will be automatically created with a temporary password. 
            The employee should change this password upon first login.
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
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Creating Employee...' : 'Create Employee & Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;