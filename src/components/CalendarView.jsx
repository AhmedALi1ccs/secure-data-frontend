import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import OrderDetailsModal from './OrderDetailsModal';
import PaymentModal from './PaymentModal';
import CreateOrderModal from './CreateOrderModal';

const CalendarView = () => {
  const [editingOrder, setEditingOrder] = useState(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState(window.innerWidth <= 480 ? 'day' : 'month');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    
    // Force day view on mobile devices
    const handleResize = () => {
      if (window.innerWidth <= 480 && viewMode !== 'day') {
        setViewMode('day');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Check on initial load

    return () => window.removeEventListener('resize', handleResize);
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
      const filtered = (response.orders || []).filter(order => order.order_status !== 'cancelled');
      setOrders(filtered);
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
      loadCalendarData();
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
      await apiService.updateOrderPayment(orderId, {
        payment_status: status,
        amount: amount,
      });
      alert('Payment updated successfully!');
      setShowPaymentModal(false);
    } catch (err) {
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
      <div style={{ 
        display: 'flex', 
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: window.innerWidth <= 768 ? 'stretch' : 'center',
        gap: window.innerWidth <= 768 ? '12px' : '0'
      }}>
        <h2 style={{ 
          margin: 0,
          fontSize: window.innerWidth <= 768 ? '18px' : '24px',
          textAlign: window.innerWidth <= 768 ? 'center' : 'left'
        }}>
          {label}
        </h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => navigateDate(-1)} 
              className="action-button secondary"
              style={{ 
                fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                padding: window.innerWidth <= 480 ? '6px 8px' : '8px 12px'
              }}
            >
              ← Prev
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())} 
              className="action-button primary"
              style={{ 
                fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                padding: window.innerWidth <= 480 ? '6px 8px' : '8px 12px'
              }}
            >
              Today
            </button>
            <button 
              onClick={() => navigateDate(1)} 
              className="action-button secondary"
              style={{ 
                fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                padding: window.innerWidth <= 480 ? '6px 8px' : '8px 12px'
              }}
            >
              Next →
            </button>
          </div>
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)} 
            className="action-button"
            style={{ 
              fontSize: window.innerWidth <= 480 ? '12px' : '14px',
              padding: window.innerWidth <= 480 ? '6px 8px' : '8px 12px',
              minWidth: window.innerWidth <= 480 ? '80px' : 'auto'
            }}
          >
            {window.innerWidth <= 480 ? (
              <option value="day">Day</option>
            ) : (
              <>
                <option value="month">Month</option>
                <option value="week">Week</option>
                <option value="day">Day</option>
              </>
            )}
          </select>
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '1px', 
        background: '#e5e7eb', 
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
          <div key={day} style={{ 
            padding: window.innerWidth <= 480 ? '8px 4px' : '12px 8px', 
            textAlign: 'center', 
            fontSize: window.innerWidth <= 480 ? '10px' : '14px', 
            fontWeight: '600', 
            background: '#f9fafb' 
          }}>
            {window.innerWidth <= 480 ? day.substring(0, 3) : day}
          </div>
        ))}
        {days.map((date, i) => (
          <div key={i} style={{ 
            minHeight: window.innerWidth <= 480 ? '60px' : window.innerWidth <= 768 ? '80px' : '100px', 
            background: '#fff' 
          }}>
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '1px', 
        background: '#e5e7eb', 
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {[...Array(7)].map((_, i) => {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          return (
            <div key={i} style={{ 
              minHeight: window.innerWidth <= 480 ? '80px' : window.innerWidth <= 768 ? '100px' : '120px', 
              background: '#fff' 
            }}>
              {renderDayCell(date)}
            </div>
          );
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
                <strong>{orderEvent.order.location_name}</strong> – {orderEvent.order.order_id}<br />
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
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 768;
    
    return (
      <div
        onClick={() => setSelectedDate(date)}
        style={{
          padding: isMobile ? '4px' : '8px',
          cursor: 'pointer',
          background: selectedDate?.toDateString() === date.toDateString() ? '#fef3c7' : isToday(date) ? '#dbeafe' : 'white',
          borderLeft: isToday(date) ? '4px solid #3b82f6' : 'none',
          height: '100%'
        }}
      >
        <div style={{ 
          fontSize: isMobile ? '10px' : '14px', 
          fontWeight: isToday(date) ? 'bold' : '500', 
          marginBottom: '2px', 
          color: isToday(date) ? '#1d4ed8' : '#1f2937' 
        }}>
          {date.getDate()}
        </div>
        {orderEvents.slice(0, isMobile ? 1 : 2).map(({ type, order }, i) => (
          <div
            key={i}
            style={{
              fontSize: isMobile ? '8px' : '10px',
              padding: isMobile ? '1px 2px' : '2px 4px',
              marginBottom: '1px',
              borderRadius: '2px',
              background: type === 'installation' ? '#d1fae5' : '#fef9c3',
              color: type === 'installation' ? '#065f46' : '#92400e',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: isMobile ? '1.2' : '1.3'
            }}
          >
            {isMobile ? (
              <>
                {order.order_id.length > 8 ? order.order_id.substring(0, 8) + '...' : order.order_id}
                <div style={{ fontSize: '7px' }}>
                  {type === 'installation' ? 'Install' : 'Disasm'}
                </div>
              </>
            ) : (
              <>
                {order.order_id} {type === 'installation' ? '(Install)' : '(Disassemble)'}
                {order.google_maps_link && !isMobile && (
                  <a
                    href={order.google_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', fontSize: '10px', color: '#3b82f6' }}
                  >
                    📍 Map
                  </a>
                )}
              </>
            )}
          </div>
        ))}
        {orderEvents.length > (isMobile ? 1 : 2) && (
          <div style={{ 
            fontSize: isMobile ? '7px' : '10px', 
            color: '#6b7280', 
            fontWeight: '500' 
          }}>
            +{orderEvents.length - (isMobile ? 1 : 2)} more
          </div>
        )}
      </div>
    );
  };

  // Helper function to render installer/disassembler information
  const renderPersonnelInfo = (order, type) => {
    const personnelField = type === 'installation' ? 'installing_assignee' : 'disassemble_assignee';
    const personnel = order[personnelField];
    const isMobile = window.innerWidth <= 480;
    
    if (!personnel) {
      return (
        <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6b7280', fontStyle: 'italic' }}>
          No {type === 'installation' ? 'installer' : 'disassembler'} assigned
        </div>
      );
    }

    return (
      <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#374151', marginTop: '4px' }}>
        <strong>{type === 'installation' ? 'Installer:' : 'Disassembler:'}</strong>
        <div style={{ marginLeft: isMobile ? '4px' : '8px' }}>
          <div>{personnel.name}</div>
          <div style={{ fontSize: isMobile ? '9px' : '11px', color: '#6b7280' }}>ID: {personnel.id}</div>
        </div>
      </div>
    );
  };

  const isMobile = window.innerWidth <= 480;
  const isTablet = window.innerWidth <= 768;

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="welcome-section">
          {renderHeader()}
          <p style={{ 
            marginTop: '4px',
            fontSize: isMobile ? '12px' : '14px',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            Click on any date to see order details.
          </p>
        </div>

        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3 style={{ fontSize: isMobile ? '16px' : '18px' }}>Order Schedule</h3>
          </div>
          <div className="card-content">
            {viewMode === 'month' && renderMonth()}
            {viewMode === 'week' && renderWeek()}
            {viewMode === 'day' && renderDay()}
          </div>
        </div>

        {selectedDate && (
          <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <h3 style={{ 
                fontSize: isMobile ? '14px' : '18px',
                margin: 0,
                flex: 1
              }}>
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: isMobile ? 'short' : 'long', 
                  month: isMobile ? 'short' : 'long', 
                  day: 'numeric', 
                  year: isMobile ? '2-digit' : 'numeric' 
                })}
              </h3>
              <button 
                onClick={() => setSelectedDate(null)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: isMobile ? '16px' : '18px', 
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>
            <div className="card-content">
              {getOrdersForDate(selectedDate).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {getOrdersForDate(selectedDate).map(({ order, type }, idx) => (
                    <div key={idx} style={{ 
                      padding: isMobile ? '12px' : '16px', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      borderLeft: `4px solid ${type === 'installation' ? '#10b981' : '#f59e0b'}`
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        marginBottom: '8px',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: isMobile ? '14px' : '16px' }}>
                            {order.location_name}
                          </strong>
                          <div style={{ 
                            fontSize: isMobile ? '12px' : '14px', 
                            color: '#6b7280', 
                            marginTop: '2px',
                            wordBreak: 'break-all'
                          }}>
                            {order.order_id}
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: isMobile ? '10px' : '12px', 
                          padding: isMobile ? '3px 6px' : '4px 8px', 
                          borderRadius: '4px',
                          background: type === 'installation' ? '#d1fae5' : '#fef9c3',
                          color: type === 'installation' ? '#065f46' : '#92400e',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>
                          {type === 'installation' ? 'Installation' : 'Disassembly'}
                        </div>
                      </div>

                      {order.google_maps_link && (
                        <div style={{ marginTop: '3px', marginBottom: '6px' }}>
                          <a
                            href={order.google_maps_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              fontSize: isMobile ? '11px' : '13px', 
                              color: '#3b82f6',
                              wordBreak: 'break-word'
                            }}
                          >
                            📍 View Location on Google Maps
                          </a>
                        </div>
                      )}

                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                        gap: '12px', 
                        marginBottom: '12px' 
                      }}>
                        <div>
                          {isAdmin() && (
                            <div style={{ 
                              fontSize: isMobile ? '12px' : '14px', 
                              color: '#374151' 
                            }}>
                              <strong>Amount:</strong> {formatCurrency(order.total_amount)}
                            </div>
                          )} 
                          {order.third_party_provider && (
                            <div style={{ 
                              fontSize: isMobile ? '12px' : '14px', 
                              color: '#374151',
                              marginTop: '2px'
                            }}>
                              <strong>Third Party:</strong> {order.third_party_provider.name}
                            </div>
                          )}
                          <div style={{ 
                            fontSize: isMobile ? '12px' : '14px', 
                            color: '#374151', 
                            marginTop: '4px' 
                          }}>
                            <strong>Status:</strong> {order.order_status}
                          </div>
                          {isAdmin() && (
                            <div style={{ 
                              fontSize: isMobile ? '12px' : '14px', 
                              color: '#374151', 
                              marginTop: '4px' 
                            }}>
                              <strong>Payment:</strong> {order.payment_status}
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ 
                            fontSize: isMobile ? '12px' : '14px', 
                            color: '#374151' 
                          }}>
                            <strong>Start:</strong> {new Date(order.start_date).toLocaleDateString()}
                          </div>
                          <div style={{ 
                            fontSize: isMobile ? '12px' : '14px', 
                            color: '#374151', 
                            marginTop: '4px' 
                          }}>
                            <strong>End:</strong> {new Date(order.end_date).toLocaleDateString()}
                          </div>
                          <div style={{ 
                            fontSize: isMobile ? '12px' : '14px', 
                            color: '#374151', 
                            marginTop: '4px' 
                          }}>
                            <strong>Duration:</strong> {order.duration_days} days
                          </div>
                        </div>
                      </div>

                      <div style={{ 
                        borderTop: '1px solid #f3f4f6', 
                        paddingTop: '12px',
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                        gap: '12px'
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
                        gap: isMobile ? '4px' : '8px',
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap'
                      }}>
                        {(isAdmin() || isViewer()) && (
                          <button
                            onClick={() => handleViewOrder(order.id)}
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: isMobile ? '6px 8px' : '8px 16px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: isMobile ? '10px' : '12px',
                              fontWeight: '500'
                            }}
                          >
                            📋 {isMobile ? 'View' : 'View Details'}
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
                                padding: isMobile ? '6px 8px' : '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: isMobile ? '10px' : '12px',
                                fontWeight: '500'
                              }}
                            >
                              💰 {isMobile ? 'Pay' : 'Payment'}
                            </button>

                            {order.order_status === 'confirmed' && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  padding: isMobile ? '6px 8px' : '8px 16px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: isMobile ? '10px' : '12px',
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
              ) : <p style={{ fontSize: isMobile ? '14px' : '16px' }}>No orders on this day.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Admin-only Modals */}
      <>
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
        <CreateOrderModal
          isOpen={showCreateOrder}
          onClose={() => {
            setShowCreateOrder(false);
            setEditingOrder(null);
          }}
          onSuccess={() => {
            setShowCreateOrder(false);
            setEditingOrder(null);
            loadCalendarData();
          }}
          initialData={editingOrder}
          isEditMode={Boolean(editingOrder)}
        />

        <PaymentModal
          isOpen={showPaymentModal}
          order={selectedOrder}
          onClose={() => setShowPaymentModal(false)}
          onUpdate={updatePaymentStatus}
        />
      </>
    </div>
  );
};

export default CalendarView;