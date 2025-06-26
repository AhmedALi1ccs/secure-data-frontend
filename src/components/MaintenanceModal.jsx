import React, { useState, useEffect } from 'react';

export default function MaintenanceModal({
  isOpen,
  onClose,
  onSubmit,
  item
}) {
  const isScreen = Boolean(item?.screen_type);
  const [sqm,  setSqm]    = useState('');
  const [dates, setDates] = useState({ start_date: '', end_date: '' });
  const [errors,setErrors]= useState([]);

  // reset when opened or item changes
  useEffect(() => {
    if (isOpen) {
      setSqm('');
      setDates({ start_date: '', end_date: '' });
      setErrors([]);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const validate = () => {
    const errs = [];
    if (isScreen) {
      if (!sqm || parseFloat(sqm) <= 0) errs.push('Enter a valid area > 0');
      if (parseFloat(sqm) > item.available_sqm)
        errs.push(`Can’t exceed available ${item.available_sqm} m²`);
    }
    if (!dates.start_date) errs.push('Start date is required');
    if (!dates.end_date)   errs.push('End date is required');
    if (dates.end_date < dates.start_date)
      errs.push('End date must be on or after start date');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onSubmit(item, { ...dates, sqm: isScreen ? sqm : undefined });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 480, padding: 24 }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 16 }}>
          Send {isScreen ? 'Screen' : 'Equipment'} “
          {isScreen ? item.screen_type : item.model}” to Maintenance
        </h3>

        {errors.length > 0 && (
          <div className="error-message" style={{ color: '#dc2626', marginBottom: 12 }}>
            {errors.map((e,i) => <div key={i}>• {e}</div>)}
          </div>
        )}

        {isScreen && (
          <div className="form-group">
            <label className="form-label">Area to maintain (m²)</label>
            <input
              type="number"
              className="form-input"
              step="0.1"
              min="0.1"
              max={item.available_sqm}
              placeholder={`0 – ${item.available_sqm}`}
              value={sqm}
              onChange={e => setSqm(e.target.value)}
            />
          </div>
        )}

        <div className="form-row" style={{ display: 'flex', gap: 16 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">From</label>
            <input
              type="date"
              className="form-input"
              value={dates.start_date}
              onChange={e => setDates(d => ({ ...d, start_date: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">To</label>
            <input
              type="date"
              className="form-input"
              min={dates.start_date}
              value={dates.end_date}
              onChange={e => setDates(d => ({ ...d, end_date: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: 24, textAlign: 'right' }}>
          <button className="action-button secondary" onClick={onClose} style={{ marginRight: 8 }}>
            Cancel
          </button>
          <button className="action-button primary" onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
