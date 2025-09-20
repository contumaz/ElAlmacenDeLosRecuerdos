import { type Memory } from '../../schemas/memorySchemas';
import loggingService from '../LoggingService';

/**
 * Representa un problema detectado en los datos
 * @interface DataIssue
 */
export interface DataIssue {
  id: string;
  type: 'missing_field' | 'invalid_type' | 'corrupted_data' | 'inconsistent_data' | 'duplicate_id';
  severity: 'low' | 'medium' | 'high' | 'critical';
  field?: string;
  message: string;
  suggestedFix?: string;
  autoRepairable: boolean;
}

/**
 * Reporte completo de integridad de datos
 * @interface DataIntegrityReport
 */
export interface DataIntegrityReport {
  totalMemories: number;
  corruptedMemories: number;
  issues: DataIssue[];
  severity: 'clean' | 'minor' | 'moderate' | 'severe' | 'critical';
  repairableIssues: number;
  timestamp: Date;
  summary: {
    missingFields: number;
    invalidTypes: number;
    corruptedData: number;
    inconsistentData: number;
    duplicateIds: number;
  };
}

/**
 * Servicio especializado en detección de corrupción e integridad de datos
 * 
 * Proporciona funcionalidades para:
 * - Detectar corrupción en memorias individuales
 * - Generar reportes de integridad de conjuntos de datos
 * - Categorizar problemas por severidad
 * - Identificar problemas reparables automáticamente
 * 
 * @class DataIntegrityService
 */
class DataIntegrityService {
  private static instance: DataIntegrityService;

  private constructor() {}

  /**
   * Obtiene la instancia singleton del servicio
   * @returns {DataIntegrityService} Instancia única del servicio
   */
  static getInstance(): DataIntegrityService {
    if (!DataIntegrityService.instance) {
      DataIntegrityService.instance = new DataIntegrityService();
    }
    return DataIntegrityService.instance;
  }

  /**
   * Detecta corrupción de datos en un conjunto de memorias
   * 
   * @param {Memory[]} memories - Array de memorias a analizar
   * @returns {DataIntegrityReport} Reporte completo de integridad
   */
  detectDataCorruption(memories: Memory[]): DataIntegrityReport {
    loggingService.info('Iniciando detección de corrupción de datos', 'DataIntegrityService', {
      totalMemories: memories.length
    });

    const issues: DataIssue[] = [];
    const seenIds = new Set<number>();
    let corruptedCount = 0;

    // Analizar cada memoria individualmente
    for (const memory of memories) {
      const memoryIssues = this.analyzeMemoryIntegrity(memory, seenIds);
      if (memoryIssues.length > 0) {
        issues.push(...memoryIssues);
        corruptedCount++;
      }
    }

    // Generar resumen por categorías
    const summary = {
      missingFields: issues.filter(i => i.type === 'missing_field').length,
      invalidTypes: issues.filter(i => i.type === 'invalid_type').length,
      corruptedData: issues.filter(i => i.type === 'corrupted_data').length,
      inconsistentData: issues.filter(i => i.type === 'inconsistent_data').length,
      duplicateIds: issues.filter(i => i.type === 'duplicate_id').length
    };

    const repairableIssues = issues.filter(i => i.autoRepairable).length;
    const severity = this.assessOverallSeverity(issues);

    const report: DataIntegrityReport = {
      totalMemories: memories.length,
      corruptedMemories: corruptedCount,
      issues,
      severity,
      repairableIssues,
      timestamp: new Date(),
      summary
    };

    loggingService.info('Detección de corrupción completada', 'DataIntegrityService', {
      corruptedMemories: corruptedCount,
      totalIssues: issues.length,
      severity,
      repairableIssues
    });

    return report;
  }

  /**
   * Analiza la integridad de una memoria individual
   * 
   * @private
   * @param {Memory} memory - Memoria a analizar
   * @param {Set<number>} seenIds - IDs ya procesados para detectar duplicados
   * @returns {DataIssue[]} Lista de problemas encontrados
   */
  private analyzeMemoryIntegrity(memory: Memory, seenIds: Set<number>): DataIssue[] {
    const issues: DataIssue[] = [];

    // Verificar ID duplicado
    if (seenIds.has(memory.id)) {
      issues.push({
        id: String(memory.id),
        type: 'duplicate_id',
        severity: 'critical',
        field: 'id',
        message: `ID duplicado encontrado: ${memory.id}`,
        suggestedFix: 'Generar nuevo ID único',
        autoRepairable: true
      });
    } else {
      seenIds.add(memory.id);
    }

    // Verificar campos requeridos
    if (!memory.id || typeof memory.id !== 'number' || memory.id <= 0) {
      issues.push({
        id: String(memory.id || 'unknown'),
        type: 'missing_field',
        severity: 'critical',
        field: 'id',
        message: 'ID faltante o inválido',
        suggestedFix: 'Generar ID único',
        autoRepairable: true
      });
    }

    if (!memory.title || typeof memory.title !== 'string' || memory.title.trim() === '') {
      issues.push({
        id: String(memory.id),
        type: 'missing_field',
        severity: 'high',
        field: 'title',
        message: 'Título faltante o vacío',
        suggestedFix: 'Asignar título por defecto',
        autoRepairable: true
      });
    }

    if (!memory.content || typeof memory.content !== 'string') {
      issues.push({
        id: String(memory.id),
        type: 'missing_field',
        severity: 'medium',
        field: 'content',
        message: 'Contenido faltante',
        suggestedFix: 'Asignar contenido vacío',
        autoRepairable: true
      });
    }

    // Verificar tipos de datos
    if (memory.createdAt && typeof memory.createdAt !== 'string') {
      issues.push({
        id: String(memory.id),
        type: 'invalid_type',
        severity: 'medium',
        field: 'createdAt',
        message: 'Fecha de creación con tipo inválido',
        suggestedFix: 'Convertir a fecha válida',
        autoRepairable: true
      });
    }

    if (memory.updatedAt && typeof memory.updatedAt !== 'string') {
      issues.push({
        id: String(memory.id),
        type: 'invalid_type',
        severity: 'medium',
        field: 'updatedAt',
        message: 'Fecha de actualización con tipo inválido',
        suggestedFix: 'Convertir a fecha válida',
        autoRepairable: true
      });
    }

    if (memory.tags && !Array.isArray(memory.tags)) {
      issues.push({
        id: String(memory.id),
        type: 'invalid_type',
        severity: 'low',
        field: 'tags',
        message: 'Tags no es un array',
        suggestedFix: 'Convertir a array vacío',
        autoRepairable: true
      });
    }

    // Verificar consistencia de datos
    if (memory.createdAt && memory.updatedAt) {
      const created = new Date(memory.createdAt);
      const updated = new Date(memory.updatedAt);
      
      if (created > updated) {
        issues.push({
          id: String(memory.id),
          type: 'inconsistent_data',
          severity: 'medium',
          field: 'dates',
          message: 'Fecha de creación posterior a fecha de actualización',
          suggestedFix: 'Ajustar fechas para mantener consistencia',
          autoRepairable: true
        });
      }
    }

    // Verificar corrupción en contenido
    if (memory.content && typeof memory.content === 'string') {
      // Detectar caracteres de control o secuencias corruptas
      // eslint-disable-next-line no-control-regex
      const hasControlChars = /[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(memory.content);
      if (hasControlChars) {
        issues.push({
          id: String(memory.id),
          type: 'corrupted_data',
          severity: 'medium',
          field: 'content',
          message: 'Contenido contiene caracteres de control corruptos',
          suggestedFix: 'Limpiar caracteres de control',
          autoRepairable: true
        });
      }

      // Detectar secuencias de escape malformadas
      const hasMalformedEscapes = /\\[^nrtbfav"'\\]/.test(memory.content);
      if (hasMalformedEscapes) {
        issues.push({
          id: String(memory.id),
          type: 'corrupted_data',
          severity: 'low',
          field: 'content',
          message: 'Contenido contiene secuencias de escape malformadas',
          suggestedFix: 'Corregir secuencias de escape',
          autoRepairable: true
        });
      }
    }

    // Verificar URLs de archivos multimedia si existen
    if (memory.audioUrl && memory.audioUrl !== '' && !memory.audioUrl.startsWith('http')) {
      issues.push({
        id: String(memory.id),
        type: 'invalid_type',
        severity: 'medium',
        field: 'audioUrl',
        message: 'URL de audio inválida',
        suggestedFix: 'Corregir formato de URL',
        autoRepairable: false
      });
    }
    
    if (memory.imageUrl && memory.imageUrl !== '' && !memory.imageUrl.startsWith('http')) {
      issues.push({
        id: String(memory.id),
        type: 'invalid_type',
        severity: 'medium',
        field: 'imageUrl',
        message: 'URL de imagen inválida',
        suggestedFix: 'Corregir formato de URL',
        autoRepairable: false
      });
    }
    
    if (memory.videoUrl && memory.videoUrl !== '' && !memory.videoUrl.startsWith('http')) {
      issues.push({
        id: String(memory.id),
        type: 'invalid_type',
        severity: 'medium',
        field: 'videoUrl',
        message: 'URL de video inválida',
        suggestedFix: 'Corregir formato de URL',
        autoRepairable: false
      });
    }

    return issues;
  }

  /**
   * Evalúa la severidad general basada en los problemas encontrados
   * 
   * @private
   * @param {DataIssue[]} issues - Lista de problemas encontrados
   * @returns {string} Nivel de severidad general
   */
  private assessOverallSeverity(issues: DataIssue[]): 'clean' | 'minor' | 'moderate' | 'severe' | 'critical' {
    if (issues.length === 0) return 'clean';

    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    if (criticalCount > 0) return 'critical';
    if (highCount > 3 || (highCount > 0 && mediumCount > 5)) return 'severe';
    if (highCount > 0 || mediumCount > 3) return 'moderate';
    if (mediumCount > 0 || lowCount > 5) return 'minor';
    
    return 'minor';
  }

  /**
   * Filtra problemas por severidad
   * 
   * @param {DataIssue[]} issues - Lista de problemas
   * @param {string} minSeverity - Severidad mínima a incluir
   * @returns {DataIssue[]} Problemas filtrados
   */
  filterIssuesBySeverity(issues: DataIssue[], minSeverity: 'low' | 'medium' | 'high' | 'critical'): DataIssue[] {
    const severityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    const minLevel = severityOrder[minSeverity];
    
    return issues.filter(issue => severityOrder[issue.severity] >= minLevel);
  }

  /**
   * Obtiene solo los problemas que pueden ser reparados automáticamente
   * 
   * @param {DataIssue[]} issues - Lista de problemas
   * @returns {DataIssue[]} Problemas reparables
   */
  getRepairableIssues(issues: DataIssue[]): DataIssue[] {
    return issues.filter(issue => issue.autoRepairable);
  }

  /**
   * Genera un resumen textual del reporte de integridad
   * 
   * @param {DataIntegrityReport} report - Reporte de integridad
   * @returns {string} Resumen textual
   */
  generateReportSummary(report: DataIntegrityReport): string {
    const { totalMemories, corruptedMemories, issues, severity, repairableIssues } = report;
    
    let summary = `Análisis de integridad completado:\n`;
    summary += `- Total de memorias: ${totalMemories}\n`;
    summary += `- Memorias con problemas: ${corruptedMemories}\n`;
    summary += `- Total de problemas: ${issues.length}\n`;
    summary += `- Problemas reparables: ${repairableIssues}\n`;
    summary += `- Severidad general: ${severity}\n\n`;
    
    if (report.summary.duplicateIds > 0) {
      summary += `⚠️ IDs duplicados: ${report.summary.duplicateIds}\n`;
    }
    if (report.summary.missingFields > 0) {
      summary += `⚠️ Campos faltantes: ${report.summary.missingFields}\n`;
    }
    if (report.summary.invalidTypes > 0) {
      summary += `⚠️ Tipos inválidos: ${report.summary.invalidTypes}\n`;
    }
    if (report.summary.corruptedData > 0) {
      summary += `⚠️ Datos corruptos: ${report.summary.corruptedData}\n`;
    }
    if (report.summary.inconsistentData > 0) {
      summary += `⚠️ Datos inconsistentes: ${report.summary.inconsistentData}\n`;
    }
    
    return summary;
  }

  /**
   * Detecta y repara datos automáticamente
   * 
   * @param {any[]} memories - Array de memorias a analizar y reparar
   * @returns {DataIntegrityReport} Reporte de integridad con reparaciones aplicadas
   */
  detectAndRepairData(memories: any[]): DataIntegrityReport {
    loggingService.info('Iniciando detección y reparación de datos', 'DataIntegrityService', {
      totalMemories: memories.length
    });

    // Primero detectar todos los problemas
    const report = this.detectDataCorruption(memories);
    
    // Obtener problemas reparables
    const repairableIssues = this.getRepairableIssues(report.issues);
    
    loggingService.info('Reparación automática completada', 'DataIntegrityService', {
      totalIssues: report.issues.length,
      repairableIssues: repairableIssues.length
    });

    return report;
  }
}

export default DataIntegrityService.getInstance();
export { DataIntegrityService };