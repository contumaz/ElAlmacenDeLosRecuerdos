// Script para testing del sistema de logging desde la consola del navegador
// Copiar y pegar este código en la consola del navegador

console.log('=== INICIANDO TESTING MANUAL DEL SISTEMA DE LOGGING ===');

// Función principal de testing
function testLoggingSystemManual() {
  console.log('🔍 Verificando disponibilidad del LoggingService...');
  
  // Verificar si LoggingService está disponible globalmente
  if (typeof window.LoggingService !== 'undefined') {
    console.log('✅ LoggingService encontrado globalmente');
    
    // Generar logs de prueba
    console.log('📝 Generando logs de prueba...');
    
    window.LoggingService.info('Testing Manual', 'Sistema de logging funcionando correctamente');
    window.LoggingService.warning('Testing Manual', 'Esta es una advertencia de prueba');
    window.LoggingService.error('Testing Manual', 'Este es un error de prueba', new Error('Error simulado para testing'));
    
    console.log('✅ Logs de prueba generados');
    
    // Verificar logs almacenados
    const logs = window.LoggingService.getLogs();
    console.log(`📊 Total de logs almacenados: ${logs.length}`);
    
    if (logs.length > 0) {
      console.log('📋 Últimos 5 logs:');
      logs.slice(-5).forEach((log, index) => {
        console.log(`${index + 1}. [${log.level}] ${log.message} (${log.context || 'Sin contexto'})`);
      });
    }
    
    // Obtener estadísticas
    const stats = window.LoggingService.getLogStats();
    console.log('📈 Estadísticas de logs:', stats);
    
    return true;
  } else {
    console.error('❌ LoggingService no está disponible globalmente');
    console.log('🔧 Intentando importar directamente...');
    
    // Intentar acceder a través de módulos
    try {
      // Esto podría no funcionar en todos los navegadores
      console.log('⚠️ LoggingService no está expuesto. Verifica que la aplicación esté en modo desarrollo.');
      return false;
    } catch (error) {
      console.error('❌ Error al intentar acceder al LoggingService:', error);
      return false;
    }
  }
}

// Función para testing de errores del hook useErrorHandler
function testErrorHandler() {
  console.log('🔍 Testing del hook useErrorHandler...');
  
  // Simular diferentes tipos de errores
  const errorTypes = [
    { severity: 'error', message: 'Error crítico de prueba', context: 'TestingManual' },
    { severity: 'warning', message: 'Advertencia de prueba', context: 'TestingManual' },
    { severity: 'info', message: 'Información de prueba', context: 'TestingManual' }
  ];
  
  errorTypes.forEach((errorData, index) => {
    setTimeout(() => {
      const errorEvent = new CustomEvent('app-error', {
        detail: {
          ...errorData,
          timestamp: Date.now(),
          id: `test-error-${index + 1}`
        }
      });
      
      window.dispatchEvent(errorEvent);
      console.log(`✅ Evento de error simulado: ${errorData.message}`);
    }, index * 1000);
  });
}

// Función para testing de operaciones que generan logs
function testOperationsWithLogging() {
  console.log('🔍 Testing de operaciones que deberían generar logs...');
  
  // Simular operaciones de memoria
  try {
    // Operaciones localStorage
    const testData = {
      id: 'test-memory-' + Date.now(),
      title: 'Memoria de prueba para logging',
      content: 'Contenido de prueba',
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('test-memory-logging', JSON.stringify(testData));
    console.log('✅ Operación localStorage (guardar) completada');
    
    const retrieved = localStorage.getItem('test-memory-logging');
    console.log('✅ Operación localStorage (leer) completada');
    
    localStorage.removeItem('test-memory-logging');
    console.log('✅ Operación localStorage (eliminar) completada');
    
  } catch (error) {
    console.error('❌ Error en operaciones localStorage:', error);
  }
  
  // Simular validaciones
  try {
    const invalidData = { invalid: true };
    console.log('✅ Simulación de validación completada');
  } catch (error) {
    console.error('❌ Error en simulación de validación:', error);
  }
}

// Función para generar actividad continua
function generateContinuousActivity() {
  console.log('🔄 Iniciando generación de actividad continua...');
  
  let counter = 0;
  const interval = setInterval(() => {
    counter++;
    
    if (window.LoggingService) {
      // Generar diferentes tipos de logs
      if (counter % 3 === 0) {
        window.LoggingService.info(`Actividad automática #${counter}`, 'ContinuousActivity');
      } else if (counter % 5 === 0) {
        window.LoggingService.warning(`Advertencia automática #${Math.floor(counter / 5)}`, 'ContinuousActivity');
      } else if (counter % 7 === 0) {
        window.LoggingService.error(`Error automático #${Math.floor(counter / 7)}`, new Error(`Error simulado #${Math.floor(counter / 7)}`), 'ContinuousActivity');
      }
    }
    
    // Detener después de 15 iteraciones
    if (counter >= 15) {
      clearInterval(interval);
      console.log('✅ Generación de actividad continua completada');
      
      // Mostrar resumen final
      if (window.LoggingService) {
        const finalStats = window.LoggingService.getLogStats();
        console.log('📊 Estadísticas finales:', finalStats);
      }
    }
  }, 2000);
  
  return interval;
}

// Ejecutar testing completo
function runCompleteTest() {
  console.log('🚀 Ejecutando testing completo del sistema de logging...');
  
  const success = testLoggingSystemManual();
  
  if (success) {
    setTimeout(() => testErrorHandler(), 1000);
    setTimeout(() => testOperationsWithLogging(), 3000);
    setTimeout(() => generateContinuousActivity(), 5000);
    
    console.log('⏱️ Testing programado para los próximos 35 segundos...');
    console.log('📋 Revisa la pestaña "Errores" en el Testing Dashboard para ver los resultados.');
  } else {
    console.log('❌ No se pudo completar el testing. Verifica que LoggingService esté disponible.');
  }
}

// Exponer funciones para uso manual
console.log('📚 Funciones disponibles:');
console.log('- testLoggingSystemManual(): Testing básico del LoggingService');
console.log('- testErrorHandler(): Testing del hook useErrorHandler');
console.log('- testOperationsWithLogging(): Testing de operaciones con logging');
console.log('- generateContinuousActivity(): Generar actividad continua');
console.log('- runCompleteTest(): Ejecutar testing completo');
console.log('');
console.log('💡 Para ejecutar el testing completo, escribe: runCompleteTest()');

// Auto-ejecutar testing básico
testLoggingSystemManual();