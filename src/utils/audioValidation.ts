/**
 * Utilidades para validación de archivos de audio
 */

export interface AudioValidationResult {
  isValid: boolean;
  error: string;
  details: Record<string, any>;
}

/**
 * Valida si un archivo de audio es válido basándose en su URL o ruta
 * @param audioUrl - URL o ruta del archivo de audio
 * @param audioBlob - Blob de audio (opcional)
 * @returns Resultado de la validación
 */
export const validateAudioFile = (audioUrl?: string, audioBlob?: Blob): AudioValidationResult => {
  const validation: AudioValidationResult = {
    isValid: false,
    error: '',
    details: {}
  };

  // Verificar que se proporcione al menos una fuente
  if (!audioUrl && !audioBlob) {
    validation.error = 'No se proporcionó URL de audio ni blob';
    return validation;
  }

  // Validar URL de audio
  if (audioUrl) {
    // Verificar que la URL no esté vacía
    if (audioUrl.trim() === '') {
      validation.error = 'URL de audio vacía';
      return validation;
    }

    // Validar extensión de archivo
    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm', '.mp4'];
    const hasValidExtension = validExtensions.some(ext => 
      audioUrl.toLowerCase().includes(ext)
    );
    
    if (!hasValidExtension) {
      validation.error = 'Extensión de archivo no válida';
      validation.details = { url: audioUrl, validExtensions };
      return validation;
    }

    // Verificar que no sea una URL obviamente inválida
    if (audioUrl.includes('undefined') || audioUrl.includes('null')) {
      validation.error = 'URL contiene valores inválidos';
      validation.details = { url: audioUrl };
      return validation;
    }
  }

  // Validar blob de audio
  if (audioBlob) {
    // Verificar que el blob tenga tipo de audio
    if (!audioBlob.type.startsWith('audio/')) {
      validation.error = 'Tipo de blob no es audio';
      validation.details = { type: audioBlob.type };
      return validation;
    }

    // Verificar que el blob tenga contenido
    if (audioBlob.size === 0) {
      validation.error = 'Blob de audio está vacío';
      validation.details = { size: audioBlob.size };
      return validation;
    }
  }

  validation.isValid = true;
  return validation;
};

/**
 * Genera un mensaje de error detallado para problemas de audio
 * @param memoryTitle - Título de la memoria
 * @param audioUrl - URL del archivo de audio
 * @param validation - Resultado de la validación
 * @returns Mensaje de error formateado
 */
export const generateAudioErrorMessage = (
  memoryTitle: string,
  audioUrl?: string,
  validation?: AudioValidationResult
): string => {
  const fileName = audioUrl ? audioUrl.split('/').pop() || audioUrl : 'archivo';
  const title = memoryTitle || 'Sin título';
  
  let message = `Error al cargar audio "${title}"`;
  
  if (fileName !== 'archivo') {
    message += ` (${fileName})`;
  }
  
  if (validation && !validation.isValid) {
    message += `: ${validation.error}`;
  }
  
  return message;
};

/**
 * Registra información detallada sobre errores de audio
 * @param context - Contexto donde ocurrió el error (ej: 'MemoryListItem', 'AudioPlayer')
 * @param memoryTitle - Título de la memoria
 * @param audioUrl - URL del archivo de audio
 * @param error - Error del elemento de audio HTML
 * @param validation - Resultado de la validación
 */
export const logAudioError = (
  context: string,
  memoryTitle: string,
  audioUrl?: string,
  error?: MediaError | null,
  validation?: AudioValidationResult
) => {
  const errorDetails = {
    context,
    memoria: memoryTitle,
    audioUrl,
    validation: validation?.isValid ? 'válido' : validation?.error,
    validationDetails: validation?.details,
    mediaError: error ? {
      code: error.code,
      message: error.message
    } : null,
    timestamp: new Date().toISOString()
  };
  
  console.error(`${context} - Error de audio:`, errorDetails);
};

/**
 * Registra información sobre el inicio de carga de audio
 * @param context - Contexto donde se inicia la carga
 * @param memoryTitle - Título de la memoria
 * @param audioUrl - URL del archivo de audio
 * @param validation - Resultado de la validación
 */
export const logAudioLoadStart = (
  context: string,
  memoryTitle: string,
  audioUrl?: string,
  validation?: AudioValidationResult
) => {
  const loadDetails = {
    context,
    memoria: memoryTitle,
    audioUrl,
    validation: validation?.isValid ? 'válido' : validation?.error,
    timestamp: new Date().toISOString()
  };
  
  console.log(`${context} - Iniciando carga de audio:`, loadDetails);
  
  if (validation && !validation.isValid) {
    console.warn(`${context} - Archivo de audio no válido:`, {
      error: validation.error,
      details: validation.details,
      memoria: memoryTitle
    });
  }
};

/**
 * Registra información sobre audio listo para reproducir
 * @param context - Contexto donde el audio está listo
 * @param memoryTitle - Título de la memoria
 * @param audioUrl - URL del archivo de audio
 * @param duration - Duración del audio (opcional)
 */
export const logAudioReady = (
  context: string,
  memoryTitle: string,
  audioUrl?: string,
  duration?: number
) => {
  const readyDetails = {
    context,
    memoria: memoryTitle,
    audioUrl,
    duration,
    timestamp: new Date().toISOString()
  };
  
  console.log(`${context} - Audio listo para reproducir:`, readyDetails);
};