import loggingService from '../LoggingService';

/**
 * Servicio especializado en sanitización de datos
 * 
 * Proporciona funcionalidades para:
 * - Sanitización de texto eliminando contenido peligroso
 * - Sanitización recursiva de objetos
 * - Eliminación de scripts y código malicioso
 * - Limpieza de etiquetas HTML
 * 
 * @class SanitizationService
 */
class SanitizationService {
  private static instance: SanitizationService;

  private constructor() {}

  /**
   * Obtiene la instancia singleton del servicio
   * @returns {SanitizationService} Instancia única del servicio
   */
  static getInstance(): SanitizationService {
    if (!SanitizationService.instance) {
      SanitizationService.instance = new SanitizationService();
    }
    return SanitizationService.instance;
  }

  /**
   * Sanitiza texto eliminando caracteres y código potencialmente peligroso
   * 
   * Elimina:
   * - Scripts y código JavaScript
   * - Etiquetas HTML
   * - Event handlers
   * - URLs javascript:
   * 
   * @param {string} text - Texto a sanitizar
   * @returns {string} Texto sanitizado y seguro
   * @example
   * ```typescript
   * const unsafe = '<script>alert("XSS")</script>Hola mundo';
   * const safe = sanitizationService.sanitizeText(unsafe);
   * console.log(safe); // "Hola mundo"
   * ```
   */
  sanitizeText(text: string): string {
    if (typeof text !== 'string') return '';
    
    const originalLength = text.length;
    const sanitized = text
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Eliminar scripts
      .replace(/<[^>]*>/g, '') // Eliminar HTML tags
      .replace(/javascript:/gi, '') // Eliminar javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Eliminar event handlers
      .trim();
    
    if (sanitized.length !== originalLength) {
      loggingService.info('Texto sanitizado', 'SanitizationService', {
        originalLength,
        sanitizedLength: sanitized.length,
        removedCharacters: originalLength - sanitized.length
      });
    }
    
    return sanitized;
  }

  /**
   * Sanitiza un objeto recursivamente aplicando sanitización a todos los strings
   * 
   * Procesa:
   * - Strings: aplica sanitizeText
   * - Arrays: sanitiza cada elemento
   * - Objetos: sanitiza todas las propiedades
   * - Otros tipos: los mantiene sin cambios
   * 
   * @param {any} obj - Objeto a sanitizar
   * @returns {any} Objeto sanitizado con todos los strings seguros
   * @example
   * ```typescript
   * const unsafe = {
   *   title: '<script>alert("XSS")</script>Mi título',
   *   tags: ['<b>tag1</b>', 'tag2']
   * };
   * const safe = sanitizationService.sanitizeObject(unsafe);
   * ```
   */
  sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Valida si un texto contiene contenido potencialmente peligroso
   * 
   * @param {string} text - Texto a validar
   * @returns {boolean} true si el texto contiene contenido peligroso
   */
  containsDangerousContent(text: string): boolean {
    if (typeof text !== 'string') return false;
    
    const dangerousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Obtiene estadísticas de sanitización para un objeto
   * 
   * @param {any} obj - Objeto a analizar
   * @returns {object} Estadísticas de sanitización
   */
  getSanitizationStats(obj: any): {
    totalStrings: number;
    dangerousStrings: number;
    sanitizationRequired: boolean;
  } {
    let totalStrings = 0;
    let dangerousStrings = 0;
    
    const analyze = (item: any): void => {
      if (typeof item === 'string') {
        totalStrings++;
        if (this.containsDangerousContent(item)) {
          dangerousStrings++;
        }
      } else if (Array.isArray(item)) {
        item.forEach(analyze);
      } else if (typeof item === 'object' && item !== null) {
        Object.values(item).forEach(analyze);
      }
    };
    
    analyze(obj);
    
    return {
      totalStrings,
      dangerousStrings,
      sanitizationRequired: dangerousStrings > 0
    };
  }
}

export default SanitizationService.getInstance();
export { SanitizationService };