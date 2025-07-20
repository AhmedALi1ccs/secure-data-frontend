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
    per_page: 20,
    due_filter: ''
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

  const isMobile = window.innerWidth <= 480;
  const isTablet = window.innerWidth <= 768;

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
      await apiService.updateOrderPayment(orderId, {
        payment_status: status,
        amount: amount,
      });
      alert('Payment updated successfully!');
      setShowPaymentModal(false);
      loadOrders();
    } catch (err) {
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
      month: isMobile ? 'short' : 'short',
      day: 'numeric',
      year: isMobile ? '2-digit' : 'numeric'
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
      'Total SQM', 'Total Amount (SAR)', 'paid (SAR)', 'Remaining (SAR)',
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

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
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

    const utf8WithBom = new Blob(["\uFEFF" + content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(utf8WithBom);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInstallThenDisassembleTxt = () => {
    const today = new Date();
    const arabicDate = new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(today);

    const formatArabicDate = (dateStr) => {
      return new Intl.DateTimeFormat('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(dateStr));
    };

    let content = `السلام عليكم\n\nالتاريخ: ${arabicDate}\n\n`;

    content += `تشغيلات التركيب\n\n`;

    orders.forEach((order) => {
      const screenReqs = order.order_screen_requirements || [];

      const screensText = screenReqs.map((req) => {
        return `• النوع: ${req.screen_type}, المساحة: ${req.sqm_required} متر, التكوين: ${req.dimensions_rows} × ${req.dimensions_columns}`;
      }).join('\n');

      const location = order.location_name || 'غير محدد';
      const link = order.google_maps_link || order.url || null;

      content += `📦 الطلب: ${order.order_id} (${location})\n`;
      content += `📍 الموقع: ${location}\n`;
      if (link) content += `🔗 الرابط: ${link}\n`;
      content += `${screensText}\n`;
      content += `🗓️ تاريخ التركيب: ${formatArabicDate(order.start_date)}\n`;
      content += `👷 الفني المسؤول: ${order.installing_assignee?.name || 'غير محدد'}\n\n`;
    });

    content += `تشغيلات الفك\n\n`;

    orders.forEach((order) => {
      const screenReqs = order.order_screen_requirements || [];

      const screensText = screenReqs.map((req) => {
        return `• النوع: ${req.screen_type}, المساحة: ${req.sqm_required} متر, التكوين: ${req.dimensions_rows} × ${req.dimensions_columns}`;
      }).join('\n');

      const location = order.location_name || 'غير محدد';
      const link = order.google_maps_link || order.url || null;

      content += `📦 الطلب: ${order.order_id} (${location})\n`;
      content += `📍 الموقع: ${location}\n`;
      if (link) content += `🔗 الرابط: ${link}\n`;
      content += `${screensText}\n`;
      content += `🗓️ تاريخ الفك: ${formatArabicDate(order.end_date)}\n`;
      content += `👷 الفني المسؤول: ${order.disassemble_assignee?.name || 'غير محدد'}\n\n`;
    });

    const blob = new Blob(["\uFEFF" + content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `assemble_then_disassemble_${today.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="welcome-section">
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? '16px' : '12px'
          }}>
            <div>
              <h2 style={{ 
                fontSize: isMobile ? '18px' : '24px',
                margin: 0
              }}>
                Orders Management
              </h2>
              <p style={{ 
                fontSize: isMobile ? '12px' : '14px',
                margin: '4px 0 0 0',
                display: isMobile ? 'none' : 'block'
              }}>
                Manage your LED screen rental orders and track their status.
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: isMobile ? '8px' : '12px',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button 
                onClick={() => setShowCreateOrder(true)}
                className="action-button primary"
                style={{ 
                  marginBottom: '0',
                  fontSize: isMobile ? '12px' : '14px',
                  padding: isMobile ? '8px 12px' : '12px 16px'
                }}
              >
                📋 {isMobile ? 'New Order' : 'Create New Order'}
              </button>
              <div className="export-dropdown" style={{ position: 'relative' }}>
                <button
                  className="action-button primary"
                  style={{
                    minWidth: isMobile ? 'auto' : '200px',
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: 0,
                    fontSize: isMobile ? '12px' : '14px',
                    padding: isMobile ? '8px 12px' : '12px 16px'
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
                      minWidth: isMobile ? '160px' : '180px'
                    }}
                  >
                    <div
                      onClick={() => {
                        exportOrders();
                        setShowExportDropdown(false);
                      }}
                      style={{
                        padding: isMobile ? '10px 12px' : '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: isMobile ? '12px' : '14px',
                        borderBottom: '1px solid #eee',
                        background: '#fff',
                        color: '#111'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      📊 {isMobile ? 'CSV' : 'Export as CSV'}
                    </div>
                    <div
                      onClick={() => {
                        exportOrdersAsTxt();
                        setShowExportDropdown(false);
                      }}
                      style={{
                        padding: isMobile ? '10px 12px' : '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: isMobile ? '12px' : '14px',
                        background: '#fff',
                        color: '#111',
                        borderBottom: '1px solid #eee'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      📝 {isMobile ? 'TXT (order)' : 'Export as TXT (order by order)'}
                    </div>
                    <div
                      onClick={() => {
                        exportInstallThenDisassembleTxt();
                        setShowExportDropdown(false);
                      }}
                      style={{
                        padding: isMobile ? '10px 12px' : '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: isMobile ? '12px' : '14px',
                        background: '#fff',
                        color: '#111'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      📦 {isMobile ? 'TXT (assemble)' : 'Export as TXT (assemble then disassemble)'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" style={{ 
            marginBottom: '20px',
            fontSize: isMobile ? '12px' : '14px',
            padding: isMobile ? '8px 12px' : '12px 16px'
          }}>
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid" style={{ 
          marginBottom: '32px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '12px' : '16px'
        }}>
          <div className="stat-card" style={{ padding: isMobile ? '12px' : '16px' }}>
            <h3 style={{ fontSize: isMobile ? '12px' : '14px', margin: '0 0 8px 0' }}>
              {isMobile ? 'Total' : 'Total Orders'}
            </h3>
            <div className="value" style={{ fontSize: isMobile ? '18px' : '24px' }}>
              {stats.total_orders || 0}
            </div>
          </div>
          <div className="stat-card" style={{ padding: isMobile ? '12px' : '16px' }}>
            <h3 style={{ fontSize: isMobile ? '12px' : '14px', margin: '0 0 8px 0' }}>
              {isMobile ? 'Confirmed' : 'Confirmed Orders'}
            </h3>
            <div className="value" style={{ fontSize: isMobile ? '18px' : '24px' }}>
              {stats.confirmed_orders || 0}
            </div>
          </div>
          <div className="stat-card" style={{ padding: isMobile ? '12px' : '16px' }}>
            <h3 style={{ fontSize: isMobile ? '12px' : '14px', margin: '0 0 8px 0' }}>
              {isMobile ? 'Revenue' : 'Total Revenue'}
            </h3>
            <div className="value" style={{ 
              fontSize: isMobile ? '14px' : '20px',
              wordBreak: 'break-word'
            }}>
              {formatCurrency(stats.total_revenue)}
            </div>
          </div>
          <div className="stat-card" style={{ padding: isMobile ? '12px' : '16px' }}>
            <h3 style={{ fontSize: isMobile ? '12px' : '14px', margin: '0 0 8px 0' }}>
              This Month
            </h3>
            <div className="value" style={{ 
              fontSize: isMobile ? '14px' : '20px',
              wordBreak: 'break-word'
            }}>
              {formatCurrency(stats.revenue_this_month)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 style={{ fontSize: isMobile ? '14px' : '18px' }}>🔍 Filters & Search</h3>
          </div>
          <div className="card-content">
            <div className="form-row" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: isMobile ? '12px' : '16px'
            }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  Search Orders:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={isMobile ? "Search..." : "Search by order ID, location..."}
                  value={filters.q}
                  onChange={(e) => handleFilterChange('q', e.target.value)}
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  Active Only:
                </label>
                <select
                  className="form-input"
                  value={filters.active}
                  onChange={(e) => handleFilterChange('active', e.target.value)}
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                >
                  <option value="">All Orders</option>
                  <option value="true">Active Orders</option>
                  <option value="false">Inactive Orders</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  Order Status:
                </label>
                <select
                  className="form-input"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  Due Filter:
                </label>
                <select
                  className="form-input"
                  value={filters.due_filter}
                  onChange={(e) => handleFilterChange('due_filter', e.target.value)}
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                >
                  <option value="">All</option>
                  <option value="overdue">Overdue</option>
                  <option value="due_this_week">Due This Week</option>
                </select>
              </div>
            </div>
            <div className="form-row" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: isMobile ? '12px' : '16px',
              marginTop: '12px'
            }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  Payment Status:
                </label>
                <select
                  className="form-input"
                  value={filters.payment_status}
                  onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                >
                  <option value="">All Payment Status</option>
                  <option value="received">Paid</option>
                  <option value="partial">Partially Paid</option>
                  <option value="not_received">Unpaid</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  Date Range:
                </label>
                <div style={{ 
                  display: 'flex', 
                  gap: '8px',
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <input
                    type="date"
                    className="form-input"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    style={{ fontSize: isMobile ? '12px' : '14px' }}
                  />
                  <input
                    type="date"
                    className="form-input"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    style={{ fontSize: isMobile ? '12px' : '14px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: isMobile ? '14px' : '18px' }}>
              📋 Orders ({pagination.total_count})
            </h3>
          </div>
          <div className="card-content">
            {loading ? (
              <div style={{ textAlign: 'center', padding: isMobile ? '24px' : '40px' }}>
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ margin: '0 auto 16px' }}></div>
                <p style={{ fontSize: isMobile ? '12px' : '14px' }}>Loading orders...</p>
              </div>
            ) : orders.length > 0 ? (
              <>
                <div className="items-list">
                  {orders.map(order => (
                    <div key={order.id} className="item-row" style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? '12px' : '16px',
                      padding: isMobile ? '12px' : '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      background: 'white'
                    }}>
                      <div className="item-info" style={{ flex: '1' }}>
                        <h4 style={{
                          margin: '0 0 8px 0',
                          fontSize: isMobile ? '14px' : '16px',
                          fontWeight: '600',
                          lineHeight: '1.4'
                        }}>
                          {order.order_id} – {order.location_name}
                        </h4>
                        <p style={{
                          margin: '0 0 8px 0',
                          fontSize: isMobile ? '12px' : '14px',
                          color: '#6b7280',
                          lineHeight: '1.4'
                        }}>
                          {formatDate(order.start_date)} – {formatDate(order.end_date)} •
                          {calculateScreenTotals(order).totalSqm.toFixed(2)} m² • {formatCurrency(order.total_amount)}
                        </p>
                        
                        {/* Personnel Information */}
                        {!isMobile && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            <div style={{ 
                              display: 'flex', 
                              gap: '16px',
                              flexWrap: 'wrap'
                            }}>
                              <span>
                                <strong style={{ color: '#065f46' }}>Installer:</strong> {order.installing_assignee?.name || 'Not assigned'}
                              </span>
                              <span>
                                <strong style={{ color: '#92400e' }}>Disassembler:</strong> {order.disassemble_assignee?.name || 'Not assigned'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Personnel Information - Mobile Layout */}
                        {isMobile && (
                          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                            <div>
                              <strong style={{ color: '#065f46' }}>Install:</strong> {order.installing_assignee?.name || 'N/A'}
                            </div>
                            <div>
                              <strong style={{ color: '#92400e' }}>Disasm:</strong> {order.disassemble_assignee?.name || 'N/A'}
                            </div>
                          </div>
                        )}

                        {/* Status & Payment Pills */}
                        <div style={{ 
                          display: 'flex', 
                          gap: isMobile ? '4px' : '8px', 
                          marginTop: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{
                            ...getStatusColor(order.order_status),
                            padding: isMobile ? '2px 6px' : '2px 8px',
                            borderRadius: '4px',
                            fontSize: isMobile ? '10px' : '12px',
                            fontWeight: '500',
                            whiteSpace: 'nowrap'
                          }}>
                            {(order.order_status ?? 'confirmed').replace('_',' ').toUpperCase()}
                          </span>
                          <span style={{
                            ...getPaymentStatusColor(order.payment_status),
                            padding: isMobile ? '2px 6px' : '2px 8px',
                            borderRadius: '4px',
                            fontSize: isMobile ? '10px' : '12px',
                            fontWeight: '500',
                            whiteSpace: 'nowrap'
                          }}>
                            {(order.payment_status ?? 'not_received').replace('_',' ').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ 
                        display: 'flex', 
                        gap: isMobile ? '4px' : '8px', 
                        alignItems: isMobile ? 'stretch' : 'center',
                        flexDirection: isMobile ? 'row' : 'column',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          style={{
                            background: '#3b82f6', 
                            color: 'white', 
                            border: 'none',
                            padding: isMobile ? '4px 8px' : '6px 12px', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            fontSize: isMobile ? '10px' : '12px',
                            whiteSpace: 'nowrap',
                            flex: isMobile ? '1' : 'none'
                          }}
                        >
                          {isMobile ? 'View' : 'View Details'}
                        </button>
                        <button
                          onClick={() => handlePaymentUpdate(order)}
                          style={{
                            background: '#10b981', 
                            color: 'white', 
                            border: 'none',
                            padding: isMobile ? '4px 8px' : '6px 12px', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            fontSize: isMobile ? '10px' : '12px',
                            whiteSpace: 'nowrap',
                            flex: isMobile ? '1' : 'none'
                          }}
                        >
                          {isMobile ? 'Pay' : 'Payment'}
                        </button>

                        {order.order_status === 'confirmed' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              padding: isMobile ? '4px 8px' : '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: isMobile ? '10px' : '12px',
                              whiteSpace: 'nowrap',
                              flex: isMobile ? '1' : 'none'
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
                    gap: isMobile ? '8px' : '12px', 
                    marginTop: '24px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      style={{
                        background: pagination.current_page === 1 ? '#e5e7eb' : '#3b82f6',
                        color: pagination.current_page === 1 ? '#9ca3af' : 'white',
                        border: 'none',
                        padding: isMobile ? '6px 12px' : '8px 16px',
                        borderRadius: '4px',
                        cursor: pagination.current_page === 1 ? 'not-allowed' : 'pointer',
                        fontSize: isMobile ? '12px' : '14px'
                      }}
                    >
                      {isMobile ? '← Prev' : '← Previous'}
                    </button>
                    <span style={{ 
                      fontSize: isMobile ? '12px' : '14px', 
                      color: '#6b7280',
                      whiteSpace: 'nowrap'
                    }}>
                      Page {pagination.current_page} of {pagination.total_pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.total_pages}
                      style={{
                        background: pagination.current_page === pagination.total_pages ? '#e5e7eb' : '#3b82f6',
                        color: pagination.current_page === pagination.total_pages ? '#9ca3af' : 'white',
                        border: 'none',
                        padding: isMobile ? '6px 12px' : '8px 16px',
                        borderRadius: '4px',
                        cursor: pagination.current_page === pagination.total_pages ? 'not-allowed' : 'pointer',
                        fontSize: isMobile ? '12px' : '14px'
                      }}
                    >
                      {isMobile ? 'Next →' : 'Next →'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state" style={{
                textAlign: 'center',
                padding: isMobile ? '32px 16px' : '48px 24px',
                color: '#6b7280'
              }}>
                <div className="icon" style={{ 
                  fontSize: isMobile ? '32px' : '48px', 
                  marginBottom: '16px' 
                }}>
                  📋
                </div>
                <p style={{ 
                  fontSize: isMobile ? '14px' : '16px', 
                  margin: '0 0 8px 0' 
                }}>
                  No orders found
                </p>
                <small style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  Create your first order to get started
                </small>
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
      editingOrderId={editingOrder?.order?.id}
    />

      <OrderDetailsModal
        isOpen={showOrderDetails}
        order={selectedOrder}
        onClose={() => setShowOrderDetails(false)}
        onEdit={async (order) => {
        try {
          const fullOrderData = await apiService.getOrder(order.id);
          console.log('🟢 Full edit data:', fullOrderData);

          setEditingOrder(fullOrderData);
          setShowOrderDetails(false);
          setShowCreateOrder(true);
        } catch (err) {
          console.error('❌ Failed to fetch full order for editing:', err);
          alert('Could not load order for editing');
        }
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