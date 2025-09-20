import { useContext } from 'react';
import { AuthContext, AuthContextType } from './auth-context';

/**
 * Hook personalizado para acceder al contexto de autenticación
 * Debe ser usado dentro de un AuthProvider para funcionar correctamente
 * 
 * @function useAuth
 * @returns {AuthContextType} Objeto con el estado y funciones de autenticación
 * @throws {Error} Si se usa fuera de un AuthProvider
 * 
 * @example
 * ```tsx
 * function LoginComponent() {
 *   const { user, login, logout, isAuthenticated, isLoading } = useAuth();
 *   
 *   if (isLoading) return <div>Cargando...</div>;
 *   
 *   if (isAuthenticated) {
 *     return (
 *       <div>
 *         <p>Bienvenido, {user?.username}</p>
 *         <button onClick={logout}>Cerrar Sesión</button>
 *       </div>
 *     );
 *   }
 *   
 *   return <LoginForm onLogin={login} />;
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}