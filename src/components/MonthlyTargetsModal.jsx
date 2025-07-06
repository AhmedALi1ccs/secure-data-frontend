import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const MonthlyTargetsModal = ({ month, year, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    gross_earnings_target: '',
    estimated_fixed_expenses: '',
    estimated_variable_expenses: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    // Load existing target if available
    loadExistingTarget();
  }, [month, year]);

  const loadExistingTarget = async () => {
    try {
      const response = await apiService.getMonthlyTargets(year);
      const existingTarget = response.monthly_targets?.find(
        target => target.month === month
      );
      
      if (existingTarget) {
        setFormData({
          gross_earnings_target: existingTarget.gross_earnings_target || '',
          estimated_fixed_expenses: existingTarget.estimated_fixed_expenses || '',
          estimated_variable_expenses: existingTarget.estimated_variable_expenses || '',
          notes: existingTarget.notes || ''
        });
      }
    } catch (error) {
      console.error('Failed to load existing target:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = [];
    
    if (!formData.gross_earnings_target || parseFloat(formData.gross_earnings_target) <= 0) {
      newErrors.push('Gross earnings target must be greater than 0');
    }
    
    if (formData.estimated_fixed_expenses && parseFloat(formData.estimated_fixed_expenses) < 0) {
      newErrors.push('Fixed expenses cannot be negative');
    }
    
    if (formData.estimated_variable_expenses && parseFloat(formData.estimated_variable_expenses) < 0) {
      newErrors.push('Variable expenses cannot be negative');
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
      const targetData = {
        gross_earnings_target: parseFloat(formData.gross_earnings_target),
        estimated_fixed_expenses: parseFloat(formData.estimated_fixed_expenses) || 0,
        estimated_variable_expenses: parseFloat(formData.estimated_variable_expenses) || 0,
        notes: formData.notes
      };
      
      await apiService.setMonthlyTarget(month, year, targetData);
      onSuccess();
    } catch (error) {
      console.error('Failed to set monthly target:', error);
      setErrors([error.response?.data?.error || 'Failed to set monthly target']);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const calculateBreakEven = () => {
    const fixed = parseFloat(formData.estimated_fixed_expenses) || 0;
    const variable = parseFloat(formData.estimated_variable_expenses) || 0;
    return fixed + variable;
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
        maxWidth: '500px',
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
            🎯 Set Monthly Target - {getMonthName(month)} {year}
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
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontWeight: '500',
              color: '#374151'
            }}>
              💰 Gross Earnings Target (SAR) *
            </label>
            <input
              type="number"
              name="gross_earnings_target"
              value={formData.gross_earnings_target}
              onChange={handleInputChange}
              placeholder="e.g., 75000"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#6b7280' }}>
              Target revenue for {getMonthName(month)} {year}
            </small>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontWeight: '500',
              color: '#374151'
            }}>
              🏢 Estimated Fixed Expenses (SAR)
            </label>
            <input
              type="number"
              name="estimated_fixed_expenses"
              value={formData.estimated_fixed_expenses}
              onChange={handleInputChange}
              placeholder="e.g., 20000"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#6b7280' }}>
              Rent, salaries, insurance, etc.
            </small>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontWeight: '500',
              color: '#374151'
            }}>
              📊 Estimated Variable Expenses (SAR)
            </label>
            <input
              type="number"
              name="estimated_variable_expenses"
              value={formData.estimated_variable_expenses}
              onChange={handleInputChange}
              placeholder="e.g., 15000"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#6b7280' }}>
              Transportation, materials, contractor fees, etc.
            </small>
          </div>

          {/* Break-even calculation */}
          {(formData.estimated_fixed_expenses || formData.estimated_variable_expenses) && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ color: '#065f46', fontWeight: '500', marginBottom: '4px' }}>
                📊 Break-even Point: {formatCurrency(calculateBreakEven())}
              </div>
              <small style={{ color: '#047857' }}>
                Minimum revenue needed to cover estimated expenses
              </small>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontWeight: '500',
              color: '#374151'
            }}>
              📝 Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Optional notes about this target..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                resize: 'vertical'
              }}
            />
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
              disabled={loading}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              {loading ? 'Setting Target...' : 'Set Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MonthlyTargetsModal;