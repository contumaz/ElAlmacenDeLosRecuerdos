/**
 * Limpiador DOM global para prevenir errores críticos de React
 * Específicamente diseñado para errores removeChild, insertBefore, etc.
 */
export class DOMCleaner {
  private static instance: DOMCleaner;
  private pendingCleanups: Set<() => void> = new Set();
  private isActive: boolean = true;
  
  static getInstance(): DOMCleaner {
    if (!DOMCleaner.instance) {
      DOMCleaner.instance = new DOMCleaner();
    }
    return DOMCleaner.instance;
  }
  
  constructor() {
    // Solo inicializar en entorno browser
    if (typeof window !== 'undefined') {
      this.initializeEventListeners();
      this.patchDOMOperations();
      
      // Hacer disponible globalmente para debugging
      (window as any).domCleaner = this;
    }
  }
  
  private initializeEventListeners() {
    // Escuchar eventos de limpieza crítica
    window.addEventListener('dom-cleanup', this.handleCriticalCleanup.bind(this));
    window.addEventListener('beforeunload', this.forceCleanup.bind(this));
    
    // Escuchar errores no capturados específicos
    window.addEventListener('error', this.handleGlobalError.bind(this));
    
    console.log('[DOMCleaner] Inicializado con protección de errores DOM');
  }
  
  private patchDOMOperations() {
    // Patch para Node.removeChild
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function(child: Node) {
      try {
        // Verificar que el nodo es realmente hijo antes de remover
        if (this.contains(child)) {
          return originalRemoveChild.call(this, child);
        } else {
          console.warn('[DOMCleaner] Prevención: intento de remover nodo que no es hijo');
          return child;
        }
      } catch (error) {
        console.warn('[DOMCleaner] Error en removeChild interceptado:', error);
        return child;
      }
    };
    
    // Patch para Node.insertBefore
    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function(newNode: Node, referenceNode: Node | null) {
      try {
        // Verificar que el nodo de referencia es realmente hijo
        if (referenceNode === null || this.contains(referenceNode)) {
          return originalInsertBefore.call(this, newNode, referenceNode);
        } else {
          console.warn('[DOMCleaner] Prevención: intento de insertar antes de nodo que no es hijo');
          return this.appendChild(newNode);
        }
      } catch (error) {
        console.warn('[DOMCleaner] Error en insertBefore interceptado:', error);
        return newNode;
      }
    };
    
    // Patch para Node.appendChild
    const originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function(child: Node) {
      try {
        return originalAppendChild.call(this, child);
      } catch (error) {
        console.warn('[DOMCleaner] Error en appendChild interceptado:', error);
        return child;
      }
    };
    
    console.log('[DOMCleaner] Operaciones DOM protegidas');
  }
  
  private handleGlobalError = (event: ErrorEvent) => {
    const error = event.error;
    if (error && this.isDOMError(error)) {
      console.warn('[DOMCleaner] Error DOM global interceptado:', error.message);
      
      // Disparar limpieza crítica
      this.triggerCriticalCleanup({ error: error.message });
      
      // Prevenir que el error se propague
      event.preventDefault();
      return false;
    }
  };
  
  private isDOMError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    
    return (
      message.includes('removechild') ||
      message.includes('insertbefore') ||
      message.includes('appendchild') ||
      message.includes('replacechild') ||
      message.includes('node') ||
      message.includes('commitdeletioneffects') ||
      message.includes('removechildfromcontainer') ||
      name === 'notfounderror' ||
      name === 'hierarchyrequesterror' ||
      name === 'invalidnodetypeerror'
    );
  }
  
  private handleCriticalCleanup = (event: CustomEvent) => {
    if (!this.isActive) return;
    
    console.log('[DOMCleaner] Ejecutando limpieza crítica:', event.detail);
    
    // Ejecutar todas las limpiezas pendientes
    this.pendingCleanups.forEach(cleanup => {
      try {
        cleanup();
      } catch (e) {
        console.warn('[DOMCleaner] Error en cleanup pendiente:', e);
      }
    });
    
    this.pendingCleanups.clear();
    
    // Forzar garbage collection si está disponible
    if (typeof window !== 'undefined' && (window as any).gc) {
      try {
        (window as any).gc();
      } catch (e) {
        // Ignorar errores de GC
      }
    }
  };
  
  private forceCleanup = () => {
    console.log('[DOMCleaner] Limpieza forzada antes de descarga');
    this.isActive = false;
    this.pendingCleanups.clear();
  };
  
  /**
   * Agregar una función de limpieza para ejecutar en caso de error crítico
   */
  addCleanup(cleanup: () => void): void {
    if (this.isActive) {
      this.pendingCleanups.add(cleanup);
    }
  }
  
  /**
   * Remover una función de limpieza
   */
  removeCleanup(cleanup: () => void): void {
    this.pendingCleanups.delete(cleanup);
  }
  
  /**
   * Disparar limpieza crítica manualmente
   */
  triggerCriticalCleanup(detail: any = {}): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('dom-cleanup', { detail });
      window.dispatchEvent(event);
    }
  }
  
  /**
   * Limpiar un nodo específico de manera segura
   */
  safeCleanNode(node: Node): void {
    try {
      // Remover todos los event listeners si es un Element
      if (node instanceof Element) {
        const clone = node.cloneNode(false);
        if (node.parentNode) {
          node.parentNode.replaceChild(clone, node);
        }
      }
      
      // Limpiar referencias hijo-padre de manera recursiva
      while (node.firstChild) {
        this.safeCleanNode(node.firstChild);
        try {
          node.removeChild(node.firstChild);
        } catch (e) {
          break; // Si falla, salir del loop
        }
      }
    } catch (error) {
      console.warn('[DOMCleaner] Error en limpieza de nodo:', error);
    }
  }
  
  /**
   * Obtener estadísticas del limpiador
   */
  getStats() {
    return {
      isActive: this.isActive,
      pendingCleanups: this.pendingCleanups.size,
      hasPatches: typeof (Node.prototype as any)._originalRemoveChild !== 'undefined'
    };
  }
}

// Inicializar automáticamente al importar
if (typeof window !== 'undefined') {
  DOMCleaner.getInstance();
}

// Export por defecto para facilitar importación
export default DOMCleaner;
