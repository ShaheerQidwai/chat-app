import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthPage } from './pages/AuthPage';
import { ChatPage } from './pages/ChatPage';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={isAuthenticated ? <Navigate to="/chat" replace /> : <AuthPage />} 
      />
      <Route 
        path="/chat" 
        element={
          <ProtectedRoute>
            {isAuthenticated ? (
              <ChatProvider>
                <ChatPage />
              </ChatProvider>
            ) : (
              <Navigate to="/auth" replace />
            )}
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/chat" : "/auth"} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;