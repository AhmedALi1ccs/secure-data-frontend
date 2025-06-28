// ThirdCompanies.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useToast } from './Toast';
import { useConfirmation } from './ConfirmationModal';
import CreateCompanyModal from './CreateCompanyModal';

const ThirdCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const [filters, setFilters] = useState({
    q: '',
    active_only: '',
    page: 1,
    per_page: 20
  });

  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0
  });

  // Use hooks for toast and confirmation
  const { showToast, ToastComponent } = useToast();
  const { showConfirmation, ConfirmationComponent } = useConfirmation();

  useEffect(() => {
    loadCompanies();
  }, [filters]);

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading companies...'); // Debug log
      const response = await apiService.getCompanies(filters);
      console.log('Companies response:', response); // Debug log
      setCompanies(response.companies || []);
      setPagination(response.pagination || pagination);
    } catch (err) {
      console.error('Load companies error:', err); // Debug log
      setError('Failed to load companies: ' + err.message);
      showToast('Failed to load companies: ' + err.message, 'error');
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

  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setShowCreateCompany(true);
  };

  const handleDeactivateCompany = async (company) => {
    showConfirmation({
      title: 'Deactivate Company',
      message: `Are you sure you want to deactivate "${company.name}"? This action can be reversed later.`,
      confirmText: 'Deactivate',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          const updatedData = { ...company, is_active: false };
          const response = await apiService.updateCompany(company.id, updatedData);
          showToast(response.message || 'Company deactivated successfully!', 'success');
          loadCompanies(); // Refresh the list
        } catch (err) {
          console.error('Deactivate company error:', err);
          showToast(
            'Failed to deactivate company: ' + (err.response?.data?.error || err.message),
            'error'
          );
        }
      }
    });
  };

  const handleCompanyCreated = () => {
    setShowCreateCompany(false);
    setEditingCompany(null);
    loadCompanies();
  };

  const exportCompanies = () => {
    try {
      const csvData = [];
      
      csvData.push([
        'Company Name', 'Contact Person', 'Email', 'Phone', 
        'Address', 'Active', 'Created Date'
      ]);

      companies.forEach(company => {
        csvData.push([
          company.name || '',
          company.contact_person || '',
          company.email || '',
          company.phone || '',
          company.address || '',
          company.is_active ? 'Yes' : 'No',
          company.created_at ? new Date(company.created_at).toLocaleDateString() : ''
        ]);
      });

      const csvContent = csvData.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `companies_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Companies exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export companies', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  console.log('ThirdCompanies component rendering...'); // Debug log

  if (loading && companies.length === 0) {
    return (
      <div className="dashboard-container">
        <div className="main-content">
          <div className="welcome-section">
            <h2>Loading Companies...</h2>
            <p>Please wait while we load your company data.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <ToastComponent />
        <div className="dashboard-container">
          <div className="main-content">
            <div className="welcome-section">
              <h2>Error Loading Companies</h2>
              <p style={{ color: 'red' }}>{error}</p>
              <button onClick={loadCompanies} className="action-button primary">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Toast and Confirmation Components */}
      <ToastComponent />
      <ConfirmationComponent />
      
      <div className="dashboard-container">
        <div className="main-content">
          <div className="welcome-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Third Party Companies</h2>
                <p>Manage your external service providers and partner companies.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setShowCreateCompany(true)}
                  className="action-button primary"
                  style={{ marginBottom: '0' }}
                >
                  🏢 Add New Company
                </button>
                <button 
                  onClick={exportCompanies}
                  className="action-button secondary"
                  style={{ marginBottom: '0' }}
                >
                  📊 Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid" style={{ marginBottom: '32px' }}>
            <div className="stat-card">
              <h3>Total Companies</h3>
              <div className="value">{pagination.total_count || companies.length}</div>
            </div>
            <div className="stat-card">
              <h3>Active Companies</h3>
              <div className="value">
                {companies.filter(c => c.is_active).length}
              </div>
            </div>
            <div className="stat-card">
              <h3>Inactive Companies</h3>
              <div className="value">
                {companies.filter(c => !c.is_active).length}
              </div>
            </div>
            <div className="stat-card">
              <h3>This Month</h3>
              <div className="value">
                {companies.filter(c => {
                  if (!c.created_at) return false;
                  const created = new Date(c.created_at);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && 
                         created.getFullYear() === now.getFullYear();
                }).length}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3>🔍 Search & Filter</h3>
            </div>
            <div className="card-content">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Search Companies:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by company name, contact person..."
                    value={filters.q}
                    onChange={(e) => handleFilterChange('q', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status Filter:</label>
                  <select
                    className="form-input"
                    value={filters.active_only}
                    onChange={(e) => handleFilterChange('active_only', e.target.value)}
                  >
                    <option value="">All Companies</option>
                    <option value="true">Active Only</option>
                    <option value="false">Inactive Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Companies List */}
          <div className="card">
            <div className="card-header">
              <h3>🏢 Companies ({pagination.total_count || companies.length})</h3>
            </div>
            <div className="card-content">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ margin: '0 auto 16px' }}></div>
                  <p>Loading companies...</p>
                </div>
              ) : companies.length > 0 ? (
                <>
                  <div className="items-list">
                    {companies.map(company => (
                      <div key={company.id} className="item-row">
                        <div className="item-info" style={{ flex: '1' }}>
                          <h4>{company.name}</h4>
                          <p>
                            <strong>Contact:</strong> {company.contact_person || 'N/A'}
                            {company.email && (
                              <>
                                {' • '}
                                <a href={`mailto:${company.email}`} style={{ color: '#3b82f6' }}>
                                  {company.email}
                                </a>
                              </>
                            )}
                            {company.phone && (
                              <>
                                {' • '}
                                <a href={`tel:${company.phone}`} style={{ color: '#3b82f6' }}>
                                  {company.phone}
                                </a>
                              </>
                            )}
                          </p>
                          
                          {company.address && (
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                              <strong>Address:</strong> {company.address}
                            </p>
                          )}

                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            <strong>Created:</strong> {formatDate(company.created_at)}
                          </div>

                          <div style={{ marginTop: '8px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: company.is_active ? '#10b981' : '#ef4444',
                              background: company.is_active ? '#d1fae5' : '#fee2e2'
                            }}>
                              {company.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleEditCompany(company)}
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
                            ✏️ Edit
                          </button>
                          {company.email && (
                            <button
                              onClick={() => window.open(`mailto:${company.email}`, '_blank')}
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
                              📧 Email
                            </button>
                          )}
                          {company.phone && (
                            <button
                              onClick={() => window.open(`tel:${company.phone}`, '_blank')}
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
                              📞 Call
                            </button>
                          )}
                          <button
                            onClick={() => handleDeactivateCompany(company)}
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
                            🗑️ Deactivate
                          </button>
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
                  <div className="icon">🏢</div>
                  <p>No companies found</p>
                  <small>Add your first third-party company to get started</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create/Edit Company Modal */}
        <CreateCompanyModal
          isOpen={showCreateCompany}
          onClose={() => {
            setShowCreateCompany(false);
            setEditingCompany(null);
          }}
          onSuccess={handleCompanyCreated}
          initialData={editingCompany}
          isEditMode={Boolean(editingCompany)}
        />
      </div>
    </>
  );
};

export default ThirdCompanies;