import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AddInventoryModal = ({ isOpen, onClose, onSuccess, activeTab }) => {
  const getInitialFormData = () => ({
    // Screen inventory fields
    screen_type: '',
    pixel_pitch: '',
    total_sqm_owned: '',
    available_sqm: '',
    description: '',
    
    // Equipment fields
    equipment_type: activeTab === 'screens' ? '' : 
                   activeTab === 'laptops' ? 'laptop' :
                   activeTab === 'processors' ? 'video_processor' : 'cable',
    model: '',
    serial_number: '',
    purchase_price: '',
    purchase_date: '',
    notes: ''
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Reset form when modal opens or activeTab changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setErrors([]);
      setHasSubmitted(false);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0 && hasSubmitted) {
      validateForm();
    }
    
    // Auto-set available_sqm when total_sqm_owned changes for screens
    if (field === 'total_sqm_owned' && activeTab === 'screens') {
      setFormData(prev => ({
        ...prev,
        available_sqm: value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = [];
    
    if (activeTab === 'screens') {
      if (!formData.screen_type.trim()) newErrors.push('Screen type is required');
      if (!formData.pixel_pitch.trim()) newErrors.push('Pixel pitch is required');
      if (!formData.total_sqm_owned || formData.total_sqm_owned <= 0) newErrors.push('Total square meters must be greater than 0');
      if (!formData.available_sqm || formData.available_sqm < 0) newErrors.push('Available square meters cannot be negative');
      if (parseFloat(formData.available_sqm) > parseFloat(formData.total_sqm_owned)) {
        newErrors.push('Available square meters cannot exceed total owned');
      }
    } else {
      if (!formData.equipment_type) newErrors.push('Equipment type is required');
      if (!formData.model.trim()) newErrors.push('Model is required');
      if (formData.serial_number && formData.serial_number.trim().length === 0) {
        newErrors.push('Serial number cannot be empty if provided');
      }
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors([]);

    try {
      let response;
      
      if (activeTab === 'screens') {
        response = await apiService.createScreenInventory({
          screen_type: formData.screen_type,
          pixel_pitch: formData.pixel_pitch,
          total_sqm_owned: parseFloat(formData.total_sqm_owned),
          available_sqm: parseFloat(formData.available_sqm),
          description: formData.description,
          is_active: true
        });
      } else {
        // Format the data according to your API structure
        const equipmentData = {
          equipment_type: formData.equipment_type,
          model: formData.model,
          serial_number: formData.serial_number || null,
          purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
          purchase_date: formData.purchase_date || null,
          notes: formData.notes || null,
          status: 'available'
        };

        // Don't wrap in equipment object - the API service likely already does this
        response = await apiService.createEquipment(equipmentData);
      }
      
      onSuccess && onSuccess(response);
      handleClose();
      
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      const errorMsg = error.response?.data?.errors?.join(', ') || 
                      error.response?.data?.error || 
                      error.message;
      setErrors([`Failed to add item: ${errorMsg}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset everything when closing
    setFormData(getInitialFormData());
    setErrors([]);
    setHasSubmitted(false);
    onClose();
  };

  const getFormTitle = () => {
    switch (activeTab) {
      case 'screens': return 'Add LED Screen';
      case 'laptops': return 'Add Laptop';
      case 'processors': return 'Add Video Processor';
      case 'cables': return 'Add Cable';
      default: return 'Add Inventory Item';
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <h3>{getFormTitle()}</h3>
        
        {errors.length > 0 && hasSubmitted && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {errors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {activeTab === 'screens' ? (
            <>
              {/* LED Screen Form */}
              <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>📺 Screen Specifications</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Screen Type *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.screen_type}
                      onChange={(e) => handleInputChange('screen_type', e.target.value)}
                      placeholder="e.g., P2.6B1, P3.9B2"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pixel Pitch *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.pixel_pitch}
                      onChange={(e) => handleInputChange('pixel_pitch', e.target.value)}
                      placeholder="e.g., 2.6, 3.9, 4.0"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Total Square Meters Owned *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.total_sqm_owned}
                      onChange={(e) => handleInputChange('total_sqm_owned', e.target.value)}
                      step="0.1"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Available Square Meters *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.available_sqm}
                      onChange={(e) => handleInputChange('available_sqm', e.target.value)}
                      step="0.1"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="3"
                    placeholder="Additional details about this screen type..."
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Equipment Form */}
              <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>
                  {activeTab === 'laptops' && '💻 Laptop Details'}
                  {activeTab === 'processors' && '🖥️ Video Processor Details'}
                  {activeTab === 'cables' && '🔌 Cable Details'}
                </h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Model *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      placeholder={
                        activeTab === 'laptops' ? 'e.g., Dell Latitude 5520' :
                        activeTab === 'processors' ? 'e.g., Novastar VX4S' :
                        'e.g., HDMI Cable 10m'
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Serial Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.serial_number}
                      onChange={(e) => handleInputChange('serial_number', e.target.value)}
                      placeholder="e.g., LAP001, VID001"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Purchase Price (SAR)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.purchase_price}
                      onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchase Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.purchase_date}
                      onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-input"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows="3"
                    placeholder="Additional notes, specifications, or maintenance info..."
                  />
                </div>

                {/* Hidden equipment type field */}
                <input type="hidden" value={formData.equipment_type} />
              </div>
            </>
          )}

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
              {loading ? 'Adding...' : `Add ${getFormTitle().split(' ')[1]}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventoryModal;