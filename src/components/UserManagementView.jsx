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
      year: 'numeric'
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
            <h2>Loading Users...</h2>
            <p>Please wait while we load user data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="welcome-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>User Management</h2>
              <p>Manage user accounts, employees, and access permissions.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowChangePassword(true)}
                className="action-button secondary"
                style={{ marginBottom: '0' }}
              >
                🔐 Change My Password
              </button>
              {currentUser?.admin && (
                <button 
                  onClick={() => setShowAddEmployee(true)}
                  className="action-button primary"
                  style={{ marginBottom: '0' }}
                >
                  👤 Add Employee
                </button>
              )}
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
            <h3>Total Users</h3>
            <div className="value">{stats.total_users || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <div className="value">{stats.active_users || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Administrators</h3>
            <div className="value">{stats.admin_users || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Employees</h3>
            <div className="value">{stats.employee_users || 0}</div>
          </div>
        </div>

        {/* Filters */}
        {currentUser?.admin && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3>🔍 Filters & Search</h3>
            </div>
            <div className="card-content">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Search Users:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by name or email..."
                    value={filters.q}
                    onChange={(e) => handleFilterChange('q', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role:</label>
                  <select
                    className="form-input"
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Administrator</option>
                    <option value="user">Employee</option>
                    <option value="viewer">Team Leader</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status:</label>
                  <select
                    className="form-input"
                    value={filters.active}
                    onChange={(e) => handleFilterChange('active', e.target.value)}
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
            <h3>👥 Users ({pagination.total_count})</h3>
          </div>
          <div className="card-content">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ margin: '0 auto 16px' }}></div>
                <p>Loading users...</p>
              </div>
            ) : users.length > 0 ? (
              <>
                <div className="items-list">
                  {users.map(user => (
                    <div key={user.id} className="item-row">
                      <div className="item-info" style={{ flex: '1' }}>
                        <h4>{user.full_name}</h4>
                        <p>{user.email}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>
                          Created: {formatDate(user.created_at)}
                          {user.last_login_at && ` • Last login: ${formatDate(user.last_login_at)}`}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <span style={{
                            ...getRoleColor(user.role),
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                             {user.role === 'admin'
                            ? 'admin'
                            : user.role === 'viewer'
                            ? 'Team Leader'
                            : 'Employee'}
                          </span>
                          <span style={{
                            ...getStatusColor(user.is_active),
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleViewUser(user.id)}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
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
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
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
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
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
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Reset Password
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
                <div className="icon">👥</div>
                <p>No users found</p>
                <small>Add employees to get started</small>
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