import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './components/Auth/AuthProvider';
import Dashboard from './components/Dashboard/Dashboard';
import AuthPage from './components/Auth/AuthPage';
import websocketService from './services/websocketService';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" replace />;
};

// Main App Content
const AppContent = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize WebSocket connection when user is authenticated
    if (user) {
      websocketService.connect()
        .then(() => {
          console.log('WebSocket connected successfully');
          // Request initial data
          websocketService.requestSignals();
          websocketService.requestPortfolio();
        })
        .catch(error => {
          console.error('WebSocket connection failed:', error);
        });
    } else {
      // Disconnect WebSocket when user logs out
      websocketService.disconnect();
    }

    return () => {
      // Cleanup on unmount
      websocketService.disconnect();
    };
  }, [user]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/auth" 
            element={user ? <Navigate to="/" replace /> : <AuthPage />} 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="*" 
            element={<Navigate to={user ? "/" : "/auth"} replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <ThemeContextProvider>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeContextProvider>
  );
}

export default App;