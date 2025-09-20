import { type Memory, type CreateMemory, type UpdateMemory } from '../schemas/memorySchemas';
import loggingService from './LoggingService';

// Importar servicios especializados
import sanitizationService from './validation/SanitizationService';
import memoryValidator from './validation/MemoryValidator';
import dataIntegrityService from './validation/DataIntegrityService';
import autoRepairService from './validation/AutoRepairService';

// Re-exportar tipos e interfaces de los módulos especializados
export type { ValidationResult } from './validation/MemoryValidator';
export type { DataIssue, DataIntegrityReport } from './validation/DataIntegrityService';
export type { RepairResult, BatchRepairResult } from './validation/AutoRepairService';

/**
 * Servicio principal de validación que orquesta todos los servicios especializados
 * 
 * Este servicio actúa como punto de entrada único para:
 * - Validación de memorias usando MemoryValidator
 * - Sanitización de datos usando SanitizationService
 * - Detección de integridad usando DataIntegrityService
 * - Reparación automática usando AutoRepairService
 * 
 * @class ValidationService
 * @example
 * ```typescript
 * // Validar una memoria
 * const result = validationService.validateMemory(memoryData);
 * if (result.success) {
 *   console.log('Memoria válida:', result.data);
 * } else {
 *   console.error('Errores:', result.errors);
 * }
 * 
 * // Detectar y reparar problemas
 * const report = validationService.detectAndRepairData(memories);
 * console.log(`Reparadas ${report.successfulRepairs} memorias`);
 * ```
 */
class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  /**
   * Obtiene la instancia singleton del servicio
   * @returns {ValidationService} Instancia única del servicio
   */
  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  // ============================================================================
  // MÉTODOS DE SANITIZACIÓN (delegados a SanitizationService)
  // ============================================================================

  /**
   * Sanitiza texto eliminando contenido peligroso y caracteres no deseados
   * 
   * @param {string} text - Texto a sanitizar
   * @returns {string} Texto sanitizado y seguro
   */
  sanitizeText(text: string): string {
    return sanitizationService.sanitizeText(text);
  }

  /**
   * Sanitiza un objeto recursivamente aplicando sanitización a todas las propiedades de texto
   * 
   * @param {any} obj - Objeto a sanitizar
   * @returns {any} Objeto sanitizado
   */
  sanitizeObject(obj: any): any {
    return sanitizationService.sanitizeObject(obj);
  }

  /**
   * Verifica si el contenido contiene elementos peligrosos
   * 
   * @param {string} content - Contenido a verificar
   * @returns {boolean} true si contiene contenido peligroso
   */
  containsDangerousContent(content: string): boolean {
    return sanitizationService.containsDangerousContent(content);
  }

  /**
   * Obtiene estadísticas de sanitización
   * 
   * @returns {object} Estadísticas de operaciones de sanitización
   */
  getSanitizationStats(): { totalOperations: number; dangerousContentBlocked: number; } {
    const stats = sanitizationService.getSanitizationStats({});
    return {
      totalOperations: stats.totalStrings,
      dangerousContentBlocked: stats.dangerousStrings
    };
  }

  // ============================================================================
  // MÉTODOS DE VALIDACIÓN DE MEMORIAS (delegados a MemoryValidator)
  // ============================================================================

  /**
   * Valida una memoria completa usando el esquema definido
   * 
   * @param {unknown} memory - Objeto memoria a validar
   * @param {boolean} [useCache=true] - Si usar caché para optimizar validaciones repetidas
   * @returns {ValidationResult} Resultado de la validación con datos sanitizados
   */
  validateMemory(memory: unknown, useCache: boolean = true): import('./validation/MemoryValidator').ValidationResult {
    return memoryValidator.validateMemory(memory, useCache);
  }

  /**
   * Valida datos para crear una nueva memoria
   * 
   * @param {unknown} data - Datos de la nueva memoria a validar
   * @param {boolean} [sanitize=true] - Si aplicar sanitización automática
   * @returns {ValidationResult<CreateMemory>} Resultado con datos validados y sanitizados
   */
  validateCreateMemory(data: unknown, sanitize = true): import('./validation/MemoryValidator').ValidationResult<CreateMemory> {
    return memoryValidator.validateCreateMemory(data, sanitize);
  }

  /**
   * Valida datos para actualizar una memoria existente
   * 
   * @param {unknown} data - Datos de actualización a validar
   * @param {boolean} [sanitize=true] - Si aplicar sanitización automática
   * @returns {ValidationResult<UpdateMemory>} Resultado con datos validados y sanitizados
   */
  validateUpdateMemory(data: unknown, sanitize = true): import('./validation/MemoryValidator').ValidationResult<UpdateMemory> {
    return memoryValidator.validateUpdateMemory(data, sanitize);
  }

  /**
   * Valida un archivo multimedia
   * 
   * @param {unknown} file - Archivo a validar
   * @returns {ValidationResult} Resultado de la validación
   */
  validateMediaFile(file: unknown): import('./validation/MemoryValidator').ValidationResult {
    return memoryValidator.validateMediaFile(file);
  }

  /**
   * Valida texto de entrada
   */
  validateTextInput(text: unknown): import('./validation/MemoryValidator').ValidationResult<string> {
    return memoryValidator.validateTextInput(text);
  }

  /**
   * Valida una etiqueta
   */
  validateTag(tag: unknown): import('./validation/MemoryValidator').ValidationResult<string> {
    return memoryValidator.validateTag(tag);
  }

  /**
   * Limpia la caché de validación
   */
  clearCache(): void {
    return memoryValidator.clearCache();
  }

  /**
   * Obtiene estadísticas de la caché de validación
   */
  getCacheStats(): import('./validation/MemoryValidator').CacheStats {
    return memoryValidator.getCacheStats();
  }

  // ============================================================================
  // MÉTODOS DE INTEGRIDAD DE DATOS (delegados a DataIntegrityService)
  // ============================================================================

  /**
   * Detecta y analiza datos corruptos en un conjunto de memorias
   * 
   * @param {any[]} memories - Array de memorias a analizar
   * @returns {DataIntegrityReport} Reporte completo de integridad
   */
  detectDataCorruption(memories: any[]): import('./validation/DataIntegrityService').DataIntegrityReport {
    return dataIntegrityService.detectDataCorruption(memories);
  }

  /**
   * Detecta y repara automáticamente problemas de integridad
   * 
   * @param {any[]} memories - Array de memorias a analizar y reparar
   * @returns {DataIntegrityReport} Reporte con reparaciones aplicadas
   */
  detectAndRepairData(memories: any[]): import('./validation/DataIntegrityService').DataIntegrityReport {
    return dataIntegrityService.detectAndRepairData(memories);
  }

  // ============================================================================
  // MÉTODOS DE REPARACIÓN AUTOMÁTICA (delegados a AutoRepairService)
  // ============================================================================

  /**
   * Intenta reparar automáticamente una memoria corrupta
   * 
   * @param {any} memory - Memoria corrupta a reparar
   * @returns {RepairResult} Resultado con la memoria reparada o errores
   */
  autoRepairMemory(memory: any, issues: any[]): import('./validation/AutoRepairService').RepairResult {
    return autoRepairService.autoRepairMemory(memory, issues);
  }

  /**
   * Repara múltiples memorias en lote
   * 
   * @param {any[]} memories - Array de memorias a reparar
   * @returns {BatchRepairResult} Resultado de la reparación en lote
   */
  batchRepairMemories(memoriesWithIssues: Array<{memory: any, issues: any[]}>): import('./validation/AutoRepairService').BatchRepairResult {
    return autoRepairService.batchRepairMemories(memoriesWithIssues);
  }


}

/**
 * Instancia singleton del servicio de validación
 * 
 * Actúa como orquestador principal que coordina todos los servicios de validación especializados:
 * - SanitizationService: Limpieza y sanitización de datos
 * - MemoryValidator: Validación específica de memorias
 * - DataIntegrityService: Detección de corrupción de datos
 * - AutoRepairService: Reparación automática de problemas
 * 
 * @example
 * ```typescript
 * import { validationService } from '@/services/ValidationService';
 * 
 * // Validación básica
 * const result = validationService.validateMemory(memoryData);
 * if (result.success) {
 *   console.log('Memoria válida:', result.data);
 * }
 * 
 * // Análisis de integridad
 * const report = validationService.detectDataCorruption(memories);
 * console.log(`Memorias corruptas: ${report.corruptedRecords}`);
 * 
 * // Reparación automática
 * const repairResult = validationService.autoRepairMemory(corruptedMemory);
 * if (repairResult.success) {
 *   console.log('Memoria reparada:', repairResult.data);
 * }
 * ```
 */
export const validationService = ValidationService.getInstance();

export default ValidationService.getInstance();