import { useState, useCallback, useEffect } from 'react';
import { MemoryData as Memory } from '@/services/electronAPI';
import EncryptionService, { EncryptedMemory, EncryptedData } from '@/services/EncryptionService';
import { toast } from 'sonner';

/**
 * Estado del sistema de cifrado
 * Contiene información sobre el estado actual del cifrado y configuración
 */
export interface EncryptionState {
  /** Indica si se está realizando una operación de cifrado */
  isEncrypting: boolean;
  /** Indica si se está realizando una operación de descifrado */
  isDecrypting: boolean;
  /** Datos cifrados almacenados temporalmente */
  encryptedData: EncryptedMemory | null;
  /** Clave maestra para cifrado/descifrado */
  masterKey: string | null;
  /** Indica si la sesión está desbloqueada */
  isUnlocked: boolean;
  /** Configuración de cifrado automático */
  autoEncrypt: boolean;
}

/**
 * Interfaz del hook de cifrado
 * Define todas las funciones y propiedades disponibles para el manejo de cifrado
 */
export interface EncryptionHook {
  /** Estado actual del sistema de cifrado */
  state: EncryptionState;
  
  /** Cifra una memoria con la contraseña especificada o la clave maestra */
  encryptMemory: (memory: Memory, password?: string) => Promise<EncryptedMemory>;
  /** Descifra una memoria cifrada con la contraseña especificada o la clave maestra */
  decryptMemory: (encryptedMemory: EncryptedMemory, password?: string) => Promise<Memory>;
  
  /** Establece la clave maestra para cifrado */
  setMasterKey: (key: string) => void;
  /** Genera una nueva clave maestra aleatoria */
  generateMasterKey: () => string;
  /** Elimina la clave maestra y desbloquea la sesión */
  clearMasterKey: () => void;
  /** Desbloquea la sesión con una contraseña */
  unlockWithPassword: (password: string) => boolean;
  
  /** Configura el cifrado automático */
  setAutoEncrypt: (enabled: boolean) => void;
  
  /** Valida la fortaleza de una contraseña */
  validatePassword: (password: string) => { isValid: boolean; errors: string[] };
  /** Verifica si una memoria está cifrada */
  isMemoryEncrypted: (memory: any) => memory is EncryptedMemory;
  
  /** Cifra un archivo */
  encryptFile: (file: File, password?: string) => Promise<EncryptedData>;
  /** Descifra datos de archivo cifrados */
  decryptFile: (encryptedData: EncryptedData, password?: string) => string;
}

/**
 * Claves de almacenamiento local para configuración de cifrado
 */
const STORAGE_KEYS = {
  /** Clave para almacenar la clave maestra en localStorage */
  MASTER_KEY: 'almacen_master_key',
  /** Clave para almacenar la configuración de cifrado automático */
  AUTO_ENCRYPT: 'almacen_auto_encrypt',
  /** Clave para almacenar el estado de desbloqueo en sessionStorage */
  UNLOCK_STATUS: 'almacen_unlock_status'
};

/**
 * Hook personalizado para manejo de cifrado de memorias
 * Proporciona funcionalidad completa de cifrado/descifrado con gestión de claves
 * 
 * @returns {EncryptionHook} Objeto con funciones y estado de cifrado
 * 
 * @example
 * ```tsx
 * const {
 *   state,
 *   encryptMemory,
 *   decryptMemory,
 *   setMasterKey,
 *   unlockWithPassword
 * } = useEncryption();
 * 
 * // Cifrar una memoria
 * const encrypted = await encryptMemory(memory, 'password123');
 * 
 * // Descifrar una memoria
 * const decrypted = await decryptMemory(encrypted, 'password123');
 * ```
 */
export default function useEncryption(): EncryptionHook {
  const [state, setState] = useState<EncryptionState>({
    isEncrypting: false,
    isDecrypting: false,
    encryptedData: null,
    masterKey: null,
    isUnlocked: false,
    autoEncrypt: false
  });

  // Cargar configuración al inicializar
  useEffect(() => {
    const savedMasterKey = localStorage.getItem(STORAGE_KEYS.MASTER_KEY);
    const savedAutoEncrypt = localStorage.getItem(STORAGE_KEYS.AUTO_ENCRYPT) === 'true';
    const savedUnlockStatus = sessionStorage.getItem(STORAGE_KEYS.UNLOCK_STATUS) === 'true';

    setState(prev => ({
      ...prev,
      masterKey: savedMasterKey,
      autoEncrypt: savedAutoEncrypt,
      isUnlocked: savedUnlockStatus && !!savedMasterKey
    }));
  }, []);

  // Cifrar memoria
  const encryptMemory = useCallback(async (memory: Memory, password?: string): Promise<EncryptedMemory> => {
    setState(prev => ({ ...prev, isEncrypting: true }));
    
    try {
      const encryptionPassword = password || state.masterKey;
      
      if (!encryptionPassword) {
        throw new Error('No se ha proporcionado una contraseña de cifrado');
      }

      // Asegurar que la memoria tenga un id válido
      const memoryWithId = {
        ...memory,
        id: memory.id || Date.now()
      };

      const encryptedMemory = EncryptionService.encryptMemory(memoryWithId as any, encryptionPassword);
      
      setState(prev => ({ 
        ...prev, 
        encryptedData: encryptedMemory,
        isEncrypting: false 
      }));
      
      toast.success('Memoria cifrada correctamente');
      return encryptedMemory;
    } catch (error) {
      setState(prev => ({ ...prev, isEncrypting: false }));
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cifrar';
      toast.error(`Error al cifrar memoria: ${errorMessage}`);
      throw error;
    }
  }, [state.masterKey]);

  // Descifrar memoria
  const decryptMemory = useCallback(async (encryptedMemory: EncryptedMemory, password?: string): Promise<Memory> => {
    setState(prev => ({ ...prev, isDecrypting: true }));
    
    try {
      const decryptionPassword = password || state.masterKey;
      
      if (!decryptionPassword) {
        throw new Error('No se ha proporcionado una contraseña de descifrado');
      }

      const memory = EncryptionService.decryptMemory(encryptedMemory, decryptionPassword);
      
      setState(prev => ({ ...prev, isDecrypting: false }));
      
      return memory;
    } catch (error) {
      setState(prev => ({ ...prev, isDecrypting: false }));
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al descifrar';
      toast.error(`Error al descifrar memoria: ${errorMessage}`);
      throw error;
    }
  }, [state.masterKey]);

  // Establecer clave maestra
  const setMasterKey = useCallback((key: string) => {
    setState(prev => ({ ...prev, masterKey: key }));
    localStorage.setItem(STORAGE_KEYS.MASTER_KEY, key);
    toast.success('Clave maestra establecida');
  }, []);

  // Generar clave maestra
  const generateMasterKey = useCallback((): string => {
    const newKey = EncryptionService.generateMasterKey();
    setMasterKey(newKey);
    return newKey;
  }, [setMasterKey]);

  // Limpiar clave maestra
  const clearMasterKey = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      masterKey: null, 
      isUnlocked: false,
      encryptedData: null 
    }));
    localStorage.removeItem(STORAGE_KEYS.MASTER_KEY);
    sessionStorage.removeItem(STORAGE_KEYS.UNLOCK_STATUS);
    toast.success('Clave maestra eliminada');
  }, []);

  // Desbloquear con contraseña
  const unlockWithPassword = useCallback((password: string): boolean => {
    try {
      if (!state.masterKey) {
        toast.error('No hay clave maestra configurada');
        return false;
      }

      // Verificar contraseña intentando descifrar un dato de prueba
      const testData = 'test';
      const testMemory: Memory = {
        id: 1,
        title: 'Test Memory',
        content: testData,
        type: 'texto',
        tags: [],
        filePath: '',
        audioUrl: '',
        imageUrl: '',
        videoUrl: '',
        metadata: {
          duration: 0,
          size: 0,
          format: 'text',
          location: '',
          date: new Date().toISOString(),
          emotion: 'neutral',
          hasTranscription: false,
          savedDirectory: ''
        },
        privacyLevel: 1,
        encryptionLevel: 'none',
        requiresPassword: false,
        isEncrypted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const encrypted = EncryptionService.encryptMemory(testMemory as any, password);
      
      const decrypted = EncryptionService.decryptMemory(encrypted, password);
      
      if (decrypted.content === testData) {
        setState(prev => ({ ...prev, isUnlocked: true }));
        sessionStorage.setItem(STORAGE_KEYS.UNLOCK_STATUS, 'true');
        toast.success('Sesión desbloqueada');
        return true;
      }
      
      return false;
    } catch (error) {
      toast.error('Contraseña incorrecta');
      return false;
    }
  }, [state.masterKey]);

  // Configurar cifrado automático
  const setAutoEncrypt = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, autoEncrypt: enabled }));
    localStorage.setItem(STORAGE_KEYS.AUTO_ENCRYPT, enabled.toString());
    toast.success(`Cifrado automático ${enabled ? 'activado' : 'desactivado'}`);
  }, []);

  // Validar contraseña
  const validatePassword = useCallback((password: string) => {
    return EncryptionService.validatePassword(password);
  }, []);

  // Verificar si memoria está cifrada
  const isMemoryEncrypted = useCallback((memory: any): memory is EncryptedMemory => {
    return EncryptionService.isMemoryEncrypted(memory);
  }, []);

  // Cifrar archivo
  const encryptFile = useCallback(async (file: File, password?: string): Promise<EncryptedData> => {
    setState(prev => ({ ...prev, isEncrypting: true }));
    
    try {
      const encryptionPassword = password || state.masterKey;
      
      if (!encryptionPassword) {
        throw new Error('No se ha proporcionado una contraseña de cifrado');
      }

      const encryptedFile = await EncryptionService.encryptFile(file, encryptionPassword);
      
      setState(prev => ({ ...prev, isEncrypting: false }));
      toast.success('Archivo cifrado correctamente');
      
      return encryptedFile;
    } catch (error) {
      setState(prev => ({ ...prev, isEncrypting: false }));
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cifrar archivo';
      toast.error(`Error al cifrar archivo: ${errorMessage}`);
      throw error;
    }
  }, [state.masterKey]);

  // Descifrar archivo
  const decryptFile = useCallback((encryptedData: EncryptedData, password?: string): string => {
    try {
      const decryptionPassword = password || state.masterKey;
      
      if (!decryptionPassword) {
        throw new Error('No se ha proporcionado una contraseña de descifrado');
      }

      return EncryptionService.decryptFile(encryptedData, decryptionPassword);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al descifrar archivo';
      toast.error(`Error al descifrar archivo: ${errorMessage}`);
      throw error;
    }
  }, [state.masterKey]);

  return {
    state,
    encryptMemory,
    decryptMemory,
    setMasterKey,
    generateMasterKey,
    clearMasterKey,
    unlockWithPassword,
    setAutoEncrypt,
    validatePassword,
    isMemoryEncrypted,
    encryptFile,
    decryptFile
  };
}