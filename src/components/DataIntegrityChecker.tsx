import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Button from './ui/button';
import Badge from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Wrench,
  Database,
  Activity,
  Clock,
  FileText
} from 'lucide-react';
import { useValidation } from '../hooks/useValidation';
import { useMemories } from '../hooks/use-memories-hook';
import { DataIntegrityReport, DataIssue } from '../services/ValidationService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DataIntegrityCheckerProps {
  className?: string;
  autoCheck?: boolean;
  showDetailedReport?: boolean;
}

const DataIntegrityChecker: React.FC<DataIntegrityCheckerProps> = ({
  className = '',
  autoCheck = false,
  showDetailedReport = true
}) => {
  const { memories, refreshMemories } = useMemories();
  const { validationState, checkDataIntegrity, repairMemory } = useValidation();
  
  const [report, setReport] = useState<DataIntegrityReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairProgress, setRepairProgress] = useState(0);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  
  const handleCheckIntegrity = useCallback(async () => {
    if (memories.length === 0) {
      toast.warning('No hay memorias para verificar');
      return;
    }
    
    setIsChecking(true);
    try {
      const integrityReport = await checkDataIntegrity(memories);
      setReport(integrityReport);
      setLastCheck(new Date());
      
      if (integrityReport.corruptedRecords === 0) {
        toast.success('¡Todos los datos están íntegros!');
      } else {
        toast.warning(`Se encontraron ${integrityReport.corruptedRecords} registros con problemas`);
      }
    } catch (error) {
      toast.error('Error al verificar la integridad de los datos');
      console.error('Error checking data integrity:', error);
    } finally {
      setIsChecking(false);
    }
  }, [memories, checkDataIntegrity]);
  
  // Verificación automática al cargar
  useEffect(() => {
    if (autoCheck && memories.length > 0 && !report) {
      handleCheckIntegrity();
    }
  }, [autoCheck, memories.length, report, handleCheckIntegrity]);
  
  const handleRepairSelected = async () => {
    if (selectedIssues.size === 0) {
      toast.warning('Selecciona al menos un problema para reparar');
      return;
    }
    
    setIsRepairing(true);
    setRepairProgress(0);
    
    try {
      const issuesToRepair = report?.issues.filter(issue => 
        selectedIssues.has(issue.id) && issue.autoRepairable
      ) || [];
      
      let repairedCount = 0;
      
      for (let i = 0; i < issuesToRepair.length; i++) {
        const issue = issuesToRepair[i];
        const memoryId = issue.id.replace('memory_', '');
        const memory = memories.find(m => m.id.toString() === memoryId);
        
        if (memory) {
          try {
            const result = await repairMemory(memory);
            if (result.repaired) {
              repairedCount++;
            }
          } catch (error) {
            console.error(`Error repairing memory ${memoryId}:`, error);
          }
        }
        
        setRepairProgress(((i + 1) / issuesToRepair.length) * 100);
      }
      
      toast.success(`Se repararon ${repairedCount} de ${issuesToRepair.length} problemas`);
      
      // Refrescar datos y verificar nuevamente
      await refreshMemories();
      setTimeout(() => handleCheckIntegrity(), 1000);
      
    } catch (error) {
      toast.error('Error durante la reparación automática');
      console.error('Error during repair:', error);
    } finally {
      setIsRepairing(false);
      setRepairProgress(0);
      setSelectedIssues(new Set());
    }
  };
  
  const handleRepairAll = async () => {
    const repairableIssues = report?.issues.filter(issue => issue.autoRepairable) || [];
    if (repairableIssues.length === 0) {
      toast.warning('No hay problemas reparables automáticamente');
      return;
    }
    
    const newSelected = new Set(repairableIssues.map(issue => issue.id));
    setSelectedIssues(newSelected);
    
    // Esperar un momento para que se actualice el estado
    setTimeout(() => handleRepairSelected(), 100);
  };
  
  const toggleIssueSelection = (issueId: string) => {
    const newSelected = new Set(selectedIssues);
    if (newSelected.has(issueId)) {
      newSelected.delete(issueId);
    } else {
      newSelected.add(issueId);
    }
    setSelectedIssues(newSelected);
  };
  
  const getSeverityColor = (severity: DataIssue['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };
  
  const getSeverityIcon = (severity: DataIssue['severity']) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };
  
  const exportReport = () => {
    if (!report) return;
    
    const reportData = {
      ...report,
      exportedAt: new Date().toISOString(),
      memoryCount: memories.length
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integrity-report-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Reporte exportado correctamente');
  };
  
  const healthPercentage = report ? 
    Math.round((report.validRecords / report.totalRecords) * 100) : 100;
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con estadísticas generales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <CardTitle>Verificador de Integridad de Datos</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleCheckIntegrity}
                disabled={isChecking || validationState.isValidating}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Verificando...' : 'Verificar Integridad'}
              </Button>
              {report && (
                <Button onClick={exportReport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Reporte
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            Verifica la integridad y consistencia de tus memorias almacenadas
          </CardDescription>
        </CardHeader>
        
        {report && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{report.validRecords}</div>
                <div className="text-sm text-muted-foreground">Registros Válidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{report.corruptedRecords}</div>
                <div className="text-sm text-muted-foreground">Registros con Problemas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{report.totalRecords}</div>
                <div className="text-sm text-muted-foreground">Total de Registros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{healthPercentage}%</div>
                <div className="text-sm text-muted-foreground">Salud de Datos</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Salud General de los Datos</span>
                <span>{healthPercentage}%</span>
              </div>
              <Progress value={healthPercentage} className="h-2" />
            </div>
            
            {lastCheck && (
              <div className="flex items-center text-sm text-muted-foreground mt-4">
                <Clock className="h-4 w-4 mr-2" />
                Última verificación: {format(lastCheck, 'dd/MM/yyyy HH:mm', { locale: es })}
              </div>
            )}
          </CardContent>
        )}
      </Card>
      
      {/* Detalles del reporte */}
      {report && showDetailedReport && (
        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="issues">Problemas Detectados</TabsTrigger>
            <TabsTrigger value="summary">Resumen Detallado</TabsTrigger>
          </TabsList>
          
          <TabsContent value="issues" className="space-y-4">
            {report.issues.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Problemas Encontrados ({report.issues.length})</h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleRepairAll}
                      disabled={isRepairing || report.issues.filter(i => i.autoRepairable).length === 0}
                      variant="outline"
                      size="sm"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Reparar Todo
                    </Button>
                    <Button
                      onClick={handleRepairSelected}
                      disabled={isRepairing || selectedIssues.size === 0}
                      size="sm"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Reparar Seleccionados ({selectedIssues.size})
                    </Button>
                  </div>
                </div>
                
                {isRepairing && (
                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      Reparando problemas... {Math.round(repairProgress)}%
                      <Progress value={repairProgress} className="mt-2" />
                    </AlertDescription>
                  </Alert>
                )}
                
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {report.issues.map((issue, index) => (
                      <Card key={issue.id} className="p-4">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedIssues.has(issue.id)}
                            onChange={() => toggleIssueSelection(issue.id)}
                            disabled={!issue.autoRepairable}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getSeverityIcon(issue.severity)}
                              <Badge variant={getSeverityColor(issue.severity)}>
                                {issue.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">{issue.type}</Badge>
                              {issue.autoRepairable && (
                                <Badge variant="secondary">
                                  <Wrench className="h-3 w-3 mr-1" />
                                  Auto-reparable
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium mb-1">{issue.description}</p>
                            {issue.field && (
                              <p className="text-xs text-muted-foreground mb-1">
                                Campo afectado: <code>{issue.field}</code>
                              </p>
                            )}
                            {issue.suggestedFix && (
                              <p className="text-xs text-blue-600">
                                Solución sugerida: {issue.suggestedFix}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ¡Excelente! No se encontraron problemas en tus datos.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Resumen de Integridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Estadísticas Generales</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total de registros:</span>
                        <span>{report.totalRecords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Registros válidos:</span>
                        <span className="text-green-600">{report.validRecords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Registros con problemas:</span>
                        <span className="text-red-600">{report.corruptedRecords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Registros reparados:</span>
                        <span className="text-blue-600">{report.repairedRecords}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Tipos de Problemas</h4>
                    <div className="space-y-1 text-sm">
                      {['corruption', 'inconsistency', 'missing_field', 'invalid_format'].map(type => {
                        const count = report.issues.filter(issue => issue.type === type).length;
                        return count > 0 ? (
                          <div key={type} className="flex justify-between">
                            <span className="capitalize">{type.replace('_', ' ')}:</span>
                            <span>{count}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-2">Información del Reporte</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Generado: {format(new Date(report.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      {!report && !isChecking && (
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            Haz clic en "Verificar Integridad" para analizar la salud de tus datos.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DataIntegrityChecker;