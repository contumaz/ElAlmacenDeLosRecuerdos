import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ValidationService, { ValidationResult, DataIntegrityReport } from '../services/ValidationService';
import { toast } from 'sonner';

export interface ValidationState {
  isValidating: boolean;
  errors: string[];
  warnings: string[];
  isValid: boolean;
  lastValidation?: Date;
}

export interface ValidationOptions {
  realTime?: boolean;
  debounceMs?: number;
  sanitize?: boolean;
  showToasts?: boolean;
  autoRepair?: boolean;
}

export interface UseValidationReturn {
  // Estado
  validationState: ValidationState;
  
  // Funciones de validación
  validateMemory: (data: unknown, options?: ValidationOptions) => Promise<ValidationResult>;
  validateCreateMemory: (data: unknown, options?: ValidationOptions) => Promise<ValidationResult>;
  validateUpdateMemory: (data: unknown, options?: ValidationOptions) => Promise<ValidationResult>;
  validateTextInput: (text: unknown, options?: ValidationOptions) => ValidationResult;
  validateTag: (tag: unknown, options?: ValidationOptions) => ValidationResult;
  validateMediaFile: (file: File, options?: ValidationOptions) => ValidationResult;
  
  // Funciones de integridad
  checkDataIntegrity: (memories: any[]) => Promise<DataIntegrityReport>;
  repairMemory: (memory: any) => Promise<{ repaired: boolean; data?: any; issues: string[] }>;
  
  // Utilidades
  clearErrors: () => void;
  resetValidation: () => void;
  sanitizeData: (data: any) => any;
}

const defaultOptions: ValidationOptions = {
  realTime: false,
  debounceMs: 300,
  sanitize: true,
  showToasts: true,
  autoRepair: false
};

export const useValidation = (initialOptions?: Partial<ValidationOptions>): UseValidationReturn => {
  const options = useMemo(() => ({ ...defaultOptions, ...initialOptions }), [
    initialOptions
  ]);
  const validationService = ValidationService;
  
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    errors: [],
    warnings: [],
    isValid: true
  });
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const validationCacheRef = useRef<Map<string, ValidationResult>>(new Map());
  
  // Limpiar debounce al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  const updateValidationState = useCallback((result: ValidationResult, showToast = true) => {
    setValidationState(prev => ({
      ...prev,
      isValidating: false,
      errors: result.errors || [],
      warnings: result.warnings || [],
      isValid: result.success,
      lastValidation: new Date()
    }));
    
    if (showToast && options.showToasts) {
      if (!result.success && result.errors?.length) {
        toast.error(`Errores de validación: ${result.errors.length}`);
      } else if (result.warnings?.length) {
        toast.warning(`Advertencias: ${result.warnings.length}`);
      }
    }
  }, [options.showToasts]);
  
  const executeValidation = useCallback(async <T,>(
    validationFn: () => ValidationResult<T>,
    cacheKey?: string,
    showToast = true
  ): Promise<ValidationResult<T>> => {
    // Verificar caché si se proporciona clave
    if (cacheKey && validationCacheRef.current.has(cacheKey)) {
      const cached = validationCacheRef.current.get(cacheKey)!;
      updateValidationState(cached, false);
      return cached;
    }
    
    setValidationState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = validationFn();
      
      // Guardar en caché
      if (cacheKey) {
        validationCacheRef.current.set(cacheKey, result);
        // Limpiar caché después de 5 minutos
        setTimeout(() => {
          validationCacheRef.current.delete(cacheKey);
        }, 5 * 60 * 1000);
      }
      
      updateValidationState(result, showToast);
        return {
          success: result.success,
          data: result.data,
          errors: result.errors || []
        };
    } catch (error) {
      const errorResult: ValidationResult<T> = {
        success: false,
        errors: [`Error de validación: ${error instanceof Error ? error.message : 'Error desconocido'}`]
      };
      
      updateValidationState(errorResult, showToast);
      return errorResult;
    }
  }, [updateValidationState]);
  
  const debouncedValidation = useCallback(<T,>(
    validationFn: () => ValidationResult<T>,
    cacheKey?: string,
    showToast = true
  ): Promise<ValidationResult<T>> => {
    return new Promise((resolve) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(async () => {
        const result = await executeValidation(validationFn, cacheKey, showToast);
        resolve(result);
      }, options.debounceMs);
    });
  }, [executeValidation, options.debounceMs]);
  
  const validateMemory = useCallback(async (data: unknown, validationOptions?: ValidationOptions): Promise<ValidationResult> => {
    const opts = { ...options, ...validationOptions };
    const cacheKey = opts.realTime ? undefined : `memory_${JSON.stringify(data).substring(0, 100)}`;
    
    const validationFn = () => validationService.validateMemory(data, opts.sanitize);
    
    if (opts.realTime) {
      return debouncedValidation(validationFn, cacheKey, opts.showToasts);
    }
    
    return executeValidation(validationFn, cacheKey, opts.showToasts);
  }, [options, executeValidation, debouncedValidation, validationService]);
  
  const validateCreateMemory = useCallback(async (data: unknown, validationOptions?: ValidationOptions): Promise<ValidationResult> => {
    const opts = { ...options, ...validationOptions };
    const cacheKey = opts.realTime ? undefined : `create_memory_${JSON.stringify(data).substring(0, 100)}`;
    
    const validationFn = () => validationService.validateCreateMemory(data, opts.sanitize);
    
    if (opts.realTime) {
      return debouncedValidation(validationFn, cacheKey, opts.showToasts);
    }
    
    return executeValidation(validationFn, cacheKey, opts.showToasts);
  }, [options, executeValidation, debouncedValidation, validationService]);
  
  const validateUpdateMemory = useCallback(async (data: unknown, validationOptions?: ValidationOptions): Promise<ValidationResult> => {
    const opts = { ...options, ...validationOptions };
    const cacheKey = opts.realTime ? undefined : `update_memory_${JSON.stringify(data).substring(0, 100)}`;
    
    const validationFn = () => validationService.validateUpdateMemory(data, opts.sanitize);
    
    if (opts.realTime) {
      return debouncedValidation(validationFn, cacheKey, opts.showToasts);
    }
    
    return executeValidation(validationFn, cacheKey, opts.showToasts);
  }, [options, executeValidation, debouncedValidation, validationService]);
  
  const validateTextInput = useCallback((text: unknown, validationOptions?: ValidationOptions): ValidationResult => {
    const opts = { ...options, ...validationOptions };
    const result = validationService.validateTextInput(text);
    
    if (!opts.realTime) {
      updateValidationState(result, opts.showToasts);
    }
    
    return result;
  }, [options, updateValidationState, validationService]);
  
  const validateTag = useCallback((tag: unknown, validationOptions?: ValidationOptions): ValidationResult => {
    const opts = { ...options, ...validationOptions };
    const result = validationService.validateTag(tag);
    
    if (!opts.realTime) {
      updateValidationState(result, opts.showToasts);
    }
    
    return result;
  }, [options, updateValidationState, validationService]);
  
  const validateMediaFile = useCallback((file: File, validationOptions?: ValidationOptions): ValidationResult => {
    const opts = { ...options, ...validationOptions };
    const result = validationService.validateMediaFile(file);
    
    if (!opts.realTime) {
      updateValidationState(result, opts.showToasts);
    }
    
    return result;
  }, [options, updateValidationState, validationService]);
  
  const checkDataIntegrity = useCallback(async (memories: any[]): Promise<DataIntegrityReport> => {
    setValidationState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const report = validationService.detectDataCorruption(memories);
      
      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        lastValidation: new Date()
      }));
      
      if (options.showToasts) {
        if (report.corruptedMemories > 0) {
          toast.warning(`Se encontraron ${report.corruptedMemories} registros con problemas`);
        } else {
          toast.success('Todos los registros están íntegros');
        }
      }
      
      return report;
    } catch (error) {
      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        errors: [`Error al verificar integridad: ${error instanceof Error ? error.message : 'Error desconocido'}`],
        isValid: false
      }));
      
      throw error;
    }
  }, [options.showToasts, validationService]);
  
  const repairMemory = useCallback(async (memory: any): Promise<{ repaired: boolean; data?: any; issues: string[] }> => {
    setValidationState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = validationService.autoRepairMemory(memory, []);
      
      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        warnings: result.errors || [],
        lastValidation: new Date()
      }));
      
      if (options.showToasts) {
        if (result.success) {
          toast.success('Memoria reparada automáticamente');
        } else {
          toast.error('No se pudo reparar la memoria automáticamente');
        }
      }
      
      return { repaired: result.success, data: result.repairedMemory, issues: result.errors || [] };
    } catch (error) {
      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        errors: [`Error al reparar memoria: ${error instanceof Error ? error.message : 'Error desconocido'}`],
        isValid: false
      }));
      
      throw error;
    }
  }, [options.showToasts, validationService]);
  
  const clearErrors = useCallback(() => {
    setValidationState(prev => ({
      ...prev,
      errors: [],
      warnings: [],
      isValid: true
    }));
  }, []);
  
  const resetValidation = useCallback(() => {
    setValidationState({
      isValidating: false,
      errors: [],
      warnings: [],
      isValid: true
    });
    
    validationCacheRef.current.clear();
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);
  
  const sanitizeData = useCallback((data: any) => {
    return validationService.sanitizeObject(data);
  }, [validationService]);
  
  return {
    validationState,
    validateMemory,
    validateCreateMemory,
    validateUpdateMemory,
    validateTextInput,
    validateTag,
    validateMediaFile,
    checkDataIntegrity,
    repairMemory,
    clearErrors,
    resetValidation,
    sanitizeData
  };
};

export default useValidation;