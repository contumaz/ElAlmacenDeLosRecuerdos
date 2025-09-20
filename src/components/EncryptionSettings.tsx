import React, { useState, useEffect } from 'react';
import { Shield, Key, Lock, Unlock, Eye, EyeOff, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import useEncryption from '../hooks/useEncryption';
import { Memory, EncryptionConfig } from '../types';

interface EncryptionSettingsProps {
  memory?: Memory;
  onConfigChange?: (config: EncryptionConfig) => void;
  className?: string;
}

export const EncryptionSettings: React.FC<EncryptionSettingsProps> = ({
  memory,
  onConfigChange,
  className = ''
}) => {
  const {
    state,
    encryptMemory,
    decryptMemory,
    setMasterKey,
    generateMasterKey,
    clearMasterKey,
    setAutoEncrypt,
    unlockWithPassword,
    validatePassword,
    isMemoryEncrypted
  } = useEncryption();

  const [showMasterKey, setShowMasterKey] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [autoEncrypt, setAutoEncryptLocal] = useState(state.autoEncrypt || false);
  const [encryptionLevel, setEncryptionLevel] = useState<'none' | 'basic' | 'advanced'>(
    memory?.encryptionLevel || 'none'
  );
  const [requiresPassword, setRequiresPassword] = useState(memory?.requiresPassword || false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (memory) {
      setEncryptionLevel(memory.encryptionLevel || 'none');
      setRequiresPassword(memory.requiresPassword || false);
    }
  }, [memory]);

  useEffect(() => {
    setAutoEncryptLocal(state.autoEncrypt || false);
  }, [state.autoEncrypt]);

  const handleEnableEncryption = async () => {
    if (!masterKeyInput) {
      setError('Por favor ingresa una clave maestra');
      return;
    }

    if (masterKeyInput.length < 8) {
      setError('La clave maestra debe tener al menos 8 caracteres');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await setMasterKey(masterKeyInput);
      setStatusMessage('Cifrado habilitado correctamente');
      setMasterKeyInput('');
    } catch (err) {
      setError('Error habilitando el cifrado: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisableEncryption = async () => {
    setIsProcessing(true);
    setError('');

    try {
      clearMasterKey();
      setStatusMessage('Cifrado deshabilitado');
    } catch (err) {
      setError('Error deshabilitando el cifrado: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordInput || !confirmPassword) {
      setError('Por favor completa ambos campos de contraseña');
      return;
    }

    if (passwordInput !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (passwordInput.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await setMasterKey(passwordInput);
      setStatusMessage('Contraseña actualizada correctamente');
      setPasswordInput('');
      setConfirmPassword('');
    } catch (err) {
      setError('Error actualizando la contraseña: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfigUpdate = async () => {
    const newConfig: EncryptionConfig = {
      algorithm: 'AES-256-GCM',
      keySize: 256,
      iterations: 100000,
      autoEncrypt: state.autoEncrypt,
      encryptPrivateMemories: autoEncrypt,
      requirePasswordForDecryption: requiresPassword
    };

    try {
      setAutoEncrypt(newConfig.autoEncrypt);
      onConfigChange?.(newConfig);
      setStatusMessage('Configuración actualizada correctamente');
    } catch (err) {
      setError('Error actualizando configuración: ' + (err as Error).message);
    }
  };

  const handleEncryptMemory = async () => {
    if (!memory) return;

    setIsProcessing(true);
    setError('');

    try {
      const encrypted = await encryptMemory(memory);
      if (encrypted) {
        setStatusMessage('Memoria cifrada correctamente');
      }
    } catch (err) {
      setError('Error cifrando memoria: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecryptMemory = async () => {
    if (!memory) return;

    setIsProcessing(true);
    setError('');

    try {
      if (isMemoryEncrypted(memory)) {
        const decrypted = await decryptMemory(memory as any);
        if (decrypted) {
          setStatusMessage('Memoria descifrada correctamente');
        }
      } else {
        setStatusMessage('La memoria no está cifrada');
      }
    } catch (err) {
      setError('Error descifrando memoria: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Configuración de Cifrado</h3>
        {state.masterKey && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Activo</span>
            </div>
          )}
      </div>

      {/* Estado del cifrado */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-700">Estado del Sistema</span>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
             state.masterKey 
               ? 'bg-green-100 text-green-800' 
               : 'bg-gray-100 text-gray-800'
           }`}>
             {state.masterKey ? 'Habilitado' : 'Deshabilitado'}
            </div>
        </div>
        <p className="text-sm text-gray-600">
           {state.masterKey 
             ? 'El cifrado AES-256 está activo. Las memorias privadas se cifran automáticamente.' 
             : 'El cifrado está deshabilitado. Las memorias se almacenan sin cifrar.'}
          </p>
      </div>

      {/* Configuración principal */}
      {!state.masterKey ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clave Maestra
            </label>
            <div className="relative">
              <input
                type={showMasterKey ? 'text' : 'password'}
                value={masterKeyInput}
                onChange={(e) => setMasterKeyInput(e.target.value)}
                placeholder="Ingresa una clave maestra segura"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowMasterKey(!showMasterKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showMasterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 8 caracteres. Esta clave se usará para cifrar todas las memorias.
            </p>
          </div>

          <button
            onClick={handleEnableEncryption}
            disabled={isProcessing || !masterKeyInput}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {isProcessing ? 'Habilitando...' : 'Habilitar Cifrado'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Configuración automática */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuración Automática
            </h4>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Cifrar memorias privadas automáticamente
                </label>
                <p className="text-xs text-gray-500">
                  Las memorias con nivel de privacidad alto se cifrarán automáticamente
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoEncrypt}
                  onChange={(e) => setAutoEncryptLocal(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Configuración específica de memoria */}
          {memory && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-gray-900">Configuración de esta Memoria</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de Cifrado
                  </label>
                  <select
                    value={encryptionLevel}
                    onChange={(e) => setEncryptionLevel(e.target.value as 'none' | 'basic' | 'advanced')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">Sin cifrado</option>
                    <option value="basic">Cifrado básico</option>
                    <option value="advanced">Avanzado (Máxima)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Requiere contraseña para descifrar
                    </label>
                    <p className="text-xs text-gray-500">
                      Solicitar contraseña adicional al acceder a esta memoria
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresPassword}
                      onChange={(e) => setRequiresPassword(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex gap-2">
                  {memory.isEncrypted ? (
                    <button
                      onClick={handleDecryptMemory}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      {isProcessing ? 'Descifrando...' : 'Descifrar'}
                    </button>
                  ) : (
                    <button
                      onClick={handleEncryptMemory}
                      disabled={isProcessing}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      {isProcessing ? 'Cifrando...' : 'Cifrar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cambiar contraseña */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Cambiar Clave Maestra
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Nueva contraseña"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar contraseña"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <button
              onClick={handlePasswordChange}
              disabled={isProcessing || !passwordInput || !confirmPassword}
              className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </div>

          {/* Acciones del sistema */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <button
                onClick={handleConfigUpdate}
                disabled={isProcessing}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? 'Guardando...' : 'Guardar Configuración'}
              </button>
              
              <button
                onClick={handleDisableEncryption}
                disabled={isProcessing}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                {isProcessing ? 'Deshabilitando...' : 'Deshabilitar Cifrado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensajes de estado */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Error</span>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {statusMessage && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Éxito</span>
          </div>
          <p className="text-sm text-green-700 mt-1">{statusMessage}</p>
        </div>
      )}

      {/* Información de estado del cifrado */}
      {state.masterKey && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Estado del Cifrado</span>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <p>Estado: {state.isUnlocked ? 'Desbloqueado' : 'Bloqueado'}</p>
            <p>Cifrado automático: {state.autoEncrypt ? 'Habilitado' : 'Deshabilitado'}</p>
            <p>Clave maestra: Configurada</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EncryptionSettings;