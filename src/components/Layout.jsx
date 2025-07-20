import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NavLink } from 'react-router-dom';
import moment from 'moment-hijri';

const Layout = ({ children, currentView, onViewChange }) => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 480);
  const todayHijri = moment().format('iD iMMMM iYYYY');

  const allMenu = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊', description: 'Overview & Statistics' },
    { id: 'calendar',  name: 'Calendar',  icon: '📅', description: 'Daily Order Schedule' },
    { id: 'inventory', name: 'Inventory', icon: '📦', description: 'Screen Availability' },
    { id: 'orders',    name: 'Orders',    icon: '📋', description: 'Order Management' },
     { id: 'expenses',  name: 'Expenses',  icon: '💸', description: 'Expense Management' },
    { id: 'finance',   name: 'Finance',   icon: '💰', description: 'Revenue & Expenses' },
    { id: 'thirdcompanies',   name: 'Third party companies',   icon: '💻', description: 'Third party companies' },
    { id: 'users',     name: 'Users',     icon: '👥', description: 'User Management' },
  ];
   const menuItems = user?.role === 'user' || user?.role === 'viewer'
   ? allMenu.filter(item => item.id === 'calendar')
   : allMenu;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Sidebar */}
<div style={{
  width: sidebarCollapsed ? '60px' : '250px',
  background: 'white',
  borderRight: '1px solid #e5e7eb',
  transition: 'width 0.3s ease',
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  position: 'sticky',
  top: 0
}}>
  {/* Header */}
  <div style={{
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }}>
    {!sidebarCollapsed && (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: '#3b82f6',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontWeight: 'bold',
          marginRight: '12px',
          fontSize: '18px'
        }}>
          📺
        </div>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
          LED Rental
        </h1>
      </div>
    )}
    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
      background: 'none',
      border: 'none',
      padding: '4px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      color: '#6b7280'
    }}>
      {sidebarCollapsed ? '→' : '←'}
    </button>
  </div>

  {/* Scrollable Menu */}
  <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
    {menuItems.map(item => (
      <NavLink
        key={item.id}
        to={`/${item.id}`}
        style={({ isActive }) => ({
          width: '100%',
          textAlign: 'left',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          background: isActive ? '#eff6ff' : 'transparent',
          color: isActive ? '#1d4ed8' : '#374151',
          borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent'
        })}
        title={sidebarCollapsed ? item.name : ''}
      >
        <span style={{ fontSize: '20px', marginRight: sidebarCollapsed ? '0' : '12px' }}>{item.icon}</span>
        {!sidebarCollapsed && (
          <div>
            <div style={{ fontWeight: '500', fontSize: '14px' }}>{item.name}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{item.description}</div>
          </div>
        )}
      </NavLink>
    ))}
  </div>

  {/* Sticky Bottom User Section */}
  <div style={{
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
    background: 'white'
  }}>
    {!sidebarCollapsed ? (
      <>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: '#d1d5db',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginRight: '12px'
          }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1f2937',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user?.full_name}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {user?.role === 'viewer'
                ? 'Team Leader'
                : user?.role === 'user'
                ? 'Employee'
                : user?.role}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '8px',
            fontSize: '14px',
            color: '#dc2626',
            background: 'none',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🚪 Sign Out
        </button>
      </>
    ) : (
      <button
        onClick={logout}
        style={{
          width: '100%',
          padding: '8px',
          color: '#dc2626',
          background: 'none',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          textAlign: 'center'
        }}
        title="Sign Out"
      >
        🚪
      </button>
    )}
  </div>
</div>


      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Header */}
        <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {menuItems.find(item => item.id === currentView)?.name || 'Dashboard'}
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                {menuItems.find(item => item.id === currentView)?.description || 'LED Screen Rental Management'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '13px', color: '#9ca3af' }}>{todayHijri} (Hijri)</div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{ flex: 1, overflow: 'auto', background: '#f8f9fa' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;