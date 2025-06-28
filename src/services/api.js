import axios from 'axios';

// const API_BASE_URL = 'http://localhost:3000/api/v1';
const API_BASE_URL= 'https://lobster-app-dolxs.ondigitalocean.app/api/v1'
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sessionToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sessionToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth endpoints
  login: async (credentials) => {
    const response = await api.post('/auth/login', { user: credentials });
    return response.data;
  },
  getEquipmentAvailabilityForDates: async (startDate, endDate) => {
  const response = await api.get('/equipment/availability_for_dates', {
    params: { start_date: startDate, end_date: endDate }
  });
  return response.data;
},


  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Orders endpoints
  getOrders: async (filters = {}) => {
    const response = await api.get('/orders', { params: filters });
    return response.data;
  },

  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  updateOrder: async (id, fullData) => {
  const response = await api.put(`/orders/${id}`, fullData);
  return response.data;
},
payOrder: async (id, amount) => {
    const res = await api.patch(`/orders/${id}/pay`, { amount });
    return res.data;
  },

createScreenMaintenance: async (screenInventoryId, maintenanceData) => {
  const response = await api.post(
    `/screen_inventories/${screenInventoryId}/maintenances`,
    { screen_maintenance: maintenanceData }
  );
  return response.data;
},
getLocationSuggestions: async (query) => {
  const response = await api.get('/orders/location_suggestions', {
    params: { q: query }
  });
  return response.data;
},
getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.patch('/auth/change_password', { password_change: passwordData });
    return response.data;
  },
  getUsers: async (filters = {}) => {
  const response = await api.get('/users', { params: filters });
  return response.data;
},

getUser: async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
},

createUser: async (userData) => {
  const response = await api.post('/users/create_employee', {employee: userData });
  return response.data;
},

createEmployee: async (employeeData) => {
  const response = await api.post('/employees', { employee: employeeData });
  return response.data;
},

updateUser: async (id, userData) => {
  const response = await api.put(`/users/${id}`, { user: userData });
  return response.data;
},

activateUser: async (id) => {
  const response = await api.patch(`/users/${id}/activate`);
  return response.data;
},

deactivateUser: async (id) => {
  const response = await api.patch(`/users/${id}/deactivate`);
  return response.data;
},

resetUserPassword: async (id) => {
  const response = await api.patch(`/users/${id}/reset_password`);
  return response.data;
},

  confirmOrder: async (id) => {
    const response = await api.patch(`/orders/${id}/confirm`);
    return response.data;
  },

  completeOrder: async (id) => {
    const response = await api.patch(`/orders/${id}/complete`);
    return response.data;
  },

  cancelOrder: async (id) => {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data;
  },

  getCalendarData: async (startDate, endDate) => {
    const response = await api.get('/orders/calendar', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Employees endpoints
  getEmployees: async (filters = {}) => {
    const response = await api.get('/employees', { params: filters });
    return response.data;
  },

  createEmployee: async (employeeData) => {
    const response = await api.post('/employees', { employee: employeeData });
    return response.data;
  },

  getEmployeeAvailability: async (startDate, endDate) => {
    const response = await api.get('/employees/availability', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Companies endpoints
  getCompanies: async (filters = {}) => {
    const response = await api.get('/companies', { params: filters });
    return response.data;
  },

  createCompany: async (companyData) => {
    const response = await api.post('/companies', { company: companyData });
    return response.data;
  },
  updateCompany: async (companyId, companyData) => {
  const response = await api.put(`/companies/${companyId}`, { company: companyData });
  return response.data;
},

getCompany: async (companyId) => {
  const response = await api.get(`/companies/${companyId}`);
  return response.data;
},


deleteCompany: async (companyId) => {
  const response = await api.delete(`/companies/${companyId}`);
  return response.data;
},

getCompanyStats: async () => {
  const response = await api.get('/companies/stats');
  return response.data;
},
  // Screen Inventory endpoints
  getScreenInventory: async (filters = {}) => {
    const response = await api.get('/screen_inventory', { params: filters });
    return response.data;
  },

  getScreenInventoryItem: async (id) => {
    const response = await api.get(`/screen_inventory/${id}`);
    return response.data;
  },

  createScreenInventory: async (screenData) => {
    const response = await api.post('/screen_inventory', { screen_inventory: screenData });
    return response.data;
  },

  updateScreenInventory: async (id, screenData) => {
    const response = await api.put(`/screen_inventory/${id}`, { screen_inventory: screenData });
    return response.data;
  },

  getScreenAvailability: async (startDate, endDate, requiredSqm, pixelPitch) => {
    const response = await api.get('/screen_inventory/availability', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        required_sqm: requiredSqm,
        pixel_pitch: pixelPitch 
      }
    });
    return response.data;
  },
  

  // NEW: Get screen availability for specific date range (for CreateOrderModal)
  getScreenAvailabilityForDates: async (params) => {
    const response = await api.get('/screen_inventory/availability', { params });
    return response.data;
  },

  // Equipment endpoints
  getEquipment: async (filters = {}) => {
    const response = await api.get('/equipment', { params: filters });
    return response.data;
  },

  getEquipmentItem: async (id) => {
    const response = await api.get(`/equipment/${id}`);
    return response.data;
  },

  createEquipment: async (equipmentData) => {
    const response = await api.post('/equipment', { equipment: equipmentData });
    return response.data;
  },

  updateEquipment: async (id, equipmentData) => {
    const response = await api.put(`/equipment/${id}`, { equipment: equipmentData });
    return response.data;
  },

  getEquipmentAvailability: async () => {
    const response = await api.get('/equipment/availability');
    return response.data;
  },

  // Finance endpoints
  getFinanceOverview: async (month, year) => {
    const response = await api.get('/finance/overview', {
      params: { month, year }
    });
    return response.data;
  },

  getMonthlyComparison: async () => {
    const response = await api.get('/finance/monthly_comparison');
    return response.data;
  },

  // Expenses endpoints
  getExpenses: async (filters = {}) => {
    const response = await api.get('/expenses', { params: filters });
    return response.data;
  },

  createExpense: async (expenseData) => {
    const response = await api.post('/expenses', { expense: expenseData });
    return response.data;
  },

  getExpenseSummary: async (month, year) => {
    const response = await api.get('/expenses/summary', {
      params: { month, year }
    });
    return response.data;
  }
};

export default api;
