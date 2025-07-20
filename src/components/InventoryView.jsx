import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import AddInventoryModal from './AddInventoryModal';
import InventoryDetailsModal from './InventoryDetailsModal';
import MaintenanceModal from './MaintenanceModal';

const InventoryView = () => {
  const [screenInventory, setScreenInventory] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('screens');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintItem, setMaintItem] = useState(null);
  
  // Date range for availability checking
  const [dateRange, setDateRange] = useState({
    start_date: new Date().toISOString().split('T')[0], // Today
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +7 days
  });
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    available_only: false
  });

  const [inventoryStats, setInventoryStats] = useState({
    screens: { total: 0, available: 0, reserved: 0 },
    laptops: { total: 0, available: 0, assigned: 0 },
    processors: { total: 0, available: 0, assigned: 0 },
    cables: { total: 0, available: 0, assigned: 0 }
  });

  const [availabilityData, setAvailabilityData] = useState({
    screens: [],
    equipment: {}
  });

  const isMobile = window.innerWidth <= 480;
  const isTablet = window.innerWidth <= 768;

  useEffect(() => {
    loadInventoryData();
  }, []);

  useEffect(() => {
    if (screenInventory.length > 0 || equipment.length > 0) {
      checkAvailabilityForDateRange();
    }
  }, [dateRange, screenInventory, equipment]);

  const loadInventoryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [screenResponse, equipmentResponse] = await Promise.all([
        apiService.getScreenInventory(),
        apiService.getEquipment()
      ]);

      setScreenInventory(screenResponse.screen_inventory || []);
      setEquipment(equipmentResponse.equipment || []);
      
    } catch (err) {
      setError('Failed to load inventory data: ' + err.message);
      console.error('Inventory load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToMaintenance = (item) => {
    setMaintItem(item);
    setShowMaintModal(true);
  };

  const submitMaintenance = async (item, { start_date, end_date, sqm }) => {
    try {
      await apiService.createScreenMaintenance(item.id, {
        sqm: parseFloat(sqm),
        maintenance_start_date: start_date,
        maintenance_end_date: end_date
      });
      setShowMaintModal(false);
      loadInventoryData();
    } catch (err) {
      alert('Failed to schedule maintenance: ' + err.message);
    }
  };

  const checkAvailabilityForDateRange = async () => {
    try {
      let screenAvailabilityData = [];
      
      try {
        const screenResponse = await apiService.getScreenAvailability?.(
          dateRange.start_date, 
          dateRange.end_date
        );
        
        if (screenResponse?.availability) {
          screenAvailabilityData = screenResponse.availability;
        }
      } catch (screenErr) {
        console.error('Screen availability error:', screenErr);
      }
      
      const equipmentAvailabilityResponse = await apiService.getEquipmentAvailabilityForDates(
        dateRange.start_date,
        dateRange.end_date
      );
      
      setAvailabilityData({
        screens: screenAvailabilityData,
        equipment: equipmentAvailabilityResponse.availability || {}
      });
      
      calculateInventoryStatsWithAvailability(
        screenInventory, 
        equipment, 
        screenAvailabilityData,
        equipmentAvailabilityResponse.availability || {}
      );
      
    } catch (err) {
      console.error('Availability check error:', err);
      calculateClientSideAvailability();
    }
  };

  const calculateClientSideAvailability = () => {
    const screenAvailability = screenInventory.map(screen => ({
      id: screen.id,
      screen_type: screen.screen_type,
      pixel_pitch: screen.pixel_pitch,
      total_sqm_owned: screen.total_sqm_owned,
      available_sqm_for_period: screen.available_sqm,
      is_available: screen.available_sqm > 0,
      max_available_for_period: screen.available_sqm
    }));
    
    setAvailabilityData({
      screens: screenAvailability,
      equipment: {
        laptops: { available: equipment.filter(eq => eq.equipment_type === 'laptop' && eq.status === 'available').length },
        video_processors: { available: equipment.filter(eq => eq.equipment_type === 'video_processor' && eq.status === 'available').length },
        cables: { available: equipment.filter(eq => eq.equipment_type === 'cable' && eq.status === 'available').length }
      }
    });
    
    calculateInventoryStats(screenInventory, equipment);
  };

  const calculateInventoryStats = (screens, equipmentList) => {
    const laptops = equipmentList.filter(eq => eq.equipment_type === 'laptop');
    const processors = equipmentList.filter(eq => eq.equipment_type === 'video_processor');
    const cables = equipmentList.filter(eq => eq.equipment_type === 'cable');

    const stats = {
      screens: {
        total: screens.reduce((sum, screen) => sum + (screen.total_sqm_owned || 0), 0),
        available: screens.reduce((sum, screen) => sum + (screen.available_sqm || 0), 0),
        reserved: screens.reduce((sum, screen) => sum + ((screen.total_sqm_owned || 0) - (screen.available_sqm || 0)), 0)
      },
      laptops: {
        total: laptops.length,
        available: laptops.filter(eq => eq.status === 'available').length,
        assigned: laptops.filter(eq => eq.status === 'assigned').length
      },
      processors: {
        total: processors.length,
        available: processors.filter(eq => eq.status === 'available').length,
        assigned: processors.filter(eq => eq.status === 'assigned').length
      },
      cables: {
        total: cables.length,
        available: cables.filter(eq => eq.status === 'available').length,
        assigned: cables.filter(eq => eq.status === 'assigned').length
      }
    };

    setInventoryStats(stats);
  };

  const calculateInventoryStatsWithAvailability = (screens, equipmentList, screenAvailability, equipmentAvailability) => {
    const screenStats = {
      total: screenAvailability.reduce((sum, s) => sum + (parseFloat(s.total_sqm_owned) || 0), 0),
      available: screenAvailability.reduce((sum, screen) => sum + (parseFloat(screen.max_available_for_period) || 0), 0),
      reserved: 0
    };
    screenStats.reserved = screenStats.total - screenStats.available;

    const stats = {
      screens: screenStats,
      laptops: {
        total: equipmentAvailability.laptops?.total || equipmentList.filter(eq => eq.equipment_type === 'laptop').length,
        available: equipmentAvailability.laptops?.available || 0,
        assigned: 0
      },
      processors: {
        total: equipmentAvailability.video_processors?.total || equipmentList.filter(eq => eq.equipment_type === 'video_processor').length,
        available: equipmentAvailability.video_processors?.available || 0,
        assigned: 0
      },
      cables: {
        total: equipmentAvailability.cables?.total || equipmentList.filter(eq => eq.equipment_type === 'cable').length,
        available: equipmentAvailability.cables?.available || 0,
        assigned: 0
      }
    };

    stats.laptops.assigned = stats.laptops.total - stats.laptops.available;
    stats.processors.assigned = stats.processors.total - stats.processors.available;
    stats.cables.assigned = stats.cables.total - stats.cables.available;

    setInventoryStats(stats);
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddItem = () => {
    setShowAddModal(true);
  };

  const handleItemAdded = () => {
    setShowAddModal(false);
    loadInventoryData();
  };

  const handleViewDetails = async (item, type) => {
    try {
      let response;
      if (type === 'screen') {
        response = await apiService.getScreenInventoryItem(item.id);
        setSelectedItem({ ...response.screen_inventory, type: 'screen' });
      } else {
        response = await apiService.getEquipmentItem(item.id);
        setSelectedItem({ ...response.equipment, type: 'equipment' });
      }
      setShowDetailsModal(true);
    } catch (err) {
      alert('Failed to load item details: ' + err.message);
    }
  };

  const getFilteredScreens = () => {
    const screens = availabilityData.screens.length > 0 ? availabilityData.screens : screenInventory;
    
    return screens.filter(screen => {
      const searchMatch = !filters.search || 
        screen.screen_type.toLowerCase().includes(filters.search.toLowerCase()) ||
        screen.description?.toLowerCase().includes(filters.search.toLowerCase());
      
      const availableForPeriod = parseFloat(screen.max_available_for_period !== undefined ? screen.max_available_for_period : screen.available_sqm);
      const totalOwned = parseFloat(screen.total_sqm_owned) || 0;
      
      const statusMatch = !filters.status || 
        (filters.status === 'available' && availableForPeriod > 0) ||
        (filters.status === 'reserved' && availableForPeriod < totalOwned);
      
      const availableMatch = !filters.available_only || availableForPeriod > 0;
      
      return searchMatch && statusMatch && availableMatch;
    });
  };

  const getFilteredEquipment = (equipmentType) => {
    const availabilityCount = getEquipmentAvailabilityCount(equipmentType);
    
    return equipment.filter(item => {
      const typeMatch = item.equipment_type === equipmentType;
      
      const searchMatch = !filters.search || 
        item.model?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.serial_number?.toLowerCase().includes(filters.search.toLowerCase());
      
      let statusMatch = true;
      if (filters.status) {
        if (filters.status === 'available') {
          const itemIndex = equipment.filter(eq => eq.equipment_type === equipmentType).indexOf(item);
          statusMatch = itemIndex < availabilityCount;
        } else {
          statusMatch = item.status === filters.status;
        }
      }
      
      const availableMatch = !filters.available_only || 
        (equipment.filter(eq => eq.equipment_type === equipmentType).indexOf(item) < availabilityCount);
      
      return typeMatch && searchMatch && statusMatch && availableMatch;
    });
  };

  const getEquipmentAvailabilityCount = (equipmentType) => {
    const mapping = {
      'laptop': 'laptops',
      'video_processor': 'video_processors',
      'cable': 'cables'
    };
    
    const equipmentKey = mapping[equipmentType];
    return availabilityData.equipment[equipmentKey]?.available || 0;
  };

  const isEquipmentAvailableForPeriod = (item) => {
    const equipmentOfType = equipment.filter(eq => eq.equipment_type === item.equipment_type);
    const itemIndex = equipmentOfType.indexOf(item);
    const availableCount = getEquipmentAvailabilityCount(item.equipment_type);
    
    return itemIndex < availableCount;
  };

  const exportInventoryData = () => {
    const csvData = [];
    
    csvData.push([
      'Type', 'Name/Model', 'Serial/ID', 'Status', 'Quantity', 
      'Available for Period', 'Location', 'Purchase Date', 'Value', 'Notes',
      'Period Start', 'Period End'
    ]);

    const screensToExport = getFilteredScreens();
    screensToExport.forEach(screen => {
      const availableForPeriod = parseFloat(screen.max_available_for_period !== undefined ? 
        screen.max_available_for_period : screen.available_sqm);
      const totalOwned = parseFloat(screen.total_sqm_owned) || 0;
      
      csvData.push([
        'LED Screen',
        screen.screen_type,
        `P${screen.pixel_pitch}`,
        availableForPeriod > 0 ? 'Available' : 'Reserved',
        `${totalOwned} m^2`,
        `${availableForPeriod} m^2`,
        'Screen Inventory',
        '',
        '',
        screen.description || '',
        dateRange.start_date,
        dateRange.end_date
      ]);
    });

    ['laptop', 'video_processor', 'cable'].forEach(equipmentType => {
      const equipmentItems = getFilteredEquipment(equipmentType);
      equipmentItems.forEach(item => {
        const isAvailable = isEquipmentAvailableForPeriod(item);
        csvData.push([
          item.equipment_type.replace('_', ' '),
          item.model || '',
          item.serial_number || '',
          isAvailable ? 'Available' : 'Reserved',
          '1',
          isAvailable ? '1' : '0',
          'Equipment Storage',
          item.purchase_date || '',
          item.purchase_price || '',
          item.notes || '',
          dateRange.start_date,
          dateRange.end_date
        ]);
      });
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${dateRange.start_date}_to_${dateRange.end_date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'screens':
        return renderScreenInventory();
      case 'laptops':
        return renderEquipmentInventory('laptop', 'Laptops');
      case 'processors':
        return renderEquipmentInventory('video_processor', 'Video Processors');
      case 'cables':
        return renderEquipmentInventory('cable', 'Cables');
      default:
        return null;
    }
  };

  const renderScreenInventory = () => {
    const filteredScreens = getFilteredScreens();
    
    return (
      <div>
        {filteredScreens.length > 0 ? (
          <div className="items-list">
            {filteredScreens.map(screen => {
              const availableForPeriod = parseFloat(screen.max_available_for_period !== undefined ? 
                screen.max_available_for_period : screen.available_sqm);
              const totalOwned = parseFloat(screen.total_sqm_owned) || 0;
              const reservedForPeriod = totalOwned - availableForPeriod;
              const utilizationPercent = totalOwned > 0 ? (reservedForPeriod / totalOwned) * 100 : 0;
              
              return (
                <div key={screen.id || `${screen.screen_type}-${screen.pixel_pitch}`} className="item-row" style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '12px' : '16px',
                  padding: isMobile ? '12px' : '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  background: 'white'
                }}>
                  <div className="item-info" style={{ flex: 1 }}>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '600'
                    }}>
                      {screen.screen_type} (P{screen.pixel_pitch})
                    </h4>
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: isMobile ? '12px' : '14px',
                      color: '#6b7280'
                    }}>
                      {screen.description || `Pixel Pitch: ${screen.pixel_pitch}mm`}
                    </p>
                    <p style={{ 
                      fontSize: isMobile ? '10px' : '12px', 
                      color: '#6b7280',
                      margin: '0 0 8px 0',
                      lineHeight: '1.4'
                    }}>
                      Total: {totalOwned}m² • Available: {availableForPeriod}m² • 
                      Reserved: {reservedForPeriod.toFixed(1)}m² • Utilization: {utilizationPercent.toFixed(1)}%
                    </p>
                    
                    {/* Utilization Bar */}
                    <div style={{ 
                      width: '100%', 
                      height: isMobile ? '4px' : '6px', 
                      background: '#e5e7eb', 
                      borderRadius: '3px',
                      overflow: 'hidden',
                      marginTop: '8px'
                    }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(utilizationPercent, 100)}%`,
                          background: utilizationPercent > 80 ? '#ef4444' : utilizationPercent > 50 ? '#f59e0b' : '#10b981',
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'row' : 'column',
                    gap: isMobile ? '4px' : '8px', 
                    alignItems: isMobile ? 'center' : 'flex-end',
                    justifyContent: isMobile ? 'space-between' : 'center',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      padding: isMobile ? '3px 6px' : '4px 8px',
                      borderRadius: '4px',
                      fontSize: isMobile ? '10px' : '12px',
                      fontWeight: '500',
                      background: availableForPeriod > 0 ? '#d1fae5' : '#fee2e2',
                      color: availableForPeriod > 0 ? '#10b981' : '#ef4444',
                      whiteSpace: 'nowrap'
                    }}>
                      {availableForPeriod > 0 ? 'Available' : 'Reserved'}
                    </span>
                    <div style={{ 
                      display: 'flex', 
                      gap: '4px',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => handleViewDetails(screen, 'screen')}
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: isMobile ? '4px 8px' : '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: isMobile ? '10px' : '12px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isMobile ? 'View' : 'View Details'}
                      </button>
                      <button
                        onClick={() => handleSendToMaintenance(screen)}
                        style={{
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          padding: isMobile ? '4px 8px' : '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: isMobile ? '10px' : '12px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isMobile ? '🔧' : '🔧 Maintenance'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" style={{
            textAlign: 'center',
            padding: isMobile ? '32px 16px' : '48px 24px',
            color: '#6b7280'
          }}>
            <div className="icon" style={{ fontSize: isMobile ? '32px' : '48px', marginBottom: '16px' }}>📺</div>
            <p style={{ fontSize: isMobile ? '14px' : '16px', margin: '0 0 8px 0' }}>No LED screens available for selected period</p>
            <small style={{ fontSize: isMobile ? '12px' : '14px' }}>Try adjusting your date range or search criteria</small>
          </div>
        )}
      </div>
    );
  };

  const renderEquipmentInventory = (equipmentType, title) => {
    const filteredEquipment = getFilteredEquipment(equipmentType);
    
    return (
      <div>
        {filteredEquipment.length > 0 ? (
          <div className="items-list">
            {filteredEquipment.map(item => {
              const isAvailable = isEquipmentAvailableForPeriod(item);
              
              return (
                <div key={item.id} className="item-row" style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '12px' : '16px',
                  padding: isMobile ? '12px' : '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  background: 'white'
                }}>
                  <div className="item-info" style={{ flex: 1 }}>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '600'
                    }}>
                      {item.model || `${equipmentType.replace('_', ' ')} ${item.id}`}
                    </h4>
                    <p style={{
                      margin: '0 0 4px 0',
                      fontSize: isMobile ? '12px' : '14px',
                      color: '#374151'
                    }}>
                      Serial: {item.serial_number || 'Not assigned'}
                    </p>
                    {(item.purchase_date || item.purchase_price) && (
                      <p style={{ 
                        fontSize: isMobile ? '10px' : '12px', 
                        color: '#6b7280',
                        margin: '0 0 4px 0'
                      }}>
                        {item.purchase_date && `Purchased: ${new Date(item.purchase_date).toLocaleDateString()}`}
                        {item.purchase_price && ` • Value: ${item.purchase_price} SAR`}
                      </p>
                    )}
                    {item.notes && (
                      <p style={{ 
                        fontSize: isMobile ? '10px' : '12px', 
                        color: '#6b7280', 
                        fontStyle: 'italic',
                        margin: 0
                      }}>
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'row' : 'column',
                    gap: isMobile ? '4px' : '8px', 
                    alignItems: isMobile ? 'center' : 'flex-end',
                    justifyContent: isMobile ? 'space-between' : 'center',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      padding: isMobile ? '3px 6px' : '4px 8px',
                      borderRadius: '4px',
                      fontSize: isMobile ? '10px' : '12px',
                      fontWeight: '500',
                      background: isAvailable ? '#d1fae5' : '#fee2e2',
                      color: isAvailable ? '#10b981' : '#ef4444',
                      whiteSpace: 'nowrap'
                    }}>
                      {isAvailable ? 'Available' : 'Reserved'} {isMobile ? '' : 'for period'}
                    </span>
                    <div style={{ 
                      display: 'flex', 
                      gap: '4px',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => handleViewDetails(item, 'equipment')}
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: isMobile ? '4px 8px' : '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: isMobile ? '10px' : '12px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isMobile ? 'View' : 'View Details'}
                      </button>
                      <button
                        onClick={() => handleSendToMaintenance(item)}
                        style={{
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          padding: isMobile ? '4px 8px' : '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: isMobile ? '10px' : '12px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isMobile ? '🔧' : '🔧 Maintenance'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" style={{
            textAlign: 'center',
            padding: isMobile ? '32px 16px' : '48px 24px',
            color: '#6b7280'
          }}>
            <div className="icon" style={{ fontSize: isMobile ? '32px' : '48px', marginBottom: '16px' }}>🔧</div>
            <p style={{ fontSize: isMobile ? '14px' : '16px', margin: '0 0 8px 0' }}>No {title.toLowerCase()} found</p>
            <small style={{ fontSize: isMobile ? '12px' : '14px' }}>Try adjusting your search criteria</small>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="main-content">
          <div className="welcome-section">
            <h2 style={{ fontSize: isMobile ? '18px' : '24px' }}>Loading Inventory...</h2>
            <p style={{ fontSize: isMobile ? '12px' : '14px' }}>Please wait while we load your inventory data.</p>
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
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? '16px' : '12px'
          }}>
            <div>
              <h2 style={{ 
                fontSize: isMobile ? '18px' : '24px',
                margin: 0
              }}>
                Inventory Management
              </h2>
              <p style={{ 
                fontSize: isMobile ? '12px' : '14px',
                margin: '4px 0 0 0',
                display: isMobile ? 'none' : 'block'
              }}>
                Track and manage your LED screens, laptops, video processors, and cables.
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: isMobile ? '8px' : '12px',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button 
                onClick={handleAddItem}
                className="action-button primary"
                style={{ 
                  marginBottom: '0',
                  fontSize: isMobile ? '12px' : '14px',
                  padding: isMobile ? '8px 12px' : '12px 16px'
                }}
              >
                ➕ {isMobile ? 'Add' : 'Add Item'}
              </button>
              <button 
                onClick={exportInventoryData}
                className="action-button secondary"
                style={{ 
                  marginBottom: '0',
                  fontSize: isMobile ? '12px' : '14px',
                  padding: isMobile ? '8px 12px' : '12px 16px'
                }}
              >
                📊 {isMobile ? 'Export' : 'Export CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" style={{ 
            marginBottom: '20px',
            fontSize: isMobile ? '12px' : '14px',
            padding: isMobile ? '8px 12px' : '12px 16px'
          }}>
            {error}
          </div>
        )}

        {/* Date Range Selection */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 style={{ fontSize: isMobile ? '14px' : '18px' }}>📅 Check Availability for Period</h3>
          </div>
          <div className="card-content">
            <div className="form-row" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: isMobile ? '12px' : '16px'
            }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>Start Date:</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateRange.start_date}
                  onChange={(e) => handleDateRangeChange('start_date', e.target.value)}
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>End Date:</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateRange.end_date}
                  onChange={(e) => handleDateRangeChange('end_date', e.target.value)}
                  min={dateRange.start_date}
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>Period Duration:</label>
                <p style={{ 
                  margin: '8px 0', 
                  padding: isMobile ? '6px 8px' : '8px 12px', 
                  background: '#f3f4f6', 
                  borderRadius: '4px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '500'
                }}>
                  {Math.ceil((new Date(dateRange.end_date) - new Date(dateRange.start_date)) / (1000 * 60 * 60 * 24)) + 1} days
                </p>
              </div>
            </div>
            <div style={{ 
              padding: isMobile ? '8px' : '12px', 
              background: '#eff6ff', 
              borderRadius: '6px', 
              fontSize: isMobile ? '12px' : '14px', 
              color: '#1e40af',
              marginTop: '12px',
              lineHeight: '1.4'
            }}>
              💡 <strong>Checking availability from {new Date(dateRange.start_date).toLocaleDateString()} to {new Date(dateRange.end_date).toLocaleDateString()}</strong>
              <br />All availability numbers below reflect this specific time period.
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" style={{ 
          marginBottom: '32px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '12px' : '16px'
        }}>
          <div className="stat-card" style={{ padding: isMobile ? '12px' : '16px' }}>
            <h3 style={{ fontSize: isMobile ? '12px' : '14px', margin: '0 0 8px 0' }}>LED Screens</h3>
            <div className="value" style={{ fontSize: isMobile ? '18px' : '24px' }}>
              {inventoryStats.screens.available} / {inventoryStats.screens.total} m²
            </div>
            <small style={{ color: '#6b7280', fontSize: isMobile ? '10px' : '12px' }}>Available / Total</small>
          </div>
          <div className="stat-card" style={{ padding: isMobile ? '12px' : '16px' }}>
            <h3 style={{ fontSize: isMobile ? '12px' : '14px', margin: '0 0 8px 0' }}>Laptops</h3>
            <div className="value" style={{ fontSize: isMobile ? '18px' : '24px' }}>
              {inventoryStats.laptops.available} / {inventoryStats.laptops.total}
            </div>
            <small style={{ color: '#6b7280', fontSize: isMobile ? '10px' : '12px' }}>Available / Total</small>
          </div>
          <div className="stat-card" style={{ padding: isMobile ? '12px' : '16px' }}>
            <h3 style={{ fontSize: isMobile ? '12px' : '14px', margin: '0 0 8px 0' }}>
              {isMobile ? 'Processors' : 'Video Processors'}
            </h3>
            <div className="value" style={{ fontSize: isMobile ? '18px' : '24px' }}>
              {inventoryStats.processors.available} / {inventoryStats.processors.total}
            </div>
            <small style={{ color: '#6b7280', fontSize: isMobile ? '10px' : '12px' }}>Available / Total</small>
          </div>
          <div className="stat-card" style={{ padding: isMobile ? '12px' : '16px' }}>
            <h3 style={{ fontSize: isMobile ? '12px' : '14px', margin: '0 0 8px 0' }}>Cables</h3>
            <div className="value" style={{ fontSize: isMobile ? '18px' : '24px' }}>
              {inventoryStats.cables.available} / {inventoryStats.cables.total}
            </div>
            <small style={{ color: '#6b7280', fontSize: isMobile ? '10px' : '12px' }}>Available / Total</small>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '24px', overflowX: 'auto' }}>
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid #e5e7eb',
            gap: '0',
            minWidth: 'fit-content'
          }}>
            {[
              { id: 'screens', label: isMobile ? '📺 Screens' : '📺 LED Screens', icon: '📺' },
              { id: 'laptops', label: isMobile ? '💻 Laptops' : '💻 Laptops', icon: '💻' },
              { id: 'processors', label: isMobile ? '🖥️ Proc.' : '🖥️ Video Processors', icon: '🖥️' },
              { id: 'cables', label: isMobile ? '🔌 Cables' : '🔌 Cables', icon: '🔌' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: isMobile ? '8px 12px' : '12px 24px',
                  border: 'none',
                  background: activeTab === tab.id ? 'white' : 'transparent',
                  borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  fontSize: isMobile ? '12px' : '14px',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 style={{ fontSize: isMobile ? '14px' : '18px' }}>🔍 Filters & Search</h3>
          </div>
          <div className="card-content">
            <div className="form-row" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: isMobile ? '12px' : '16px'
            }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>Search:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={isMobile ? "Search..." : "Search by name, model, serial number..."}
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: isMobile ? '12px' : '14px' }}>Status:</label>
                <select
                  className="form-input"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                >
                  <option value="">All Status</option>
                  {activeTab === 'screens' ? (
                    <>
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                    </>
                  ) : (
                    <>
                      <option value="available">Available</option>
                      <option value="assigned">Reserved</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="damaged">Damaged</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                fontSize: isMobile ? '12px' : '14px',
                gap: '8px'
              }}>
                <input
                  type="checkbox"
                  checked={filters.available_only}
                  onChange={(e) => setFilters(prev => ({ ...prev, available_only: e.target.checked }))}
                />
                {isMobile ? 'Available only' : 'Show only available items for selected period'}
              </label>
            </div>
          </div>
        </div>

        {/* Inventory Content */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: isMobile ? '14px' : '18px' }}>
              {activeTab === 'screens' && (isMobile ? '📺 Screens' : '📺 LED Screens')}
              {activeTab === 'laptops' && '💻 Laptops'}
              {activeTab === 'processors' && (isMobile ? '🖥️ Processors' : '🖥️ Video Processors')}
              {activeTab === 'cables' && '🔌 Cables'}
              <span style={{ 
                fontSize: isMobile ? '10px' : '14px', 
                color: '#6b7280', 
                fontWeight: 'normal', 
                marginLeft: '8px',
                display: isMobile ? 'block' : 'inline'
              }}>
                ({new Date(dateRange.start_date).toLocaleDateString()} - {new Date(dateRange.end_date).toLocaleDateString()})
              </span>
            </h3>
          </div>
          <div className="card-content">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddInventoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleItemAdded}
        activeTab={activeTab}
      />

      <InventoryDetailsModal
        isOpen={showDetailsModal}
        item={selectedItem}
        onClose={() => setShowDetailsModal(false)}
        onUpdate={loadInventoryData}
      />
       
      <MaintenanceModal
        isOpen={showMaintModal}
        item={maintItem}
        onClose={() => setShowMaintModal(false)}
        onSubmit={submitMaintenance}
      />
    </div>
  );
};

export default InventoryView;