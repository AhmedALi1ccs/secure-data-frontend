import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import CreateOrderModal from './CreateOrderModal';
import OrderDetailsModal from './OrderDetailsModal';
import PaymentModal from './PaymentModal';
import { calculateScreenTotals } from '../utils/screenTotals';
import { formatOrderAsArabicTxt } from '../utils/exportOrderTxt';

const OrdersView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    start_date: '',
    end_date: '',
    q: '',
    active: '',
    page: 1,
    per_page: 20
  });
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0
  });
  
  const [stats, setStats] = useState({
    total_orders: 0,
    confirmed_orders: 0,
    cancelled_orders: 0,
    total_revenue: 0,
    revenue_this_month: 0
  });

  useEffect(() => {
    loadOrders();
  }, [filters]);

  useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest('.export-dropdown')) {
      setShowExportDropdown(false);
    }
  };

  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, []);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getOrders(filters);
      setOrders(response.orders || []);
      setPagination(response.pagination || pagination);
      setStats(response.stats || stats);
    } catch (err) {
      setError('Failed to load orders: ' + err.message);
      console.error('Load orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleOrderCreated = () => {
    setShowCreateOrder(false);
    loadOrders();
  };
  
  const handleViewOrder = async (orderId) => {
    try {
      const response = await apiService.getOrder(orderId);
      setSelectedOrder(response.order);
      setShowOrderDetails(true);
    } catch (err) {
      alert('Failed to load order details: ' + err.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await apiService.cancelOrder(orderId);
      alert('Order cancelled successfully!');
      loadOrders();
    } catch (err) {
      alert('Failed to cancel order: ' + err.message);
    }
  };

  const handlePaymentUpdate = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

 const updatePaymentStatus = async (orderId, status, amount) => {
   try {
     // 1) increment the payed total
     await apiService.payOrder(orderId, amount);
     // 2) update the payment_status
     await apiService.updateOrder(orderId, { payment_status: status });
     alert('Payment updated successfully!');
     setShowPaymentModal(false);
     loadOrders();
   } catch (err) {
     console.error(err);
     alert('Failed to update payment: ' + err.message);
   }
 };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'SAR' 
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return { color: '#3b82f6', background: '#dbeafe' };
      case 'cancelled': return { color: '#ef4444', background: '#fee2e2' };
      default: return { color: '#6b7280', background: '#f3f4f6' };
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'received': return { color: '#10b981', background: '#d1fae5' };
      case 'partial': return { color: '#f59e0b', background: '#fef3c7' };
      case 'not_received': return { color: '#ef4444', background: '#fee2e2' };
      default: return { color: '#6b7280', background: '#f3f4f6' };
    }
  };

  const exportOrders = () => {
    const csvData = [];
    
      csvData.push([
        'Order ID', 'Location', 'google_maps_link', 'Start Date', 'End Date', 'Duration (Days)',
        'Total SQM', 'Total Amount (SAR)', 'Payed (SAR)', 'Remaining (SAR)',
        'Order Status', 'Payment Status',
        'Installing Assignee', 'Disassemble Assignee', 'Created Date'

      ]);


    orders.forEach(order => {
    csvData.push([
      order.order_id,
      order.location_name,
      order.google_maps_link|| '',
      formatDate(order.start_date),
      formatDate(order.end_date),
      order.duration_days,
      calculateScreenTotals(order).totalSqm.toFixed(2),
      order.total_amount,
      order.payed,
      order.remaining,
      order.order_status,
      order.payment_status?.replace('_', ' '),
      order.installing_assignee?.name || '',
      order.disassemble_assignee?.name || '',
      formatDate(order.created_at)
    ]);
  });

    
    

    const csvContent = csvData.map(row =>
      row.map(field => {
        const cell = String(field ?? '');
        return cell.includes(',') || cell.includes('"') || cell.includes('\n')
          ? `"${cell.replace(/"/g, '""')}"`
          : cell;
      }).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const exportOrdersAsTxt = () => {
  const today = new Date();
  const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let content = `السلام عليكم\n\n`;
  content += `التاريخ: ${dateFormatter.format(today)}\n\n`;

  orders.forEach(order => {
    try {
      content += `${formatOrderAsArabicTxt(order)}\n\n`;
    } catch (e) {
      console.error('Failed to format order for export:', order.order_id, e);
    }
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="welcome-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Orders Management</h2>
              <p>Manage your LED screen rental orders and track their status.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowCreateOrder(true)}
                className="action-button primary"
                style={{ marginBottom: '0' }}
              >
                📋 Create New Order
              </button>
              <div className="export-dropdown" style={{ position: 'relative' }}>
  <button
    className="action-button primary"
    style={{
      minWidth: '200px',
      justifyContent: 'center',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: 0
    }}
    onClick={() => setShowExportDropdown(prev => !prev)}
  >
    📨 Export ▼
  </button>

  {showExportDropdown && (
    <div
      style={{
        position: 'absolute',
        top: '110%',
        right: 0,
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
        zIndex: 1000,
        minWidth: '180px'
      }}
    >
      <div
        onClick={() => {
          exportOrders();
          setShowExportDropdown(false);
        }}
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          borderBottom: '1px solid #eee',
          background: '#fff',
          color: '#111'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
      >
        📊 Export as CSV
      </div>
      <div
        onClick={() => {
          exportOrdersAsTxt();
          setShowExportDropdown(false);
        }}
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          background: '#fff',
          color: '#111'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
      >
        📝 Export as TXT (Arabic)
      </div>
    </div>
  )}
</div>


            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid" style={{ marginBottom: '32px' }}>
          <div className="stat-card">
            <h3>Total Orders</h3>
            <div className="value">{stats.total_orders || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Confirmed Orders</h3>
            <div className="value">{stats.confirmed_orders || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <div className="value">{formatCurrency(stats.total_revenue)}</div>
          </div>
          <div className="stat-card">
            <h3>This Month</h3>
            <div className="value">{formatCurrency(stats.revenue_this_month)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3>🔍 Filters & Search</h3>
          </div>
          <div className="card-content">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Search Orders:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by order ID, location..."
                  value={filters.q}
                  onChange={(e) => handleFilterChange('q', e.target.value)}
                />
              </div>
              <div className="form-group">
              <label className="form-label">Active Only:</label>
              <select
                className="form-input"
                value={filters.active}
                onChange={(e) => handleFilterChange('active', e.target.value)}
              >
                <option value="">All Orders</option>
                <option value="true">Active Orders</option>
                <option value="false">Inactive Orders</option>
              </select>
            </div>

              <div className="form-group">
                <label className="form-label">Order Status:</label>
                <select
                  className="form-input"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payment Status:</label>
                <select
                  className="form-input"
                  value={filters.payment_status}
                  onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                >
                  <option value="">All Payment Status</option>
                  <option value="received">Paid</option>
                  <option value="partial">Partially Paid</option>
                  <option value="not_received">Unpaid</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date Range:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="date"
                    className="form-input"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  />
                  <input
                    type="date"
                    className="form-input"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="card">
          <div className="card-header">
            <h3>📋 Orders ({pagination.total_count})</h3>
          </div>
          <div className="card-content">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ margin: '0 auto 16px' }}></div>
                <p>Loading orders...</p>
              </div>
            ) : orders.length > 0 ? (
              <>
                <div className="items-list">
                 {orders.map(order => (
  <div key={order.id} className="item-row">
    <div className="item-info" style={{ flex: '1' }}>
      <h4>{order.order_id} – {order.location_name}</h4>
      <p>
        {formatDate(order.start_date)} – {formatDate(order.end_date)} •
        {calculateScreenTotals(order).totalSqm.toFixed(2)} m² • {formatCurrency(order.total_amount)}
      </p>
      
      {/* Personnel Information */}
      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>
            <strong style={{ color: '#065f46' }}>Installer:</strong> {order.installing_assignee?.name || 'Not assigned'}
          </span>
          <span>
            <strong style={{ color: '#92400e' }}>Disassembler:</strong> {order.disassemble_assignee?.name || 'Not assigned'}
          </span>
        </div>
      </div>

      {/* status & payment pills */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <span style={{
          ...getStatusColor(order.order_status),
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
         {(order.order_status ?? 'confirmed').replace('_',' ').toUpperCase()}
        </span>
        <span style={{
          ...getPaymentStatusColor(order.payment_status),
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
         {(order.payment_status ?? 'not_received').replace('_',' ').toUpperCase()}
        </span>
      </div>
    </div>

    {/* action buttons */}
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button
        onClick={() => handleViewOrder(order.id)}
        style={{
          background: '#3b82f6', color: 'white', border: 'none',
          padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        View
      </button>
      <button
        onClick={() => handlePaymentUpdate(order)}
        style={{
          background: '#10b981', color: 'white', border: 'none',
          padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Payment
      </button>

    {order.order_status === 'confirmed' && 
  (new Date(order.start_date) - new Date()) / (1000 * 60 * 60 * 24) >= -7 && (
  <button
    onClick={() => handleCancelOrder(order.id)}
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
    Cancel
  </button>
)}

    </div>
  </div>
))}

                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginTop: '24px' 
                  }}>
                    <button
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      style={{
                        background: pagination.current_page === 1 ? '#e5e7eb' : '#3b82f6',
                        color: pagination.current_page === 1 ? '#9ca3af' : 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: pagination.current_page === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ← Previous
                    </button>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Page {pagination.current_page} of {pagination.total_pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.total_pages}
                      style={{
                        background: pagination.current_page === pagination.total_pages ? '#e5e7eb' : '#3b82f6',
                        color: pagination.current_page === pagination.total_pages ? '#9ca3af' : 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: pagination.current_page === pagination.total_pages ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="icon">📋</div>
                <p>No orders found</p>
                <small>Create your first order to get started</small>
              </div>
            )}
          </div>
        </div>
      </div>
      

      {/* Modals */}
      <CreateOrderModal
        isOpen={showCreateOrder}
        onClose={() => {
     setShowCreateOrder(false);
     setEditingOrder(null);           
   }}
           onSuccess={() => {
     setShowCreateOrder(false);
     setEditingOrder(null);
     loadOrders();
     setFilters({ ...filters, q: '', page: 1 });
   }}
  initialData={editingOrder} 
  isEditMode={Boolean(editingOrder)} 
        
      />

      <OrderDetailsModal
        isOpen={showOrderDetails}
        order={selectedOrder}
        onClose={() => setShowOrderDetails(false)}
        onEdit={(order) => {
          setEditingOrder(order);
          setShowOrderDetails(false);
          setShowCreateOrder(true); 
  }}
      />

  <PaymentModal
  isOpen={showPaymentModal}
   order={selectedOrder}
 onClose={() => setShowPaymentModal(false)}
 onUpdate={updatePaymentStatus}
/>
    </div>
  );
};

export default OrdersView;