import { createContext } from 'react';
import { User } from '@/types';

/**
 * Tipo de contexto para la autenticación de usuarios
 * @interface AuthContextType
 */
export interface AuthContextType {
  /** Usuario actualmente autenticado o null si no hay sesión activa */
  user: User | null;
  /** Función para iniciar sesión con credenciales de usuario */
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  /** Función para cerrar sesión y limpiar datos del usuario */
  logout: () => void;
  /** Estado booleano que indica si el usuario está autenticado */
  isAuthenticated: boolean;
  /** Estado booleano que indica si se está procesando una operación de autenticación */
  isLoading: boolean;
}

/**
 * Contexto de React para manejar el estado de autenticación global
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);