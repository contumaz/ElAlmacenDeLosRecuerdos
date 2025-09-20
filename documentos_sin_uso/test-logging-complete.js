// Script completo de testing del sistema de logging
// Ejecutar en la consola del navegador: loadScript('/test-logging-complete.js')

(function() {
    'use strict';
    
    console.log('🧪 Iniciando testing completo del sistema de logging...');
    
    // Verificar disponibilidad de LoggingService
    if (typeof window.LoggingService === 'undefined') {
        console.error('❌ LoggingService no está disponible globalmente');
        return;
    }
    
    const LoggingService = window.LoggingService;
    
    // Clase de testing
    class LoggingSystemTester {
        constructor() {
            this.results = [];
            this.startTime = performance.now();
        }
        
        // Test básico del LoggingService
        async testBasicLogging() {
            console.log('🔍 Test 1: Funcionalidad básica de logging...');
            const testStart = performance.now();
            
            try {
                // Limpiar logs previos
                const initialCount = LoggingService.getLogs().length;
                
                // Generar logs de prueba
                LoggingService.info('Test info message', 'BasicTest');
                LoggingService.warning('Test warning message', 'BasicTest');
                LoggingService.error('Test error message', new Error('Test error'), 'BasicTest');
                LoggingService.debug('Test debug message', 'BasicTest');
                
                // Verificar logs
                const logs = LoggingService.getLogs();
                const testLogs = logs.filter(log => log.context === 'BasicTest');
                
                const duration = performance.now() - testStart;
                
                if (testLogs.length >= 4) {
                    console.log(`✅ Test 1 EXITOSO: ${testLogs.length} logs generados en ${duration.toFixed(2)}ms`);
                    return { passed: true, details: `${testLogs.length} logs generados`, duration };
                } else {
                    throw new Error(`Solo ${testLogs.length} logs de 4 esperados`);
                }
            } catch (error) {
                const duration = performance.now() - testStart;
                console.error(`❌ Test 1 FALLIDO: ${error.message}`);
                return { passed: false, details: error.message, duration };
            }
        }
        
        // Test de filtros y consultas
        async testFiltersAndQueries() {
            console.log('🔍 Test 2: Filtros y consultas...');
            const testStart = performance.now();
            
            try {
                // Generar logs con diferentes contextos y niveles
                LoggingService.info('Filter test info', 'FilterTest');
                LoggingService.warning('Filter test warning', 'FilterTest');
                LoggingService.error('Filter test error', new Error('Filter error'), 'FilterTest');
                LoggingService.info('Other context info', 'OtherContext');
                
                // Test filtro por contexto
                const contextLogs = LoggingService.getLogs({ context: 'FilterTest' });
                
                // Test filtro por nivel
                const errorLogs = LoggingService.getLogs({ level: 'error' });
                
                // Test estadísticas
                const stats = LoggingService.getLogStats();
                
                const duration = performance.now() - testStart;
                
                if (contextLogs.length >= 3 && errorLogs.length >= 1 && stats.total > 0) {
                    console.log(`✅ Test 2 EXITOSO: Filtros funcionando correctamente`);
                    console.log(`   - Logs por contexto: ${contextLogs.length}`);
                    console.log(`   - Logs de error: ${errorLogs.length}`);
                    console.log(`   - Total en stats: ${stats.total}`);
                    return { 
                        passed: true, 
                        details: `Contexto: ${contextLogs.length}, Errores: ${errorLogs.length}, Total: ${stats.total}`, 
                        duration 
                    };
                } else {
                    throw new Error(`Filtros fallaron: contexto=${contextLogs.length}, errores=${errorLogs.length}, total=${stats.total}`);
                }
            } catch (error) {
                const duration = performance.now() - testStart;
                console.error(`❌ Test 2 FALLIDO: ${error.message}`);
                return { passed: false, details: error.message, duration };
            }
        }
        
        // Test de métricas de rendimiento
        async testPerformanceMetrics() {
            console.log('🔍 Test 3: Métricas de rendimiento...');
            const testStart = performance.now();
            
            try {
                // Iniciar marca de rendimiento
                LoggingService.startPerformanceMark('testOperation');
                
                // Simular operación
                await new Promise(resolve => setTimeout(resolve, 150));
                
                // Finalizar marca
                const operationDuration = LoggingService.endPerformanceMark('testOperation', 'PerformanceTest');
                
                const testDuration = performance.now() - testStart;
                
                if (operationDuration !== null && operationDuration > 140 && operationDuration < 200) {
                    console.log(`✅ Test 3 EXITOSO: Métricas de rendimiento funcionando`);
                    console.log(`   - Duración medida: ${operationDuration.toFixed(2)}ms`);
                    return { 
                        passed: true, 
                        details: `Duración medida: ${operationDuration.toFixed(2)}ms`, 
                        duration: testDuration 
                    };
                } else {
                    throw new Error(`Métricas incorrectas: ${operationDuration}ms (esperado ~150ms)`);
                }
            } catch (error) {
                const duration = performance.now() - testStart;
                console.error(`❌ Test 3 FALLIDO: ${error.message}`);
                return { passed: false, details: error.message, duration };
            }
        }
        
        // Test de exportación
        async testExportFunctionality() {
            console.log('🔍 Test 4: Funcionalidad de exportación...');
            const testStart = performance.now();
            
            try {
                // Generar logs para exportar
                LoggingService.info('Export test log 1', 'ExportTest');
                LoggingService.warning('Export test log 2', 'ExportTest');
                
                // Test exportación JSON
                const jsonExport = LoggingService.exportLogs('json');
                const jsonData = JSON.parse(jsonExport);
                
                // Test exportación CSV
                const csvExport = LoggingService.exportLogs('csv');
                
                const duration = performance.now() - testStart;
                
                if (Array.isArray(jsonData) && jsonData.length > 0 && csvExport.includes('ID,Timestamp,Level')) {
                    console.log(`✅ Test 4 EXITOSO: Exportación funcionando`);
                    console.log(`   - JSON: ${jsonData.length} logs`);
                    console.log(`   - CSV: ${csvExport.split('\n').length - 1} líneas`);
                    return { 
                        passed: true, 
                        details: `JSON: ${jsonData.length} logs, CSV generado`, 
                        duration 
                    };
                } else {
                    throw new Error('Formato de exportación incorrecto');
                }
            } catch (error) {
                const duration = performance.now() - testStart;
                console.error(`❌ Test 4 FALLIDO: ${error.message}`);
                return { passed: false, details: error.message, duration };
            }
        }
        
        // Test de configuración y límites
        async testConfigurationAndLimits() {
            console.log('🔍 Test 5: Configuración y límites...');
            const testStart = performance.now();
            
            try {
                // Obtener configuración actual
                const currentConfig = LoggingService.getConfig ? LoggingService.getConfig() : null;
                
                // Generar muchos logs para probar límites
                const initialCount = LoggingService.getLogs().length;
                
                for (let i = 0; i < 10; i++) {
                    LoggingService.info(`Limit test log ${i}`, 'LimitTest');
                }
                
                const finalCount = LoggingService.getLogs().length;
                const newLogs = finalCount - initialCount;
                
                const duration = performance.now() - testStart;
                
                if (newLogs === 10) {
                    console.log(`✅ Test 5 EXITOSO: Configuración y límites funcionando`);
                    console.log(`   - Logs generados: ${newLogs}`);
                    console.log(`   - Total de logs: ${finalCount}`);
                    return { 
                        passed: true, 
                        details: `${newLogs} logs generados, total: ${finalCount}`, 
                        duration 
                    };
                } else {
                    throw new Error(`Límites incorrectos: generados ${newLogs} de 10 esperados`);
                }
            } catch (error) {
                const duration = performance.now() - testStart;
                console.error(`❌ Test 5 FALLIDO: ${error.message}`);
                return { passed: false, details: error.message, duration };
            }
        }
        
        // Ejecutar todos los tests
        async runAllTests() {
            console.log('🚀 Ejecutando suite completa de tests...');
            console.log('=' .repeat(50));
            
            const tests = [
                { name: 'Funcionalidad Básica', test: () => this.testBasicLogging() },
                { name: 'Filtros y Consultas', test: () => this.testFiltersAndQueries() },
                { name: 'Métricas de Rendimiento', test: () => this.testPerformanceMetrics() },
                { name: 'Funcionalidad de Exportación', test: () => this.testExportFunctionality() },
                { name: 'Configuración y Límites', test: () => this.testConfigurationAndLimits() }
            ];
            
            const results = [];
            
            for (const testCase of tests) {
                try {
                    const result = await testCase.test();
                    results.push({ name: testCase.name, ...result });
                } catch (error) {
                    results.push({ 
                        name: testCase.name, 
                        passed: false, 
                        details: error.message, 
                        duration: 0 
                    });
                }
                
                // Pausa entre tests
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Generar reporte final
            this.generateFinalReport(results);
            
            return results;
        }
        
        // Generar reporte final
        generateFinalReport(results) {
            const totalDuration = performance.now() - this.startTime;
            const passedTests = results.filter(r => r.passed).length;
            const totalTests = results.length;
            const passRate = (passedTests / totalTests) * 100;
            
            console.log('\n' + '=' .repeat(50));
            console.log('📊 REPORTE FINAL DEL SISTEMA DE LOGGING');
            console.log('=' .repeat(50));
            console.log(`🕒 Duración total: ${totalDuration.toFixed(2)}ms`);
            console.log(`✅ Tests exitosos: ${passedTests}/${totalTests}`);
            console.log(`📈 Tasa de éxito: ${passRate.toFixed(1)}%`);
            console.log('');
            
            // Detalles por test
            results.forEach((result, index) => {
                const status = result.passed ? '✅' : '❌';
                console.log(`${status} Test ${index + 1}: ${result.name}`);
                console.log(`   Detalles: ${result.details}`);
                console.log(`   Duración: ${result.duration.toFixed(2)}ms`);
                console.log('');
            });
            
            // Estadísticas del sistema
            try {
                const stats = LoggingService.getLogStats();
                console.log('📈 ESTADÍSTICAS DEL SISTEMA:');
                console.log(`   Total de logs: ${stats.total}`);
                console.log(`   Por nivel:`, stats.byLevel);
                console.log(`   Por contexto:`, stats.byContext);
            } catch (error) {
                console.warn('⚠️ No se pudieron obtener estadísticas del sistema');
            }
            
            // Resultado general
            if (passRate >= 80) {
                console.log('\n🎉 SISTEMA DE LOGGING: FUNCIONANDO CORRECTAMENTE');
                LoggingService.info(`Testing completado exitosamente: ${passedTests}/${totalTests} tests pasaron`, 'LoggingSystemTester');
            } else {
                console.log('\n⚠️ SISTEMA DE LOGGING: REQUIERE ATENCIÓN');
                LoggingService.warning(`Testing completado con problemas: ${passedTests}/${totalTests} tests pasaron`, 'LoggingSystemTester');
            }
            
            console.log('=' .repeat(50));
            
            // Guardar resultados globalmente
            window.loggingTestResults = {
                results,
                totalDuration,
                passRate,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    // Función principal de testing
    window.runCompleteLoggingTest = async function() {
        const tester = new LoggingSystemTester();
        return await tester.runAllTests();
    };
    
    // Auto-ejecutar si se especifica
    if (window.location.hash === '#autotest') {
        setTimeout(() => {
            console.log('🔄 Auto-ejecutando tests...');
            window.runCompleteLoggingTest();
        }, 2000);
    }
    
    console.log('✅ Script de testing cargado. Ejecutar: runCompleteLoggingTest()');
    
})();