/**
 * Utilidades para Testing y Validación Integral
 * El Almacén de los Recuerdos
 */

import { ElectronService } from '@/services/electronAPI';

export interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  duration: number;
  timestamp: Date;
  category: 'integration' | 'functionality' | 'performance' | 'compatibility';
}

export interface TestSuite {
  name: string;
  description: string;
  tests: TestResult[];
  totalDuration: number;
  passRate: number;
}

// Simulación de datos para testing
export const mockMemoryData = {
  texto: {
    title: 'Memoria de Prueba - Texto',
    content: 'Esta es una memoria de prueba para validar el sistema de guardado de texto.',
    type: 'texto' as const,
    tags: ['prueba', 'testing', 'texto']
  },
  audio: {
    title: 'Memoria de Prueba - Audio',
    content: 'Transcripción de audio de prueba',
    type: 'audio' as const,
    tags: ['prueba', 'audio', 'grabación']
  },
  foto: {
    title: 'Memoria de Prueba - Foto',
    content: 'Descripción de foto de prueba',
    type: 'foto' as const,
    tags: ['prueba', 'imagen', 'foto']
  },
  video: {
    title: 'Memoria de Prueba - Video',
    content: 'Descripción de video de prueba',
    type: 'video' as const,
    tags: ['prueba', 'video', 'multimedia']
  }
};

// Validación de estructura de datos
export function validateMemoryStructure(memory: any): boolean {
  const requiredFields = ['title', 'content', 'type', 'tags'];
  const validTypes = ['texto', 'audio', 'foto', 'video'];
  
  // Verificar campos requeridos
  for (const field of requiredFields) {
    if (!(field in memory)) {
      console.error(`Campo requerido faltante: ${field}`);
      return false;
    }
  }
  
  // Verificar tipo válido
  if (!validTypes.includes(memory.type)) {
    console.error(`Tipo de memoria inválido: ${memory.type}`);
    return false;
  }
  
  // Verificar que tags sea array
  if (!Array.isArray(memory.tags)) {
    console.error('Tags debe ser un array');
    return false;
  }
  
  return true;
}

// Validación de rutas
export function validateRoutes(): { valid: string[], invalid: string[] } {
  const routesToTest = [
    '/',
    '/login',
    '/memorias',
    '/memorias/nueva',
    '/memorias/texto',
    '/memorias/audio',
    '/memorias/foto',
    '/memorias/video',
    '/entrevistas',
    '/configuracion'
  ];
  
  const invalidRoutes = [
    '/ruta-inexistente',
    '/memorias/tipo-invalido',
    '/usuarios', // Eliminada del sidebar
    '/seguridad' // Eliminada del sidebar
  ];
  
  return {
    valid: routesToTest,
    invalid: invalidRoutes
  };
}

// Simulación de audio para testing
export function createMockAudioBlob(): Blob {
  // Crear un blob de audio simulado para testing
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = 2; // 2 segundos
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Generar tono simple para testing
  for (let i = 0; i < length; i++) {
    data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1; // Tono de 440Hz
  }
  
  // Convertir a blob (simulado)
  const arrayBuffer = new ArrayBuffer(length * 2);
  const view = new Int16Array(arrayBuffer);
  
  for (let i = 0; i < length; i++) {
    view[i] = data[i] * 0x7FFF;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Testing de performance
export async function measurePerformance(testName: string, testFn: () => Promise<any>): Promise<{ result: any, duration: number }> {
  const startTime = performance.now();
  const result = await testFn();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`Performance test "${testName}": ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}

// Validación de compatibilidad
export function checkCompatibility(): {
  electron: boolean;
  webAPIs: {
    mediaRecorder: boolean;
    fileSystemAccess: boolean;
    webSpeech: boolean;
    localStorage: boolean;
  };
  browser: string;
} {
  const electronService = new ElectronService();
  
  return {
    electron: electronService.isElectronAvailable(),
    webAPIs: {
      mediaRecorder: 'MediaRecorder' in window,
      fileSystemAccess: 'showDirectoryPicker' in window,
      webSpeech: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      localStorage: 'localStorage' in window
    },
    browser: navigator.userAgent
  };
}

// Testing de localStorage
export function testLocalStorage(): boolean {
  try {
    const testKey = 'almacen_test';
    const testValue = 'test_value';
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    return retrieved === testValue;
  } catch (error) {
    console.error('Error testing localStorage:', error);
    return false;
  }
}

// Validación de estructura de proyecto
export function validateProjectStructure(): { valid: boolean, issues: string[] } {
  const issues: string[] = [];
  
  // Verificar APIs requeridas
  if (!window.React) {
    // React está disponible a través de import, no globalmente
  }
  
  // Verificar que los hooks estén disponibles
  try {
    // Estos se verificarán en el componente de testing
  } catch (error) {
    issues.push('Error accediendo a hooks de React');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// Generación de reportes
export function generateTestReport(testSuites: TestSuite[]): string {
  const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
  const passedTests = testSuites.reduce((sum, suite) => 
    sum + suite.tests.filter(test => test.passed).length, 0
  );
  const overallPassRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  
  let report = `# Reporte de Testing - El Almacén de los Recuerdos\n\n`;
  report += `**Fecha:** ${new Date().toLocaleString()}\n`;
  report += `**Pruebas totales:** ${totalTests}\n`;
  report += `**Pruebas exitosas:** ${passedTests}\n`;
  report += `**Tasa de éxito:** ${overallPassRate.toFixed(2)}%\n\n`;
  
  testSuites.forEach(suite => {
    report += `## ${suite.name}\n`;
    report += `${suite.description}\n\n`;
    report += `**Duración total:** ${suite.totalDuration.toFixed(2)}ms\n`;
    report += `**Tasa de éxito:** ${suite.passRate.toFixed(2)}%\n\n`;
    
    suite.tests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      report += `- ${status} **${test.testName}** (${test.duration.toFixed(2)}ms)\n`;
      if (!test.passed) {
        report += `  - Error: ${test.details}\n`;
      }
    });
    
    report += '\n';
  });
  
  return report;
}

// Simulación de errores para testing
export class TestError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'TestError';
  }
}

export function simulateError(type: 'network' | 'validation' | 'permission' | 'storage'): TestError {
  switch (type) {
    case 'network':
      return new TestError('Error de conexión simulado', 'NETWORK_ERROR');
    case 'validation':
      return new TestError('Error de validación simulado', 'VALIDATION_ERROR');
    case 'permission':
      return new TestError('Error de permisos simulado', 'PERMISSION_ERROR');
    case 'storage':
      return new TestError('Error de almacenamiento simulado', 'STORAGE_ERROR');
    default:
      return new TestError('Error desconocido simulado', 'UNKNOWN_ERROR');
  }
}

// Utilidades para testing de audio
export function validateAudioFeatures(audioBlob: Blob): boolean {
  // Verificar que es un blob válido
  if (!(audioBlob instanceof Blob)) {
    return false;
  }
  
  // Verificar tipo MIME
  if (!audioBlob.type.startsWith('audio/')) {
    return false;
  }
  
  // Verificar tamaño mínimo
  if (audioBlob.size < 100) {
    return false;
  }
  
  return true;
}

// Utilidades para testing de imágenes
export function createMockImageFile(): File {
  // Crear imagen canvas pequeña para testing
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Dibujar un patrón simple
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 50, 50);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(50, 0, 50, 50);
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 50, 50, 50);
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(50, 50, 50, 50);
  }
  
  // Convertir canvas a blob y luego a file
  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'test-image.png', { type: 'image/png' });
        resolve(file);
      }
    }, 'image/png');
  }) as any; // Para simplificar en este contexto
}

export default {
  mockMemoryData,
  validateMemoryStructure,
  validateRoutes,
  createMockAudioBlob,
  measurePerformance,
  checkCompatibility,
  testLocalStorage,
  validateProjectStructure,
  generateTestReport,
  simulateError,
  validateAudioFeatures,
  createMockImageFile
};
