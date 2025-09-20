import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'

// Registrar Service Worker para funcionalidades offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Importar funciones de testing para desarrollo
import './utils/testEmotionAnalysis'
import loggingService from './services/LoggingService'

// Exponer servicios globalmente para testing en desarrollo
if (import.meta.env.DEV) {
  (window as any).LoggingService = loggingService;
  console.log('🔧 Modo desarrollo: LoggingService disponible globalmente');
  
  // Generar log inicial
  loggingService.info('Aplicación iniciada en modo desarrollo', 'Development');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
