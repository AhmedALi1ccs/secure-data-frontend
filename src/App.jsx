import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CalendarView from './components/CalendarView';
import InventoryView from './components/InventoryView';
import OrdersView from './components/OrdersView';
import UserManagementView from './components/UserManagementView';
import { useEffect } from 'react';
import ThirdCompanies from './components/ThirdCompanies';
import FinancialOverview from './components/FinancialOverview';
import ExpensesView from './components/ExpensesView';

const MainApp = () => {
  const { user, loading } = useAuth();
  const { view }          = useParams();               // grabs "calendar", "inventory", etc.
  const navigate         = useNavigate();
  const currentView       = view || 'dashboard';      
  useEffect(() => {
    if (user?.role === 'user' || user?.role === 'viewer' && view !== 'calendar') {
      navigate('/calendar', { replace: true });
    }
  }, [user, view, navigate]);


  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'calendar':
        return <CalendarView />;
      case 'inventory':
        return <InventoryView />;
      case 'orders':
        return <OrdersView />;
        case 'finance':
          return <FinancialOverview />;

        case 'expenses':
          return <ExpensesView />;
         case 'thirdcompanies':
          return <ThirdCompanies />;
        case 'users':
          return <UserManagementView />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
     <Layout
      currentView={currentView}
      onViewChange={newView => navigate(`/${newView}`)}  // push a new URL
    >
     {renderCurrentView()}
         </Layout>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
         <Route path="/:view" element={<ProtectedRoute><MainApp/></ProtectedRoute>} />
   
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
