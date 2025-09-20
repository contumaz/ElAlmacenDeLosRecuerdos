import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Database, FileImage, Calendar, Tag, Settings, BarChart3, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { MemoryData } from '@/services/electronAPI';
import { exportService, ExportOptions, ExportProgress } from '@/services/ExportService';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryData[];
  selectedMemories?: string[];
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  memories,
  selectedMemories = []
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeTags: true,
    groupBy: 'date'
  });
  
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Calcular estadísticas cuando se abre el diálogo
      const exportStats = exportService.getExportStats(memories);
      setStats(exportStats);
      
      // Si hay memorias seleccionadas, configurar la exportación para solo esas
      if (selectedMemories.length > 0) {
        const selectedIds = selectedMemories.map(id => typeof id === 'string' ? parseInt(id) : id);
        setOptions(prev => ({ ...prev, selectedMemories: selectedIds }));
      }
    }
  }, [isOpen, memories, selectedMemories]);

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(null);
    
    try {
      exportService.setProgressCallback(setProgress);
      await exportService.exportMemories(memories, options);
    } catch (error) {
      console.error('Error durante la exportación:', error);
    } finally {
      setIsExporting(false);
      // Mantener el progreso visible por un momento antes de cerrar
      setTimeout(() => {
        if (progress?.status === 'complete') {
          onClose();
          setProgress(null);
        }
      }, 2000);
    }
  };

  const formatOptions = [
    {
      value: 'json',
      label: 'JSON',
      description: 'Formato estructurado, ideal para respaldos completos',
      icon: Database,
      color: 'text-blue-600'
    },
    {
      value: 'csv',
      label: 'CSV',
      description: 'Hoja de cálculo, compatible con Excel y Google Sheets',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Documento imprimible con formato profesional',
      icon: FileImage,
      color: 'text-red-600'
    }
  ];

  const groupByOptions = [
    { value: 'none', label: 'Sin agrupar' },
    { value: 'date', label: 'Por fecha' },
    { value: 'type', label: 'Por tipo' },
    { value: 'emotion', label: 'Por emoción' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Exportar Memorias</h2>
              <p className="text-sm text-gray-600">
                {selectedMemories.length > 0 
                  ? `${selectedMemories.length} memorias seleccionadas`
                  : `${memories.length} memorias totales`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Progreso de Exportación */}
          {progress && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                {progress.status === 'complete' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : progress.status === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                )}
                <span className="font-medium text-gray-900">{progress.message}</span>
              </div>
              
              {progress.status !== 'error' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress.status === 'complete' ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${progress.current}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Estadísticas */}
          {stats && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Resumen de Datos</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-blue-600 font-medium">{stats.totalMemories}</div>
                  <div className="text-blue-700">Memorias</div>
                </div>
                <div>
                  <div className="text-blue-600 font-medium">{stats.totalTags}</div>
                  <div className="text-blue-700">Etiquetas únicas</div>
                </div>
                <div>
                  <div className="text-blue-600 font-medium">{Object.keys(stats.types).length}</div>
                  <div className="text-blue-700">Tipos diferentes</div>
                </div>
                <div>
                  <div className="text-blue-600 font-medium">{Object.keys(stats.emotions).length}</div>
                  <div className="text-blue-700">Emociones</div>
                </div>
              </div>
              {stats.dateRange.from && (
                <div className="mt-3 text-sm text-blue-700">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Desde {new Date(stats.dateRange.from).toLocaleDateString('es-ES')} hasta {new Date(stats.dateRange.to).toLocaleDateString('es-ES')}
                </div>
              )}
            </div>
          )}

          {/* Selección de Formato */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Formato de Exportación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formatOptions.map(format => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.value}
                    onClick={() => setOptions(prev => ({ ...prev, format: format.value as any }))}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      options.format === format.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-6 h-6 ${format.color}`} />
                      <span className="font-medium text-gray-900">{format.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">{format.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opciones Básicas */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Opciones de Contenido</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.includeTags}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeTags: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Tag className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">Incluir etiquetas</div>
                  <div className="text-sm text-gray-600">Exportar todas las etiquetas asociadas</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.includeMetadata}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Database className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">Incluir metadatos</div>
                  <div className="text-sm text-gray-600">Tipo, emoción, ubicación y descripción</div>
                </div>
              </label>
            </div>
          </div>

          {/* Opciones Avanzadas */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Settings className="w-5 h-5" />
              Opciones avanzadas
            </button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                {/* Agrupación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agrupar por
                  </label>
                  <select
                    value={options.groupBy}
                    onChange={(e) => setOptions(prev => ({ ...prev, groupBy: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    {groupByOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rango de Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Desde (opcional)
                    </label>
                    <input
                      type="date"
                      value={options.dateRange?.from || ''}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, from: e.target.value, to: prev.dateRange?.to || '' }
                      }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hasta (opcional)
                    </label>
                    <input
                      type="date"
                      value={options.dateRange?.to || ''}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, to: e.target.value, from: prev.dateRange?.from || '' }
                      }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedMemories.length > 0 
              ? `Exportando ${selectedMemories.length} memorias seleccionadas`
              : `Exportando todas las ${memories.length} memorias`
            }
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || memories.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exportar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;