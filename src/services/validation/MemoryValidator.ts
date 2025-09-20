import { z } from 'zod';
import {
  memorySchema,
  createMemorySchema,
  updateMemorySchema,
  userSchema,
  configSchema,
  mediaFileSchema,
  textInputSchema,
  tagSchema,
  encryptedDataSchema,
  type Memory,
  type CreateMemory,
  type UpdateMemory
} from '../../schemas/memorySchemas';
import loggingService from '../LoggingService';
import sanitizationService from './SanitizationService';

/**
 * Resultado de una operación de validación
 * @interface ValidationResult
 * @template T - Tipo de datos validados
 */
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
  warnings?: string[];
  sanitized?: boolean;
  metadata?: any;
}

/**
 * Interfaz para estadísticas de caché
 */
export interface CacheStats {
  size: number;
  ttl: number;
}

/**
 * Servicio especializado en validación de memorias
 * 
 * Proporciona funcionalidades para:
 * - Validación de memorias completas
 * - Validación de datos para crear memorias
 * - Validación de datos para actualizar memorias
 * - Validación de archivos multimedia
 * - Caché de validaciones para optimización
 * 
 * @class MemoryValidator
 */
class MemoryValidator {
  private static instance: MemoryValidator;
  private validationCache = new Map<string, ValidationResult>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  private constructor() {}

  /**
   * Obtiene la instancia singleton del servicio
   * @returns {MemoryValidator} Instancia única del servicio
   */
  static getInstance(): MemoryValidator {
    if (!MemoryValidator.instance) {
      MemoryValidator.instance = new MemoryValidator();
    }
    return MemoryValidator.instance;
  }

  /**
   * Valida una memoria completa usando el esquema definido
   * 
   * @param {unknown} memory - Objeto memoria a validar
   * @param {boolean} [useCache=true] - Si usar caché para optimizar validaciones repetidas
   * @returns {ValidationResult} Resultado de la validación con datos sanitizados
   */
  validateMemory(memory: unknown, useCache: boolean = true): ValidationResult {
    const cacheKey = useCache ? JSON.stringify(memory) : null;
    
    if (cacheKey && this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }
    
    loggingService.info('Iniciando validación de memoria', 'MemoryValidator', { 
      memoryId: (memory as any)?.id || 'unknown',
      useCache 
    });
    
    try {
      const result = memorySchema.safeParse(memory);
      
      if (result.success) {
        const sanitizedData = sanitizationService.sanitizeObject(result.data);
        const validationResult = {
          success: true,
          data: sanitizedData
        };
        
        if (cacheKey) {
          this.validationCache.set(cacheKey, validationResult);
        }
        
        loggingService.info('Validación de memoria exitosa', 'MemoryValidator', { 
          memoryId: sanitizedData.id 
        });
        
        return validationResult;
      }
      
      const errors = result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
      const validationResult = {
        success: false,
        errors
      };
      
      loggingService.warn('Validación de memoria falló', 'MemoryValidator', { 
        memoryId: (memory as any)?.id || 'unknown',
        errors 
      });
      
      return validationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const validationResult = {
        success: false,
        errors: [`Error de validación: ${errorMessage}`]
      };
      
      loggingService.error('Error durante validación de memoria', error instanceof Error ? error : new Error(errorMessage), 'MemoryValidator', { 
        memoryId: (memory as any)?.id || 'unknown' 
      });
      
      return validationResult;
    }
  }

  /**
   * Valida datos para crear una nueva memoria
   * 
   * @param {unknown} data - Datos de la nueva memoria a validar
   * @param {boolean} [sanitize=true] - Si aplicar sanitización automática
   * @returns {ValidationResult<CreateMemory>} Resultado con datos validados y sanitizados
   */
  validateCreateMemory(data: unknown, sanitize = true): ValidationResult<CreateMemory> {
    loggingService.info('Iniciando validación para crear memoria', 'MemoryValidator');
    
    try {
      const processedData = sanitize ? sanitizationService.sanitizeObject(data) : data;
      
      const result = createMemorySchema.safeParse(processedData);
      
      if (result.success) {
        loggingService.info('Validación para crear memoria exitosa', 'MemoryValidator');
        
        return {
          success: true,
          data: result.data,
          sanitized: sanitize
        };
      }
      
      const errors = result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
      loggingService.warn('Validación para crear memoria falló', 'MemoryValidator', { errors });
      
      return {
        success: false,
        errors,
        sanitized: sanitize
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      loggingService.error('Error durante validación para crear memoria', error instanceof Error ? error : new Error(errorMessage), 'MemoryValidator');
      
      return {
        success: false,
        errors: [`Error de validación: ${errorMessage}`]
      };
    }
  }

  /**
   * Valida datos para actualizar una memoria existente
   * 
   * @param {unknown} data - Datos de actualización a validar
   * @param {boolean} [sanitize=true] - Si aplicar sanitización automática
   * @returns {ValidationResult<UpdateMemory>} Resultado con datos validados y sanitizados
   */
  validateUpdateMemory(data: unknown, sanitize = true): ValidationResult<UpdateMemory> {
    loggingService.info('Iniciando validación para actualizar memoria', 'MemoryValidator', { 
      memoryId: (data as any)?.id || 'unknown' 
    });
    
    try {
      const processedData = sanitize ? sanitizationService.sanitizeObject(data) : data;
      
      const result = updateMemorySchema.safeParse(processedData);
      
      if (result.success) {
        loggingService.info('Validación para actualizar memoria exitosa', 'MemoryValidator', { 
          memoryId: result.data.id 
        });
        
        return {
          success: true,
          data: result.data,
          sanitized: sanitize
        };
      }
      
      const errors = result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
      loggingService.warn('Validación para actualizar memoria falló', 'MemoryValidator', { 
        memoryId: (data as any)?.id || 'unknown',
        errors 
      });
      
      return {
        success: false,
        errors,
        sanitized: sanitize
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      loggingService.error('Error durante validación para actualizar memoria', error instanceof Error ? error : new Error(errorMessage), 'MemoryValidator', { 
        memoryId: (data as any)?.id || 'unknown' 
      });
      
      return {
        success: false,
        errors: [`Error de validación: ${errorMessage}`]
      };
    }
  }

  /**
   * Valida un archivo multimedia
   * 
   * @param {unknown} file - Archivo a validar
   * @returns {ValidationResult} Resultado de la validación
   */
  validateMediaFile(file: unknown): ValidationResult {
    loggingService.info('Iniciando validación de archivo multimedia', 'MemoryValidator');
    
    try {
      const result = mediaFileSchema.safeParse(file);
      
      if (result.success) {
        // Validar tipo MIME vs extensión
        const fileName = result.data.name;
        const mimeType = result.data.type;
        const extension = fileName.split('.').pop()?.toLowerCase();
        
        if (extension && !this.isValidMimeTypeForExtension(extension, mimeType)) {
          return {
            success: false,
            errors: [`Tipo MIME ${mimeType} no válido para extensión .${extension}`]
          };
        }
        
        loggingService.info('Validación de archivo multimedia exitosa', 'MemoryValidator', {
          fileName: result.data.name,
          fileSize: result.data.size,
          mimeType: result.data.type
        });
        
        return {
          success: true,
          data: result.data
        };
      }
      
      const errors = result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
      loggingService.warn('Validación de archivo multimedia falló', 'MemoryValidator', { errors });
      
      return {
        success: false,
        errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      loggingService.error('Error durante validación de archivo multimedia', error instanceof Error ? error : new Error(errorMessage), 'MemoryValidator');
      
      return {
        success: false,
        errors: [`Error de validación: ${errorMessage}`]
      };
    }
  }

  /**
   * Valida si un tipo MIME es compatible con una extensión de archivo específica
   * 
   * @private
   * @param {string} extension - Extensión del archivo sin el punto
   * @param {string} mimeType - Tipo MIME del archivo
   * @returns {boolean} true si el tipo MIME es válido para la extensión
   */
  private isValidMimeTypeForExtension(extension: string, mimeType: string): boolean {
    const validMimeTypes: Record<string, string[]> = {
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'gif': ['image/gif'],
      'webp': ['image/webp'],
      'mp3': ['audio/mpeg', 'audio/mp3'],
      'wav': ['audio/wav', 'audio/wave'],
      'ogg': ['audio/ogg'],
      'mp4': ['video/mp4'],
      'webm': ['video/webm'],
      'avi': ['video/avi', 'video/x-msvideo']
    };
    
    return validMimeTypes[extension]?.includes(mimeType) || false;
  }

  /**
   * Valida texto de entrada
   */
  validateTextInput(text: unknown): ValidationResult<string> {
    loggingService.info('Iniciando validación de texto de entrada', 'MemoryValidator');
    
    try {
      const result = textInputSchema.safeParse(text);
      
      if (result.success) {
        const sanitizedText = sanitizationService.sanitizeText(result.data);
        
        loggingService.info('Validación de texto de entrada exitosa', 'MemoryValidator');
        
        return {
          success: true,
          data: sanitizedText,
          sanitized: true
        };
      }
      
      const errors = result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
      loggingService.warn('Validación de texto de entrada falló', 'MemoryValidator', { errors });
      
      return {
        success: false,
        errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      loggingService.error('Error durante validación de texto de entrada', error instanceof Error ? error : new Error(errorMessage), 'MemoryValidator');
      
      return {
        success: false,
        errors: [`Error de validación: ${errorMessage}`]
      };
    }
  }

  /**
   * Valida una etiqueta
   */
  validateTag(tag: unknown): ValidationResult<string> {
    loggingService.info('Iniciando validación de etiqueta', 'MemoryValidator');
    
    try {
      const result = tagSchema.safeParse(tag);
      
      if (result.success) {
        const sanitizedTag = sanitizationService.sanitizeText(result.data);
        
        loggingService.info('Validación de etiqueta exitosa', 'MemoryValidator');
        
        return {
          success: true,
          data: sanitizedTag,
          sanitized: true
        };
      }
      
      const errors = result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
      loggingService.warn('Validación de etiqueta falló', 'MemoryValidator', { errors });
      
      return {
        success: false,
        errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      loggingService.error('Error durante validación de etiqueta', error instanceof Error ? error : new Error(errorMessage), 'MemoryValidator');
      
      return {
        success: false,
        errors: [`Error de validación: ${errorMessage}`]
      };
    }
  }

  /**
   * Limpia completamente la caché de validación
   */
  clearCache(): void {
    this.validationCache.clear();
    loggingService.info('Caché de validación de memorias limpiada', 'MemoryValidator');
  }

  /**
   * Obtiene estadísticas de la caché
   */
  getCacheStats(): { size: number; ttl: number } {
    return {
      size: this.validationCache.size,
      ttl: this.CACHE_TTL
    };
  }
}

export default MemoryValidator.getInstance();
export { MemoryValidator };