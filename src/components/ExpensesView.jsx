import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import ExpenseModal from './ExpenseModal';
import RecurringExpenseModal from './RecurringExpenseModal';

const ExpensesView = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showRecurringModal, setShowRecurringModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const [filters, setFilters] = useState({
    expense_type: '',
    status: '',
    start_date: '',
    end_date: '',
    q: ''
  });

  useEffect(() => {
    loadExpenses();
  }, [filters]);

  const loadExpenses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getExpenses(filters);
      setExpenses(response.expenses || []);
    } catch (err) {
      setError('Failed to load expenses: ' + err.message);
      console.error('Load expenses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'SAR' 
    }).format(parseFloat(value) || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Date Error';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return { color: '#10b981', background: '#d1fae5' };
      case 'pending': return { color: '#f59e0b', background: '#fef3c7' };
      case 'rejected': return { color: '#ef4444', background: '#fee2e2' };
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

  // Calculate stats from expenses
  const stats = {
    total_expenses: expenses.length,
    approved_expenses: expenses.filter(e => e.status === 'approved').length,
    pending_expenses: expenses.filter(e => e.status === 'pending').length,
    total_amount: expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  };

  const exportExpenses = () => {
    const csvData = [
      ['Date', 'Type', 'Description', 'Amount (SAR)', 'Status', 'Recorded By']
    ];

    expenses.forEach(expense => {
      csvData.push([
        expense.expense_date || '',
        expense.expense_type || '',
        expense.description || '',
        expense.amount || '',
        expense.status || '',
        expense.recorded_by || ''
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '24px', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: window.innerWidth <= 768 ? 'stretch' : 'center',
        marginBottom: '32px',
        gap: window.innerWidth <= 768 ? '16px' : '0'
      }}>
        <div>
          <h2 style={{ 
            margin: '0 0 8px 0', 
            fontSize: window.innerWidth <= 480 ? '20px' : '28px', 
            fontWeight: 'bold', 
            color: '#1f2937' 
          }}>
            Expense Management
          </h2>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Track and manage business expenses, approvals, and recurring payments.
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          flexDirection: window.innerWidth <= 480 ? 'column' : 'row'
        }}>
          <button 
            onClick={() => setShowExpenseModal(true)}
            style={{
              padding: window.innerWidth <= 480 ? '10px 16px' : '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: window.innerWidth <= 480 ? '14px' : '16px'
            }}
          >
            💰 Record Expense
          </button>
          <button 
            onClick={() => setShowRecurringModal(true)}
            style={{
              padding: window.innerWidth <= 480 ? '10px 16px' : '12px 24px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: window.innerWidth <= 480 ? '14px' : '16px'
            }}
          >
            🔄 Manage Recurring
          </button>
          <button 
            onClick={exportExpenses}
            style={{
              padding: window.innerWidth <= 480 ? '10px 16px' : '12px 24px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: window.innerWidth <= 480 ? '14px' : '16px'
            }}
          >
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth <= 480 ? '1fr 1fr' : window.innerWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: window.innerWidth <= 480 ? '12px' : '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'white',
          padding: window.innerWidth <= 480 ? '16px' : '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            color: '#6b7280', 
            fontSize: window.innerWidth <= 480 ? '12px' : '14px', 
            fontWeight: '500' 
          }}>
            Total Expenses
          </h3>
          <div style={{ 
            fontSize: window.innerWidth <= 480 ? '24px' : '32px', 
            fontWeight: 'bold', 
            color: '#1f2937' 
          }}>
            {stats.total_expenses}
          </div>
        </div>
        
        <div style={{
          background: 'white',
          padding: window.innerWidth <= 480 ? '16px' : '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            color: '#6b7280', 
            fontSize: window.innerWidth <= 480 ? '12px' : '14px', 
            fontWeight: '500' 
          }}>
            Approved
          </h3>
          <div style={{ 
            fontSize: window.innerWidth <= 480 ? '24px' : '32px', 
            fontWeight: 'bold', 
            color: '#1f2937' 
          }}>
            {stats.approved_expenses}
          </div>
        </div>
        
        <div style={{
          background: 'white',
          padding: window.innerWidth <= 480 ? '16px' : '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            color: '#6b7280', 
            fontSize: window.innerWidth <= 480 ? '12px' : '14px', 
            fontWeight: '500' 
          }}>
            Pending Approval
          </h3>
          <div style={{ 
            fontSize: window.innerWidth <= 480 ? '24px' : '32px', 
            fontWeight: 'bold', 
            color: '#1f2937' 
          }}>
            {stats.pending_expenses}
          </div>
        </div>
        
        <div style={{
          background: 'white',
          padding: window.innerWidth <= 480 ? '16px' : '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            color: '#6b7280', 
            fontSize: window.innerWidth <= 480 ? '12px' : '14px', 
            fontWeight: '500' 
          }}>
            Total Amount
          </h3>
          <div style={{ 
            fontSize: window.innerWidth <= 480 ? '18px' : '32px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            wordBreak: 'break-word'
          }}>
            {formatCurrency(stats.total_amount)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        <div style={{ 
          padding: window.innerWidth <= 480 ? '16px 20px' : '20px 24px', 
          borderBottom: '1px solid #e5e7eb', 
          background: '#f9fafb' 
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: window.innerWidth <= 480 ? '16px' : '18px', 
            fontWeight: '600', 
            color: '#1f2937' 
          }}>
            🔍 Filters & Search
          </h3>
        </div>
        <div style={{ padding: window.innerWidth <= 480 ? '16px 20px' : '24px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151' 
              }}>
                Search:
              </label>
              <input
                type="text"
                placeholder="Search description..."
                value={filters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                style={{
                  width: '100%',
                  padding: window.innerWidth <= 480 ? '10px 12px' : '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: window.innerWidth <= 480 ? '14px' : '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151' 
              }}>
                Expense Type:
              </label>
              <select
                value={filters.expense_type}
                onChange={(e) => handleFilterChange('expense_type', e.target.value)}
                style={{
                  width: '100%',
                  padding: window.innerWidth <= 480 ? '10px 12px' : '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: window.innerWidth <= 480 ? '14px' : '16px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">All Types</option>
                <option value="labor">💼 Labor/Wages</option>
                <option value="transportation">🚚 Transportation</option>
                <option value="lunch">🍽️ Lunch/Meals</option>
                <option value="others">📋 Others</option>
              </select>
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151' 
              }}>
                Status:
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: window.innerWidth <= 480 ? '10px 12px' : '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: window.innerWidth <= 480 ? '14px' : '16px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ 
          padding: window.innerWidth <= 480 ? '16px 20px' : '20px 24px', 
          borderBottom: '1px solid #e5e7eb', 
          background: '#f9fafb' 
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: window.innerWidth <= 480 ? '16px' : '18px', 
            fontWeight: '600', 
            color: '#1f2937' 
          }}>
            💰 Expenses ({expenses.length})
          </h3>
        </div>
        <div style={{ padding: window.innerWidth <= 480 ? '16px 20px' : '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #f3f4f6',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <p>Loading expenses...</p>
            </div>
          ) : expenses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {expenses.map(expense => (
                <div key={expense.id} style={{
                  display: 'flex',
                  flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                  justifyContent: 'space-between',
                  alignItems: window.innerWidth <= 768 ? 'stretch' : 'center',
                  padding: window.innerWidth <= 480 ? '12px' : '16px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  gap: window.innerWidth <= 768 ? '12px' : '0'
                }}>
                  <div style={{ flex: '1' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '4px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ fontSize: '16px' }}>
                        {getExpenseTypeIcon(expense.expense_type)}
                      </span>
                      <h4 style={{ 
                        margin: 0,
                        fontSize: window.innerWidth <= 480 ? '14px' : '16px',
                        wordBreak: 'break-word'
                      }}>
                        {expense.description || `${expense.expense_type} expense`}
                      </h4>
                      <span style={{
                        ...getStatusColor(expense.status),
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: window.innerWidth <= 480 ? '10px' : '12px',
                        fontWeight: '500'
                      }}>
                        {(expense.status || 'pending').toUpperCase()}
                      </span>
                      {expense.auto_generated && (
                        <span style={{
                          background: '#e0e7ff',
                          color: '#3730a3',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: window.innerWidth <= 480 ? '10px' : '12px',
                          fontWeight: '500'
                        }}>
                          AUTO
                        </span>
                      )}
                    </div>
                    
                    <p style={{ 
                      margin: '4px 0', 
                      color: '#6b7280', 
                      fontSize: window.innerWidth <= 480 ? '12px' : '14px' 
                    }}>
                      {formatDate(expense.expense_date)} • {formatCurrency(expense.amount)}
                      {expense.recurring_expense && !window.innerWidth <= 480 && ` • Recurring: ${expense.recurring_expense.name}`}
                    </p>

                    <p style={{ 
                      margin: '4px 0', 
                      color: '#9ca3af', 
                      fontSize: window.innerWidth <= 480 ? '10px' : '12px',
                      display: window.innerWidth <= 480 ? 'none' : 'block'
                    }}>
                      Recorded by: {expense.recorded_by || 'Unknown'} • 
                      {formatDate(expense.expense_date)}
                    </p>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    alignItems: 'center',
                    justifyContent: window.innerWidth <= 768 ? 'space-between' : 'flex-end'
                  }}>
                    <div style={{ 
                      textAlign: window.innerWidth <= 768 ? 'left' : 'right', 
                      marginRight: window.innerWidth <= 768 ? '0' : '12px' 
                    }}>
                      <div style={{ 
                        fontSize: window.innerWidth <= 480 ? '14px' : '16px', 
                        fontWeight: 'bold', 
                        color: '#1f2937' 
                      }}>
                        {formatCurrency(expense.amount)}
                      </div>
                      <div style={{ 
                        fontSize: window.innerWidth <= 480 ? '10px' : '12px', 
                        color: '#6b7280' 
                      }}>
                        {expense.expense_type}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedExpense(expense); 
                        setIsEditMode(true);
                        setShowExpenseModal(true);
                        }}

                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: window.innerWidth <= 480 ? '4px 8px' : '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: window.innerWidth <= 480 ? '10px' : '12px'
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
              <div style={{ 
                fontSize: window.innerWidth <= 480 ? '48px' : '64px', 
                marginBottom: '16px', 
                opacity: 0.5 
              }}>
                💰
              </div>
              <p style={{ 
                fontSize: window.innerWidth <= 480 ? '16px' : '18px', 
                fontWeight: '500', 
                marginBottom: '8px', 
                color: '#374151' 
              }}>
                No expenses found
              </p>
              <small style={{ 
                fontSize: window.innerWidth <= 480 ? '12px' : '14px', 
                color: '#9ca3af' 
              }}>
                Record your first expense to get started
              </small>
            </div>
          )}
        </div>
      </div>

     {showExpenseModal && (
  <ExpenseModal
    isOpen={showExpenseModal}
    onClose={() => {
      setShowExpenseModal(false);
      setSelectedExpense(null);
      setIsEditMode(false);
    }}
    onSuccess={loadExpenses}
    isEditMode={isEditMode}
    initialData={selectedExpense}
  />
)}
      {showRecurringModal && (
  <RecurringExpenseModal
    isOpen={showRecurringModal}
    onClose={() => setShowRecurringModal(false)}
    onSuccess={loadExpenses}
  />
)}


      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ExpensesView;