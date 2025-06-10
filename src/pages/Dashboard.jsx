import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    total_items: 0,
    total_value: 0,
    categories: 0,
    disposed_items: 0
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: '',
    location: '',
    quantity: 1,
    value: ''
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await apiService.getItems();
      setItems(response.items || []);
      setStats(response.stats || stats);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await apiService.createItem(newItem);
      setNewItem({
        name: '',
        description: '',
        category: '',
        location: '',
        quantity: 1,
        value: ''
      });
      setShowAddForm(false);
      loadItems();
    } catch (error) {
      console.error('Failed to add item:', error);
      alert('Failed to add item: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDisposeItem = async (itemId) => {
    const reason = prompt('Please enter disposal reason:');
    if (reason) {
      try {
        await apiService.disposeItem(itemId, reason);
        loadItems();
        alert('Item disposed successfully');
      } catch (error) {
        console.error('Failed to dispose item:', error);
        alert('Failed to dispose item: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const formatCurrency = (value) => {
    const numValue = parseFloat(value) || 0;
    return numValue.toFixed(2);
  };

  if (loading) {
    return <div className="dashboard-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="header-left">
          <div className="header-logo">S</div>
          <h1 className="header-title">Salah Data System</h1>
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
          <p>Manage your inventory and track your items.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Items</h3>
            <div className="value">{stats.total_items || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Total Value</h3>
            <div className="value">${formatCurrency(stats.total_value)}</div>
          </div>
          <div className="stat-card">
            <h3>Categories</h3>
            <div className="value">{stats.categories || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Disposed Items</h3>
            <div className="value">{stats.disposed_items || 0}</div>
          </div>
        </div>

        <div className="content-grid">
          <div className="card">
            <div className="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="card-content">
              <button 
                className="action-button primary"
                onClick={() => setShowAddForm(true)}
              >
                + Add New Item
              </button>
              <button className="action-button secondary">Browse Items</button>
              <button className="action-button secondary">Generate Report</button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Recent Items</h3>
            </div>
            <div className="card-content">
              {items.length > 0 ? (
                <div className="items-list">
                  {items.slice(0, 5).map(item => (
                    <div key={item.id} className="item-row">
                      <div className="item-info">
                        <h4>{item.name}</h4>
                        <p>Qty: {item.quantity} • {item.location || 'No location'}</p>
                      </div>
                      <div className="item-actions">
                        <button 
                          className="dispose-button"
                          onClick={() => handleDisposeItem(item.id)}
                          title="Dispose Item"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="icon">📦</div>
                  <p>No items yet</p>
                  <small>Add your first item to get started</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add New Item</h3>
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    placeholder="e.g., Electronics, Furniture"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newItem.location}
                    onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    placeholder="e.g., Warehouse A, Room 101"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Value ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newItem.value}
                    onChange={(e) => setNewItem({...newItem, value: e.target.value})}
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)} className="action-button secondary">
                  Cancel
                </button>
                <button type="submit" className="action-button primary">
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
