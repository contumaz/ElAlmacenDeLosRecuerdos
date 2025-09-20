/**
 * Servicio de Autenticación para Electron API
 * Maneja login, logout y cambio de contraseñas
 */

import { AuthResponse } from '../types/electronTypes';
import loggingService from '../LoggingService';

export class AuthService {
  private electronAPI: any = null;

  constructor(electronAPI: any) {
    this.electronAPI = electronAPI;
  }

  /**
   * Verifica si Electron está disponible
   */
  isElectronAvailable(): boolean {
    return this.electronAPI !== null;
  }

  /**
   * Autentica un usuario
   */
  async authenticate(username: string, password: string): Promise<AuthResponse> {
    loggingService.info('Iniciando autenticación de usuario', 'AuthService', { username });
    
    if (!this.electronAPI) {
      // Simulación para modo web
      const mockUser = {
        id: 1,
        username,
        role: 'user',
        authenticated: true
      };
      
      localStorage.setItem('almacen_user', JSON.stringify(mockUser));
      localStorage.setItem('almacen_session_start', Date.now().toString());
      
      loggingService.info('Autenticación exitosa (modo web)', 'AuthService', { userId: mockUser.id });
      
      return {
        success: true,
        user: mockUser,
        token: 'mock_token_' + Date.now()
      };
    }
    
    try {
      const result = await this.electronAPI.security.authenticate({ username, password });
      if (result.success) {
        loggingService.info('Autenticación exitosa', 'AuthService', { userId: result.user?.id });
      } else {
        loggingService.warn('Fallo en autenticación', 'AuthService', { username, error: result.error });
      }
      return result;
    } catch (error) {
      console.error('Error en autenticación:', error);
      loggingService.error(
        'Error en proceso de autenticación', 
        error instanceof Error ? error : new Error('Error en proceso de autenticación'), 
        'AuthService', 
        {
          username,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      );
      return { success: false, error: 'Error de autenticación' };
    }
  }

  /**
   * Cambia la contraseña del usuario
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    loggingService.info('Iniciando cambio de contraseña', 'AuthService');
    
    if (!this.electronAPI) {
      // Simulación para modo web
      loggingService.info('Contraseña cambiada (modo web)', 'AuthService');
      return {
        success: true
      };
    }
    
    try {
      const result = await this.electronAPI.security.changePassword({ currentPassword, newPassword });
      if (result.success) {
        loggingService.info('Contraseña cambiada exitosamente', 'AuthService');
      } else {
        loggingService.warn('Fallo al cambiar contraseña', 'AuthService', { error: result.error });
      }
      return result;
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      loggingService.error(
        'Error cambiando contraseña', 
        error instanceof Error ? error : new Error('Error cambiando contraseña'), 
        'AuthService',
        {
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return { success: false, error: 'Error al cambiar contraseña' };
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  async logout(): Promise<AuthResponse> {
    loggingService.info('Cerrando sesión de usuario', 'AuthService');
    
    if (!this.electronAPI) {
      // Limpiar datos de sesión en modo web
      localStorage.removeItem('almacen_user');
      localStorage.removeItem('almacen_session_start');
      
      loggingService.info('Sesión cerrada (modo web)', 'AuthService');
      return {
        success: true
      };
    }
    
    try {
      const result = await this.electronAPI.security.logout();
      if (result.success) {
        loggingService.info('Sesión cerrada exitosamente', 'AuthService');
      }
      return result;
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      loggingService.error(
        'Error cerrando sesión', 
        error instanceof Error ? error : new Error('Error cerrando sesión'), 
        'AuthService'
      );
      return { success: false, error: 'Error al cerrar sesión' };
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    if (!this.electronAPI) {
      // Verificar en localStorage para modo web
      const user = localStorage.getItem('almacen_user');
      return !!user;
    }
    
    // En Electron, verificar con la API
    try {
      return this.electronAPI.security?.isAuthenticated() || false;
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      return false;
    }
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): any {
    if (!this.electronAPI) {
      // Obtener de localStorage para modo web
      const userStr = localStorage.getItem('almacen_user');
      return userStr ? JSON.parse(userStr) : null;
    }
    
    try {
      return this.electronAPI.security?.getCurrentUser() || null;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  }
}