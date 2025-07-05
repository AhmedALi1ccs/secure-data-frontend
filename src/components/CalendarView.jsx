import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import OrderDetailsModal from './OrderDetailsModal';
import PaymentModal from './PaymentModal';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

 useEffect(() => {
  loadCurrentUser();
}, []);

useEffect(() => {
  if (currentUser) {
    loadCalendarData();
  }
}, [currentUser, currentDate, viewMode]);

  const loadCurrentUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      setCurrentUser(response.user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadCalendarData = async () => {
  if (!currentUser) {
    console.log("❌ No current user yet.");
    return;
  }

  setLoading(true);
  try {
    let startDate, endDate;
    if (viewMode === 'month') {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startDate = new Date(startOfWeek);
      endDate = new Date(startOfWeek);
      endDate.setDate(startOfWeek.getDate() + 6);
    } else {
      startDate = new Date(currentDate);
      endDate = new Date(currentDate);
    }

    const params = {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      per_page: 100,
    };


    if (!isAdmin() && !isViewer()) {
      params.user_id = currentUser.id;
    }

    console.log("📡 Sending params to backend:", params);

    const response = await apiService.getOrders(params);
    console.log("📥 Response from backend:", response);
    setOrders(response.orders || []);
  } catch (error) {
    console.error('❌ Failed to load calendar data:', error);
  } finally {
    setLoading(false);
  }
};



  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date) => new Date().toDateString() === date.toDateString();

  const getOrdersForDate = (date) => {
      const dateStr = date.toLocaleDateString('en-CA');
      return orders.flatMap(order => {
        const events = [];
        const orderStart = new Date(order.start_date).toISOString().split('T')[0];
        const orderEnd = new Date(order.end_date).toISOString().split('T')[0];

        if (orderStart === dateStr) {
          events.push({ type: 'installation', order });
        }
        if (orderEnd === dateStr) {
          events.push({ type: 'disassemble', order });
        }

        return events;
    });
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value || 0);


  // Admin-only functions
  const handleViewOrder = async (orderId) => {
     if (!isAdmin() && !isViewer()) return;
    
    try {
      const response = await apiService.getOrder(orderId);
      setSelectedOrder(response.order);
      setShowOrderDetails(true);
    } catch (err) {
      alert('Failed to load order details: ' + err.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!isAdmin()) return;
    
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await apiService.cancelOrder(orderId);
      alert('Order cancelled successfully!');
      loadCalendarData(); // Reload calendar data
    } catch (err) {
      alert('Failed to cancel order: ' + err.message);
    }
  };

  const handlePaymentUpdate = (order) => {
    if (!isAdmin()) return;
    
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
      loadCalendarData(); // Reload calendar data
    } catch (err) {
      console.error(err);
      alert('Failed to update payment: ' + err.message);
    }
  };

  const isAdmin = () => {
    return currentUser?.role === 'admin' || currentUser?.admin === true;
  };
  const isViewer = () => {
  return currentUser?.role === 'viewer';
};


  const renderHeader = () => {
    let label = '';
    if (viewMode === 'month') {
      label = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      label = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
    } else {
      label = currentDate.toLocaleDateString();
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{label}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigateDate(-1)} className="action-button secondary">← Previous</button>
          <button onClick={() => setCurrentDate(new Date())} className="action-button primary">Today</button>
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="action-button">
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
          </select>
          <button onClick={() => navigateDate(1)} className="action-button secondary">Next →</button>
        </div>
      </div>
    );
  };

  const renderMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const offset = first.getDay();
    const days = [];

    for (let i = 0; i < offset; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#e5e7eb', borderRadius: '8px' }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => <div key={day} style={{ padding: '12px 8px', textAlign: 'center', fontSize: '14px', fontWeight: '600', background: '#f9fafb' }}>{day}</div>)}
        {days.map((date, i) => (
          <div key={i} style={{ minHeight: '100px', background: '#fff' }}>
            {date && renderDayCell(date)}
          </div>
        ))}
      </div>
    );
  };

  const renderWeek = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#e5e7eb', borderRadius: '8px' }}>
        {[...Array(7)].map((_, i) => {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          return <div key={i} style={{ minHeight: '120px', background: '#fff' }}>{renderDayCell(date)}</div>;
        })}
      </div>
    );
  };

  const renderDay = () => {
    const ordersToday = getOrdersForDate(currentDate);
    return (
      <div style={{ padding: '16px', background: '#fff', borderRadius: '8px' }}>
        {ordersToday.length === 0 ? <p>No orders today.</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {ordersToday.map((orderEvent, i) => (
              <li key={i} style={{ marginBottom: '12px' }}>
                <strong>{orderEvent.order.order_id}</strong> – {orderEvent.order.location_name}<br />
                {formatCurrency(orderEvent.order.total_amount)} – {orderEvent.order.order_status}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const renderDayCell = (date) => {
  const orderEvents = getOrdersForDate(date);
  return (
    <div
      onClick={() => setSelectedDate(date)}
      style={{
        padding: '8px',
        cursor: 'pointer',
        background: selectedDate?.toDateString() === date.toDateString() ? '#fef3c7' : isToday(date) ? '#dbeafe' : 'white',
        borderLeft: isToday(date) ? '4px solid #3b82f6' : 'none'
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: isToday(date) ? 'bold' : '500', marginBottom: '4px', color: isToday(date) ? '#1d4ed8' : '#1f2937' }}>
        {date.getDate()}
      </div>
      {orderEvents.slice(0, 2).map(({ type, order }, i) => (
        <div
          key={i}
          style={{
            fontSize: '10px',
            padding: '2px 4px',
            marginBottom: '2px',
            borderRadius: '3px',
            background: type === 'installation' ? '#d1fae5' : '#fef9c3',
            color: type === 'installation' ? '#065f46' : '#92400e',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {order.order_id} {type === 'installation' ? '(Install)' : '(Disassemble)'}
        </div>
      ))}
      {orderEvents.length > 2 && (
        <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>
          +{orderEvents.length - 2} more
        </div>
      )}
    </div>
  );
};

  // Helper function to render installer/disassembler information
  const renderPersonnelInfo = (order, type) => {
    const personnelField = type === 'installation' ? 'installing_assignee' : 'disassemble_assignee';
    const personnel = order[personnelField];
    
    if (!personnel) {
      return (
        <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
          No {type === 'installation' ? 'installer' : 'disassembler'} assigned
        </div>
      );
    }

    return (
      <div style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>
        <strong>{type === 'installation' ? 'Installer:' : 'Disassembler:'}</strong>
        <div style={{ marginLeft: '8px' }}>
          <div>{personnel.name}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>ID: {personnel.id}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="welcome-section">
          {renderHeader()}
          <p style={{ marginTop: '4px' }}>Click on any date to see order details.</p>
        </div>

        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3>Order Schedule</h3>
          </div>
          <div className="card-content">
            {viewMode === 'month' && renderMonth()}
            {viewMode === 'week' && renderWeek()}
            {viewMode === 'day' && renderDay()}
          </div>
        </div>

        {selectedDate && (
  <div className="card" style={{ marginTop: '24px' }}>
    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
      <h3>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
      <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
    </div>
    <div className="card-content">
      {getOrdersForDate(selectedDate).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {getOrdersForDate(selectedDate).map(({ order, type }, idx) => (
            <div key={idx} style={{ 
              padding: '16px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              borderLeft: `4px solid ${type === 'installation' ? '#10b981' : '#f59e0b'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>{order.order_id}</strong>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                    {order.location_name}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  background: type === 'installation' ? '#d1fae5' : '#fef9c3',
                  color: type === 'installation' ? '#065f46' : '#92400e',
                  fontWeight: '500'
                }}>
                  {type === 'installation' ? 'Installation' : 'Disassembly'}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    <strong>Amount:</strong> {formatCurrency(order.total_amount)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', marginTop: '4px' }}>
                    <strong>Status:</strong> {order.order_status}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', marginTop: '4px' }}>
                    <strong>Payment:</strong> {order.payment_status}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    <strong>Start Date:</strong> {new Date(order.start_date).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', marginTop: '4px' }}>
                    <strong>End Date:</strong> {new Date(order.end_date).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', marginTop: '4px' }}>
                    <strong>Duration:</strong> {order.duration_days} days
                  </div>
                </div>
              </div>

              <div style={{ 
                borderTop: '1px solid #f3f4f6', 
                paddingTop: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                {renderPersonnelInfo(order, 'installation')}
                {renderPersonnelInfo(order, 'disassemble')}
              </div>

              {/* Admin Action Buttons */}
              <div style={{
  borderTop: '1px solid #f3f4f6',
  paddingTop: '12px',
  marginTop: '12px',
  display: 'flex',
  gap: '8px',
  justifyContent: 'flex-end'
}}>
  {(isAdmin() || isViewer()) && (
    <button
      onClick={() => handleViewOrder(order.id)}
      style={{
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '500'
      }}
    >
      📋 View Details
    </button>
  )}

  {isAdmin() && (
    <>
      <button
        onClick={() => handlePaymentUpdate(order)}
        style={{
          background: '#10b981',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500'
        }}
      >
        💰 Payment
      </button>

      {order.order_status === 'confirmed' && (
        <button
          onClick={() => handleCancelOrder(order.id)}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          ❌ Cancel
        </button>
      )}
    </>
  )}
</div>


            </div>
          ))}
        </div>
      ) : <p>No orders on this day.</p>}
    </div>
  </div>
)}

      </div>
      {/* Admin-only Modals */}
      {(isAdmin() || isViewer()) && (
        <>
          <OrderDetailsModal
            isOpen={showOrderDetails}
            order={selectedOrder}
            onClose={() => setShowOrderDetails(false)}
            onEdit={(order) => {
              // Handle edit if needed - you can implement this based on your requirements
              console.log('Edit order:', order);
            }}
          />

          <PaymentModal
            isOpen={showPaymentModal}
            order={selectedOrder}
            onClose={() => setShowPaymentModal(false)}
            onUpdate={updatePaymentStatus}
          />
        </>
      )}
    </div>
  );
};

export default CalendarView;