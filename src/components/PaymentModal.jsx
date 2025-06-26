import React, { useState, useEffect } from 'react';

const PaymentModal = ({ isOpen, order, onClose, onUpdate }) => {
  const [status, setStatus] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // reset when reopened
  useEffect(() => {
    if (isOpen) {
      setStatus('');
      setAmount('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  // how much is left to pay
  const remaining = parseFloat(order.total_amount) - parseFloat(order.payed || 0);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!status) {
      return alert('Please select Full or Partial');
    }
    let amt;
    if (status === 'received') {
      amt = remaining;
    } else {
      amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0 || amt > remaining) {
        return alert(`Please enter a valid amount (1–${remaining})`);
      }
    }

    setLoading(true);
    try {
      await onUpdate(order.id, status, amt);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Payment update failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = v =>
    new Intl.NumberFormat('en-US',{style:'currency',currency:'SAR'}).format(v);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e=>e.stopPropagation()} style={{maxWidth:500}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h3>Update Payment</h3>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:24,cursor:'pointer'}}>×</button>
        </div>

        <div style={{marginBottom:16,padding:12,background:'#f8f9fa',borderRadius:4}}>
          <strong>Order:</strong> {order.order_id}<br/>
          <strong>Total:</strong> {formatCurrency(order.total_amount)}<br/>
          <strong>Paid so far:</strong> {formatCurrency(order.payed || 0)}<br/>
          <strong>Remaining:</strong> {formatCurrency(remaining)}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Payment Type *</label>
            <div>
              <label>
                <input
                  type="radio"
                  name="status"
                  value="received"
                  checked={status==='received'}
                  onChange={e=>setStatus(e.target.value)}
                /> Full
              </label>
              <label style={{marginLeft:16}}>
                <input
                  type="radio"
                  name="status"
                  value="partial"
                  checked={status==='partial'}
                  onChange={e=>setStatus(e.target.value)}
                /> Partial
              </label>
            </div>
          </div>

          {status === 'partial' && (
            <div className="form-group">
              <label className="form-label">Amount Paid *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="form-input"
                value={amount}
                onChange={e=>setAmount(e.target.value)}
                required
              />
              <small style={{color:'#6b7280'}}>Max: {formatCurrency(remaining)}</small>
            </div>
          )}

          <div className="form-actions" style={{marginTop:16}}>
            <button type="button" onClick={onClose} className="action-button secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="action-button primary" disabled={loading} style={{marginLeft:8}}>
              {loading ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
