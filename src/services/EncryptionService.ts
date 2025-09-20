import CryptoJS from 'crypto-js';
import { Memory } from '@/types';
import loggingService from './LoggingService';

/**
 * Configuración para el servicio de cifrado
 * Define los parámetros de seguridad utilizados en el cifrado AES
 */
export interface EncryptionConfig {
  /** Algoritmo de cifrado utilizado (AES) */
  algorithm: string;
  /** Tamaño de la clave en palabras de 32 bits (256 bits = 8 palabras) */
  keySize: number;
  /** Número de iteraciones para PBKDF2 (derivación de clave) */
  iterations: number;
}

/**
 * Estructura de datos cifrados
 * Contiene todos los elementos necesarios para el cifrado seguro
 */
export interface EncryptedData {
  /** Datos cifrados en formato string */
  data: string;
  /** Vector de inicialización (IV) para el cifrado */
  iv: string;
  /** Salt utilizado para la derivación de clave */
  salt: string;
  /** HMAC para verificación de integridad */
  hmac: string;
  /** Timestamp de cuando se cifró la información */
  timestamp: number;
}

/**
 * Memoria cifrada
 * Extiende Memory pero reemplaza el contenido sensible con versiones cifradas
 */
export interface EncryptedMemory extends Omit<Memory, 'content' | 'audioUrl' | 'imageUrl'> {
  /** Contenido de texto cifrado */
  encryptedContent: EncryptedData;
  /** URL de audio cifrada (opcional) */
  encryptedAudioUrl?: EncryptedData;
  /** URL de imagen cifrada (opcional) */
  encryptedImageUrl?: EncryptedData;
  /** Indicador de que la memoria está cifrada */
  isEncrypted: true;
}

/**
 * Servicio de cifrado AES-256 con autenticación HMAC
 * Implementa el patrón Singleton para garantizar una única instancia
 * Proporciona cifrado seguro para memorias y archivos multimedia
 * 
 * Características de seguridad:
 * - Cifrado AES-256 en modo CBC
 * - Derivación de clave PBKDF2 con 10,000 iteraciones
 * - Verificación de integridad con HMAC-SHA256
 * - Salt e IV únicos para cada operación de cifrado
 * 
 * @example
 * ```typescript
 * const encryptionService = EncryptionService.getInstance();
 * const encrypted = encryptionService.encryptMemory(memory, password);
 * const decrypted = encryptionService.decryptMemory(encrypted, password);
 * ```
 */
class EncryptionService {
  private static instance: EncryptionService;
  private config: EncryptionConfig = {
    algorithm: 'AES',
    keySize: 256 / 32, // 256 bits = 8 words
    iterations: 10000
  };

  private constructor() {}

  /**
   * Obtiene la instancia única del servicio de cifrado
   * @returns {EncryptionService} Instancia del servicio
   */
  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Deriva una clave de cifrado a partir de una contraseña usando PBKDF2
   * Utiliza SHA-256 como función hash y 10,000 iteraciones para mayor seguridad
   * 
   * @param {string} password - Contraseña del usuario
   * @param {CryptoJS.lib.WordArray} salt - Salt único para la derivación
   * @returns {CryptoJS.lib.WordArray} Clave derivada de 256 bits
   */
  private deriveKey(password: string, salt: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: this.config.keySize,
      iterations: this.config.iterations,
      hasher: CryptoJS.algo.SHA256
    });
  }

  /**
   * Genera un HMAC-SHA256 para verificar la integridad de los datos
   * 
   * @param {string} data - Datos a autenticar
   * @param {CryptoJS.lib.WordArray} key - Clave para generar el HMAC
   * @returns {string} HMAC en formato hexadecimal
   */
  private generateHMAC(data: string, key: CryptoJS.lib.WordArray): string {
    return CryptoJS.HmacSHA256(data, key).toString();
  }

  /**
   * Verifica la integridad de los datos comparando HMACs
   * 
   * @param {string} data - Datos a verificar
   * @param {string} hmac - HMAC esperado
   * @param {CryptoJS.lib.WordArray} key - Clave para verificar el HMAC
   * @returns {boolean} true si los datos son íntegros, false en caso contrario
   */
  private verifyHMAC(data: string, hmac: string, key: CryptoJS.lib.WordArray): boolean {
    const computedHmac = this.generateHMAC(data, key);
    return computedHmac === hmac;
  }

  /**
   * Cifra un string usando AES-256 en modo CBC con autenticación HMAC
   * Genera salt e IV únicos para cada operación de cifrado
   * 
   * @param {string} plaintext - Texto plano a cifrar
   * @param {string} password - Contraseña para el cifrado
   * @returns {EncryptedData} Objeto con datos cifrados, IV, salt, HMAC y timestamp
   * @throws {Error} Si ocurre un error durante el cifrado
   */
  private encryptString(plaintext: string, password: string): EncryptedData {
    try {
      // Generar salt e IV aleatorios
      const salt = CryptoJS.lib.WordArray.random(256 / 8);
      const iv = CryptoJS.lib.WordArray.random(128 / 8);
      
      // Derivar clave
      const key = this.deriveKey(password, salt);
      
      // Cifrar datos
      const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      const encryptedData = encrypted.toString();
      
      // Generar HMAC para integridad
      const hmac = this.generateHMAC(encryptedData, key);
      
      return {
        data: encryptedData,
        iv: iv.toString(),
        salt: salt.toString(),
        hmac: hmac,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error al cifrar datos:', error);
      throw new Error('Error en el proceso de cifrado');
    }
  }

  /**
   * Descifra un string usando AES-256 en modo CBC con verificación HMAC
   * Verifica la integridad de los datos antes del descifrado
   * 
   * @param {EncryptedData} encryptedData - Datos cifrados con metadatos
   * @param {string} password - Contraseña para el descifrado
   * @returns {string} Texto plano descifrado
   * @throws {Error} Si la contraseña es incorrecta o los datos están corruptos
   */
  private decryptString(encryptedData: EncryptedData, password: string): string {
    try {
      const { data, iv, salt, hmac } = encryptedData;
      
      // Reconstruir salt e IV
      const saltWordArray = CryptoJS.enc.Hex.parse(salt);
      const ivWordArray = CryptoJS.enc.Hex.parse(iv);
      
      // Derivar clave
      const key = this.deriveKey(password, saltWordArray);
      
      // Verificar integridad
      if (!this.verifyHMAC(data, hmac, key)) {
        throw new Error('Los datos han sido modificados o la contraseña es incorrecta');
      }
      
      // Descifrar datos
      const decrypted = CryptoJS.AES.decrypt(data, key, {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!plaintext) {
        throw new Error('Error al descifrar: contraseña incorrecta o datos corruptos');
      }
      
      return plaintext;
    } catch (error) {
      console.error('Error al descifrar datos:', error);
      throw new Error('Error en el proceso de descifrado: ' + (error as Error).message);
    }
  }

  /**
   * Cifra una memoria completa incluyendo contenido, audio e imágenes
   * Registra el proceso en el sistema de logging para auditoría
   * 
   * @param {Memory} memory - Memoria a cifrar
   * @param {string} password - Contraseña para el cifrado
   * @returns {EncryptedMemory} Memoria cifrada con contenido protegido
   * @throws {Error} Si no se puede cifrar la memoria
   * 
   * @example
   * ```typescript
   * const encryptedMemory = encryptionService.encryptMemory(memory, 'mi-contraseña-segura');
   * ```
   */
  public encryptMemory(memory: Memory, password: string): EncryptedMemory {
    loggingService.info('encryption_memory_start', 'EncryptionService', {
      memoryId: memory.id,
      hasAudio: !!memory.audioUrl,
      hasImage: !!memory.imageUrl
    });
    
    try {
      const encryptedContent = this.encryptString(memory.content, password);
      
      const encryptedMemory: EncryptedMemory = {
        ...memory,
        encryptedContent,
        isEncrypted: true
      };
      
      // Cifrar URL de audio si existe
      if (memory.audioUrl) {
        encryptedMemory.encryptedAudioUrl = this.encryptString(memory.audioUrl, password);
      }
      
      // Cifrar URL de imagen si existe
      if (memory.imageUrl) {
        encryptedMemory.encryptedImageUrl = this.encryptString(memory.imageUrl, password);
      }
      
      // Remover propiedades no cifradas
      delete (encryptedMemory as any).content;
      delete (encryptedMemory as any).audioUrl;
      delete (encryptedMemory as any).imageUrl;
      
      loggingService.info('encryption_memory_success', 'EncryptionService', {
        memoryId: memory.id,
        hasEncryptedAudio: !!encryptedMemory.encryptedAudioUrl,
        hasEncryptedImage: !!encryptedMemory.encryptedImageUrl
      });
      
      return encryptedMemory;
    } catch (error) {
      loggingService.error('encryption_memory_failed', error, 'EncryptionService', {
        memoryId: memory.id
      });
      
      console.error('Error al cifrar memoria:', error);
      throw new Error('No se pudo cifrar la memoria');
    }
  }

  /**
   * Descifra una memoria completa restaurando contenido, audio e imágenes
   * Registra el proceso en el sistema de logging para auditoría
   * 
   * @param {EncryptedMemory} encryptedMemory - Memoria cifrada a descifrar
   * @param {string} password - Contraseña para el descifrado
   * @returns {Memory} Memoria descifrada con contenido restaurado
   * @throws {Error} Si la contraseña es incorrecta o los datos están corruptos
   * 
   * @example
   * ```typescript
   * const memory = encryptionService.decryptMemory(encryptedMemory, 'mi-contraseña-segura');
   * ```
   */
  public decryptMemory(encryptedMemory: EncryptedMemory, password: string): Memory {
    loggingService.info('decryption_memory_start', 'EncryptionService', {
      memoryId: encryptedMemory.id,
      hasEncryptedAudio: !!encryptedMemory.encryptedAudioUrl,
      hasEncryptedImage: !!encryptedMemory.encryptedImageUrl
    });
    
    try {
      const content = this.decryptString(encryptedMemory.encryptedContent, password);
      
      const memory: Memory = {
        ...encryptedMemory,
        content,
        isEncrypted: false
      };
      
      // Descifrar URL de audio si existe
      if (encryptedMemory.encryptedAudioUrl) {
        memory.audioUrl = this.decryptString(encryptedMemory.encryptedAudioUrl, password);
      }
      
      // Descifrar URL de imagen si existe
      if (encryptedMemory.encryptedImageUrl) {
        memory.imageUrl = this.decryptString(encryptedMemory.encryptedImageUrl, password);
      }
      
      // Remover propiedades cifradas
      delete (memory as any).encryptedContent;
      delete (memory as any).encryptedAudioUrl;
      delete (memory as any).encryptedImageUrl;
      
      loggingService.info('decryption_memory_success', 'EncryptionService', {
        memoryId: encryptedMemory.id,
        hasDecryptedAudio: !!memory.audioUrl,
        hasDecryptedImage: !!memory.imageUrl
      });
      
      return memory;
    } catch (error) {
      loggingService.error('decryption_memory_failed', error, 'EncryptionService', {
        memoryId: encryptedMemory.id
      });
      
      console.error('Error al descifrar memoria:', error);
      throw new Error('No se pudo descifrar la memoria: contraseña incorrecta o datos corruptos');
    }
  }

  /**
   * Verifica si una memoria está cifrada mediante type guard
   * 
   * @param {any} memory - Objeto a verificar
   * @returns {boolean} true si la memoria está cifrada, false en caso contrario
   * 
   * @example
   * ```typescript
   * if (encryptionService.isMemoryEncrypted(memory)) {
   *   const decrypted = encryptionService.decryptMemory(memory, password);
   * }
   * ```
   */
  public isMemoryEncrypted(memory: any): memory is EncryptedMemory {
    return memory.isEncrypted === true && memory.encryptedContent;
  }

  /**
   * Genera una clave maestra aleatoria de 256 bits
   * Utiliza el generador criptográfico seguro de CryptoJS
   * 
   * @returns {string} Clave maestra en formato hexadecimal
   * 
   * @example
   * ```typescript
   * const masterKey = encryptionService.generateMasterKey();
   * ```
   */
  public generateMasterKey(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  /**
   * Valida la fortaleza de una contraseña según criterios de seguridad
   * Verifica longitud mínima, mayúsculas, minúsculas, números y caracteres especiales
   * 
   * @param {string} password - Contraseña a validar
   * @returns {Object} Objeto con resultado de validación y errores
   * @returns {boolean} returns.isValid - true si la contraseña es válida
   * @returns {string[]} returns.errors - Array de errores encontrados
   * 
   * @example
   * ```typescript
   * const validation = encryptionService.validatePassword('MiContraseña123!');
   * if (!validation.isValid) {
   *   console.log('Errores:', validation.errors);
   * }
   * ```
   */
  public validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }
    
    if (!/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Cifra archivos multimedia convirtiéndolos a base64 y luego cifrándolos
   * Registra el proceso completo para auditoría y monitoreo
   * 
   * @param {File} file - Archivo a cifrar
   * @param {string} password - Contraseña para el cifrado
   * @returns {Promise<EncryptedData>} Promesa que resuelve con los datos cifrados
   * @throws {Error} Si ocurre un error al leer o cifrar el archivo
   * 
   * @example
   * ```typescript
   * const fileInput = document.getElementById('file') as HTMLInputElement;
   * const file = fileInput.files[0];
   * const encrypted = await encryptionService.encryptFile(file, 'mi-contraseña');
   * ```
   */
  public async encryptFile(file: File, password: string): Promise<EncryptedData> {
    loggingService.info('encryption_file_start', 'EncryptionService', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const base64Data = reader.result as string;
          const encrypted = this.encryptString(base64Data, password);
          
          loggingService.info('encryption_file_success', 'EncryptionService', {
            fileName: file.name,
            originalSize: file.size,
            encryptedSize: encrypted.data.length
          });
          
          resolve(encrypted);
        } catch (error) {
          loggingService.error('encryption_file_failed', error, 'EncryptionService', {
            fileName: file.name
          });
          
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Descifra archivos multimedia restaurando el formato base64 original
   * Registra el proceso completo para auditoría y monitoreo
   * 
   * @param {EncryptedData} encryptedData - Datos cifrados del archivo
   * @param {string} password - Contraseña para el descifrado
   * @returns {string} Archivo en formato base64 (data URL)
   * @throws {Error} Si la contraseña es incorrecta o los datos están corruptos
   * 
   * @example
   * ```typescript
   * const decryptedFile = encryptionService.decryptFile(encryptedData, 'mi-contraseña');
   * const img = document.createElement('img');
   * img.src = decryptedFile; // data:image/jpeg;base64,...
   * ```
   */
  public decryptFile(encryptedData: EncryptedData, password: string): string {
    loggingService.info('decryption_file_start', 'EncryptionService', {
      encryptedSize: encryptedData.data.length,
      timestamp: encryptedData.timestamp
    });
    
    try {
      const decryptedData = this.decryptString(encryptedData, password);
      
      loggingService.info('decryption_file_success', 'EncryptionService', {
        encryptedSize: encryptedData.data.length,
        decryptedSize: decryptedData.length
      });
      
      return decryptedData;
    } catch (error) {
      loggingService.error('decryption_file_failed', error, 'EncryptionService', {
        encryptedSize: encryptedData.data.length
      });
      
      throw error;
    }
  }
}

export default EncryptionService.getInstance();