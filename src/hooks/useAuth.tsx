import { useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import electronService from '@/services/electronAPI';
import { AuthContext, AuthContextType } from './auth-context';

/**
 * Props para el componente AuthProvider
 * @interface AuthProviderProps
 */
interface AuthProviderProps {
  /** Componentes hijos que tendrán acceso al contexto de autenticación */
  children: ReactNode;
}

/**
 * Proveedor de contexto para la autenticación de usuarios
 * Maneja el estado global de autenticación y proporciona funciones para login/logout
 * 
 * @param {AuthProviderProps} props - Props del componente
 * @returns {JSX.Element} Proveedor de contexto con funcionalidad de autenticación
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Verifica el estado de autenticación del usuario al cargar la aplicación
   * Revisa si existe una sesión válida en localStorage y valida su expiración
   * 
   * @private
   * @async
   * @function checkAuthStatus
   * @returns {Promise<void>}
   */
  const checkAuthStatus = async () => {
    try {
      // Verificar si hay una sesión activa
      const storedUser = localStorage.getItem('almacen_user');
      const sessionExpiry = localStorage.getItem('almacen_session_expiry');
      
      if (storedUser && sessionExpiry) {
        const expiryTime = parseInt(sessionExpiry);
        const currentTime = Date.now();
        
        // Verificar si la sesión no ha expirado (24 horas por defecto)
        if (currentTime < expiryTime) {
          const userData = JSON.parse(storedUser);
          
          // Validar estructura del usuario
          if (userData.id && userData.username) {
            setUser(userData);
          } else {
            // Datos de usuario inválidos, limpiar sesión
            localStorage.removeItem('almacen_user');
            localStorage.removeItem('almacen_session_expiry');
          }
        } else {
          // Sesión expirada, limpiar datos
          localStorage.removeItem('almacen_user');
          localStorage.removeItem('almacen_session_expiry');
          console.log('Sesión expirada, redirigiendo al login');
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // En caso de error, limpiar datos posiblemente corruptos
      localStorage.removeItem('almacen_user');
      localStorage.removeItem('almacen_session_expiry');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Autentica al usuario con las credenciales proporcionadas
   * Utiliza la API de Electron para validar credenciales y establece la sesión
   * 
   * @async
   * @function login
   * @param {Object} credentials - Credenciales de usuario
   * @param {string} credentials.username - Nombre de usuario
   * @param {string} credentials.password - Contraseña del usuario
   * @returns {Promise<boolean>} True si el login fue exitoso, false en caso contrario
   * 
   * @example
   * ```tsx
   * const { login } = useAuth();
   * const success = await login({ username: 'user', password: 'pass' });
   * if (success) {
   *   console.log('Login exitoso');
   * }
   * ```
   */
  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Usar la API de Electron para autenticación (con fallback para web)
      const response = await electronService.auth.authenticate(credentials.username, credentials.password);
      
      if (response.success) {
        const userData: User = {
          id: response.user.id,
          username: response.user.username,
          email: `${response.user.username}@local.com`, // Email por defecto
          role: 'familiar', // Rol por defecto
          createdAt: new Date().toISOString() // Fecha actual
        };
        
        // Configurar expiración de sesión (24 horas)
        const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);
        
        setUser(userData);
        localStorage.setItem('almacen_user', JSON.stringify(userData));
        localStorage.setItem('almacen_session_expiry', sessionExpiry.toString());
        
        // Log de actividad de seguridad
        try {
          await electronService.logAction(`Login exitoso para usuario: ${credentials.username}`, { username: credentials.username });
        } catch (logError) {
          console.warn('No se pudo registrar la actividad de login:', logError);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cierra la sesión del usuario actual
   * Limpia todos los datos de sesión del localStorage y resetea el estado
   * 
   * @async
   * @function logout
   * @returns {Promise<void>}
   * 
   * @example
   * ```tsx
   * const { logout } = useAuth();
   * await logout();
   * ```
   */
  const logout = async () => {
    try {
      if (user) {
        try {
          await electronService.logAction(`Logout realizado por usuario: ${user.username}`, { username: user.username });
        } catch (logError) {
          console.warn('No se pudo registrar la actividad de logout:', logError);
        }
      }
      
      setUser(null);
      localStorage.removeItem('almacen_user');
      localStorage.removeItem('almacen_session_expiry');
      
      // Limpiar otros datos de la sesión si existen
      localStorage.removeItem('web_memories');
      localStorage.removeItem('app_config');
    } catch (error) {
      console.error('Logout error:', error);
      // Asegurar que se limpien los datos incluso si hay error
      setUser(null);
      localStorage.clear();
    }
  };

  /**
   * Valor del contexto de autenticación que se proporciona a los componentes hijos
   * @type {AuthContextType}
   */
  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
