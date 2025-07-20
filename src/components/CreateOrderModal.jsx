import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import NotificationModal from './NotificationModal';

const CreateOrderModal = ({ isOpen, onClose, onSuccess, initialData, isEditMode, editingOrderId}) => {
  const [formData, setFormData] = useState({
     id: '',
    google_maps_link: '',
    location_name: '',
    start_date: '',
    end_date: '',
    due_date: '',
    price_per_sqm: 150,
    notes: '',
    installing_assignee_id: '',
    disassemble_assignee_id: '',
    third_party_provider_id: '',
    laptops_needed: 1,
    video_processors_needed: 1
  });

  const [screenRequirements, setScreenRequirements] = useState([
    { 
      screen_inventory_id: '', 
      sqm_required: '24',  // Default: 8x12x0.25 = 24m²
      dimensions_rows: 8,
      dimensions_columns: 12
    }
  ]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [screenInventory, setScreenInventory] = useState([]);
  const [screenAvailability, setScreenAvailability] = useState([]);
  const [equipmentAvailability, setEquipmentAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [manualTotalEnabled, setManualTotalEnabled] = useState(false);
  const [manualTotalAmount, setManualTotalAmount] = useState('');

  // Notification state
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    details: null,
    onCloseCallback: null
  });

  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

 useEffect(() => {
  if (formData.start_date && formData.end_date) {
    checkAvailability();
    checkEquipmentAvailability();
  }
}, [formData.start_date, formData.end_date]);

// Log this below:
useEffect(() => {
  console.log("Equipment availability state:", equipmentAvailability);
}, [equipmentAvailability]);


const loadFormData = async () => {
  try {
    const [employeesRes, companiesRes, screensRes] = await Promise.all([
      apiService.getEmployees({ active_only: true }),
      apiService.getCompanies({ active_only: true }),
      apiService.getScreenInventory({ active_only: true })
    ]);
    
    console.log('screensRes:', screensRes.availability);
    setEmployees(employeesRes.employees || []);
    setCompanies(companiesRes.companies || []);
    setScreenInventory(screensRes.availability || []);
    
    // Don't load equipment availability here if we have dates, 
    // let the useEffect handle it with proper exclude_order_id
  } catch (error) {
    console.error('Failed to load form data:', error);
    showNotification('error', 'Loading Error', 'Failed to load form options. Please refresh and try again.');
  }
};
  const fetchLocationSuggestions = async (query) => {
  if (!query.trim()) return setLocationSuggestions([]);
  try {
    const res = await apiService.getLocationSuggestions(query);
    setLocationSuggestions(res || []);
  } catch (err) {
    console.error("Failed to fetch location suggestions:", err);
    setLocationSuggestions([]);
  }
};



const checkAvailability = async () => {
  if (!formData.start_date || !formData.end_date) return;
  
  try {
    // Build parameters object
    const params = {
      start_date: formData.start_date,
      end_date: formData.end_date
    };

    // Add exclude_order_id if we're in edit mode
    if (isEditMode && editingOrderId) {
      params.exclude_order_id = editingOrderId;
    }

    const response = await apiService.getScreenAvailabilityForDates(params);
    setScreenAvailability(response.availability || []);
    console.log("Screen availability response:", response.availability);
  } catch (error) {
    console.error('Failed to check availability:', error);
  }
};
 
const checkEquipmentAvailability = async () => {
  if (!formData.start_date || !formData.end_date) return;
  
  try {

    const params = {
      start_date: formData.start_date,
      end_date: formData.end_date
    };


    if (isEditMode && editingOrderId) {
      params.exclude_order_id = editingOrderId;
    }

    const response = await apiService.getEquipmentAvailabilityForDates(params);
    console.log('Equipment availability response:', response);

    setEquipmentAvailability(response.availability || {});
  } catch (error) {
    console.error('Failed to check equipment availability:', error);
  }
};

useEffect(() => {
  if (isOpen && initialData) {
    const order = initialData.order;


    setFormData({
      id: order.id || '',
      google_maps_link: order.google_maps_link || '',
      location_name: order.location_name || '',
      start_date: order.start_date
        ? new Date(order.start_date).toISOString().split('T')[0]
        : '',
      end_date: order.end_date
          ? new Date(order.end_date).toISOString().split('T')[0]
        : '',
      due_date: order.due_date
        ? new Date(order.due_date).toISOString().split('T')[0]
        : '',

      price_per_sqm: order.price_per_sqm || 0,
      notes: order.notes || '',
      installing_assignee_id: order.installing_assignee?.id || '',
      disassemble_assignee_id: order.disassemble_assignee?.id || '',
      third_party_provider_id: order.third_party_provider?.id || '',
      laptops_needed: order.laptops_needed || 1,
      video_processors_needed: order.video_processors_needed || 1
    });

   setScreenRequirements(
  (initialData.screen_requirements || []).map(req => ({
    screen_inventory_id: req.screen_inventory_id,
    sqm_required: req.sqm_required?.toString() || '',
    dimensions_rows: req.dimensions_rows,
    dimensions_columns: req.dimensions_columns
  }))
);

  } else if (isOpen && !initialData) {
    resetForm(); // For create mode
  }
}, [isOpen, initialData]);

useEffect(() => {
  console.log('🔍 screenRequirements updated:', screenRequirements);
}, [screenRequirements]);


  const showNotification = (type, title, message, details = null) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
      details,
      onCloseCallback: null 
    });
  };

  const closeNotification = () => {
  const callback = notification.onCloseCallback;
  setNotification({ 
    ...notification, 
    isOpen: false, 
    onCloseCallback: null 
  });
  
  // Execute callback if it exists (for success notifications)
  if (callback) {
    callback();
  }
};

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // FIXED: Auto-calculate sqm_required when dimensions change
  const handleScreenRequirementChange = (index, field, value) => {
    const updatedRequirements = [...screenRequirements];
    updatedRequirements[index][field] = value;
    
    // AUTO-CALCULATE sqm_required when dimensions change
    if (field === 'dimensions_rows' || field === 'dimensions_columns') {
      const rows = field === 'dimensions_rows' ? parseInt(value) || 0 : updatedRequirements[index].dimensions_rows || 0;
      const columns = field === 'dimensions_columns' ? parseInt(value) || 0 : updatedRequirements[index].dimensions_columns || 0;
      
      // Calculate square meters (assuming each panel is 0.5m x 0.5m = 0.25m²)
      const panelSizeM2 = 1;
      updatedRequirements[index].sqm_required = (rows * columns * panelSizeM2).toString();
      
      console.log(`Calculated sqm_required: ${rows} × ${columns} × ${panelSizeM2} = ${updatedRequirements[index].sqm_required}m²`);
    }
    
    setScreenRequirements(updatedRequirements);
  };

  const addScreenRequirement = () => {
    setScreenRequirements(prev => [...prev, { 
      screen_inventory_id: '', 
      sqm_required: '24',  // Default: 8x12x0.25 = 24m²
      dimensions_rows: 8,
      dimensions_columns: 12
    }]);
  };

  const removeScreenRequirement = (index) => {
    if (screenRequirements.length > 1) {
      setScreenRequirements(prev => prev.filter((_, i) => i !== index));
    }
  };

  const getAvailableForDates = (screenId) => {
    if (!screenAvailability.length) return 'Select dates first';
    
    const availability = screenAvailability.find(item => item.id === parseInt(screenId));
    return availability ? `${availability.max_available_for_period}m² available` : 'Checking...';
  };

  const getSelectedScreenInfo = (screenId) => {
    const screen = screenInventory.find(s => s.id.toString() === screenId);
    return screen ? `P${screen.pixel_pitch} - ${screen.screen_type}` : '';
  };

  // Helper function to display calculated square meters
  const getCalculatedSqm = (req) => {
    const rows = parseInt(req.dimensions_rows) || 0;
    const columns = parseInt(req.dimensions_columns) || 0;
    const panelSizeM2 = 1; // 0.5m x 0.5m panels
    return (rows * columns * panelSizeM2).toFixed(2);
  };

const validateForm = () => {
  const newErrors = [];

  if (!formData.location_name.trim()) {
    newErrors.push('Location name is required');
  }

  if (!formData.start_date) {
    newErrors.push('Start date is required');
  }

  if (!formData.end_date) {
    newErrors.push('End date is required');
  }

  if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
    newErrors.push('End date must be after start date');
  }

  if (!formData.installing_assignee_id) {
    newErrors.push('Installing assignee is required');
  }

  if (!formData.disassemble_assignee_id) {
    newErrors.push('Disassemble assignee is required');
  }

  if (formData.laptops_needed < 1) {
    newErrors.push('At least 1 laptop is required');
  }

  if (formData.video_processors_needed < 1) {
    newErrors.push('At least 1 video processor is required');
  }

  const availableLaptops = equipmentAvailability.laptops?.available || 0;
  const availableProcessors = equipmentAvailability.video_processors?.available || 0;

  if (formData.laptops_needed > availableLaptops) {
    newErrors.push(`Only ${availableLaptops} laptops available, but ${formData.laptops_needed} requested`);
  }

  if (formData.video_processors_needed > availableProcessors) {
    newErrors.push(`Only ${availableProcessors} video processors available, but ${formData.video_processors_needed} requested`);
  }

  const validScreenRequirements = screenRequirements.filter(req => {
    const hasScreenType = req.screen_inventory_id && req.screen_inventory_id.toString().trim() !== '';
    const hasValidDimensions = req.dimensions_rows && req.dimensions_columns &&
      parseInt(req.dimensions_rows) > 0 && parseInt(req.dimensions_columns) > 0;
    const hasSqm = req.sqm_required && parseFloat(req.sqm_required) > 0;
    return hasScreenType && hasValidDimensions && hasSqm;
  });

  if (validScreenRequirements.length === 0) {
    newErrors.push('At least one screen configuration is needed (select screen type and enter valid dimensions)');
  }

  validScreenRequirements.forEach((req, index) => {
    if (!req.dimensions_rows || parseInt(req.dimensions_rows) < 1) {
      newErrors.push(`Screen ${index + 1}: Rows must be at least 1`);
    }
    if (!req.dimensions_columns || parseInt(req.dimensions_columns) < 1) {
      newErrors.push(`Screen ${index + 1}: Columns must be at least 1`);
    }
    if (parseInt(req.dimensions_rows) > 50 || parseInt(req.dimensions_columns) > 100) {
      newErrors.push(`Screen ${index + 1}: Dimensions too large (max 50 rows × 100 columns)`);
    }

    const availability = screenAvailability.find(item => parseInt(item.id) === parseInt(req.screen_inventory_id));
    if (availability && parseFloat(req.sqm_required) > availability.max_available_for_period) {
      const screenType = screenInventory.find(s => s.id.toString() === req.screen_inventory_id)?.screen_type;
      newErrors.push(`${screenType}: Only ${availability.max_available_for_period}m² available, but ${req.sqm_required}m² requested`);
    }
  });

  if (validScreenRequirements.length > 1) {
    const pixelPitches = validScreenRequirements.map(req => {
      const screen = screenInventory.find(s => s.id.toString() === req.screen_inventory_id);
      return screen?.pixel_pitch;
    });
    const uniquePitches = [...new Set(pixelPitches)];
    if (uniquePitches.length > 1) {
      newErrors.push('Cannot mix different pixel pitches in one order');
    }
  }

  setErrors(newErrors);
  return { isValid: newErrors.length === 0, validScreenRequirements, newErrors };

};

const handleSubmit = async (e) => {
  e.preventDefault();

  const { isValid, validScreenRequirements, newErrors } = validateForm();

  if (!isValid) {
    showNotification(
      'error',
      'Validation Failed',
      'Please fix the following issues:',
      newErrors
    );
    return;
  }



  setLoading(true);
  setErrors([]);

  try {
    const totalSqm    = validScreenRequirements.reduce((sum, r) => sum + parseFloat(r.sqm_required||0), 0);
    const totalAmount = manualTotalEnabled
    ? parseFloat(manualTotalAmount) || 0
    : totalSqm * (parseFloat(formData.price_per_sqm) || 0);


    const orderData = {
      order: {
        ...formData,
        installing_assignee_id: Number(formData.installing_assignee_id),
        disassemble_assignee_id: Number(formData.disassemble_assignee_id),
        laptops_needed: Number(formData.laptops_needed),
        video_processors_needed: Number(formData.video_processors_needed),
        price_per_sqm: parseFloat(formData.price_per_sqm),      
        total_amount: totalAmount,
        due_date: formData.due_date || null 
      },
      screen_requirements: validScreenRequirements.map(req => ({
        screen_inventory_id: Number(req.screen_inventory_id),
        sqm_required: parseFloat(req.sqm_required),
        dimensions_rows: Number(req.dimensions_rows),
        dimensions_columns: Number(req.dimensions_columns)
      }))
    };

    console.log('Submitting order:', orderData);
    const response = isEditMode
      ? await apiService.updateOrder(formData.id, orderData) 
      : await apiService.createOrder(orderData);


    showNotification(
      'success',
      'Order Created Successfully! 🎉',
      `Order ${response.order?.order_id || 'ID pending'} has been created and confirmed.`,
      [
        `Location: ${formData.location_name}`,
        `Total: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(
            manualTotalEnabled ? manualTotalAmount : getTotalAmount()
          )}`,

        `Equipment: ${formData.laptops_needed} laptop(s), ${formData.video_processors_needed} processor(s)`,
        `Screen Configurations: ${validScreenRequirements.map(req => `${req.dimensions_rows}×${req.dimensions_columns}`).join(', ')}`
      ]
    );

    setNotification(prev => ({
  ...prev,
  onCloseCallback: () => {
    onSuccess && onSuccess(response);
    onClose();
    resetForm();
  }
  }));
  } catch (error) {
    console.error('Failed to create order:', error);

    if (error.response?.status === 422 && Array.isArray(error.response?.data?.errors)) {
      showNotification(
        'error',
        'Validation Failed',
        'Please review the following:',
        error.response.data.errors
      );
    } else if (error.response?.status === 500) {
      showNotification(
        'error',
        'Server Error',
        'Something went wrong on the server. Please contact the administrator or try again later.',
        [error.response?.data?.exception || error.message]
      );
    } else {
      showNotification(
        'error',
        'Order Creation Failed',
        'There was an error creating your order.',
        [error.message]
      );
    }
  } finally {
    setLoading(false);
  }
};


  // FIXED: Initialize with calculated sqm_required
  const resetForm = () => {
    setFormData({
      google_maps_link: '',
      location_name: '',
      start_date: '',
      end_date: '',
      price_per_sqm: 150,
      notes: '',
      installing_assignee_id: '',
      disassemble_assignee_id: '',
      third_party_provider_id: '',
      laptops_needed: 1,
      video_processors_needed: 1
    });
    
    // Initialize with calculated sqm_required
    const initialRows = 8;
    const initialColumns = 12;
    const panelSizeM2 = 1; // 0.5m x 0.5m panels
    const initialSqm = (initialRows * initialColumns * panelSizeM2).toString();
    
    setScreenRequirements([{ 
      screen_inventory_id: '', 
      sqm_required: initialSqm,
      dimensions_rows: initialRows,
      dimensions_columns: initialColumns
    }]);
  };

  const getTotalSqm = () => {
    return screenRequirements.reduce((total, req) => total + (parseFloat(req.sqm_required) || 0), 0);
  };

  const getTotalAmount = () => {
    return getTotalSqm() * (parseFloat(formData.price_per_sqm) || 0);
  };

  if (!isOpen) return null;

const handleClose = async () => {
  if (isEditMode && editingOrderId) {
    try {
      // Optional: Call API to cancel edit mode if your backend tracks this
      // await apiService.cancelOrderEdit(editingOrderId);
      console.log('🔧 Closing edit mode for order:', editingOrderId);
    } catch (err) {
      console.warn('Failed to cancel edit mode:', err);
    }
  }
  onClose();
};


  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
          <h3>{isEditMode ? 'Edit Order' : 'Create New Order'}</h3>

          <form onSubmit={handleSubmit}>
            {/* Location Information */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>📍 Location Information</h4>
              
            <div className="form-group" style={{ position: 'relative', zIndex: 10 }}>
  <label className="form-label">Location Name *</label>
  <input
    type="text"
    className="form-input"
    value={formData.location_name}
    onChange={(e) => {
      const value = e.target.value;
      handleInputChange('location_name', value);
      fetchLocationSuggestions(value); // fetch suggestions
    }}
    onBlur={() => setTimeout(() => setLocationSuggestions([]), 150)}
    placeholder="Enter event location name"
    required
    autoComplete="off"
  />

  <ul
    style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 9999,
      background: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      listStyle: 'none',
      margin: 0,
      padding: 0,
      maxHeight: '200px',
      overflowY: 'auto',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
      display: locationSuggestions.length > 0 ? 'block' : 'none'
    }}
  >
    {locationSuggestions.map((sug, index) => (
      <li
        key={index}
        onClick={() => {
          handleInputChange('location_name', sug.location_name);
          handleInputChange('google_maps_link', sug.google_maps_link || '');
          setLocationSuggestions([]);
        }}
        style={{
          padding: '10px 14px',
          cursor: 'pointer',
          borderBottom: '1px solid #eee'
        }}
      >
        {sug.location_name}
        {sug.google_maps_link && (
          <span style={{ marginLeft: 8, color: '#888' }}>🔗</span>
        )}
      </li>
    ))}
  </ul>
</div>


              <div className="form-group">
                <label className="form-label">Google Maps Link</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.google_maps_link}
                  onChange={(e) => handleInputChange('google_maps_link', e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>

            {/* Dates and Duration */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>📅 Event Schedule</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    min=""
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date (for Payment)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                  />
                </div>

              </div>
            </div>

            {/* Team Assignment */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f4ff', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>👥 Team Assignment</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Installing Technician *</label>
                  <select
                    className="form-input"
                    value={formData.installing_assignee_id}
                    onChange={(e) => handleInputChange('installing_assignee_id', e.target.value)}
                    required
                  >
                    <option value="">Select installing technician...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} - {emp.role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Disassemble Technician *</label>
                  <select
                    className="form-input"
                    value={formData.disassemble_assignee_id}
                    onChange={(e) => handleInputChange('disassemble_assignee_id', e.target.value)}
                    required
                  >
                    <option value="">Select disassemble technician...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} - {emp.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Third Party Provider (Optional)</label>
                <select
                  className="form-input"
                  value={formData.third_party_provider_id}
                  onChange={(e) => handleInputChange('third_party_provider_id', e.target.value)}
                >
                  <option value="">None - Internal Team</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name} - {company.contact_person}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Screen Requirements */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f0fff4', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>📺 Screen Configuration</h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
                Configure your LED screen requirements. Square meters are automatically calculated from dimensions.
              </p>
              
              {screenRequirements.map((req, index) => (
                <div key={index} style={{ marginBottom: '20px', padding: '16px', background: 'white', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h5 style={{ margin: 0, color: '#374151' }}>Screen Configuration #{index + 1}</h5>
                    {screenRequirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeScreenRequirement(index)}
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
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Screen Type *</label>
                    <select
                      className="form-input"
                      value={req.screen_inventory_id}
                      onChange={(e) => handleScreenRequirementChange(index, 'screen_inventory_id', e.target.value)}
                      required
                    >
                      <option value="">Select screen type...</option>
                      {screenInventory.map(screen => (
                        <option key={screen.id} value={screen.id}>
                          {screen.screen_type} (P{screen.pixel_pitch}) - {getAvailableForDates(screen.id)}
                        </option>
                      ))}
                    </select>
                    {req.screen_inventory_id && (
                      <small style={{ color: '#3b82f6', fontWeight: '500' }}>
                        Selected: {getSelectedScreenInfo(req.screen_inventory_id)}
                      </small>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Rows (Height) *</label>
                      <input
                        type="number"
                        className="form-input"
                        value={req.dimensions_rows}
                        onChange={(e) => handleScreenRequirementChange(index, 'dimensions_rows', e.target.value)}
                        min="1"
                        max="50"
                        required
                        placeholder="8"
                      />
                      <small style={{ color: '#6b7280' }}>Number of panel rows vertically</small>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Columns (Width) *</label>
                      <input
                        type="number"
                        className="form-input"
                        value={req.dimensions_columns}
                        onChange={(e) => handleScreenRequirementChange(index, 'dimensions_columns', e.target.value)}
                        min="1"
                        max="100"
                        required
                        placeholder="12"
                      />
                      <small style={{ color: '#6b7280' }}>Number of panel columns horizontally</small>
                    </div>
                  </div>

                  {/* Display calculated square meters */}
                  <div className="form-group">
                    <label className="form-label">Calculated Square Meters</label>
                    <div style={{ 
                      padding: '12px', 
                      background: '#f0f9ff', 
                      border: '1px solid #0ea5e9', 
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: '#0c4a6e', fontWeight: '600' }}>
                        {req.dimensions_rows || 0} × {req.dimensions_columns || 0} panels = {getCalculatedSqm(req)} m²
                      </span>
                    </div>
                  </div>

                  {req.screen_inventory_id && req.dimensions_rows && req.dimensions_columns && (
                    <div style={{ 
                      padding: '12px', 
                      background: '#f8f9fa', 
                      borderRadius: '6px', 
                      marginTop: '8px',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      <div>
                        📐 Total size: {req.dimensions_rows}m × {req.dimensions_columns}m<br/>
                        📊 Square meters: {req.sqm_required}m²<br/>
                        📺 Estimated Resolution: {req.dimensions_rows * 64} × {req.dimensions_columns * 64} pixels
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addScreenRequirement}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                + Add Another Screen Configuration
              </button>
            </div>

            {/* Equipment Requirements */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#fef7ff', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>💻 Equipment Requirements</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Laptops Needed *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.laptops_needed}
                    onChange={(e) => handleInputChange('laptops_needed', parseInt(e.target.value) || 1)}
                    min="1"
                    max={equipmentAvailability.laptops?.available || 999}
                    required
                  />
             <small style={{ color: '#6b7280' }}>
  Available for selected dates: {equipmentAvailability.laptops?.available ?? '...'} laptops
</small>


                </div>
                <div className="form-group">
                  <label className="form-label">Video Processors Needed *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.video_processors_needed}
                    onChange={(e) => handleInputChange('video_processors_needed', parseInt(e.target.value) || 1)}
                    min="1"
                    max={equipmentAvailability.video_processors?.available || 999}
                    required
                  />
                  <small style={{ color: '#6b7280' }}>
                    Available: {equipmentAvailability.video_processors?.available || 0} processors
                  </small>
                </div>

              </div>
            </div>

            {/* Pricing */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#fffbeb', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>💰 Pricing Information</h4>
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={manualTotalEnabled}
                    onChange={(e) => {
                      setManualTotalEnabled(e.target.checked);
                      if (!e.target.checked) setManualTotalAmount('');
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  Bulk amount
                </label>
              </div>

              {manualTotalEnabled && (
                <div className="form-group">
                  <label className="form-label">Order Total Amount (SAR)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={manualTotalAmount}
                    onChange={(e) => setManualTotalAmount(e.target.value)}
                    placeholder="Enter total order amount"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

            {!manualTotalEnabled && (
            <div className="form-group">
              <label className="form-label">Price per Square Meter (SAR) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.price_per_sqm}
                onChange={(e) => handleInputChange('price_per_sqm', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                required
              />
            </div>
          )}


              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <textarea
                  className="form-input"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows="3"
                  placeholder="Any special requirements or notes..."
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>💰 Order Summary</h4>
              
              {screenRequirements.filter(req => req.screen_inventory_id && req.sqm_required).map((req, index) => (
                <div key={index} style={{ marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                  <strong>{getSelectedScreenInfo(req.screen_inventory_id)}:</strong> {req.dimensions_rows}×{req.dimensions_columns} ({req.sqm_required}m²)
                </div>
              ))}
              
              <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '12px', marginTop: '12px' }}>
                <p style={{ margin: '4px 0', color: '#6b7280' }}>
                  Total Square Meters: <strong>{getTotalSqm()} m²</strong>
                </p>
                <p style={{ margin: '4px 0', color: '#6b7280' }}>
                  Price per m²: <strong>{formData.price_per_sqm} SAR</strong>
                </p>
                <p style={{ margin: '4px 0', color: '#6b7280' }}>
                  Equipment: <strong>{formData.laptops_needed} laptop(s), {formData.video_processors_needed} processor(s)</strong>
                </p>
                <p>
                  Total Amount: 
                  <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(
                    manualTotalEnabled ? manualTotalAmount : getTotalAmount()
                  )}</strong>
                </p>

              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={handleClose}
                className="action-button secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="action-button primary"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                   {loading
     ? (isEditMode ? 'Updating Order...' : 'Creating Order...')
     : (isEditMode ? 'Update Order' : 'Create Order')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        details={notification.details}
      />
    </>
  );
};

export default CreateOrderModal;