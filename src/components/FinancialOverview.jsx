import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import MonthlyTargetsModal from './MonthlyTargetsModal';
import ProfitSharingModal from './ProfitSharingModal';
import ExpenseModal from './ExpenseModal';
import RecurringExpenseModal from './RecurringExpenseModal';

const FinancialOverview = () => {
  const [financialData, setFinancialData] = useState(null);
  const [monthlyComparison, setMonthlyComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadFinancialData();
    loadMonthlyComparison();
  }, [selectedMonth, selectedYear]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFinancialOverview(selectedMonth, selectedYear);
      setFinancialData(response);
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Failed to load financial data:', error);
      setNotifications([{
        type: 'error',
        message: 'Failed to load financial data',
        icon: '❌'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyComparison = async () => {
    try {
      const response = await apiService.getMonthlyComparison();
      setMonthlyComparison(response);
    } catch (error) {
      console.error('Failed to load monthly comparison:', error);
    }
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(parseInt(event.target.value));
  };

  const handleYearChange = (event) => {
    setSelectedYear(parseInt(event.target.value));
  };

  const handleExportReport = async () => {
    try {
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${lastDay}`;
      
      const response = await apiService.exportFinancialReport(startDate, endDate);
      
      // Create download link
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_report_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export financial report');
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

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          border: '3px solid #f3f4f6', 
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading financial data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
            💰 Financial Overview
          </h1>
          <p style={{ margin: '0', color: '#6b7280' }}>
            Track your business performance and profit sharing
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              value={selectedMonth} 
              onChange={handleMonthChange}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white'
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={handleYearChange}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white'
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
            onClick={handleExportReport}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            📊 Export Report
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          {notifications.map((notification, index) => (
            <div 
              key={index}
              style={{ 
                borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                background: notification.type === 'success' ? '#f0fdf4' : 
                           notification.type === 'warning' ? '#fffbeb' : '#fef2f2',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <span style={{ marginRight: '8px', fontSize: '16px' }}>
                {notification.icon}
              </span>
              <span style={{ color: '#374151', fontWeight: '500' }}>
                {notification.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main Financial Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
            💰 Gross Earnings
          </h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {formatCurrency(financialData?.gross_earnings)}
          </div>
          <small style={{ color: '#6b7280' }}>Revenue from completed orders</small>
        </div>
        
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
            💸 Total Expenses
          </h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {formatCurrency(financialData?.total_expenses)}
          </div>
          <small style={{ color: '#6b7280' }}>All approved expenses</small>
        </div>
        
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
            📈 Net Income
          </h3>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: financialData?.net_income >= 0 ? '#10b981' : '#ef4444'
          }}>
            {formatCurrency(financialData?.net_income)}
          </div>
          <small style={{ color: '#6b7280' }}>Gross earnings - expenses</small>
        </div>
        
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
            🎯 Monthly Target
          </h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {financialData?.monthly_target ? 
              `${Math.round(financialData.monthly_target.progress_percentage)}%` : 
              'Not Set'
            }
          </div>
          <small style={{ color: '#6b7280' }}>
            {financialData?.monthly_target ? 
              `${formatCurrency(financialData.monthly_target.target)} target` : 
              'Set monthly target'
            }
          </small>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>💸 Expense Breakdown</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6b7280' }}>👥 Labor</span>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>
              {formatCurrency(financialData?.expense_breakdown?.labor)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6b7280' }}>🚚 Transportation</span>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>
              {formatCurrency(financialData?.expense_breakdown?.transportation)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6b7280' }}>🍽️ Lunch</span>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>
              {formatCurrency(financialData?.expense_breakdown?.lunch)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6b7280' }}>📋 Others</span>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>
              {formatCurrency(financialData?.expense_breakdown?.others)}
            </span>
          </div>
        </div>
      </div>

      {/* Profit Sharing */}
      {financialData?.profit_sharing && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: '0', color: '#1f2937' }}>🤝 Profit Sharing</h3>
            <button 
              onClick={() => setShowProfitModal(true)}
              style={{
                padding: '6px 12px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ⚙️ Settings
            </button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px'
          }}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                {financialData.profit_sharing.settings.partner_1_name}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                {financialData.profit_sharing.settings.partner_1_percentage}%
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                {formatCurrency(financialData.profit_sharing.shares.partner_1)}
              </div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                {financialData.profit_sharing.settings.partner_2_name}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                {financialData.profit_sharing.settings.partner_2_percentage}%
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                {formatCurrency(financialData.profit_sharing.shares.partner_2)}
              </div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                Company Savings
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                {financialData.profit_sharing.settings.company_saving_percentage}%
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                {formatCurrency(financialData.profit_sharing.shares.company_saving)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Receivable */}
      {financialData?.accounts_receivable && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>💳 Accounts Receivable</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px'
          }}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                Total Outstanding
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                {formatCurrency(financialData.accounts_receivable.total_amount)}
              </div>
              <small style={{ color: '#9ca3af' }}>
                {financialData.accounts_receivable.orders_count} orders
              </small>
            </div>
            
            <div style={{ textAlign: 'center', padding: '16px', background: '#fef2f2', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                Overdue
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>
                {formatCurrency(financialData.accounts_receivable.overdue.amount)}
              </div>
              <small style={{ color: '#9ca3af' }}>
                {financialData.accounts_receivable.overdue.count} orders
              </small>
            </div>
            
            <div style={{ textAlign: 'center', padding: '16px', background: '#fffbeb', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                Due This Week
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
                {formatCurrency(financialData.accounts_receivable.due_this_week.amount)}
              </div>
              <small style={{ color: '#9ca3af' }}>
                {financialData.accounts_receivable.due_this_week.count} orders
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Comparison Chart */}
      {monthlyComparison && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>📊 6-Month Comparison</h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'end',
            height: '200px',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {monthlyComparison.monthly_data?.map((month, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: 1
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280', 
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  {month.month.split(' ')[0]}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'end', 
                  gap: '4px',
                  height: '150px'
                }}>
                  <div 
                    style={{ 
                      width: '20px',
                      height: `${Math.max(month.revenue / 100000 * 150, 5)}px`,
                      background: '#10b981',
                      borderRadius: '2px',
                      position: 'relative'
                    }}
                    title={`Revenue: ${formatCurrency(month.revenue)}`}
                  ></div>
                  <div 
                    style={{ 
                      width: '20px',
                      height: `${Math.max(month.expenses / 100000 * 150, 5)}px`,
                      background: '#ef4444',
                      borderRadius: '2px'
                    }}
                    title={`Expenses: ${formatCurrency(month.expenses)}`}
                  ></div>
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  color: '#1f2937', 
                  marginTop: '8px',
                  textAlign: 'center'
                }}>
                  {formatCurrency(month.profit)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                background: '#10b981',
                borderRadius: '2px'
              }}></div>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Revenue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                background: '#ef4444',
                borderRadius: '2px'
              }}></div>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Expenses</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>⚡ Quick Actions</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '12px'
        }}>
          <button 
            onClick={() => setShowTargetsModal(true)}
            style={{
              padding: '12px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🎯 Set Monthly Target
          </button>
          <button 
            onClick={() => setShowExpenseModal(true)}
            style={{
              padding: '12px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            💸 Add Expense
          </button>
          <button 
            onClick={() => setShowRecurringModal(true)}
            style={{
              padding: '12px 16px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🔄 Manage Recurring
          </button>
          <button 
            onClick={() => window.location.href = '/expenses'}
            style={{
              padding: '12px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            📋 View All Expenses
          </button>
        </div>
      </div>

      {/* Modals */}
      {showTargetsModal && (
        <MonthlyTargetsModal
          month={selectedMonth}
          year={selectedYear}
          onClose={() => setShowTargetsModal(false)}
          onSuccess={() => {
            setShowTargetsModal(false);
            loadFinancialData();
          }}
        />
      )}

      {showProfitModal && (
        <ProfitSharingModal
          currentSettings={financialData?.profit_sharing?.settings}
          onClose={() => setShowProfitModal(false)}
          onSuccess={() => {
            setShowProfitModal(false);
            loadFinancialData();
          }}
        />
      )}

      {showExpenseModal && (
        <ExpenseModal
          onClose={() => setShowExpenseModal(false)}
          onSuccess={() => {
            setShowExpenseModal(false);
            loadFinancialData();
          }}
        />
      )}

      {showRecurringModal && (
        <RecurringExpenseModal
          onClose={() => setShowRecurringModal(false)}
          onSuccess={() => {
            setShowRecurringModal(false);
            loadFinancialData();
          }}
        />
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FinancialOverview;