import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { TeamProvider } from './hooks/useTeam';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import TeamPage from './pages/TeamPage';
import MetricsPage from './pages/MetricsPage';
import PersonalTasksPage from './pages/PersonalTasksPage';
import MessagingPage from './pages/MessagingPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <HomePage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
      <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/team/:id" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
      <Route path="/metrics/:id" element={<ProtectedRoute><MetricsPage /></ProtectedRoute>} />
      <Route path="/personal" element={<ProtectedRoute><PersonalTasksPage /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <TeamProvider>
            <ThemeProvider>
              <AppRoutes />
            </ThemeProvider>
          </TeamProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;