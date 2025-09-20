import CryptoJS from 'crypto-js';

// Tipos para diferentes tipos de contenido
export interface DuplicateItem {
  id: string;
  hash: string;
  type: 'contact' | 'email' | 'whatsapp' | 'photo';
  originalData: any;
  importedAt: Date;
}

// Clase para gestionar la detección de duplicados
export class DuplicateDetectionService {
  private static readonly STORAGE_KEY = 'almacen_imported_items';

  // Generar hash único para diferentes tipos de contenido
  static generateHash(data: any, type: string): string {
    let hashInput = '';
    
    switch (type) {
      case 'contact':
        // Hash basado en nombre, teléfono y email
        hashInput = `${data.name || ''}${data.phone || ''}${data.email || ''}`;
        break;
      case 'email':
        // Hash basado en subject, sender, date y primeros 100 chars del body
        hashInput = `${data.subject || ''}${data.from || ''}${data.date || ''}${(data.body || '').substring(0, 100)}`;
        break;
      case 'whatsapp':
        // Hash basado en timestamp, sender y mensaje
        hashInput = `${data.timestamp || ''}${data.sender || ''}${data.message || ''}`;
        break;
      case 'photo':
        // Hash basado en nombre del archivo, tamaño y fecha de modificación
        hashInput = `${data.name || ''}${data.size || ''}${data.lastModified || ''}`;
        break;
      default:
        hashInput = JSON.stringify(data);
    }
    
    return CryptoJS.SHA256(hashInput.toLowerCase().trim()).toString();
  }

  // Obtener todos los elementos importados del localStorage
  static getImportedItems(): DuplicateItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error al obtener elementos importados:', error);
      return [];
    }
  }

  // Verificar si un elemento ya existe
  static isDuplicate(hash: string, type: string): boolean {
    const items = this.getImportedItems();
    return items.some(item => item.hash === hash && item.type === type);
  }

  // Agregar nuevo elemento a la lista de importados
  static addImportedItem(data: any, type: 'contact' | 'email' | 'whatsapp' | 'photo'): string {
    const hash = this.generateHash(data, type);
    
    if (this.isDuplicate(hash, type)) {
      throw new Error(`Este ${type} ya ha sido importado anteriormente`);
    }

    const items = this.getImportedItems();
    const newItem: DuplicateItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hash,
      type,
      originalData: data,
      importedAt: new Date()
    };

    items.push(newItem);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    
    return newItem.id;
  }

  // Procesar lote de elementos y filtrar duplicados
  static processBatch(dataArray: any[], type: 'contact' | 'email' | 'whatsapp' | 'photo'): {
    newItems: any[];
    duplicates: any[];
    summary: {
      total: number;
      new: number;
      duplicates: number;
    }
  } {
    const newItems: any[] = [];
    const duplicates: any[] = [];
    
    dataArray.forEach(item => {
      const hash = this.generateHash(item, type);
      
      if (this.isDuplicate(hash, type)) {
        duplicates.push({ ...item, _duplicateReason: 'Ya importado anteriormente' });
      } else {
        newItems.push({ ...item, _hash: hash });
      }
    });

    return {
      newItems,
      duplicates,
      summary: {
        total: dataArray.length,
        new: newItems.length,
        duplicates: duplicates.length
      }
    };
  }

  // Confirmar importación de elementos nuevos
  static confirmImport(items: any[], type: 'contact' | 'email' | 'whatsapp' | 'photo'): string[] {
    const importedIds: string[] = [];
    
    items.forEach(item => {
      try {
        const id = this.addImportedItem(item, type);
        importedIds.push(id);
      } catch (error) {
        console.warn(`Error al importar elemento:`, error);
      }
    });

    return importedIds;
  }

  // Obtener estadísticas de importación por tipo
  static getImportStats(): Record<string, number> {
    const items = this.getImportedItems();
    const stats: Record<string, number> = {
      contact: 0,
      email: 0,
      whatsapp: 0,
      photo: 0
    };

    items.forEach(item => {
      if (Object.prototype.hasOwnProperty.call(stats, item.type)) {
        stats[item.type]++;
      }
    });

    return stats;
  }

  // Limpiar elementos importados (para testing o reset)
  static clearImportedItems(type?: string): void {
    if (type) {
      const items = this.getImportedItems();
      const filtered = items.filter(item => item.type !== type);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // Exportar historial de importaciones
  static exportImportHistory(): string {
    const items = this.getImportedItems();
    return JSON.stringify(items, null, 2);
  }
}

// Hook personalizado para React
export const useDuplicateDetection = () => {
  const checkDuplicate = (data: any, type: 'contact' | 'email' | 'whatsapp' | 'photo') => {
    const hash = DuplicateDetectionService.generateHash(data, type);
    return DuplicateDetectionService.isDuplicate(hash, type);
  };

  const processBatch = (dataArray: any[], type: 'contact' | 'email' | 'whatsapp' | 'photo') => {
    return DuplicateDetectionService.processBatch(dataArray, type);
  };

  const confirmImport = (items: any[], type: 'contact' | 'email' | 'whatsapp' | 'photo') => {
    return DuplicateDetectionService.confirmImport(items, type);
  };

  const getStats = () => {
    return DuplicateDetectionService.getImportStats();
  };

  return {
    checkDuplicate,
    processBatch,
    confirmImport,
    getStats
  };
};