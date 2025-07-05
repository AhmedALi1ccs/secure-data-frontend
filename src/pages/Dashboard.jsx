import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import CreateOrderModal from '../components/CreateOrderModal';
import { useNavigate } from 'react-router-dom';
import { calculateScreenTotals } from '../utils/screenTotals';
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    total_orders: 0,
    active_orders: 0,
    total_revenue: 0,
    revenue_this_month: 0
  });
  const [orders, setOrders] = useState([]);
  const [equipmentStatus, setEquipmentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
   const navigate = useNavigate();
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading dashboard data...');
      
      const ordersResponse = await apiService.getOrders({ per_page: 5 });
      console.log('Orders response:', ordersResponse);
      
      setOrders(ordersResponse.orders || []);
      setStats(ordersResponse.stats || stats);

      try {
        const equipmentResponse = await apiService.getEquipmentAvailability();
        console.log('Equipment response:', equipmentResponse);
        setEquipmentStatus(equipmentResponse);
      } catch (equipError) {
        console.log('Equipment endpoint not available:', equipError.message);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCreated = (orderResponse) => {
    console.log('Order created successfully:', orderResponse);
    alert('Order created successfully! 🎉');
    loadDashboardData(); // Refresh the dashboard
  };

  const formatCurrency = (value) => {
    const numValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'SAR' 
    }).format(numValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': 
        return { color: '#3b82f6', background: '#dbeafe', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' };
      
      case 'pending': 
        return { color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' };
      case 'cancelled': 
        return { color: '#ef4444', background: '#fee2e2', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' };
      default: 
        return { color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' };
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '16px',
          padding: '20px'
        }}>
          <div style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold' }}>
            ⚠️ Dashboard Error
          </div>
          <p style={{ color: '#6b7280', textAlign: 'center', maxWidth: '500px' }}>
            {error}
          </p>
          <button 
            onClick={loadDashboardData}
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="header-left">
          <div className="header-logo">📺</div>
          <h1 className="header-title">LED Screen Rental System</h1>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <div className="user-avatar">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="user-details">
              <h4>{user?.full_name}</h4>
              <p>{user?.role}</p>
            </div>
          </div>
          <button className="logout-button" onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="welcome-section">
          <h2>Welcome back, {user?.first_name}!</h2>
          <p>Manage your LED screen rental orders and track your business performance.</p>
        </div>

        {/* Main Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Orders</h3>
            <div className="value">{stats.total_orders || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Active Orders</h3>
            <div className="value">{stats.active_orders || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <div className="value">{formatCurrency(stats.total_revenue || 0)}</div>
          </div>
          <div className="stat-card">
            <h3>This Month</h3>
            <div className="value">{formatCurrency(stats.revenue_this_month || 0)}</div>
          </div>
        </div>

        {/* Equipment Status (if available) */}
        {equipmentStatus && (
          <div className="stats-grid" style={{ marginTop: '20px' }}>
            <div className="stat-card">
              <h3>Laptops</h3>
              <div className="value">
                {equipmentStatus.laptops?.available || 0} / {equipmentStatus.laptops?.total || 0}
              </div>
              <small style={{ color: '#6b7280' }}>Available / Total</small>
            </div>
            <div className="stat-card">
              <h3>Video Processors</h3>
              <div className="value">
                {equipmentStatus.video_processors?.available || 0} / {equipmentStatus.video_processors?.total || 0}
              </div>
              <small style={{ color: '#6b7280' }}>Available / Total</small>
            </div>
            <div className="stat-card">
              <h3>Equipment Ready</h3>
              <div 
                className="value" 
                style={{ 
                  color: equipmentStatus.can_fulfill_order ? '#10b981' : '#ef4444',
                  fontSize: '18px'
                }}
              >
                {equipmentStatus.can_fulfill_order ? '✅ Ready' : '❌ Limited'}
              </div>
            </div>
            <div className="stat-card">
              <h3>Refresh Data</h3>
              <button 
                onClick={loadDashboardData}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 Reload
              </button>
            </div>
          </div>
        )}

        <div className="content-grid">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="card-content">
              <button 
                className="action-button primary"
                onClick={() => setShowCreateOrder(true)}
              >
                📋 Create New Order
              </button>
              <button className="action-button secondary"  onClick={() => navigate('/orders')}>
                
                📊 View All Orders
              </button>
              <button className="action-button secondary" onClick={() => navigate('/finance')}>
                💰 Finance Report
              </button>
              <button className="action-button secondary" onClick={() => navigate('/inventory')}>
                🔧 Equipment Status
              </button>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card">
            <div className="card-header">
              <h3>Recent Orders ({orders.length})</h3>
            </div>
            <div className="card-content">
              {orders.length > 0 ? (
                <div className="items-list">
                  {orders.map(order => (
                    <div key={order.id} className="item-row">
                      <div className="item-info">
                        <h4>{order.location_name || `Order #${order.id}`}</h4>
                        <p>
                          {formatDate(order.start_date)} - {formatDate(order.end_date)}
                        </p>
                        <p>
                          {calculateScreenTotals(order).totalSqm.toFixed(2) || 0} m² • {formatCurrency(order.total_amount || 0)}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <span style={getStatusColor(order.order_status)}>
                            {order.order_status || 'unknown'}
                          </span>
                          <span style={getStatusColor(order.payment_status === 'received' ? 'completed' : 'pending')}>
                            {order.payment_status === 'received' ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="icon">📋</div>
                  <p>No orders found</p>
                  <small>Create your first LED screen rental order to get started</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={showCreateOrder}
        onClose={() => setShowCreateOrder(false)}
        onSuccess={handleOrderCreated}
      />
    </div>
  );
};

export default Dashboard;
