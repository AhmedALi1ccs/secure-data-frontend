import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const ExpenseModal = ({ isOpen, onClose, onSuccess, initialData, isEditMode }) => {
  const [formData, setFormData] = useState({
    expense_type: 'labor',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    order_id: '',
    contractor_type: '',
    hours_worked: '',
    hourly_rate: '',
    status: 'approved'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadOrders();
      if (isEditMode && initialData) {
        setFormData({
          expense_type: initialData.expense_type || 'labor',
          amount: initialData.amount || '',
          expense_date: initialData.expense_date || new Date().toISOString().split('T')[0],
          description: initialData.description || '',
          order_id: initialData.order_id || '',
          contractor_type: initialData.contractor_type || '',
          hours_worked: initialData.hours_worked || '',
          hourly_rate: initialData.hourly_rate || '',
          status: initialData.status || 'approved'
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData, isEditMode]);

  const loadOrders = async () => {
    try {
      const response = await apiService.getOrders({ status: 'confirmed', per_page: 100 });
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      expense_type: 'labor',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      description: '',
      order_id: '',
      contractor_type: '',
      hours_worked: '',
      hourly_rate: '',
      status: 'approved'
    });
    setErrors([]);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-calculate amount for hourly contractors
      if (field === 'hours_worked' || field === 'hourly_rate') {
        if (prev.contractor_type === 'hourly' && newData.hours_worked && newData.hourly_rate) {
          newData.amount = (parseFloat(newData.hours_worked) * parseFloat(newData.hourly_rate)).toFixed(2);
        }
      }
      
      // Clear contractor fields when expense type changes
      if (field === 'expense_type' && value !== 'labor') {
        newData.contractor_type = '';
        newData.hours_worked = '';
        newData.hourly_rate = '';
      }
      
      return newData;
    });
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = () => {
    const newErrors = [];
    
    if (!formData.expense_type) {
      newErrors.push('Expense type is required');
    }
    
    if (!formData.expense_date) {
      newErrors.push('Expense date is required');
    }
    
    if (!formData.description.trim()) {
      newErrors.push('Description is required');
    }
    
    // Validate contractor fields for labor expenses
    if (formData.expense_type === 'labor' && formData.contractor_type === 'hourly') {
      if (!formData.hours_worked || parseFloat(formData.hours_worked) <= 0) {
        newErrors.push('Hours worked must be greater than 0');
      }
      if (!formData.hourly_rate || parseFloat(formData.hourly_rate) <= 0) {
        newErrors.push('Hourly rate must be greater than 0');
      }
    } else {
      // For non-hourly expenses, amount is required
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.push('Amount must be greater than 0');
      }
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
      const expenseData = {
        expense_type: formData.expense_type,
        expense_date: formData.expense_date,
        description: formData.description,
        order_id: formData.order_id || null,
        status: formData.status
      };

      // Handle contractor expenses
      if (formData.expense_type === 'labor' && formData.contractor_type === 'hourly') {
        expenseData.contractor_type = formData.contractor_type;
        expenseData.hours_worked = parseFloat(formData.hours_worked);
        expenseData.hourly_rate = parseFloat(formData.hourly_rate);
        // Amount will be calculated on the backend
      } else {
        expenseData.amount = parseFloat(formData.amount);
      }

      if (isEditMode) {
        await apiService.updateExpense(initialData.id, expenseData);
      } else {
        await apiService.createExpense(expenseData);
      }
      
      onSuccess && onSuccess();
      onClose();
      resetForm();
      
    } catch (error) {
      console.error('Failed to save expense:', error);
      const errorMsg = error.response?.data?.errors?.join(', ') || 
                      error.response?.data?.error || 
                      error.message;
      setErrors([errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'SAR' 
    }).format(value || 0);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3>{isEditMode ? 'Edit Expense' : 'Record New Expense'}</h3>
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
          {/* Expense Details */}
          <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>💰 Expense Details</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Expense Type *</label>
                <select
                  className="form-input"
                  value={formData.expense_type}
                  onChange={(e) => handleInputChange('expense_type', e.target.value)}
                  required
                >
                  <option value="labor">💼 Labor/Wages</option>
                  <option value="transportation">🚚 Transportation</option>
                  <option value="lunch">🍽️ Lunch/Meals</option>
                  <option value="others">📋 Others</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.expense_date}
                  onChange={(e) => handleInputChange('expense_date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                className="form-input"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows="3"
                placeholder="Describe the expense..."
                required
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Link to Order (Optional)</label>
              <select
                className="form-input"
                value={formData.order_id}
                onChange={(e) => handleInputChange('order_id', e.target.value)}
              >
                <option value="">No specific order</option>
                {orders.map(order => (
                  <option key={order.id} value={order.id}>
                    {order.order_id} - {order.location_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Labor-specific fields */}
          {formData.expense_type === 'labor' && (
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>👷 Labor Details</h4>
              
              <div className="form-group">
                <label className="form-label">Contractor Type</label>
                <select
                  className="form-input"
                  value={formData.contractor_type}
                  onChange={(e) => handleInputChange('contractor_type', e.target.value)}
                >
                  <option value="">Fixed Amount</option>
                  <option value="hourly">Hourly Rate</option>
                </select>
              </div>

              {formData.contractor_type === 'hourly' && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Hours Worked *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.hours_worked}
                      onChange={(e) => handleInputChange('hours_worked', e.target.value)}
                      step="0.5"
                      min="0"
                      placeholder="8.0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hourly Rate (SAR) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.hourly_rate}
                      onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                      step="0.01"
                      min="0"
                      placeholder="75.00"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount field */}
          <div style={{ marginBottom: '24px', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>💵 Amount</h4>
            
            {formData.contractor_type === 'hourly' ? (
              <div style={{ 
                padding: '12px', 
                background: '#e5e7eb', 
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                  {formData.hours_worked && formData.hourly_rate ? 
                    formatCurrency(parseFloat(formData.hours_worked) * parseFloat(formData.hourly_rate)) :
                    'Enter hours and rate above'
                  }
                </span>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Calculated automatically: {formData.hours_worked || 0} hours × {formatCurrency(formData.hourly_rate || 0)}
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Amount (SAR) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div style={{ marginBottom: '24px', padding: '16px', background: '#fffbeb', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>📊 Status</h4>
            
            <div className="form-group">
              <label className="form-label">Approval Status</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
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
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 
                (isEditMode ? 'Updating...' : 'Recording...') : 
                (isEditMode ? 'Update Expense' : 'Record Expense')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;