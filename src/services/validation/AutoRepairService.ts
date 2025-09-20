import { type Memory } from '../../schemas/memorySchemas';
import { type DataIssue } from './DataIntegrityService';
import loggingService from '../LoggingService';
import sanitizationService from './SanitizationService';

/**
 * Resultado de una operación de reparación automática
 * @interface RepairResult
 */
export interface RepairResult {
  success: boolean;
  repairedMemory?: Memory;
  appliedFixes: string[];
  remainingIssues: DataIssue[];
  errors?: string[];
}

/**
 * Resultado de reparación de múltiples memorias
 * @interface BatchRepairResult
 */
export interface BatchRepairResult {
  totalProcessed: number;
  successfulRepairs: number;
  failedRepairs: number;
  repairedMemories: Memory[];
  errors: string[];
  summary: {
    idsGenerated: number;
    titlesFixed: number;
    contentFixed: number;
    datesFixed: number;
    tagsFixed: number;
    corruptionCleaned: number;
  };
}

/**
 * Servicio especializado en reparación automática de memorias corruptas
 * 
 * Proporciona funcionalidades para:
 * - Reparar memorias individuales basándose en problemas detectados
 * - Reparación en lote de múltiples memorias
 * - Generación automática de IDs únicos
 * - Corrección de tipos de datos
 * - Limpieza de contenido corrupto
 * 
 * @class AutoRepairService
 */
class AutoRepairService {
  private static instance: AutoRepairService;

  private constructor() {}

  /**
   * Obtiene la instancia singleton del servicio
   * @returns {AutoRepairService} Instancia única del servicio
   */
  static getInstance(): AutoRepairService {
    if (!AutoRepairService.instance) {
      AutoRepairService.instance = new AutoRepairService();
    }
    return AutoRepairService.instance;
  }

  /**
   * Intenta reparar automáticamente una memoria corrupta
   * 
   * @param {Memory} memory - Memoria a reparar
   * @param {DataIssue[]} issues - Lista de problemas detectados
   * @returns {RepairResult} Resultado de la reparación
   */
  autoRepairMemory(memory: Memory, issues: DataIssue[]): RepairResult {
    loggingService.info('Iniciando reparación automática de memoria', 'AutoRepairService', {
      memoryId: memory.id,
      issuesCount: issues.length
    });

    const appliedFixes: string[] = [];
    const remainingIssues: DataIssue[] = [];
    let repairedMemory = { ...memory };

    try {
      // Procesar cada problema detectado
      for (const issue of issues) {
        if (issue.autoRepairable) {
          const fixResult = this.applyFix(repairedMemory, issue);
          if (fixResult.success) {
            repairedMemory = fixResult.repairedMemory!;
            appliedFixes.push(fixResult.appliedFix!);
          } else {
            remainingIssues.push(issue);
          }
        } else {
          remainingIssues.push(issue);
        }
      }

      // Aplicar sanitización final
      repairedMemory = sanitizationService.sanitizeObject(repairedMemory) as Memory;

      loggingService.info('Reparación automática completada', 'AutoRepairService', {
        memoryId: repairedMemory.id,
        appliedFixes: appliedFixes.length,
        remainingIssues: remainingIssues.length
      });

      return {
        success: true,
        repairedMemory,
        appliedFixes,
        remainingIssues
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      loggingService.error('Error durante reparación automática', error instanceof Error ? error : new Error(errorMessage), 'AutoRepairService', {
        memoryId: memory.id
      });

      return {
        success: false,
        appliedFixes,
        remainingIssues: issues,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Repara múltiples memorias en lote
   * 
   * @param {Array<{memory: Memory, issues: DataIssue[]}>} memoriesWithIssues - Memorias con sus problemas
   * @returns {BatchRepairResult} Resultado de la reparación en lote
   */
  batchRepairMemories(memoriesWithIssues: Array<{memory: Memory, issues: DataIssue[]}>): BatchRepairResult {
    loggingService.info('Iniciando reparación en lote', 'AutoRepairService', {
      totalMemories: memoriesWithIssues.length
    });

    const result: BatchRepairResult = {
      totalProcessed: memoriesWithIssues.length,
      successfulRepairs: 0,
      failedRepairs: 0,
      repairedMemories: [],
      errors: [],
      summary: {
        idsGenerated: 0,
        titlesFixed: 0,
        contentFixed: 0,
        datesFixed: 0,
        tagsFixed: 0,
        corruptionCleaned: 0
      }
    };

    for (const { memory, issues } of memoriesWithIssues) {
      const repairResult = this.autoRepairMemory(memory, issues);
      
      if (repairResult.success && repairResult.repairedMemory) {
        result.successfulRepairs++;
        result.repairedMemories.push(repairResult.repairedMemory);
        
        // Actualizar estadísticas
        this.updateRepairSummary(result.summary, repairResult.appliedFixes);
      } else {
        result.failedRepairs++;
        if (repairResult.errors) {
          result.errors.push(...repairResult.errors);
        }
      }
    }

    loggingService.info('Reparación en lote completada', 'AutoRepairService', {
      successfulRepairs: result.successfulRepairs,
      failedRepairs: result.failedRepairs
    });

    return result;
  }

  /**
   * Aplica una corrección específica a una memoria
   * 
   * @private
   * @param {Memory} memory - Memoria a corregir
   * @param {DataIssue} issue - Problema a corregir
   * @returns {object} Resultado de la aplicación de la corrección
   */
  private applyFix(memory: Memory, issue: DataIssue): { success: boolean; repairedMemory?: Memory; appliedFix?: string } {
    const repairedMemory = { ...memory };

    try {
      switch (issue.type) {
        case 'missing_field':
          return this.fixMissingField(repairedMemory, issue);
        
        case 'invalid_type':
          return this.fixInvalidType(repairedMemory, issue);
        
        case 'corrupted_data':
          return this.fixCorruptedData(repairedMemory, issue);
        
        case 'inconsistent_data':
          return this.fixInconsistentData(repairedMemory, issue);
        
        case 'duplicate_id':
          return this.fixDuplicateId(repairedMemory, issue);
        
        default:
          return { success: false };
      }
    } catch (error) {
      loggingService.error('Error aplicando corrección', error instanceof Error ? error : new Error('Error desconocido'), 'AutoRepairService', {
        memoryId: memory.id,
        issueType: issue.type
      });
      return { success: false };
    }
  }

  /**
   * Corrige campos faltantes
   * @private
   */
  private fixMissingField(memory: Memory, issue: DataIssue): { success: boolean; repairedMemory?: Memory; appliedFix?: string } {
    const repairedMemory = { ...memory };

    switch (issue.field) {
      case 'id':
        repairedMemory.id = this.generateUniqueId();
        return {
          success: true,
          repairedMemory,
          appliedFix: `Generado ID único: ${repairedMemory.id}`
        };
      
      case 'title':
        repairedMemory.title = 'Memoria sin título';
        return {
          success: true,
          repairedMemory,
          appliedFix: 'Asignado título por defecto'
        };
      
      case 'content':
        repairedMemory.content = '';
        return {
          success: true,
          repairedMemory,
          appliedFix: 'Asignado contenido vacío'
        };
      
      default:
        return { success: false };
    }
  }

  /**
   * Corrige tipos de datos inválidos
   * @private
   */
  private fixInvalidType(memory: Memory, issue: DataIssue): { success: boolean; repairedMemory?: Memory; appliedFix?: string } {
    const repairedMemory = { ...memory };

    switch (issue.field) {
      case 'createdAt':
        repairedMemory.createdAt = new Date().toISOString();
        return {
          success: true,
          repairedMemory,
          appliedFix: 'Corregida fecha de creación'
        };
      
      case 'updatedAt':
        repairedMemory.updatedAt = new Date().toISOString();
        return {
          success: true,
          repairedMemory,
          appliedFix: 'Corregida fecha de actualización'
        };
      
      case 'tags':
        repairedMemory.tags = [];
        return {
          success: true,
          repairedMemory,
          appliedFix: 'Convertido tags a array vacío'
        };
      
      default:
        return { success: false };
    }
  }

  /**
   * Corrige datos corruptos
   * @private
   */
  private fixCorruptedData(memory: Memory, issue: DataIssue): { success: boolean; repairedMemory?: Memory; appliedFix?: string } {
    const repairedMemory = { ...memory };

    if (issue.field === 'content' && typeof repairedMemory.content === 'string') {
      // Limpiar caracteres de control usando método más seguro
      repairedMemory.content = repairedMemory.content
        .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // eslint-disable-line no-control-regex
        .trim();
      
      // Corregir secuencias de escape malformadas
      repairedMemory.content = repairedMemory.content.replace(/\\([^nrtbfav"'\\])/g, '\\\\$1');
      
      return {
        success: true,
        repairedMemory,
        appliedFix: 'Limpiado contenido corrupto'
      };
    }

    return { success: false };
  }

  /**
   * Corrige datos inconsistentes
   * @private
   */
  private fixInconsistentData(memory: Memory, issue: DataIssue): { success: boolean; repairedMemory?: Memory; appliedFix?: string } {
    const repairedMemory = { ...memory };

    if (issue.field === 'dates' && repairedMemory.createdAt && repairedMemory.updatedAt) {
      // Si la fecha de creación es posterior a la de actualización, ajustar
      const created = new Date(repairedMemory.createdAt);
      const updated = new Date(repairedMemory.updatedAt);
      
      if (created > updated) {
        repairedMemory.updatedAt = new Date(created.getTime() + 1000).toISOString(); // 1 segundo después
        return {
          success: true,
          repairedMemory,
          appliedFix: 'Ajustadas fechas para mantener consistencia'
        };
      }
    }

    return { success: false };
  }

  /**
   * Corrige IDs duplicados
   * @private
   */
  private fixDuplicateId(memory: Memory, issue: DataIssue): { success: boolean; repairedMemory?: Memory; appliedFix?: string } {
    const repairedMemory = { ...memory };
    repairedMemory.id = this.generateUniqueId();
    
    return {
      success: true,
      repairedMemory,
      appliedFix: `Generado nuevo ID único: ${repairedMemory.id}`
    };
  }

  /**
   * Genera un ID único para una memoria
   * @private
   */
  private generateUniqueId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /**
   * Actualiza el resumen de reparaciones
   * @private
   */
  private updateRepairSummary(summary: BatchRepairResult['summary'], appliedFixes: string[]): void {
    for (const fix of appliedFixes) {
      if (fix.includes('ID único')) {
        summary.idsGenerated++;
      } else if (fix.includes('título')) {
        summary.titlesFixed++;
      } else if (fix.includes('contenido')) {
        summary.contentFixed++;
      } else if (fix.includes('fecha')) {
        summary.datesFixed++;
      } else if (fix.includes('tags')) {
        summary.tagsFixed++;
      } else if (fix.includes('corrupto')) {
        summary.corruptionCleaned++;
      }
    }
  }

  /**
   * Verifica si un problema puede ser reparado automáticamente
   * 
   * @param {DataIssue} issue - Problema a evaluar
   * @returns {boolean} true si puede ser reparado automáticamente
   */
  canAutoRepair(issue: DataIssue): boolean {
    return issue.autoRepairable && [
      'missing_field',
      'invalid_type',
      'corrupted_data',
      'inconsistent_data',
      'duplicate_id'
    ].includes(issue.type);
  }

  /**
   * Genera un reporte de las reparaciones realizadas
   * 
   * @param {BatchRepairResult} result - Resultado de reparación en lote
   * @returns {string} Reporte textual
   */
  generateRepairReport(result: BatchRepairResult): string {
    let report = `Reporte de Reparación Automática:\n`;
    report += `================================\n\n`;
    report += `Total procesadas: ${result.totalProcessed}\n`;
    report += `Reparaciones exitosas: ${result.successfulRepairs}\n`;
    report += `Reparaciones fallidas: ${result.failedRepairs}\n\n`;
    
    report += `Correcciones aplicadas:\n`;
    report += `- IDs generados: ${result.summary.idsGenerated}\n`;
    report += `- Títulos corregidos: ${result.summary.titlesFixed}\n`;
    report += `- Contenido corregido: ${result.summary.contentFixed}\n`;
    report += `- Fechas corregidas: ${result.summary.datesFixed}\n`;
    report += `- Tags corregidos: ${result.summary.tagsFixed}\n`;
    report += `- Corrupción limpiada: ${result.summary.corruptionCleaned}\n`;
    
    if (result.errors.length > 0) {
      report += `\nErrores encontrados:\n`;
      result.errors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`;
      });
    }
    
    return report;
  }
}

export default AutoRepairService.getInstance();
export { AutoRepairService };