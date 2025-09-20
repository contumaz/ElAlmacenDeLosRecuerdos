/**
 * Servicio Principal de Electron API - Refactorizado
 * Orquesta todos los servicios especializados
 */

import { AuthService } from './auth/AuthService';
import { MemoryStorageService } from './storage/MemoryStorageService';
import { ImportExportService } from './import-export/ImportExportService';
import { AudioTranscriptionService } from './audio/AudioTranscriptionService';
import { BasicAIService } from './ai/BasicAIService';
import { SystemUtilsService } from './system/SystemUtilsService';
import { AuditBackupService } from './audit/AuditBackupService';
import loggingService from './LoggingService';

// Re-exportar tipos para compatibilidad
export type {
  MemoryData,
  UserConfig,
  AuthResponse,
  APIResponse
} from './types/electronTypes';

/**
 * Clase principal del servicio Electron API
 * Actúa como fachada para todos los servicios especializados
 */
export class ElectronService {
  // Servicios especializados
  public readonly auth: AuthService;
  public readonly storage: MemoryStorageService;
  public readonly importExport: ImportExportService;
  public readonly audio: AudioTranscriptionService;
  public readonly ai: BasicAIService;
  public readonly system: SystemUtilsService;
  public readonly auditBackup: AuditBackupService;

  private electronAPI: any = null;

  constructor() {
    // Verificar si estamos en un entorno Electron
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      this.electronAPI = (window as any).electronAPI;
      loggingService.info('Electron API detectada', 'ElectronService');
    } else {
      loggingService.warn('Electron API no disponible, usando modo web', 'ElectronService');
    }

    // Inicializar servicios especializados
    this.auth = new AuthService(this.electronAPI);
    this.storage = new MemoryStorageService(this.electronAPI);
    this.importExport = new ImportExportService(this.electronAPI);
    this.audio = new AudioTranscriptionService(this.electronAPI);
    this.ai = new BasicAIService(this.electronAPI);
    this.system = new SystemUtilsService(this.electronAPI);
    this.auditBackup = new AuditBackupService(this.electronAPI);

    loggingService.info('ElectronService inicializado', 'ElectronService', {
      isElectron: this.isElectronAvailable(),
      servicesCount: 7
    });
  }

  /**
   * Verifica si Electron está disponible
   */
  isElectronAvailable(): boolean {
    return this.electronAPI !== null;
  }

  /**
   * Obtiene información del entorno
   */
  getEnvironmentInfo() {
    return {
      isElectron: this.isElectronAvailable(),
      platform: this.isElectronAvailable() ? 'electron' : 'web',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Inicializa todos los servicios
   * Útil para verificar que todos los servicios estén funcionando correctamente
   */
  async initializeServices(): Promise<{
    auth: boolean;
    storage: boolean;
    importExport: boolean;
    audio: boolean;
    ai: boolean;
    system: boolean;
    auditBackup: boolean;
  }> {
    loggingService.info('Inicializando todos los servicios', 'ElectronService');

    const results = {
      auth: this.auth.isElectronAvailable(),
      storage: this.storage.isElectronAvailable(),
      importExport: this.importExport.isElectronAvailable(),
      audio: this.audio.isElectronAvailable(),
      ai: this.ai.isElectronAvailable(),
      system: this.system.isElectronAvailable(),
      auditBackup: this.auditBackup.isElectronAvailable()
    };

    loggingService.info('Servicios inicializados', 'ElectronService', results);
    return results;
  }

  /**
   * Obtiene el estado de salud de todos los servicios
   */
  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, { status: 'ok' | 'warning' | 'error'; message?: string }>;
    timestamp: string;
  }> {
    loggingService.info('Verificando estado de salud de servicios', 'ElectronService');

    const services: Record<string, { status: 'ok' | 'warning' | 'error'; message?: string }> = {};
    let healthyCount = 0;
    let totalCount = 0;

    // Verificar cada servicio
    const serviceChecks = [
      { name: 'auth', service: this.auth },
      { name: 'storage', service: this.storage },
      { name: 'importExport', service: this.importExport },
      { name: 'audio', service: this.audio },
      { name: 'ai', service: this.ai },
      { name: 'system', service: this.system },
      { name: 'auditBackup', service: this.auditBackup }
    ];

    for (const { name, service } of serviceChecks) {
      totalCount++;
      try {
        const isAvailable = service.isElectronAvailable();
        if (isAvailable) {
          services[name] = { status: 'ok', message: 'Servicio disponible' };
          healthyCount++;
        } else {
          services[name] = { status: 'warning', message: 'Funcionando en modo web' };
          healthyCount += 0.5; // Modo web cuenta como parcialmente saludable
        }
      } catch (error) {
        services[name] = { 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Error desconocido' 
        };
      }
    }

    // Determinar estado general
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    const healthRatio = healthyCount / totalCount;
    
    if (healthRatio >= 0.8) {
      overall = 'healthy';
    } else if (healthRatio >= 0.5) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    const result = {
      overall,
      services,
      timestamp: new Date().toISOString()
    };

    loggingService.info('Estado de salud verificado', 'ElectronService', {
      overall,
      healthyCount,
      totalCount,
      healthRatio
    });

    return result;
  }

  /**
   * Registra una acción en el log de auditoría
   * Método de conveniencia para logging de auditoría
   */
  async logAction(action: string, details: any, userId?: string) {
    return await this.auditBackup.logAuditEntry(action, details, userId);
  }

  /**
   * Método de limpieza para liberar recursos
   */
  cleanup() {
    loggingService.info('Limpiando recursos de ElectronService', 'ElectronService');
    // Aquí se pueden agregar operaciones de limpieza específicas si es necesario
  }

  /**
   * Obtiene estadísticas de uso de los servicios
   */
  getUsageStats() {
    return {
      isElectron: this.isElectronAvailable(),
      servicesInitialized: 7,
      environment: this.getEnvironmentInfo(),
      timestamp: new Date().toISOString()
    };
  }
}

// Crear y exportar instancia singleton
const electronService = new ElectronService();

// Exportar la instancia como default
export default electronService;

// La clase ElectronService ya está exportada arriba

// Mantener compatibilidad con el código existente exportando métodos individuales
// Estos son wrappers que delegan a los servicios especializados

// Métodos de autenticación
export const login = (username: string, password: string) =>
  electronService.auth.authenticate(username, password);

export const logout = () => 
  electronService.auth.logout();

export const changePassword = (currentPassword: string, newPassword: string) => 
  electronService.auth.changePassword(currentPassword, newPassword);

export const isAuthenticated = () => 
  electronService.auth.isAuthenticated();

// Métodos de almacenamiento de memorias
export const saveMemory = (memory: any) => 
  electronService.storage.saveMemory(memory);

export const loadMemories = (limit?: number, offset?: number) => 
  electronService.storage.loadMemories(limit, offset);

export const getMemoryCount = () =>
  electronService.storage.loadMemories().then(memories => memories.length);

export const getTotalMemoriesCount = () =>
  electronService.storage.getTotalMemoriesCount();

export const getMemoryById = (id: number) => 
  electronService.storage.getMemoryById(id);

export const deleteMemory = (id: number) => 
  electronService.storage.deleteMemory(id);

export const updateMemory = (memoryData: any) => 
  electronService.storage.updateMemory(memoryData);

// Métodos de importación/exportación
export const importData = (data: any) =>
  electronService.importExport.importData();

export const exportData = () => 
  electronService.importExport.exportData();

export const validateImportData = (data: any) => {
  // TODO: Implementar validación de datos de importación
  return { success: true, valid: true };
};

// Métodos de transcripción de audio
export const transcribeAudio = async (audioBlob: Blob, language?: string) => {
  // TODO: Convertir Blob a archivo temporal y transcribir
  return { success: false, error: 'Transcripción no implementada para Blob' };
};

export const startVoiceRecognition = (language?: string) =>
  electronService.audio.startVoiceRecognition();

export const stopVoiceRecognition = () => 
  electronService.audio.stopVoiceRecognition();

export const isVoiceRecognitionActive = () =>
  electronService.audio.getRecognitionStatus().isListening;

// Métodos de IA básica
export const analyzeEmotion = (text: string) => 
  electronService.ai.analyzeEmotion(text);

export const chatWithAI = async (message: string, context?: any) => {
  // TODO: Implementar chatWithAI en BasicAIService
  return { success: false, error: 'Método no implementado' };
};

export const generateQuestions = (topic: string, count?: number) =>
  electronService.ai.generateQuestions(topic, count || 5);

// Métodos del sistema
export const getPlatformInfo = () => 
  electronService.system.getPlatformInfo();

export const saveFile = (fileName: string, content: string, mimeType?: string) => 
  electronService.system.saveFile(fileName, content, mimeType);

export const quitApp = () => 
  electronService.system.quitApp();

// Métodos de auditoría y respaldo
export const logAuditEntry = (action: string, details: any, userId?: string) => 
  electronService.auditBackup.logAuditEntry(action, details, userId);

export const createBackup = (options?: any) => 
  electronService.auditBackup.createBackup(options);

export const restoreBackup = (backupPath: string) => 
  electronService.auditBackup.restoreBackup(backupPath);

// Log de inicialización
loggingService.info('Módulo electronAPI cargado y servicios inicializados', 'ElectronAPI', {
  isElectron: electronService.isElectronAvailable(),
  timestamp: new Date().toISOString()
});
