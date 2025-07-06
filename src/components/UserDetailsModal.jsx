import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
const UserDetailsModal = ({ isOpen, user, onClose, onUpdate }) => {
  const { user: currentUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  if (!isOpen || !user) return null;

  const isCurrentUser = user.id === currentUser?.id;
  const canEdit = isCurrentUser || currentUser?.admin;

  const handleEdit = () => {
    setEditData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      contract_type: user.contract_type || 'PAG'
    });
    setEditMode(true);
  };

  const handleSave = async () => {
  try {
    const response = await apiService.updateUser(user.id, editData);
    setEditMode(false);

    if (onUpdate) {
      onUpdate(response.user); // ✅ pass updated user back
    }
  } catch (err) {
    console.error('Failed to update user:', err);
    alert('Failed to update user. Please try again.');
  }
};


  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3>👤 User Details</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {canEdit && !editMode && (
              <button
                onClick={handleEdit}
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
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* User Avatar and Basic Info */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#d1d5db',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#374151',
            margin: '0 auto 16px'
          }}>
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{user.full_name}</h4>
          <p style={{ margin: '0 0 12px 0', color: '#6b7280' }}>{user.email}</p>
          {user.contract_type && (
          <div style={{ marginTop: '12px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Contract Type:</span>
            <p style={{ margin: '2px 0', fontWeight: '500' }}>
              {user.contract_type === 'PAG' ? 'Pay As You Go' : 'Long-Term'}
            </p>
          </div>
        )}

          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <span style={{
              ...getRoleColor(user.role),
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {user.role === 'admin'
  ? 'Administrator'
  : user.role === 'viewer'
  ? 'Team Leader'
  : 'Employee'}

            </span>
            <span style={{
              ...getStatusColor(user.is_active),
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {editMode ? (
          /* Edit Form */
          <div>
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>Edit User Information</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editData.first_name || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editData.last_name || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Email:</label>
                <input
                  type="email"
                  className="form-input"
                  value={editData.email || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              {currentUser?.admin && !isCurrentUser && (
                <>
                  <div className="form-group">
                    <label className="form-label">Role:</label>
                    <select
                      className="form-input"
                      value={editData.role || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="user">Employee</option>
                      <option value="admin">Administrator</option>
                      <option value="viewer">Team Leader</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract Type:</label>
                    <select
                      className="form-input"
                      value={editData.contract_type}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, contract_type: e.target.value }))
                      }
                    >
                      <option value="PAG">Pay As You Go</option>
                      <option value="LT">Long-Term</option>
                    </select>
                  </div>

                  
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={editData.is_active || false}
                        onChange={(e) => setEditData(prev => ({ ...prev, is_active: e.target.checked }))}
                        style={{ marginRight: '8px' }}
                      />
                      Active Account
                    </label>
                  </div>
                </>
              )}
            </div>
            
            <div className="form-actions">
              <button 
                onClick={() => setEditMode(false)} 
                className="action-button secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                className="action-button primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div>
            {/* Account Information */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>📋 Account Information</h4>
              
              <div className="form-row">
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>First Name:</span>
                  <p style={{ margin: '2px 0', fontWeight: '500' }}>{user.first_name}</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Last Name:</span>
                  <p style={{ margin: '2px 0', fontWeight: '500' }}>{user.last_name}</p>
                </div>
              </div>
              
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Email Address:</span>
                <p style={{ margin: '2px 0', fontWeight: '500' }}>{user.email}</p>
              </div>
            </div>

            {/* Activity & Statistics */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>📊 Activity & Statistics</h4>
              
              <div className="form-row">
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Account Created:</span>
                  <p style={{ margin: '2px 0', fontWeight: '500' }}>{formatDate(user.created_at)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Last Login:</span>
                  <p style={{ margin: '2px 0', fontWeight: '500' }}>{formatDate(user.last_login_at)}</p>
                </div>
              </div>
              
              {user.orders_count !== undefined && (
                <div className="form-row" style={{ marginTop: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Total Orders:</span>
                    <p style={{ margin: '2px 0', fontWeight: '500' }}>{user.orders_count || 0}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Expenses Recorded:</span>
                    <p style={{ margin: '2px 0', fontWeight: '500' }}>{user.expenses_count || 0}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Security Information */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#fef2f2', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>🔐 Security Information</h4>
              
              <div>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Failed Login Attempts:</span>
                <p style={{ margin: '2px 0', fontWeight: '500', color: user.failed_login_attempts > 0 ? '#ef4444' : '#10b981' }}>
                  {user.failed_login_attempts || 0}
                </p>
              </div>
              
              {user.locked_until && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Account Locked Until:</span>
                  <p style={{ margin: '2px 0', fontWeight: '500', color: '#ef4444' }}>
                    {formatDate(user.locked_until)}
                  </p>
                </div>
              )}
            </div>

            {/* Role Permissions */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>🔑 Role Permissions</h4>
              
              <div style={{ fontSize: '14px' }}>
                {user.role === 'admin' && (
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#059669' }}>
                    <li>Full system administration access</li>
                    <li>User management and role assignment</li>
                    <li>All order and inventory operations</li>
                    <li>Financial reports and data export</li>
                    <li>System configuration and settings</li>
                  </ul>
                )}
                
                {user.role === 'user' && (
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#2563eb' }}>
                    <li>Create and manage orders</li>
                    <li>View and update inventory</li>
                    <li>Record expenses and view reports</li>
                    <li>Access calendar and scheduling</li>
                    <li>Change own password</li>
                  </ul>
                )}
                
                {user.role === 'viewer' && (
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
                    <li>Read-only access to orders</li>
                    <li>View inventory status</li>
                    <li>View financial reports</li>
                    <li>Access calendar (read-only)</li>
                    <li>Change own password</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailsModal;