import { useAuth } from '../contexts/AuthContext';
import { calculateScreenTotals } from '../utils/screenTotals';
import { formatOrderAsArabicTxt } from '../utils/exportOrderTxt';
const OrderDetailsModal = ({ isOpen, order, onClose, onEdit }) => {
const { user, logout } = useAuth();
      const isViewer = () => user?.role === 'viewer'
  if (!isOpen || !order) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  


  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'SAR' 
    }).format(value || 0);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return { color: '#3b82f6', background: '#dbeafe' };
      case 'in_progress': return { color: '#8b5cf6', background: '#ede9fe' };
      case 'cancelled': return { color: '#ef4444', background: '#fee2e2' };
      default: return { color: '#6b7280', background: '#f3f4f6' };
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'received': return { color: '#10b981', background: '#d1fae5' };
      case 'partial': return { color: '#f59e0b', background: '#fef3c7' };
      case 'not_received': return { color: '#ef4444', background: '#fee2e2' };
      default: return { color: '#6b7280', background: '#f3f4f6' };
    }
  };
  const paidAmount = (order.payments || [])
  .reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = (order.total_amount || 0) - paidAmount;


  const screenTotals = calculateScreenTotals(order);
  const exportOrderAsTxt = () => {
  try {
    const today = new Date().toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content = `السلام عليكم\n\nالتاريخ: ${today}\n\n${formatOrderAsArabicTxt(order)}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${order.order_id || 'order'}_details.txt`
    );

    // Required for Firefox
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 0);
  } catch (err) {
    console.error('Failed to export TXT file:', err);
    alert('❌ Failed to export file.');
  }
};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button
  onClick={exportOrderAsTxt}
  style={{
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer'
  }}
>
  📤 Export TXT
</button>

  <h3 style={{ margin: 0 }}>Order Details - {order.order_id}</h3>
  <div style={{ display: 'flex', gap: '12px' }}>
    {!isViewer() && (
    <button
      onClick={() => onEdit(order)}  // Add this callback
      style={{
        background: '#fbbf24',
        color: '#1f2937',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      ✏️ Edit
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
      ×
    </button>
  </div>
</div>
{/* Order Status, Payment and Totals */}
<div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
  <span style={{
    ...getStatusColor(order.order_status),
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600'
  }}>
        {(order.order_status ?? '').replace('_', ' ').toUpperCase()}

  </span>

  <span style={{
    ...getPaymentStatusColor(order.payment_status),
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600'
  }}>
     Payment: {(order.payment_status ?? 'not_received').replace('_', ' ').toUpperCase()}
  </span>

  <span style={{
    background: '#f3f4f6',
    color: '#374151',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600'
  }}>
    Total:     {formatCurrency(order.total_amount)}
  </span>

  <span style={{
    background: '#d1fae5',
    color: '#065f46',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600'
  }}>
    Paid:      {formatCurrency(order.payed)}
  </span>

  <span style={{
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600'
  }}>
    Remaining: {formatCurrency(order.remaining)}
  </span>
</div>


        {/* Location Information */}
        <div style={{ marginBottom: '24px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>📍 Location Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Location Name</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{order.location_name}</p>
            </div>
            {order.google_maps_link && (
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Google Maps</p>
                <a href={order.google_maps_link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                  View Location →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Event Schedule */}
        <div style={{ marginBottom: '24px', padding: '20px', background: '#f0f9ff', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>📅 Event Schedule</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Start Date</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{formatDate(order.start_date)}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>End Date</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{formatDate(order.end_date)}</p>
            </div>
            <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Due Date</p>
            <p style={{ margin: '0', fontWeight: '600' }}>
              {order.due_date ? formatDate(order.due_date) : 'N/A'}
            </p>
          </div>

            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Duration</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{order.duration_days} days</p>
            </div>
          </div>
        </div>

        {/* Screen Configurations - DETAILED */}
        {order.order_screen_requirements && order.order_screen_requirements.length > 0 && (
          <div style={{ marginBottom: '24px', padding: '20px', background: '#f0fff4', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>
              📺 Screen Configurations ({screenTotals.configurations})
            </h4>
            
            {/* Summary Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '12px', 
              marginBottom: '20px',
              padding: '16px',
              background: 'white',
              borderRadius: '6px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  {order.order_screen_requirements.length}
                </p>
                <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>Screen Types</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {screenTotals.totalPanels}
                </p>
                <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>Total Panels</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {screenTotals.totalSqm.toFixed(2)} m²
                </p>
                <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>Total Area</p>
              </div>
            </div>
            
            {/* Detailed Configurations */}
            {order.order_screen_requirements.map((req, index) => (
              <div key={req.id} style={{ 
                marginBottom: '16px', 
                padding: '16px', 
                background: 'white', 
                borderRadius: '6px',
                border: '2px solid #d1fae5'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ margin: 0, color: '#065f46' }}>
                    Configuration #{index + 1}: {req.screen_type} (P{req.pixel_pitch})
                  </h5>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      background: '#d1fae5',
                      color: '#065f46',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {req.sqm_required} m²
                    </span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                      {req.configuration || `${req.dimensions_rows} × ${req.dimensions_columns} panels`}
                    </p>
                  </div>
                </div>
                
                {req.reserved_at && (
                  <p style={{ 
                    margin: '12px 0 0 0', 
                    fontSize: '12px', 
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    Reserved on: {new Date(req.reserved_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Team Assignment */}
        <div style={{ marginBottom: '24px', padding: '20px', background: '#f0f4ff', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>👥 Team Assignment</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Installing Technician</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{order.installing_assignee?.name || 'Not assigned'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Disassemble Technician</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{order.disassemble_assignee?.name || 'Not assigned'}</p>
            </div>
          </div>
          {order.third_party_provider && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Third Party Provider</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{order.third_party_provider.name}</p>
            </div>
          )}
        </div>

        {/* Equipment Details */}
        <div style={{ marginBottom: '24px', padding: '20px', background: '#fef7ff', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>💻 Equipment Requirements</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Laptops</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{order.laptops_needed || 0} units</p>
              {order.assigned_equipment?.laptops?.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  {order.assigned_equipment.laptops.map(laptop => (
                    <p key={laptop.id} style={{ margin: '2px 0', fontSize: '12px', color: '#6b7280' }}>
                      • {laptop.model} ({laptop.serial_number})
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Video Processors</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{order.video_processors_needed || 0} units</p>
              {order.assigned_equipment?.video_processors?.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  {order.assigned_equipment.video_processors.map(processor => (
                    <p key={processor.id} style={{ margin: '2px 0', fontSize: '12px', color: '#6b7280' }}>
                      • {processor.model} ({processor.serial_number})
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div style={{ marginBottom: '24px', padding: '20px', background: '#fffbeb', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>💰 Pricing Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Price per m²</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{formatCurrency(order.price_per_sqm)}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Total Square Meters</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{order.total_sqm || screenTotals.totalSqm.toFixed(2)} m²</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Total Amount</p>
              <p style={{ margin: '0', fontWeight: '600', fontSize: '18px', color: '#065f46' }}>
                {formatCurrency(order.total_amount || ((order.total_sqm || screenTotals.totalSqm) * (order.price_per_sqm || 0)))}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{ marginBottom: '24px', padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>📝 Notes</h4>
            <p style={{ margin: '0', whiteSpace: 'pre-wrap' }}>{order.notes}</p>
          </div>
        )}

        {/* Order Metadata */}
        <div style={{ 
          borderTop: '1px solid #e5e7eb', 
          paddingTop: '16px', 
          marginTop: '24px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <p>Order created on: {new Date(order.created_at).toLocaleString()}</p>
        </div>

        <div className="form-actions" style={{ marginTop: '24px' }}>
          <button 
            onClick={onClose} 
            className="action-button primary"
            style={{ width: '100%' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;