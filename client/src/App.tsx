import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { ThemeProvider } from './theme';
import { ToastProvider } from './toast';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CreateEventoPage from './pages/CreateEventoPage';
import CreateSalaPage from './pages/CreateSalaPage';
import EventoReservaPage from './pages/EventoReservaPage';
import IngressoPublicoPage from './pages/IngressoPublicoPage';
import MeusIngressosPage from './pages/MeusIngressosPage';
import OrganizadorEventosPage from './pages/OrganizadorEventosPage';
import OrganizadorSalasPage from './pages/OrganizadorSalasPage';
import RegisterPage from './pages/RegisterPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/eventos/:id"
              element={
                <ProtectedRoute>
                  <EventoReservaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meus-ingressos"
              element={
                <ProtectedRoute>
                  <MeusIngressosPage />
                </ProtectedRoute>
              }
            />
            <Route path="/ingressos/:qrcode" element={<IngressoPublicoPage />} />
            <Route
              path="/organizador/eventos"
              element={
                <ProtectedRoute>
                  <OrganizadorEventosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizador/eventos/novo"
              element={
                <ProtectedRoute>
                  <CreateEventoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizador/eventos/:id/editar"
              element={
                <ProtectedRoute>
                  <CreateEventoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizador/salas"
              element={
                <ProtectedRoute>
                  <OrganizadorSalasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizador/salas/novo"
              element={
                <ProtectedRoute>
                  <CreateSalaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
