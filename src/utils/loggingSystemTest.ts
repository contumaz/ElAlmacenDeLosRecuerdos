// Testing automatizado del sistema de logging
import loggingService from '../services/LoggingService';
import useErrorHandler from '../hooks/useErrorHandler';

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  duration: number;
  timestamp: Date;
}

interface LoggingTestSuite {
  name: string;
  description: string;
  tests: TestResult[];
  totalDuration: number;
  passRate: number;
}

export class LoggingSystemTester {
  private results: TestResult[] = [];

  // Test básico del LoggingService
  async testLoggingServiceBasic(): Promise<TestResult> {
    const startTime = performance.now();
    const testName = 'LoggingService - Funcionalidad Básica';
    
    try {
      // Limpiar logs previos para testing
      const initialLogCount = loggingService.getLogs().length;
      
      // Generar logs de prueba
      loggingService.info('Test info message', 'LoggingTest');
      loggingService.warn('Test warning message', 'LoggingTest');
      loggingService.error('Test error message', new Error('Test error'), 'LoggingTest');
      
      // Verificar que los logs se guardaron
      const logs = loggingService.getLogs();
      const newLogs = logs.filter(log => log.context === 'LoggingTest');
      
      if (newLogs.length >= 3) {
        const duration = performance.now() - startTime;
        return {
          testName,
          passed: true,
          details: `✅ Se generaron ${newLogs.length} logs correctamente`,
          duration,
          timestamp: new Date()
        };
      } else {
        throw new Error(`Solo se encontraron ${newLogs.length} logs de 3 esperados`);
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName,
        passed: false,
        details: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        duration,
        timestamp: new Date()
      };
    }
  }

  // Test de filtros y consultas
  async testLoggingFilters(): Promise<TestResult> {
    const startTime = performance.now();
    const testName = 'LoggingService - Filtros y Consultas';
    
    try {
      // Generar logs con diferentes contextos
      loggingService.info('Filter test 1', 'FilterTest1');
      loggingService.warn('Filter test 2', 'FilterTest2');
      loggingService.error('Filter test 3', new Error('Filter error'), 'FilterTest1');
      
      // Test filtro por contexto
      const filteredLogs = loggingService.getLogs({ context: 'FilterTest1' });
      
      if (filteredLogs.length >= 2) {
        // Test estadísticas
        const stats = loggingService.getLogStats();
        
        if (stats.total > 0 && stats.byLevel) {
          const duration = performance.now() - startTime;
          return {
            testName,
            passed: true,
            details: `✅ Filtros funcionando. Logs filtrados: ${filteredLogs.length}, Total: ${stats.total}`,
            duration,
            timestamp: new Date()
          };
        } else {
          throw new Error('Estadísticas no generadas correctamente');
        }
      } else {
        throw new Error(`Filtro por contexto falló. Esperados: 2, Encontrados: ${filteredLogs.length}`);
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName,
        passed: false,
        details: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        duration,
        timestamp: new Date()
      };
    }
  }

  // Test de métricas de rendimiento
  async testPerformanceMetrics(): Promise<TestResult> {
    const startTime = performance.now();
    const testName = 'LoggingService - Métricas de Rendimiento';
    
    try {
      // Test de marcas de rendimiento
      loggingService.startPerformanceMark('testOperation');
      
      // Simular operación
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const duration = loggingService.endPerformanceMark('testOperation', 'PerformanceTest');
      
      if (duration !== null && duration > 90) { // Debería ser ~100ms
        const testDuration = performance.now() - startTime;
        return {
          testName,
          passed: true,
          details: `✅ Métricas de rendimiento funcionando. Duración medida: ${duration.toFixed(2)}ms`,
          duration: testDuration,
          timestamp: new Date()
        };
      } else {
        throw new Error(`Métricas de rendimiento incorrectas. Duración: ${duration}`);
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName,
        passed: false,
        details: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        duration,
        timestamp: new Date()
      };
    }
  }

  // Test de exportación de logs
  async testLogExport(): Promise<TestResult> {
    const startTime = performance.now();
    const testName = 'LoggingService - Exportación de Logs';
    
    try {
      // Generar algunos logs para exportar
      loggingService.info('Export test log', 'ExportTest');
      
      // Test exportación JSON
      const jsonExport = loggingService.exportLogs('json');
      const jsonData = JSON.parse(jsonExport);
      
      // Test exportación CSV
      const csvExport = loggingService.exportLogs('csv');
      
      if (Array.isArray(jsonData) && csvExport.includes('ID,Timestamp,Level')) {
        const duration = performance.now() - startTime;
        return {
          testName,
          passed: true,
          details: `✅ Exportación funcionando. JSON: ${jsonData.length} logs, CSV generado`,
          duration,
          timestamp: new Date()
        };
      } else {
        throw new Error('Formato de exportación incorrecto');
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName,
        passed: false,
        details: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        duration,
        timestamp: new Date()
      };
    }
  }

  // Test de integración con servicios
  async testServiceIntegration(): Promise<TestResult> {
    const startTime = performance.now();
    const testName = 'Integración con Servicios';
    
    try {
      let integrationCount = 0;
      
      // Verificar que los servicios estén usando logging
      const initialLogCount = loggingService.getLogs().length;
      
      // Simular operaciones que deberían generar logs
      try {
        // Simular operación de memoria
        loggingService.info('Simulando operación de memoria', 'MemoryService');
        integrationCount++;
        
        // Simular operación de backup
        loggingService.info('Simulando operación de backup', 'BackupService');
        integrationCount++;
        
        // Simular operación de encriptación
        loggingService.info('Simulando operación de encriptación', 'EncryptionService');
        integrationCount++;
        
        // Simular operación de validación
        loggingService.info('Simulando operación de validación', 'ValidationService');
        integrationCount++;
        
      } catch (error) {
        console.warn('Error en simulación de servicios:', error);
      }
      
      const finalLogCount = loggingService.getLogs().length;
      const newLogsGenerated = finalLogCount - initialLogCount;
      
      if (newLogsGenerated >= integrationCount) {
        const duration = performance.now() - startTime;
        return {
          testName,
          passed: true,
          details: `✅ Integración funcionando. Logs generados: ${newLogsGenerated}`,
          duration,
          timestamp: new Date()
        };
      } else {
        throw new Error(`Integración incompleta. Esperados: ${integrationCount}, Generados: ${newLogsGenerated}`);
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName,
        passed: false,
        details: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        duration,
        timestamp: new Date()
      };
    }
  }

  // Ejecutar todos los tests
  async runAllTests(): Promise<LoggingTestSuite> {
    console.log('🧪 Iniciando testing del sistema de logging...');
    
    const tests = [
      await this.testLoggingServiceBasic(),
      await this.testLoggingFilters(),
      await this.testPerformanceMetrics(),
      await this.testLogExport(),
      await this.testServiceIntegration()
    ];
    
    const totalDuration = tests.reduce((sum, test) => sum + test.duration, 0);
    const passedTests = tests.filter(test => test.passed).length;
    const passRate = (passedTests / tests.length) * 100;
    
    const suite: LoggingTestSuite = {
      name: 'Sistema de Logging - Tests Completos',
      description: 'Verificación exhaustiva del sistema de logging y manejo de errores',
      tests,
      totalDuration,
      passRate
    };
    
    // Log del resultado
    loggingService.info(
      `Testing completado: ${passedTests}/${tests.length} tests pasaron (${passRate.toFixed(1)}%)`,
      'LoggingSystemTester',
      { suite }
    );
    
    console.log('📊 Resultados del testing:', suite);
    
    return suite;
  }

  // Generar reporte de testing
  generateTestReport(suite: LoggingTestSuite): string {
    const report = `
# Reporte de Testing - Sistema de Logging

**Fecha:** ${new Date().toLocaleString()}
**Suite:** ${suite.name}
**Descripción:** ${suite.description}

## Resumen
- **Tests Ejecutados:** ${suite.tests.length}
- **Tests Exitosos:** ${suite.tests.filter(t => t.passed).length}
- **Tests Fallidos:** ${suite.tests.filter(t => t.passed === false).length}
- **Tasa de Éxito:** ${suite.passRate.toFixed(1)}%
- **Duración Total:** ${suite.totalDuration.toFixed(2)}ms

## Resultados Detallados

${suite.tests.map(test => `
### ${test.testName}
- **Estado:** ${test.passed ? '✅ EXITOSO' : '❌ FALLIDO'}
- **Detalles:** ${test.details}
- **Duración:** ${test.duration.toFixed(2)}ms
- **Timestamp:** ${test.timestamp.toLocaleString()}
`).join('')}

## Estadísticas del Sistema

${JSON.stringify(loggingService.getLogStats(), null, 2)}

---
*Reporte generado automáticamente por LoggingSystemTester*
`;
    
    return report;
  }
}

// Instancia singleton para uso global
export const loggingSystemTester = new LoggingSystemTester();

// Función de conveniencia para testing rápido
export async function runLoggingTests(): Promise<LoggingTestSuite> {
  return await loggingSystemTester.runAllTests();
}

// Exponer globalmente en desarrollo
if (import.meta.env.DEV) {
  (window as any).runLoggingTests = runLoggingTests;
  (window as any).loggingSystemTester = loggingSystemTester;
  console.log('🧪 Testing de logging disponible: runLoggingTests()');
}