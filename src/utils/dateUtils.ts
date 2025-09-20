/**
 * Utilidades para formateo y manipulación de fechas
 */

/**
 * Formatea una fecha a string legible en español
 * @param dateString - Fecha como string o Date
 * @returns Fecha formateada
 */
export const formatDate = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return typeof dateString === 'string' ? dateString : dateString.toString();
  }
};

/**
 * Formatea una fecha con hora
 * @param dateString - Fecha como string o Date
 * @returns Fecha y hora formateada
 */
export const formatDateTime = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return typeof dateString === 'string' ? dateString : dateString.toString();
  }
};

/**
 * Obtiene una fecha relativa (hace X días)
 * @param dateString - Fecha como string o Date
 * @returns Fecha relativa
 */
export const getRelativeDate = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return formatDate(date);
    }
  } catch {
    return typeof dateString === 'string' ? dateString : dateString.toString();
  }
};

/**
 * Verifica si una fecha está en un rango
 * @param date - Fecha a verificar
 * @param startDate - Fecha de inicio
 * @param endDate - Fecha de fin
 * @returns true si está en el rango
 */
export const isDateInRange = (date: string | Date, startDate: string | Date, endDate: string | Date): boolean => {
  try {
    const checkDate = typeof date === 'string' ? new Date(date) : date;
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    return checkDate >= start && checkDate <= end;
  } catch {
    return false;
  }
};