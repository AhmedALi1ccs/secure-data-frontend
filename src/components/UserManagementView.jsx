import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import AddEmployeeModal from './AddEmployeeModal';
import UserDetailsModal from './UserDetailsModal';

const UserManagementView = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  
  const [filters, setFilters] = useState({
    role: '',
    active: '',
    q: '',
    page: 1,
    per_page: 20
  });
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0
  });
  
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    admin_users: 0,
    employee_users: 0
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUsers(filters);
      setUsers(response.users || []);
      setPagination(response.pagination || pagination);
      setStats(response.stats || stats);
    } catch (err) {
      setError('Failed to load users: ' + err.message);
      console.error('Load users error:', err);
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

  const handlePasswordChanged = () => {
    setShowChangePassword(false);
    alert('Password changed successfully! 🎉');
  };

  const handleEmployeeAdded = () => {
    setShowAddEmployee(false);
    loadUsers();
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await apiService.getUser(userId);
      setSelectedUser(response.user);
      setShowUserDetails(true);
    } catch (err) {
      alert('Failed to load user details: ' + err.message);
    }
  };

  const handleUserStatusChange = async (userId, action) => {
    const actionNames = {
      activate: 'activate',
      deactivate: 'deactivate',
      reset_password: 'reset password for'
    };

    if (!confirm(`Are you sure you want to ${actionNames[action]} this user?`)) return;
    
    try {
      let response;
      switch (action) {
        case 'activate':
          response = await apiService.activateUser(userId);
          break;
        case 'deactivate':
          response = await apiService.deactivateUser(userId);
          break;
        case 'reset_password':
          response = await apiService.resetUserPassword(userId);
          if (response.new_password) {
            alert(`Password reset successfully!\nNew password: ${response.new_password}\nPlease share this with the user securely.`);
          }
          break;
      }
      
      loadUsers();
      alert(response.message || 'Action completed successfully!');
    } catch (err) {
      alert(`Failed to ${actionNames[action]} user: ` + err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: window.innerWidth <= 480 ? '2-digit' : 'numeric'
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return { color: '#dc2626', background: '#fee2e2' };
      case 'user': return { color: '#3b82f6', background: '#dbeafe' };
      case 'viewer': return { color: '#6b7280', background: '#f3f4f6' };
      default: return { color: '#6b7280', background: '#f3f4f6' };
    }
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? { color: '#10b981', background: '#d1fae5' }
      : { color: '#ef4444', background: '#fee2e2' };
  };

  if (loading && users.length === 0) {
    return (
      <div className="dashboard-container">
        <div className="main-content">
          <div className="welcome-section">
            <h2 style={{ fontSize: window.innerWidth <= 480 ? '18px' : '24px' }}>Loading Users...</h2>
            <p style={{ fontSize: window.innerWidth <= 480 ? '12px' : '14px' }}>Please wait while we load user data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="welcome-section">
          <div style={{ 
            display: 'flex', 
            flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: window.innerWidth <= 768 ? 'stretch' : 'center',
            gap: window.innerWidth <= 768 ? '16px' : '0'
          }}>
            <div>
              <h2 style={{ 
                fontSize: window.innerWidth <= 480 ? '18px' : '24px',
                margin: 0
              }}>
                User Management
              </h2>
              <p style={{ 
                fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                margin: '4px 0 0 0',
                display: window.innerWidth <= 480 ? 'none' : 'block'
              }}>
                Manage user accounts, employees, and access permissions.
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              flexDirection: window.innerWidth <= 480 ? 'column' : 'row'
            }}>
              <button 
                onClick={() => setShowChangePassword(true)}
                className="action-button secondary"
                style={{ 
                  marginBottom: '0',
                  fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                  padding: window.innerWidth <= 480 ? '8px 12px' : '12px 16px'
                }}
              >
                🔐 {window.innerWidth <= 480 ? 'Change Password' : 'Change My Password'}
              </button>
              {currentUser?.admin && (
                <button 
                  onClick={() => setShowAddEmployee(true)}
                  className="action-button primary"
                  style={{ 
                    marginBottom: '0',
                    fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                    padding: window.innerWidth <= 480 ? '8px 12px' : '12px 16px'
                  }}
                >
                  👤 Add Employee
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" style={{ 
            marginBottom: '20px',
            fontSize: window.innerWidth <= 480 ? '12px' : '14px',
            padding: window.innerWidth <= 480 ? '8px 12px' : '12px 16px'
          }}>
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid" style={{ 
          marginBottom: '32px',
          display: 'grid',
          gridTemplateColumns: window.innerWidth <= 480 ? '1fr 1fr' : window.innerWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: window.innerWidth <= 480 ? '12px' : '16px'
        }}>
          <div className="stat-card" style={{ padding: window.innerWidth <= 480 ? '12px' : '16px' }}>
            <h3 style={{ fontSize: window.innerWidth <= 480 ? '12px' : '14px', margin: '0 0 8px 0' }}>
              {window.innerWidth <= 480 ? 'Total' : 'Total Users'}
            </h3>
            <div className="value" style={{ fontSize: window.innerWidth <= 480 ? '18px' : '24px' }}>
              {stats.total_users || 0}
            </div>
          </div>
          <div className="stat-card" style={{ padding: window.innerWidth <= 480 ? '12px' : '16px' }}>
            <h3 style={{ fontSize: window.innerWidth <= 480 ? '12px' : '14px', margin: '0 0 8px 0' }}>
              {window.innerWidth <= 480 ? 'Active' : 'Active Users'}
            </h3>
            <div className="value" style={{ fontSize: window.innerWidth <= 480 ? '18px' : '24px' }}>
              {stats.active_users || 0}
            </div>
          </div>
          <div className="stat-card" style={{ padding: window.innerWidth <= 480 ? '12px' : '16px' }}>
            <h3 style={{ fontSize: window.innerWidth <= 480 ? '12px' : '14px', margin: '0 0 8px 0' }}>
              {window.innerWidth <= 480 ? 'Admins' : 'Administrators'}
            </h3>
            <div className="value" style={{ fontSize: window.innerWidth <= 480 ? '18px' : '24px' }}>
              {stats.admin_users || 0}
            </div>
          </div>
          <div className="stat-card" style={{ padding: window.innerWidth <= 480 ? '12px' : '16px' }}>
            <h3 style={{ fontSize: window.innerWidth <= 480 ? '12px' : '14px', margin: '0 0 8px 0' }}>
              Employees
            </h3>
            <div className="value" style={{ fontSize: window.innerWidth <= 480 ? '18px' : '24px' }}>
              {stats.employee_users || 0}
            </div>
          </div>
        </div>

        {/* Filters */}
        {currentUser?.admin && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 style={{ fontSize: window.innerWidth <= 480 ? '14px' : '18px' }}>🔍 Filters & Search</h3>
            </div>
            <div className="card-content">
              <div className="form-row" style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: window.innerWidth <= 480 ? '12px' : '16px'
              }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: window.innerWidth <= 480 ? '12px' : '14px' }}>
                    Search Users:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={window.innerWidth <= 480 ? "Search..." : "Search by name or email..."}
                    value={filters.q}
                    onChange={(e) => handleFilterChange('q', e.target.value)}
                    style={{
                      fontSize: window.innerWidth <= 480 ? '14px' : '16px',
                      padding: window.innerWidth <= 480 ? '8px 12px' : '12px 16px'
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: window.innerWidth <= 480 ? '12px' : '14px' }}>
                    Role:
                  </label>
                  <select
                    className="form-input"
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    style={{
                      fontSize: window.innerWidth <= 480 ? '14px' : '16px',
                      padding: window.innerWidth <= 480 ? '8px 12px' : '12px 16px'
                    }}
                  >
                    <option value="">All Roles</option>
                    <option value="admin">{window.innerWidth <= 480 ? 'Admin' : 'Administrator'}</option>
                    <option value="user">Employee</option>
                    <option value="viewer">Team Leader</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: window.innerWidth <= 480 ? '12px' : '14px' }}>
                    Status:
                  </label>
                  <select
                    className="form-input"
                    value={filters.active}
                    onChange={(e) => handleFilterChange('active', e.target.value)}
                    style={{
                      fontSize: window.innerWidth <= 480 ? '14px' : '16px',
                      padding: window.innerWidth <= 480 ? '8px 12px' : '12px 16px'
                    }}
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: window.innerWidth <= 480 ? '14px' : '18px' }}>
              👥 Users ({pagination.total_count})
            </h3>
          </div>
          <div className="card-content">
            {loading ? (
              <div style={{ textAlign: 'center', padding: window.innerWidth <= 480 ? '24px' : '40px' }}>
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ margin: '0 auto 16px' }}></div>
                <p style={{ fontSize: window.innerWidth <= 480 ? '12px' : '14px' }}>Loading users...</p>
              </div>
            ) : users.length > 0 ? (
              <>
                <div className="items-list">
                  {users.map(user => (
                    <div key={user.id} className="item-row" style={{
                      display: 'flex',
                      flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                      gap: window.innerWidth <= 768 ? '12px' : '16px',
                      padding: window.innerWidth <= 480 ? '12px' : '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      background: 'white'
                    }}>
                      <div className="item-info" style={{ flex: '1' }}>
                        <h4 style={{
                          margin: '0 0 4px 0',
                          fontSize: window.innerWidth <= 480 ? '14px' : '16px',
                          fontWeight: '600'
                        }}>
                          {user.full_name}
                        </h4>
                        <p style={{
                          margin: '0 0 4px 0',
                          fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                          color: '#6b7280',
                          wordBreak: 'break-word'
                        }}>
                          {user.email}
                        </p>
                        <p style={{ 
                          fontSize: window.innerWidth <= 480 ? '10px' : '12px', 
                          color: '#6b7280',
                          margin: '0 0 8px 0',
                          display: window.innerWidth <= 480 ? 'none' : 'block'
                        }}>
                          Created: {formatDate(user.created_at)}
                          {user.last_login_at && ` • Last login: ${formatDate(user.last_login_at)}`}
                        </p>
                        <div style={{ 
                          display: 'flex', 
                          gap: window.innerWidth <= 480 ? '4px' : '8px', 
                          marginTop: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{
                            ...getRoleColor(user.role),
                            padding: window.innerWidth <= 480 ? '2px 6px' : '2px 8px',
                            borderRadius: '4px',
                            fontSize: window.innerWidth <= 480 ? '10px' : '12px',
                            fontWeight: '500'
                          }}>
                             {user.role === 'admin'
                              ? 'admin'
                              : user.role === 'viewer'
                              ? window.innerWidth <= 480 ? 'Leader' : 'Team Leader'
                              : 'Employee'}
                          </span>
                          <span style={{
                            ...getStatusColor(user.is_active),
                            padding: window.innerWidth <= 480 ? '2px 6px' : '2px 8px',
                            borderRadius: '4px',
                            fontSize: window.innerWidth <= 480 ? '10px' : '12px',
                            fontWeight: '500'
                          }}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: window.innerWidth <= 480 ? '4px' : '8px', 
                        alignItems: window.innerWidth <= 768 ? 'stretch' : 'center',
                        flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => handleViewUser(user.id)}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: window.innerWidth <= 480 ? '4px 8px' : '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: window.innerWidth <= 480 ? '10px' : '12px',
                            flex: window.innerWidth <= 480 ? '1' : 'none'
                          }}
                        >
                          View
                        </button>
                        {currentUser?.admin && user.id !== currentUser.id && (
                          <>
                            {!user.is_active ? (
                              <button
                                onClick={() => handleUserStatusChange(user.id, 'activate')}
                                style={{
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  padding: window.innerWidth <= 480 ? '4px 8px' : '6px 12px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: window.innerWidth <= 480 ? '10px' : '12px',
                                  flex: window.innerWidth <= 480 ? '1' : 'none'
                                }}
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserStatusChange(user.id, 'deactivate')}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  padding: window.innerWidth <= 480 ? '4px 8px' : '6px 12px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: window.innerWidth <= 480 ? '10px' : '12px',
                                  flex: window.innerWidth <= 480 ? '1' : 'none'
                                }}
                              >
                                Deactivate
                              </button>
                            )}
                            <button
                              onClick={() => handleUserStatusChange(user.id, 'reset_password')}
                              style={{
                                background: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                padding: window.innerWidth <= 480 ? '4px 8px' : '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: window.innerWidth <= 480 ? '10px' : '12px',
                                flex: window.innerWidth <= 480 ? '1' : 'none'
                              }}
                            >
                              {window.innerWidth <= 480 ? 'Reset Pwd' : 'Reset Password'}
                            </button>
                          </>
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
                    gap: window.innerWidth <= 480 ? '8px' : '12px', 
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
                        padding: window.innerWidth <= 480 ? '6px 12px' : '8px 16px',
                        borderRadius: '4px',
                        cursor: pagination.current_page === 1 ? 'not-allowed' : 'pointer',
                        fontSize: window.innerWidth <= 480 ? '12px' : '14px'
                      }}
                    >
                      {window.innerWidth <= 480 ? '← Prev' : '← Previous'}
                    </button>
                    <span style={{ 
                      fontSize: window.innerWidth <= 480 ? '12px' : '14px', 
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
                        padding: window.innerWidth <= 480 ? '6px 12px' : '8px 16px',
                        borderRadius: '4px',
                        cursor: pagination.current_page === pagination.total_pages ? 'not-allowed' : 'pointer',
                        fontSize: window.innerWidth <= 480 ? '12px' : '14px'
                      }}
                    >
                      {window.innerWidth <= 480 ? 'Next →' : 'Next →'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state" style={{
                textAlign: 'center',
                padding: window.innerWidth <= 480 ? '32px 16px' : '48px 24px',
                color: '#6b7280'
              }}>
                <div className="icon" style={{ fontSize: window.innerWidth <= 480 ? '32px' : '48px', marginBottom: '16px' }}>👥</div>
                <p style={{ fontSize: window.innerWidth <= 480 ? '14px' : '16px', margin: '0 0 8px 0' }}>No users found</p>
                <small style={{ fontSize: window.innerWidth <= 480 ? '12px' : '14px' }}>Add employees to get started</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={handlePasswordChanged}
      />

      <AddEmployeeModal
        isOpen={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        onSuccess={handleEmployeeAdded}
      />

      <UserDetailsModal
        isOpen={showUserDetails}
        user={selectedUser}
        onClose={() => setShowUserDetails(false)}
        onUpdate={(updatedUser) => {
        setSelectedUser(updatedUser);
        loadUsers(); 
      }}

      />
    </div>
  );
};

export default UserManagementView;