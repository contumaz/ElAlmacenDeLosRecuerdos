import React from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Upload, FileText, Users } from 'lucide-react';
import Button from '@/components/ui/button';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  summary?: {
    total: number;
    imported: number;
    duplicates: number;
    errors: number;
    errorDetails: string[];
  };
}

export function ImportDialog({ isOpen, onClose, summary }: ImportDialogProps) {
  if (!isOpen) return null;

  const hasErrors = summary && summary.errors > 0;
  const hasDuplicates = summary && summary.duplicates > 0;
  const hasSuccess = summary && summary.imported > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Importación de Contactos</h2>
              <p className="text-sm text-gray-600">Resumen del proceso</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {summary ? (
            <div className="space-y-4">
              {/* Estadísticas principales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                  <div className="text-sm text-gray-600">Total procesados</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{summary.imported}</div>
                  <div className="text-sm text-green-700">Importados</div>
                </div>
              </div>

              {/* Resultados detallados */}
              <div className="space-y-3">
                {/* Éxito */}
                {hasSuccess && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-green-800">
                        {summary.imported} contactos importados correctamente
                      </p>
                      <p className="text-sm text-green-700">
                        Los contactos están listos para usar
                      </p>
                    </div>
                  </div>
                )}

                {/* Duplicados */}
                {hasDuplicates && (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-800">
                        {summary.duplicates} contactos duplicados omitidos
                      </p>
                      <p className="text-sm text-yellow-700">
                        Ya existían en tu agenda
                      </p>
                    </div>
                  </div>
                )}

                {/* Errores */}
                {hasErrors && (
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-800">
                        {summary.errors} errores durante la importación
                      </p>
                      <p className="text-sm text-red-700 mb-2">
                        Algunos contactos no pudieron procesarse
                      </p>
                      
                      {/* Detalles de errores */}
                      {summary.errorDetails.length > 0 && (
                        <div className="mt-2">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-red-700 hover:text-red-800">
                              Ver detalles de errores
                            </summary>
                            <div className="mt-2 p-2 bg-white rounded border border-red-200 max-h-32 overflow-y-auto">
                              {summary.errorDetails.slice(0, 5).map((error, index) => (
                                <p key={index} className="text-xs text-red-600 mb-1">
                                  {error}
                                </p>
                              ))}
                              {summary.errorDetails.length > 5 && (
                                <p className="text-xs text-red-500 italic">
                                  ... y {summary.errorDetails.length - 5} errores más
                                </p>
                              )}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Información adicional */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-start space-x-3 text-sm text-gray-600">
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Información del archivo CSV:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Campos detectados: Nombre, Teléfono, WhatsApp ID</li>
                      <li>• Procesamiento automático de empresas y categorías</li>
                      <li>• Detección de duplicados por número de teléfono</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Estado de carga o sin datos */
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Procesando archivo CSV
              </h3>
              <p className="text-gray-600">
                Por favor espera mientras importamos tus contactos...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <Button onClick={onClose}>
            {summary ? 'Cerrar' : 'Cancelar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ImportDialog;