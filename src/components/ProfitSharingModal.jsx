import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const ProfitSharingModal = ({ currentSettings, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    partner_1_name: 'Partner 1',
    partner_1_percentage: 33.33,
    partner_2_name: 'Partner 2',
    partner_2_percentage: 33.33,
    company_saving_percentage: 33.34
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
  async function fetchSettings() {
    const response = await apiService.getProfitSharingSettings();
    if (response) {
      setFormData({
        partner_1_name: response.partner_1_name || 'Partner 1',
        partner_1_percentage: response.partner_1_percentage || 0,
        partner_2_name: response.partner_2_name || 'Partner 2',
        partner_2_percentage: response.partner_2_percentage || 0,
        company_saving_percentage: response.company_saving_percentage || 0
      });
    }
  }
  if (!currentSettings) {
    fetchSettings();
  }
}, [currentSettings]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('percentage') ? parseFloat(value) || 0 : value
    }));
  };

  const validateForm = () => {
    const newErrors = [];
    
    if (!formData.partner_1_name.trim()) {
      newErrors.push('Partner 1 name is required');
    }
    
    if (!formData.partner_2_name.trim()) {
      newErrors.push('Partner 2 name is required');
    }
    
    if (formData.partner_1_percentage <= 0 || formData.partner_1_percentage > 100) {
      newErrors.push('Partner 1 percentage must be between 0 and 100');
    }
    
    if (formData.partner_2_percentage <= 0 || formData.partner_2_percentage > 100) {
      newErrors.push('Partner 2 percentage must be between 0 and 100');
    }
    
    if (formData.company_saving_percentage <= 0 || formData.company_saving_percentage > 100) {
      newErrors.push('Company saving percentage must be between 0 and 100');
    }
    
    const totalPercentage = formData.partner_1_percentage + formData.partner_2_percentage + formData.company_saving_percentage;
    if (Math.abs(totalPercentage - 100) > 0.01) {
      newErrors.push('Total percentages must equal 100%');
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
      await apiService.updateProfitSharingSettings(formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to update profit sharing settings:', error);
      setErrors([error.response?.data?.error || 'Failed to update profit sharing settings']);
    } finally {
      setLoading(false);
    }
  };

  const getTotalPercentage = () => {
    return formData.partner_1_percentage + formData.partner_2_percentage + formData.company_saving_percentage;
  };

  const adjustCompanyPercentage = () => {
    const partnerTotal = formData.partner_1_percentage + formData.partner_2_percentage;
    const newCompanyPercentage = 100 - partnerTotal;
    
    if (newCompanyPercentage >= 0 && newCompanyPercentage <= 100) {
      setFormData(prev => ({
        ...prev,
        company_saving_percentage: newCompanyPercentage
      }));
    }
  };

  const simulateShares = () => {
    const sampleNetIncome = 50000; // Sample 50k SAR
    return {
      partner_1: (sampleNetIncome * formData.partner_1_percentage / 100).toFixed(0),
      partner_2: (sampleNetIncome * formData.partner_2_percentage / 100).toFixed(0),
      company_saving: (sampleNetIncome * formData.company_saving_percentage / 100).toFixed(0)
    };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, color: '#1f2937' }}>
            🤝 Profit Sharing Settings
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {errors.length > 0 && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            {errors.map((error, index) => (
              <div key={index} style={{ color: '#dc2626', fontSize: '14px' }}>
                • {error}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Partner 1 */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>👤 Partner 1</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Name *
                </label>
                <input
                  type="text"
                  name="partner_1_name"
                  value={formData.partner_1_name}
                  onChange={handleInputChange}
                  placeholder="Partner name"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Percentage *
                </label>
                <input
                  type="number"
                  name="partner_1_percentage"
                  value={formData.partner_1_percentage}
                  onChange={handleInputChange}
                  onBlur={adjustCompanyPercentage}
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Partner 2 */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>👤 Partner 2</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Name *
                </label>
                <input
                  type="text"
                  name="partner_2_name"
                  value={formData.partner_2_name}
                  onChange={handleInputChange}
                  placeholder="Partner name"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '4px', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Percentage *
                </label>
                <input
                  type="number"
                  name="partner_2_percentage"
                  value={formData.partner_2_percentage}
                  onChange={handleInputChange}
                  onBlur={adjustCompanyPercentage}
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Company Savings */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>🏢 Company Savings</h4>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Percentage *
              </label>
              <input
                type="number"
                name="company_saving_percentage"
                value={formData.company_saving_percentage}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                required
                style={{
                  width: '200px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <small style={{ display: 'block', marginTop: '4px', color: '#6b7280' }}>
                Retained earnings for business growth
              </small>
            </div>
          </div>

          {/* Total Percentage Check */}
          <div style={{
            background: getTotalPercentage() === 100 ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${getTotalPercentage() === 100 ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              color: getTotalPercentage() === 100 ? '#065f46' : '#dc2626', 
              fontWeight: '500',
              marginBottom: '4px'
            }}>
              Total: {getTotalPercentage().toFixed(2)}%
            </div>
            <small style={{ 
              color: getTotalPercentage() === 100 ? '#047857' : '#991b1b'
            }}>
              {getTotalPercentage() === 100 ? 
                '✅ Percentages add up correctly' : 
                '⚠️ Percentages must total 100%'
              }
            </small>
          </div>

          {/* Simulation */}
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>
              📊 Example Distribution (50,000 SAR Net Income)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  {formData.partner_1_name}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
                  {formatCurrency(simulateShares().partner_1)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  {formData.partner_2_name}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
                  {formatCurrency(simulateShares().partner_2)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Company Savings
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
                  {formatCurrency(simulateShares().company_saving)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '12px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || getTotalPercentage() !== 100}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                background: (loading || getTotalPercentage() !== 100) ? '#9ca3af' : '#3b82f6',
                color: 'white',
                cursor: (loading || getTotalPercentage() !== 100) ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              {loading ? 'Updating...' : 'Update Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfitSharingModal;