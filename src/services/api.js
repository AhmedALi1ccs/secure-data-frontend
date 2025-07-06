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
  deleteUser: async (id) => {
  const response = await api.delete(`/users/${id}`);
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
// Add these methods to your existing apiService object in api.js

// Enhanced Expenses Methods
updateExpense: async (id, expenseData) => {
  const response = await api.put(`/expenses/${id}`, { expense: expenseData });
  return response.data;
},

deleteExpense: async (id) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
},

// Recurring Expenses Methods  
updateRecurringExpense: async (id, expenseData) => {
  const response = await api.put(`/recurring_expenses/${id}`, {
    recurring_expense: expenseData
  });
  return response.data;
},

deleteRecurringExpense: async (id) => {
  const response = await api.delete(`/recurring_expenses/${id}`);
  return response.data;
},

generateRecurringExpenses: async (recurringExpenseId, month, year) => {
  const response = await api.post(`/recurring_expenses/${recurringExpenseId}/generate_expenses`, {
    month, year
  });
  return response.data;
},

// Equipment Maintenance Methods
createEquipmentMaintenance: async (equipmentId, maintenanceData) => {
  const response = await api.post(
    `/equipment/${equipmentId}/maintenances`,
    { equipment_maintenance: maintenanceData }
  );
  return response.data;
},

// Enhanced Finance Methods
getAccountsReceivable: async (filters = {}) => {
  const response = await api.get('/finance/accounts_receivable', { params: filters });
  return response.data;
},

getCashFlow: async (startDate, endDate) => {
  const response = await api.get('/finance/cash_flow', {
    params: { start_date: startDate, end_date: endDate }
  });
  return response.data;
},

getExpenseAnalytics: async (month, year) => {
  const response = await api.get('/finance/expense_analytics', {
    params: { month, year }
  });
  return response.data;
},

// Order Payment Methods
getOrderPayments: async (orderId) => {
  const response = await api.get(`/orders/${orderId}/payments`);
  return response.data;
},

createOrderPayment: async (orderId, paymentData) => {
  const response = await api.post(`/orders/${orderId}/payments`, {
    payment: paymentData
  });
  return response.data;
},

// Monthly Targets Enhanced
updateMonthlyTarget: async (id, targetData) => {
  const response = await api.put(`/monthly_targets/${id}`, {
    monthly_target: targetData
  });
  return response.data;
},

deleteMonthlyTarget: async (id) => {
  const response = await api.delete(`/monthly_targets/${id}`);
  return response.data;
},

getCurrentMonthTarget: async () => {
  const response = await api.get('/monthly_targets/current_month');
  return response.data;
},

// Financial Reports
getDetailedFinancialReport: async (startDate, endDate, includeBreakdown = true) => {
  const response = await api.get('/finance/detailed_report', {
    params: { 
      start_date: startDate, 
      end_date: endDate,
      include_breakdown: includeBreakdown
    }
  });
  return response.data;
},

exportProfitSharingReport: async (month, year) => {
  const response = await api.get('/finance/export_profit_sharing', {
    params: { month, year },
    responseType: 'text'
  });
  return response.data;
},

// Budget Planning
getBudgetComparison: async (year) => {
  const response = await api.get('/finance/budget_comparison', {
    params: { year }
  });
  return response.data;
},

// Tax and Compliance
getTaxSummary: async (year) => {
  const response = await api.get('/finance/tax_summary', {
    params: { year }
  });
  return response.data;
},

// Advanced Analytics
getRevenueProjection: async (months = 6) => {
  const response = await api.get('/finance/revenue_projection', {
    params: { months }
  });
  return response.data;
},

getExpenseTrends: async (months = 12) => {
  const response = await api.get('/finance/expense_trends', {
    params: { months }
  });
  return response.data;
},

getProfitabilityAnalysis: async (startDate, endDate) => {
  const response = await api.get('/finance/profitability_analysis', {
    params: { start_date: startDate, end_date: endDate }
  });
  return response.data;
},

// Client Financial Analysis
getClientFinancialSummary: async (filters = {}) => {
  const response = await api.get('/finance/client_summary', { params: filters });
  return response.data;
},

// Financial Settings
getFinancialSettings: async () => {
  const response = await api.get('/finance/settings');
  return response.data;
},

updateFinancialSettings: async (settingsData) => {
  const response = await api.patch('/finance/settings', {
    financial_setting: settingsData
  });
  return response.data;
},

// Cost Center Analysis
getCostCenterAnalysis: async (month, year) => {
  const response = await api.get('/finance/cost_center_analysis', {
    params: { month, year }
  });
  return response.data;
},

// Equipment ROI
getEquipmentROI: async () => {
  const response = await api.get('/finance/equipment_roi');
  return response.data;
},

// Financial Health Metrics
getFinancialHealthMetrics: async () => {
  const response = await api.get('/finance/health_metrics');
  return response.data;
},

// Financial Dashboard
getFinancialDashboardSummary: async () => {
  const response = await api.get('/finance/dashboard_summary');
  return response.data;
},

getFinancialOverview: async (month, year) => {
  return await api.get(`/finance/overview`, {
    params: { month, year }
  }).then(res => res.data);
}
,

getRevenueBreakdown: async (month, year) => {
  const response = await api.get('/finance/revenue_breakdown', {
    params: { month, year }
  });
  return response.data;
},

exportFinancialReport: async (startDate, endDate) => {
  const response = await api.get('/finance/export_financial_report', {
    params: { start_date: startDate, end_date: endDate },
    responseType: 'blob'  // 👈 this is crucial
  });
  return response.data;
}
,
// Monthly Targets
getMonthlyTargets: async (year) => {
  const response = await api.get('/monthly_targets', { params: { year } });
  return response.data;
},

setMonthlyTarget: async (month, year, targetData) => {
  const response = await api.post('/finance/set_monthly_target', {
    month, year, monthly_target: targetData
  });
  return response.data;
},

getRecurringExpenses: async (filters = {}) => {
  const response = await api.get('/recurring_expenses', { params: filters });
  return response.data;
},

createRecurringExpense: async (expenseData) => {
  const response = await api.post('/recurring_expenses', {
    recurring_expense: expenseData
  });
  return response.data;
},

generateAllRecurringExpenses: async (month, year) => {
  const response = await api.post('/recurring_expenses/generate_all_for_month', {
    month, year
  });
  return response.data;
},

// Enhanced Expenses
approveExpense: async (id) => {
  const response = await api.patch(`/expenses/${id}/approve`);
  return response.data;
},

rejectExpense: async (id) => {
  const response = await api.patch(`/expenses/${id}/reject`);
  return response.data;
},

getPendingExpenses: async () => {
  const response = await api.get('/expenses/pending_approval');
  return response.data;
},

// Profit Sharing
getProfitSharingSettings: async () => {
  const response = await api.get('/finance/profit_sharing_settings');
  return response.data;
},

updateProfitSharingSettings: async (financial_setting) => {
  return await api.patch(`/finance/profit_sharing_settings`, {
    financial_setting
  });
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
  return await api.get(`/finance/monthly_comparison`).then(res => res.data);
}
,

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
