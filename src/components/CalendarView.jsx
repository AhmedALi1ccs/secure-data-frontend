import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month');

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewMode]);

  const loadCalendarData = async () => {
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

      const response = await apiService.getOrders({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        per_page: 100
      });
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
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
    return orders.filter(order => {
      const start = new Date(order.start_date);
      const end = new Date(order.end_date);
      return date >= start && date <= end;
    });
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(value || 0);

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
            {ordersToday.map((order, i) => (
              <li key={i} style={{ marginBottom: '12px' }}>
                <strong>{order.order_id}</strong> – {order.location_name}<br />
                {formatCurrency(order.total_amount)} – {order.order_status}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const renderDayCell = (date) => {
    const ordersForDate = getOrdersForDate(date);
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
        <div style={{ fontSize: '14px', fontWeight: isToday(date) ? 'bold' : '500', marginBottom: '4px', color: isToday(date) ? '#1d4ed8' : '#1f2937' }}>{date.getDate()}</div>
        {ordersForDate.slice(0, 2).map((o, i) => (
          <div key={i} style={{ fontSize: '10px', padding: '2px 4px', marginBottom: '2px', borderRadius: '3px', background: '#dbeafe', color: '#1d4ed8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.order_id}</div>
        ))}
        {ordersForDate.length > 2 && <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>+{ordersForDate.length - 2} more</div>}
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
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {getOrdersForDate(selectedDate).map((order, idx) => (
                    <li key={idx} style={{ marginBottom: '12px' }}>
                      <strong>{order.order_id}</strong> – {order.location_name}<br />
                      {formatCurrency(order.total_amount)} – {order.order_status}
                    </li>
                  ))}
                </ul>
              ) : <p>No orders on this day.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;