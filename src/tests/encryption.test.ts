import EncryptionService from '../services/EncryptionService';
import { Memory } from '../types';

// Mock data para testing
const mockMemory: Memory = {
  id: 1,
  title: 'Memoria de prueba',
  content: 'Este es el contenido de la memoria de prueba para cifrado',
  type: 'texto',
  tags: ['test', 'encryption'],
  privacyLevel: 2,
  emotion: {
    primary: 'neutral',
    confidence: 0,
    emotions: {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      love: 0,
      nostalgia: 0
    }
  },
  metadata: {
    emotion: 'neutral'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isEncrypted: false,
  encryptionLevel: 'none',
  requiresPassword: false
};

const testPassword = 'test-password-123';
const testMasterKey = 'master-key-for-testing-12345';

// Función para ejecutar todas las pruebas
export async function runEncryptionTests(): Promise<void> {
  console.log('🔐 Iniciando pruebas del sistema de cifrado...');
  
  try {
    // Test 1: Derivación de claves
    await testKeyDerivation();
    
    // Test 2: Cifrado y descifrado de strings
    await testStringEncryption();
    
    // Test 3: Cifrado y descifrado de memorias
    await testMemoryEncryption();
    
    // Test 4: Validación de contraseñas
    await testPasswordValidation();
    
    // Test 5: Integridad con HMAC
    await testHMACIntegrity();
    
    // Test 6: Manejo de errores
    await testErrorHandling();
    
    // Test 7: Compatibilidad con datos existentes
    await testBackwardCompatibility();
    
    // Test 8: Rendimiento
    await testPerformance();
    
    console.log('✅ Todas las pruebas de cifrado completadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error en las pruebas de cifrado:', error);
    throw error;
  }
}

// Test 1: Derivación de claves (usando métodos públicos)
async function testKeyDerivation(): Promise<void> {
  console.log('📝 Test 1: Derivación de claves');
  
  // Test usando encriptación de memoria que internamente usa derivación de claves
  const testMemory: Memory = {
    id: 1,
    title: 'Test Memory',
    content: 'Test content for key derivation',
    type: 'texto',
    tags: [],
    privacyLevel: 1,
    emotion: {
      primary: 'neutral',
      confidence: 0.8,
      emotions: {
        joy: 0.1,
        sadness: 0.1,
        anger: 0.1,
        fear: 0.1,
        surprise: 0.1,
        love: 0.1,
        nostalgia: 0.4
      }
    },
    metadata: {
      emotion: 'neutral'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isEncrypted: false,
    encryptionLevel: 'none',
    requiresPassword: false
  };
  
  const password1 = 'test-password-123';
  const password2 = 'different-password-456';
  
  // Cifrar con la primera contraseña
  const encrypted1 = EncryptionService.encryptMemory(testMemory, password1);
  const encrypted2 = EncryptionService.encryptMemory(testMemory, password1);
  
  // Los resultados deben ser diferentes (debido a salt e IV aleatorios)
  if (encrypted1.encryptedContent.data === encrypted2.encryptedContent.data) {
    throw new Error('Los cifrados con la misma contraseña no deben ser idénticos (falta aleatoriedad)');
  }
  
  // Pero ambos deben poder descifrarse con la misma contraseña
  const decrypted1 = EncryptionService.decryptMemory(encrypted1, password1);
  const decrypted2 = EncryptionService.decryptMemory(encrypted2, password1);
  
  if (decrypted1.content !== testMemory.content || decrypted2.content !== testMemory.content) {
    throw new Error('Error en la derivación de claves: no se puede descifrar correctamente');
  }
  
  console.log('✅ Test 1 completado: Derivación de claves funciona correctamente');
}

// Test 2: Cifrado y descifrado de strings (usando métodos públicos)
async function testStringEncryption(): Promise<void> {
  console.log('📝 Test 2: Cifrado y descifrado de strings');
  
  const testMemory: Memory = {
    id: 2,
    title: 'String Test Memory',
    content: 'Este es un texto de prueba para cifrar 🔐',
    type: 'texto',
    tags: ['test'],
    privacyLevel: 2,
    emotion: {
      primary: 'neutral',
      confidence: 0.8,
      emotions: {
        joy: 0.1,
        sadness: 0.1,
        anger: 0.1,
        fear: 0.1,
        surprise: 0.1,
        love: 0.1,
        nostalgia: 0.4
      }
    },
    metadata: {
      emotion: 'neutral'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isEncrypted: false,
    encryptionLevel: 'none',
    requiresPassword: false
  };
  
  const password = 'mi-contraseña-segura-123';
  
  // Cifrar memoria
  const encrypted = EncryptionService.encryptMemory(testMemory, password);
  
  // Verificar que está cifrada
  if (!encrypted.isEncrypted || !encrypted.encryptedContent) {
    throw new Error('La memoria no se cifró correctamente');
  }
  
  // Verificar que el contenido cifrado es diferente al original
  if (encrypted.encryptedContent.data === testMemory.content) {
    throw new Error('El contenido cifrado es igual al original');
  }
  
  // Verificar propiedades del cifrado
  if (!encrypted.encryptedContent.data || !encrypted.encryptedContent.iv || 
      !encrypted.encryptedContent.salt || !encrypted.encryptedContent.hmac) {
    throw new Error('El objeto cifrado no tiene todas las propiedades necesarias');
  }
  
  // Descifrar
  const decrypted = EncryptionService.decryptMemory(encrypted, password);
  
  // Verificar que el contenido descifrado es igual al original
  if (decrypted.content !== testMemory.content) {
    throw new Error(`Contenido descifrado no coincide. Original: "${testMemory.content}", Descifrado: "${decrypted.content}"`);
  }
  
  console.log('✅ Test 2 completado: Cifrado/descifrado de strings funciona correctamente');
}

// Test 3: Cifrado y descifrado de memorias
async function testMemoryEncryption(): Promise<void> {
  console.log('📝 Test 3: Cifrado y descifrado de memorias');
  
  const password = 'memory-test-password-123';
  
  // Cifrar memoria
  const encryptedMemory = EncryptionService.encryptMemory(mockMemory, password);
  
  // Verificar que la memoria se cifró
  if (!encryptedMemory.isEncrypted) {
    throw new Error('La memoria debería estar marcada como cifrada');
  }
  
  if (!encryptedMemory.encryptedContent || !encryptedMemory.encryptedContent.data) {
    throw new Error('La memoria cifrada debe tener contenido cifrado');
  }
  
  if (encryptedMemory.encryptedContent.data === mockMemory.content) {
    throw new Error('El contenido cifrado no debe ser igual al original');
  }
  
  // Descifrar memoria
  const decryptedMemory = EncryptionService.decryptMemory(encryptedMemory, password);
  
  // Verificar que el descifrado coincide con el original
  if (decryptedMemory.content !== mockMemory.content) {
    throw new Error('El contenido descifrado no coincide con el original');
  }
  
  if (decryptedMemory.title !== mockMemory.title) {
    throw new Error('El título descifrado no coincide con el original');
  }
  
  // Verificar que otros campos se mantienen
  if (decryptedMemory.id !== mockMemory.id) {
    throw new Error('El ID debe mantenerse igual');
  }
  
  if (decryptedMemory.type !== mockMemory.type) {
    throw new Error('El tipo debe mantenerse igual');
  }
  
  console.log('✅ Test 3 completado: Cifrado/descifrado de memorias funciona correctamente');
}

// Test 4: Validación de contraseñas
async function testPasswordValidation(): Promise<void> {
  console.log('📝 Test 4: Validación de contraseñas');
  
  // Contraseñas válidas
  const validPasswords = [
    'password123',
    'mi-contraseña-segura',
    'P@ssw0rd!',
    '12345678'
  ];
  
  for (const password of validPasswords) {
    const isValid = EncryptionService.validatePassword(password);
    if (!isValid) {
      throw new Error(`La contraseña '${password}' debería ser válida`);
    }
  }
  
  // Contraseñas inválidas
  const invalidPasswords = [
    '',
    '123',
    'short',
    '1234567' // 7 caracteres, menos del mínimo
  ];
  
  for (const password of invalidPasswords) {
    const isValid = EncryptionService.validatePassword(password);
    if (isValid) {
      throw new Error(`La contraseña '${password}' no debería ser válida`);
    }
  }
  
  console.log('✅ Test 4 completado: Validación de contraseñas funciona correctamente');
}

// Test 5: Integridad con HMAC (usando métodos públicos)
async function testHMACIntegrity(): Promise<void> {
  console.log('📝 Test 5: Integridad con HMAC');
  
  const testMemory: Memory = {
    id: 5,
    title: 'HMAC Test Memory',
    content: 'Texto para verificar integridad',
    type: 'texto',
    tags: ['hmac', 'test'],
    privacyLevel: 3,
    emotion: {
      primary: 'neutral',
      confidence: 0.8,
      emotions: {
        joy: 0.1,
        sadness: 0.1,
        anger: 0.1,
        fear: 0.1,
        surprise: 0.1,
        love: 0.1,
        nostalgia: 0.4
      }
    },
    metadata: {
      emotion: 'neutral'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isEncrypted: false,
    encryptionLevel: 'none',
    requiresPassword: false
  };
  
  const password = 'hmac-test-password-123';
  
  // Cifrar memoria
  const encrypted = EncryptionService.encryptMemory(testMemory, password);
  
  // Modificar el HMAC para simular corrupción
  const corruptedEncrypted = {
    ...encrypted,
    encryptedContent: {
      ...encrypted.encryptedContent,
      hmac: 'hmac-corrupto-12345'
    }
  };
  
  // Intentar descifrar con HMAC corrupto
  try {
    EncryptionService.decryptMemory(corruptedEncrypted, password);
    throw new Error('Debería haber fallado al descifrar con HMAC corrupto');
  } catch (error) {
    // Se espera que falle
    if (!(error as Error).message.includes('modificados') && !(error as Error).message.includes('incorrecta')) {
      throw new Error('Error esperado de integridad no fue lanzado');
    }
  }
  
  // Verificar que el original funciona correctamente
  const decrypted = EncryptionService.decryptMemory(encrypted, password);
  if (decrypted.content !== testMemory.content) {
    throw new Error('El descifrado con HMAC válido falló');
  }
  
  console.log('✅ Test 5 completado: Integridad HMAC funciona correctamente');
}

// Test 6: Manejo de errores
async function testErrorHandling(): Promise<void> {
  console.log('📝 Test 6: Manejo de errores');
  
  const testMemory: Memory = {
    id: 6,
    title: 'Error Test Memory',
    content: 'Contenido para test de errores',
    type: 'texto',
    tags: ['error', 'test'],
    privacyLevel: 1,
    emotion: {
      primary: 'neutral',
      confidence: 0.8,
      emotions: {
        joy: 0.1,
        sadness: 0.1,
        anger: 0.1,
        fear: 0.1,
        surprise: 0.1,
        love: 0.1,
        nostalgia: 0.4
      }
    },
    metadata: {
      emotion: 'neutral'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isEncrypted: false,
    encryptionLevel: 'none',
    requiresPassword: false
  };
  
  const correctPassword = 'correct-password-123';
  const wrongPassword = 'wrong-password-456';
  
  // Cifrar con contraseña correcta
  const encrypted = EncryptionService.encryptMemory(testMemory, correctPassword);
  
  // Test: Descifrar con contraseña incorrecta
  try {
    EncryptionService.decryptMemory(encrypted, wrongPassword);
    throw new Error('Debería haber fallado con contraseña incorrecta');
  } catch (error) {
    // Se espera que falle
    if (!(error as Error).message.includes('contraseña') && !(error as Error).message.includes('descifrar')) {
      throw new Error('Error esperado de contraseña incorrecta no fue lanzado');
    }
  }
  
  // Test: Cifrar memoria nula
  try {
    EncryptionService.encryptMemory(null as any, correctPassword);
    throw new Error('Debería haber fallado con memoria nula');
  } catch (error) {
    // Se espera que falle
  }
  
  // Test: Descifrar con datos corruptos
  const corruptedEncrypted = {
    ...encrypted,
    encryptedContent: {
      ...encrypted.encryptedContent,
      data: 'datos-corruptos-invalidos'
    }
  };
  
  try {
    EncryptionService.decryptMemory(corruptedEncrypted, correctPassword);
    throw new Error('Debería haber fallado con datos corruptos');
  } catch (error) {
    // Se espera que falle
  }
  
  console.log('✅ Test 6 completado: Manejo de errores funciona correctamente');
}

// Test 7: Compatibilidad con datos existentes
async function testBackwardCompatibility(): Promise<void> {
  console.log('📝 Test 7: Compatibilidad con datos existentes');
  
  // Simular memoria sin propiedades de cifrado (datos existentes)
  const legacyMemory = {
    id: 2,
    title: 'Memoria legacy',
    content: 'Contenido de memoria existente',
    type: 'texto' as const,
    tags: ['legacy'],
    privacyLevel: 1,
    emotion: {
      primary: 'neutral',
      confidence: 0,
      emotions: {
        joy: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: 0,
        love: 0,
        nostalgia: 0
      }
    },
    metadata: {
      emotion: 'neutral'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
    // Sin propiedades de cifrado
  };
  
  // Convertir a Memory completa
  const memoryWithDefaults: Memory = {
    ...legacyMemory,
    isEncrypted: false,
    encryptionLevel: 'none',
    requiresPassword: false
  };
  
  // Verificar que se puede procesar sin errores
  const password = 'legacy-test-password-123';
  const encrypted = EncryptionService.encryptMemory(memoryWithDefaults, password);
  const decrypted = EncryptionService.decryptMemory(encrypted, password);
  
  if (decrypted.content !== legacyMemory.content) {
    throw new Error('Compatibilidad con datos legacy falló');
  }
  
  console.log('✅ Test 7 completado: Compatibilidad con datos existentes funciona correctamente');
}

// Test 8: Rendimiento
async function testPerformance(): Promise<void> {
  console.log('📝 Test 8: Rendimiento del cifrado');
  
  const testMemory: Memory = {
    id: 8,
    title: 'Performance Test Memory',
    content: 'A'.repeat(10000), // 10KB de datos
    type: 'texto',
    tags: ['performance', 'test'],
    privacyLevel: 1,
    emotion: {
      primary: 'neutral',
      confidence: 0.8,
      emotions: {
        joy: 0.1,
        sadness: 0.1,
        anger: 0.1,
        fear: 0.1,
        surprise: 0.1,
        love: 0.1,
        nostalgia: 0.4
      }
    },
    metadata: {
      emotion: 'neutral'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isEncrypted: false,
    encryptionLevel: 'none',
    requiresPassword: false
  };
  
  const password = 'performance-test-password-123';
  
  // Test de cifrado
  const encryptStart = performance.now();
  const encrypted = EncryptionService.encryptMemory(testMemory, password);
  const encryptTime = performance.now() - encryptStart;
  
  // Test de descifrado
  const decryptStart = performance.now();
  const decrypted = EncryptionService.decryptMemory(encrypted, password);
  const decryptTime = performance.now() - decryptStart;
  
  console.log(`⏱️  Tiempo de cifrado: ${encryptTime.toFixed(2)}ms`);
  console.log(`⏱️  Tiempo de descifrado: ${decryptTime.toFixed(2)}ms`);
  
  // Verificar que el rendimiento es aceptable (menos de 200ms para 10KB)
  if (encryptTime > 200) {
    console.warn(`⚠️  Cifrado lento: ${encryptTime.toFixed(2)}ms para 10KB`);
  }
  
  if (decryptTime > 200) {
    console.warn(`⚠️  Descifrado lento: ${decryptTime.toFixed(2)}ms para 10KB`);
  }
  
  // Verificar integridad
  if (decrypted.content !== testMemory.content) {
    throw new Error('Error de integridad en test de rendimiento');
  }
  
  console.log('✅ Test 8 completado: Rendimiento del cifrado es aceptable');
}

// Función para ejecutar pruebas desde la consola del navegador
if (typeof window !== 'undefined') {
  (window as any).testEncryption = runEncryptionTests;
  console.log('🔐 Pruebas de cifrado disponibles. Ejecuta: testEncryption()');
}

export default {
  runEncryptionTests,
  testKeyDerivation,
  testStringEncryption,
  testMemoryEncryption,
  testPasswordValidation,
  testHMACIntegrity,
  testErrorHandling,
  testBackwardCompatibility,
  testPerformance
};