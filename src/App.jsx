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

const MainApp = () => {
  const { user, loading } = useAuth();
  const { view }          = useParams();               // grabs "calendar", "inventory", etc.
  const navigate         = useNavigate();
  const currentView       = view || 'dashboard';      
  useEffect(() => {
    if (user?.role === 'user' && view !== 'calendar') {
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
        return (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-4">💰</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Finance & Reports</h2>
              <p className="text-gray-600 mb-4">Detailed financial reporting interface coming soon!</p>
              <p className="text-sm text-gray-500">For now, use the Dashboard to view basic revenue statistics.</p>
            </div>
          </div>
        );
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
