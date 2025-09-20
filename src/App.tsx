import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { useAuth } from '@/hooks/use-auth-hook';
import { MemoriesProvider } from '@/hooks/useMemories';
import { ThemeProvider } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import SafeDOMWrapper from '@/components/SafeDOMWrapper';
import { OfflineIndicator } from '@/components/OfflineIndicator';

// Lazy loading de páginas para optimización de bundle
const Login = React.lazy(() => import('@/pages/Login').then(module => ({ default: module.Login })));
const Dashboard = React.lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Memorias = React.lazy(() => import('@/pages/Memorias').then(module => ({ default: module.Memorias })));
const NuevaMemoria = React.lazy(() => import('@/pages/NuevaMemoria').then(module => ({ default: module.NuevaMemoria })));
const VerMemoria = React.lazy(() => import('@/pages/VerMemoria').then(module => ({ default: module.VerMemoria })));
const EditarMemoria = React.lazy(() => import('@/pages/EditarMemoria').then(module => ({ default: module.EditarMemoria })));
const Entrevistas = React.lazy(() => import('@/pages/Entrevistas').then(module => ({ default: module.Entrevistas })));
const RedesSociales = React.lazy(() => import('@/pages/RedesSociales').then(module => ({ default: module.RedesSociales })));
const Agenda = React.lazy(() => import('@/pages/Agenda'));
const Correo = React.lazy(() => import('@/pages/Correo'));
const WhatsApp = React.lazy(() => import('@/pages/WhatsApp'));
const Fotos = React.lazy(() => import('@/pages/Fotos'));
const Contactos = React.lazy(() => import('@/pages/Contactos'));
const Configuracion = React.lazy(() => import('@/pages/Configuracion').then(module => ({ default: module.Configuracion })));
const AnalisisEmocional = React.lazy(() => import('@/pages/AnalisisEmocional'));
const TestingDashboard = React.lazy(() => import('@/components/TestingDashboard').then(module => ({ default: module.default })));
const NotFound = React.lazy(() => import('@/components/NotFound').then(module => ({ default: module.NotFound })));

// Spinner de carga mejorado
function LoadingSpinner({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="text-center p-8">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-amber-200 rounded-full mx-auto mb-4"></div>
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2"></div>
        </div>
        <p className="text-amber-800 font-medium text-lg">{message}</p>
        <div className="mt-2 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

// Componente de carga para páginas específicas
function PageLoadingSpinner({ pageName }: { pageName: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="text-center p-8">
        <div className="relative">
          <div className="w-10 h-10 border-3 border-amber-200 rounded-full mx-auto mb-3"></div>
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 transform -translate-x-1/2"></div>
        </div>
        <p className="text-amber-800 font-medium">Cargando {pageName}...</p>
      </div>
    </div>
  );
}

// Componente de ruta protegida
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Todas las rutas en un solo lugar SIN provider anidado
function AllRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Router>
      <SafeDOMWrapper>
        <Routes>
          {/* Ruta de login */}
          <Route 
            path="/login" 
            element={
              isLoading ? (
                <LoadingSpinner message="Verificando autenticación..." />
              ) : isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Suspense fallback={<PageLoadingSpinner pageName="Login" />}>
                  <Login />
                </Suspense>
              )
            } 
          />
          
          {/* Todas las rutas protegidas con lazy loading optimizado */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Dashboard" />}>
                  <Dashboard />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/memorias" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Memorias" />}>
                  <Memorias />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/memorias/:tipo" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Memorias" />}>
                  <Memorias />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/memorias/nueva" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Nueva Memoria" />}>
                  <NuevaMemoria />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/memorias/:id" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Ver Memoria" />}>
                  <VerMemoria />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/memorias/:id/editar" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Editar Memoria" />}>
                  <EditarMemoria />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/entrevistas" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Entrevistas" />}>
                  <Entrevistas />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/redes-sociales" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Redes Sociales" />}>
                  <RedesSociales />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/agenda" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Agenda" />}>
                  <Agenda />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/correo" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Correo Electrónico" />}>
                  <Correo />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/whatsapp" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="WhatsApp" />}>
                  <WhatsApp />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/fotos" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Fotos" />}>
                  <Fotos />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/contactos" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Contactos" />}>
                  <Contactos />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/configuracion" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Configuración" />}>
                  <Configuracion />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/analisis-emocional" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Análisis Emocional" />}>
                  <AnalisisEmocional />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/testing" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoadingSpinner pageName="Testing Dashboard" />}>
                  <TestingDashboard />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={
            <Suspense fallback={<PageLoadingSpinner pageName="Página" />}>
              <NotFound />
            </Suspense>
          } />
        </Routes>
      </SafeDOMWrapper>
    </Router>
  );
}

// Componente App principal - MemoriesProvider en la RAÍZ
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MemoriesProvider>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner message="Inicializando aplicación..." />}>
                <AllRoutes />
                <OfflineIndicator />
              </Suspense>
            </ErrorBoundary>
          </MemoriesProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
