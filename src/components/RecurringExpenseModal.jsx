import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const RecurringExpenseModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    expense_type: 'labor',
    amount: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    description: '',
    is_active: true
  });

  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [generatingMonth, setGeneratingMonth] = useState(new Date().getMonth() + 1);
  const [generatingYear, setGeneratingYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (isOpen) {
      loadRecurringExpenses();
      resetForm();
    }
  }, [isOpen]);

  const loadRecurringExpenses = async () => {
    try {
      const response = await apiService.getRecurringExpenses();
      setRecurringExpenses(response.recurring_expenses || []);
    } catch (error) {
      console.error('Failed to load recurring expenses:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      expense_type: 'labor',
      amount: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      description: '',
      is_active: true
    });
    setErrors([]);
    setSelectedExpense(null);
    setShowForm(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = () => {
    const newErrors = [];
    
    if (!formData.name.trim()) {
      newErrors.push('Name is required');
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.push('Amount must be greater than 0');
    }
    
    if (!formData.start_date) {
      newErrors.push('Start date is required');
    }
    
    if (formData.end_date && formData.end_date < formData.start_date) {
      newErrors.push('End date must be after start date');
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
        ...formData,
        amount: parseFloat(formData.amount),
        end_date: formData.end_date || null
      };

      if (selectedExpense) {
        await apiService.updateRecurringExpense(selectedExpense.id, expenseData);
      } else {
        await apiService.createRecurringExpense(expenseData);
      }
      
      await loadRecurringExpenses();
      resetForm();
      
    } catch (error) {
      console.error('Failed to save recurring expense:', error);
      const errorMsg = error.response?.data?.errors?.join(', ') || 
                      error.response?.data?.error || 
                      error.message;
      setErrors([errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      name: expense.name,
      expense_type: expense.expense_type,
      amount: expense.amount.toString(),
      frequency: expense.frequency,
      start_date: expense.start_date,
      end_date: expense.end_date || '',
      description: expense.description || '',
      is_active: expense.is_active
    });
    setShowForm(true);
  };

  const handleDeactivate = async (expenseId) => {
    if (!confirm('Are you sure you want to deactivate this recurring expense?')) return;
    
    try {
      await apiService.deleteRecurringExpense(expenseId);
      await loadRecurringExpenses();
    } catch (error) {
      console.error('Failed to deactivate recurring expense:', error);
      alert('Failed to deactivate recurring expense');
    }
  };

  const handleGenerateAll = async () => {
    if (!confirm(`Generate all recurring expenses for ${getMonthName(generatingMonth)} ${generatingYear}?`)) return;
    
    setLoading(true);
    try {
      const response = await apiService.generateAllRecurringExpenses(generatingMonth, generatingYear);
      alert(`Generated ${response.generated_count} expenses successfully!`);
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Failed to generate recurring expenses:', error);
      alert('Failed to generate recurring expenses: ' + error.message);
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

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const getFrequencyColor = (frequency) => {
    switch (frequency) {
      case 'weekly': return { color: '#3b82f6', background: '#dbeafe' };
      case 'monthly': return { color: '#10b981', background: '#d1fae5' };
      case 'quarterly': return { color: '#f59e0b', background: '#fef3c7' };
      case 'yearly': return { color: '#8b5cf6', background: '#ede9fe' };
      default: return { color: '#6b7280', background: '#f3f4f6' };
    }
  };

  const getExpenseTypeIcon = (type) => {
    switch (type) {
      case 'labor': return '💼';
      case 'transportation': return '🚚';
      case 'lunch': return '🍽️';
      case 'others': return '📋';
      default: return '💰';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3>🔄 Recurring Expenses Management</h3>
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

        {/* Generate All Section */}
        <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>⚡ Generate Monthly Expenses</h4>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '120px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Month:
              </label>
              <select
                value={generatingMonth}
                onChange={(e) => setGeneratingMonth(parseInt(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: '100px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Year:
              </label>
              <select
                value={generatingYear}
                onChange={(e) => setGeneratingYear(parseInt(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={2023 + i} value={2023 + i}>
                    {2023 + i}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerateAll}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Generating...' : 'Generate All'}
            </button>
          </div>
          <small style={{ color: '#6b7280', marginTop: '8px', display: 'block' }}>
            This will create expense records for all active recurring expenses for the selected month.
          </small>
        </div>

        {/* Action Buttons */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ➕ Add New Recurring Expense
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ marginBottom: '24px', padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>
              {selectedExpense ? 'Edit Recurring Expense' : 'Add New Recurring Expense'}
            </h4>
            
            {errors.length > 0 && (
              <div className="error-message" style={{ marginBottom: '16px' }}>
                {errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Monthly Salary, Office Rent"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type *</label>
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
              </div>

              <div className="form-row">
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
                <div className="form-group">
                  <label className="form-label">Frequency *</label>
                  <select
                    className="form-input"
                    value={formData.frequency}
                    onChange={(e) => handleInputChange('frequency', e.target.value)}
                    required
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date (Optional)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    min={formData.start_date}
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
                  placeholder="Additional details about this recurring expense..."
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Active
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {loading ? 'Saving...' : selectedExpense ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recurring Expenses List */}
        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: 0, color: '#374151' }}>
              📋 Recurring Expenses ({recurringExpenses.length})
            </h4>
          </div>
          
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {recurringExpenses.length > 0 ? (
              <div>
                {recurringExpenses.map(expense => (
                  <div key={expense.id} style={{ 
                    padding: '16px', 
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px' }}>
                          {getExpenseTypeIcon(expense.expense_type)}
                        </span>
                        <h5 style={{ margin: 0, color: '#1f2937' }}>{expense.name}</h5>
                        <span style={{
                          ...getFrequencyColor(expense.frequency),
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {expense.frequency}
                        </span>
                        {!expense.is_active && (
                          <span style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            Inactive
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '14px' }}>
                        {formatCurrency(expense.amount)} • 
                        Started: {new Date(expense.start_date).toLocaleDateString()}
                        {expense.end_date && ` • Ends: ${new Date(expense.end_date).toLocaleDateString()}`}
                      </p>
                      {expense.description && (
                        <p style={{ margin: '4px 0', color: '#9ca3af', fontSize: '12px', fontStyle: 'italic' }}>
                          {expense.description}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(expense)}
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Edit
                      </button>
                      {expense.is_active && (
                        <button
                          onClick={() => handleDeactivate(expense.id)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
                <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>
                  No recurring expenses yet
                </p>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Create recurring expenses for regular payments like salaries, rent, etc.
                </p>
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          marginTop: '20px', 
          display: 'flex', 
          justifyContent: 'center' 
        }}>
          <button 
            onClick={onClose} 
            style={{
              padding: '12px 24px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurringExpenseModal;