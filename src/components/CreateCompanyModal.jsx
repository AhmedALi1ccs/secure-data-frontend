// CreateCompanyModal.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useToast } from './Toast'; // Import from Toast.jsx

const CreateCompanyModal = ({ isOpen, onClose, onSuccess, initialData, isEditMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    is_active: true
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  
  // Use the toast hook
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    if (isOpen && initialData && isEditMode) {
      setFormData({
        name: initialData.name || '',
        contact_person: initialData.contact_person || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        is_active: initialData.is_active !== false
      });
    } else if (isOpen && !initialData) {
      resetForm();
    }
  }, [isOpen, initialData, isEditMode]);

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      is_active: true
    });
    setErrors([]);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) setErrors([]);
  };

  const validateForm = () => {
    const newErrors = [];
    if (!formData.name.trim()) newErrors.push('Company name is required');
    if (!formData.contact_person.trim()) newErrors.push('Contact person is required');
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push('Please enter a valid email address');
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
      const companyData = {
        ...formData,
        email: formData.email.trim() || '',
        phone: formData.phone.trim() || '',
        address: formData.address.trim() || ''
      };

      let response;
      if (isEditMode) {
        response = await apiService.updateCompany(initialData.id, companyData);
      } else {
        response = await apiService.createCompany(companyData);
      }

      // Show success toast instead of alert
      showToast(
        response.message || `Company ${isEditMode ? 'updated' : 'created'} successfully!`,
        'success'
      );
      
      onSuccess && onSuccess(response);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to save company:', error);
      if (error.response?.status === 422 && Array.isArray(error.response?.data?.errors)) {
        setErrors(error.response.data.errors);
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'An unexpected error occurred';
        setErrors([errorMessage]);
        
        // Also show error toast
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Toast Component */}
      <ToastComponent />
      
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
          <h3>{isEditMode ? 'Edit Company' : 'Add New Company'}</h3>
          
          {errors.length > 0 && (
            <div className="error-message" style={{ marginBottom: '20px' }}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>🏢 Company Information</h4>
              
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter company name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Person *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.contact_person}
                  onChange={(e) => handleInputChange('contact_person', e.target.value)}
                  placeholder="Enter primary contact person"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@company.com"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+966 50 123 4567"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  className="form-input"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter company address"
                  rows="3"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    style={{ marginRight: '8px' }}
                    disabled={loading}
                  />
                  <span className="form-label" style={{ margin: 0 }}>Active Company</span>
                </label>
                <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  Active companies will appear in the third-party provider selection list
                </small>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={onClose} 
                className="action-button secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="action-button primary"
                disabled={loading || !formData.name.trim() || !formData.contact_person.trim()}
                style={{ 
                  opacity: (loading || !formData.name.trim() || !formData.contact_person.trim()) ? 0.6 : 1 
                }}
              >
                {loading 
                  ? (isEditMode ? 'Updating...' : 'Creating...') 
                  : (isEditMode ? 'Update Company' : 'Create Company')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateCompanyModal;