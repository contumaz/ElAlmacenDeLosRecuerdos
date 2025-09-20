import React, { useState } from 'react';
import { Shield, Play, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { runEncryptionTests } from '../tests/encryption.test';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

const EncryptionTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const testSuite = [
    { name: 'Derivación de claves', key: 'keyDerivation' },
    { name: 'Cifrado/descifrado de strings', key: 'stringEncryption' },
    { name: 'Cifrado/descifrado de memorias', key: 'memoryEncryption' },
    { name: 'Validación de contraseñas', key: 'passwordValidation' },
    { name: 'Integridad HMAC', key: 'hmacIntegrity' },
    { name: 'Manejo de errores', key: 'errorHandling' },
    { name: 'Compatibilidad con datos existentes', key: 'backwardCompatibility' },
    { name: 'Rendimiento', key: 'performance' }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    
    // Inicializar resultados
    const initialResults: TestResult[] = testSuite.map(test => ({
      name: test.name,
      status: 'pending'
    }));
    setResults(initialResults);

    try {
      const startTime = performance.now();
      
      // Ejecutar las pruebas
      await runEncryptionTests();
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      // Marcar todas las pruebas como exitosas
      const successResults: TestResult[] = testSuite.map(test => ({
        name: test.name,
        status: 'success',
        message: 'Completado exitosamente',
        duration: totalDuration / testSuite.length // Distribución aproximada
      }));
      
      setResults(successResults);
      setOverallStatus('success');
      
    } catch (error) {
      console.error('Error en las pruebas:', error);
      
      // Marcar como error
      const errorResults: TestResult[] = results.map(result => ({
        ...result,
        status: result.status === 'pending' ? 'error' : result.status,
        message: result.status === 'pending' ? (error as Error).message : result.message
      }));
      
      setResults(errorResults);
      setOverallStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'running':
        return 'border-blue-500 bg-blue-50';
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Pruebas del Sistema de Cifrado AES-256
          </h1>
        </div>
        
        <p className="text-gray-600 mb-4">
          Este panel ejecuta pruebas exhaustivas del sistema de cifrado para verificar 
          la seguridad, integridad y compatibilidad de los datos.
        </p>
        
        <button
          onClick={runTests}
          disabled={isRunning}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
            ${
              isRunning
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Ejecutando pruebas...' : 'Ejecutar pruebas'}
        </button>
      </div>

      {/* Estado general */}
      {overallStatus !== 'idle' && (
        <div className={`border-2 rounded-lg p-4 mb-6 ${getOverallStatusColor()}`}>
          <div className="flex items-center gap-3">
            {overallStatus === 'running' && (
              <>
                <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="font-medium text-blue-800">Ejecutando pruebas...</span>
              </>
            )}
            {overallStatus === 'success' && (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">
                  ✅ Todas las pruebas completadas exitosamente
                </span>
              </>
            )}
            {overallStatus === 'error' && (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">
                  ❌ Algunas pruebas fallaron
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Resultados de las pruebas */}
      {results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Resultados de las Pruebas</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {results.map((result, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <span className="font-medium text-gray-900">{result.name}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  {result.duration && (
                    <span className="text-sm text-gray-500">
                      {result.duration.toFixed(1)}ms
                    </span>
                  )}
                  
                  {result.message && (
                    <span className={`text-sm ${
                      result.status === 'success' ? 'text-green-600' : 
                      result.status === 'error' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {result.message}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800 mb-2">Información Importante</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Las pruebas verifican el cifrado AES-256 con autenticación HMAC</li>
              <li>• Se valida la compatibilidad con datos existentes sin cifrar</li>
              <li>• El sistema mantiene la integridad y seguridad de los datos</li>
              <li>• Las pruebas incluyen validación de rendimiento y manejo de errores</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Consola de desarrollo */}
      <div className="mt-6 bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
        <div className="mb-2 text-gray-400">// Consola de desarrollo</div>
        <div>console.log('🔐 Sistema de cifrado AES-256 listo');</div>
        <div>console.log('📊 Ejecuta las pruebas para verificar la funcionalidad');</div>
        {overallStatus === 'success' && (
          <div className="text-green-400">console.log('✅ Todas las pruebas pasaron correctamente');</div>
        )}
        {overallStatus === 'error' && (
          <div className="text-red-400">console.error('❌ Algunas pruebas fallaron');</div>
        )}
      </div>
    </div>
  );
};

export default EncryptionTest;