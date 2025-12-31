import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import SharedFilePage from './pages/SharedFilePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ToastContainer from './components/common/ToastContainer';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Créer le client React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, fetchUser]);

  return <>{children}</>;
}

// Composant pour initialiser et synchroniser le thème avec le DOM
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    // Appliquer le thème au DOM à chaque changement
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    
    // Mettre à jour le meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#000000' : '#f9fafb');
    }
  }, [theme]);

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthInitializer>
          <BrowserRouter>
            <Routes>
              {/* Redirection racine vers login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Toast notifications */}
            
            {/* Routes publiques */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/share/:token" element={<SharedFilePage />} />
            
            {/* Routes protégées */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        {/* Toast notifications - en dehors du router pour être toujours visible */}
        <ToastContainer />
      </AuthInitializer>
    </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
