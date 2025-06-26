import React, { useState } from 'react';
import { apiService } from '../services/api';

const InventoryDetailsModal = ({ isOpen, item, onClose, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen || !item) return null;

  const isScreen = item.type === 'screen';
  const isEquipment = item.type === 'equipment';

  const handleEdit = () => {
    setEditData(item);
    setEditMode(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isScreen) {
        await apiService.updateScreenInventory(item.id, {
          screen_type: editData.screen_type,
          pixel_pitch: editData.pixel_pitch,
          total_sqm_owned: parseFloat(editData.total_sqm_owned),
          available_sqm: parseFloat(editData.available_sqm),
          description: editData.description,
          is_active: editData.is_active
        });
      } else {
        await apiService.updateEquipment(item.id, {
          model: editData.model,
          serial_number: editData.serial_number,
          purchase_price: editData.purchase_price ? parseFloat(editData.purchase_price) : null,
          purchase_date: editData.purchase_date,
          notes: editData.notes,
          status: editData.status
        });
      }
      
      setEditMode(false);
      onUpdate && onUpdate();
      alert('Item updated successfully!');
    } catch (error) {
      alert('Failed to update item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    
    setLoading(true);
    try {
      if (isScreen) {
        await apiService.updateScreenInventory(item.id, { is_active: newStatus === 'active' });
      } else {
        await apiService.updateEquipment(item.id, { status: newStatus });
      }
      
      onUpdate && onUpdate();
      alert('Status updated successfully!');
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (isScreen) {
      return status ? { color: '#10b981', background: '#d1fae5' } : { color: '#ef4444', background: '#fee2e2' };
    }
    
    switch (status) {
      case 'available': return { color: '#10b981', background: '#d1fae5' };
      case 'assigned': return { color: '#3b82f6', background: '#dbeafe' };
      case 'maintenance': return { color: '#f59e0b', background: '#fef3c7' };
      case 'damaged': return { color: '#ef4444', background: '#fee2e2' };
      default: return { color: '#6b7280', background: '#f3f4f6' };
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3>
            {isScreen ? `📺 ${item.screen_type}` : `🔧 ${item.model || item.equipment_type}`}
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!editMode && (
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

        {/* Status Badge */}
        <div style={{ marginBottom: '24px' }}>
          <span style={{
            ...getStatusColor(isScreen ? item.is_active : item.status),
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {isScreen ? (item.is_active ? 'Active' : 'Inactive') : item.status}
          </span>
        </div>

        {editMode ? (
          /* Edit Form */
          <div>
            {isScreen ? (
              /* Screen Edit Form */
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Screen Type:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editData.screen_type || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, screen_type: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pixel Pitch:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editData.pixel_pitch || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, pixel_pitch: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Total SQM Owned:</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editData.total_sqm_owned || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, total_sqm_owned: e.target.value }))}
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Available SQM:</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editData.available_sqm || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, available_sqm: e.target.value }))}
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description:</label>
                  <textarea
                    className="form-input"
                    value={editData.description || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={editData.is_active || false}
                      onChange={(e) => setEditData(prev => ({ ...prev, is_active: e.target.checked }))}
                      style={{ marginRight: '8px' }}
                    />
                    Active
                  </label>
                </div>
              </div>
            ) : (
              /* Equipment Edit Form */
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Model:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editData.model || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, model: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Serial Number:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editData.serial_number || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, serial_number: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Purchase Price (SAR):</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editData.purchase_price || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, purchase_price: e.target.value }))}
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchase Date:</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editData.purchase_date || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, purchase_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Status:</label>
                  <select
                    className="form-input"
                    value={editData.status || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="damaged">Damaged</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes:</label>
                  <textarea
                    className="form-input"
                    value={editData.notes || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                  />
                </div>
              </div>
            )}
            
            <div className="form-actions">
              <button 
                onClick={() => setEditMode(false)} 
                className="action-button secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                className="action-button primary"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div>
            {isScreen ? (
              /* Screen Details */
              <div>
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>📺 Screen Specifications</h4>
                  <div className="form-row">
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Screen Type:</span>
                      <p style={{ margin: '2px 0', fontWeight: '500' }}>{item.screen_type}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Pixel Pitch:</span>
                      <p style={{ margin: '2px 0', fontWeight: '500' }}>P{item.pixel_pitch}</p>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>📊 Inventory Status</h4>
                  <div className="form-row">
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Total Owned:</span>
                      <p style={{ margin: '2px 0', fontWeight: '500' }}>{item.total_sqm_owned} m²</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Available:</span>
                      <p style={{ margin: '2px 0', fontWeight: '500', color: '#10b981' }}>{item.available_sqm} m²</p>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Reserved:</span>
                    <p style={{ margin: '2px 0', fontWeight: '500', color: '#ef4444' }}>
                      {(item.total_sqm_owned - item.available_sqm)} m²
                    </p>
                  </div>
                  
                  {/* Utilization Bar */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      <span>Utilization</span>
                      <span>{(((item.total_sqm_owned - item.available_sqm) / item.total_sqm_owned) * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      background: '#e5e7eb', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(((item.total_sqm_owned - item.available_sqm) / item.total_sqm_owned) * 100, 100)}%`,
                          background: ((item.total_sqm_owned - item.available_sqm) / item.total_sqm_owned) > 0.8 ? '#ef4444' : 
                                     ((item.total_sqm_owned - item.available_sqm) / item.total_sqm_owned) > 0.5 ? '#f59e0b' : '#10b981',
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {item.description && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>📝 Description</h4>
                    <p style={{ margin: 0, lineHeight: '1.5' }}>{item.description}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Equipment Details */
              <div>
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>🔧 Equipment Details</h4>
                  <div className="form-row">
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Model:</span>
                      <p style={{ margin: '2px 0', fontWeight: '500' }}>{item.model}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Serial Number:</span>
                      <p style={{ margin: '2px 0', fontWeight: '500' }}>{item.serial_number || 'Not assigned'}</p>
                    </div>
                  </div>
                  <div className="form-row">
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Equipment Type:</span>
                      <p style={{ margin: '2px 0', fontWeight: '500' }}>{item.equipment_type?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Current Status:</span>
                      <p style={{ margin: '2px 0', fontWeight: '500' }}>{item.status}</p>
                    </div>
                  </div>
                </div>

                {(item.purchase_price || item.purchase_date) && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>💰 Purchase Information</h4>
                    <div className="form-row">
                      <div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Purchase Price:</span>
                        <p style={{ margin: '2px 0', fontWeight: '500' }}>
                          {item.purchase_price ? `${item.purchase_price} SAR` : 'Not recorded'}
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Purchase Date:</span>
                        <p style={{ margin: '2px 0', fontWeight: '500' }}>
                          {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'Not recorded'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {item.notes && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>📝 Notes</h4>
                    <p style={{ margin: 0, lineHeight: '1.5' }}>{item.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Status Actions */}
            {!isScreen && (
              <div style={{ marginBottom: '24px', padding: '16px', background: '#fef2f2', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>⚡ Quick Actions</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {item.status !== 'available' && (
                    <button
                      onClick={() => handleStatusChange('available')}
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
                      Mark Available
                    </button>
                  )}
                  {item.status !== 'maintenance' && (
                    <button
                      onClick={() => handleStatusChange('maintenance')}
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
                      Send to Maintenance
                    </button>
                  )}
                  {item.status !== 'damaged' && (
                    <button
                      onClick={() => handleStatusChange('damaged')}
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
                      Mark Damaged
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryDetailsModal;
