export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
  performanceMetrics?: {
    duration?: number;
    memoryUsage?: number;
    timestamp: number;
  };
}

export interface LoggingConfig {
  maxLogEntries: number;
  logLevel: LogLevel;
  enableConsoleOutput: boolean;
  enableFileOutput: boolean;
  rotationSize: number; // MB
  enablePerformanceMetrics: boolean;
}

class LoggingService {
  private logs: LogEntry[] = [];
  private config: LoggingConfig = {
    maxLogEntries: 1000,
    logLevel: LogLevel.INFO,
    enableConsoleOutput: true,
    enableFileOutput: true,
    rotationSize: 10,
    enablePerformanceMetrics: true
  };
  private performanceMarks: Map<string, number> = new Map();

  constructor(config?: Partial<LoggingConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializeLogging();
  }

  private initializeLogging(): void {
    // Cargar logs existentes del localStorage
    this.loadLogsFromStorage();
    
    // Configurar limpieza automática
    this.setupAutoCleanup();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.logLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const levelName = LogLevel[level];
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `[${timestamp}] ${levelName} ${contextStr}: ${message}`;
  }

  private addLogEntry(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Mantener el límite de logs
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs = this.logs.slice(-this.config.maxLogEntries);
    }
    
    // Guardar en localStorage
    this.saveLogsToStorage();
    
    // Output a consola si está habilitado
    if (this.config.enableConsoleOutput) {
      this.outputToConsole(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const message = this.formatMessage(entry.level, entry.message, entry.context);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(message, entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.metadata);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.metadata, entry.stackTrace);
        break;
    }
  }

  private saveLogsToStorage(): void {
    try {
      const logsToSave = this.logs.slice(-100); // Solo guardar los últimos 100
      localStorage.setItem('app_logs', JSON.stringify(logsToSave));
    } catch (error) {
      console.warn('No se pudieron guardar los logs en localStorage:', error);
    }
  }

  private loadLogsFromStorage(): void {
    try {
      const savedLogs = localStorage.getItem('app_logs');
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        this.logs = parsedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.warn('No se pudieron cargar los logs desde localStorage:', error);
    }
  }

  private setupAutoCleanup(): void {
    // Limpiar logs antiguos cada hora
    setInterval(() => {
      this.cleanupOldLogs();
    }, 60 * 60 * 1000);
  }

  private cleanupOldLogs(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.logs = this.logs.filter(log => log.timestamp > oneDayAgo);
    this.saveLogsToStorage();
  }

  private getStackTrace(): string {
    const error = new Error();
    return error.stack || 'No stack trace available';
  }

  private getPerformanceMetrics(): LogEntry['performanceMetrics'] {
    if (!this.config.enablePerformanceMetrics) return undefined;
    
    return {
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      timestamp: performance.now()
    };
  }

  // Métodos públicos de logging
  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      message,
      context,
      metadata,
      performanceMetrics: this.getPerformanceMetrics()
    };
    
    this.addLogEntry(entry);
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level: LogLevel.INFO,
      message,
      context,
      metadata,
      performanceMetrics: this.getPerformanceMetrics()
    };
    
    this.addLogEntry(entry);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level: LogLevel.WARN,
      message,
      context,
      metadata,
      performanceMetrics: this.getPerformanceMetrics()
    };
    
    this.addLogEntry(entry);
  }

  error(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      context,
      stackTrace: error?.stack || this.getStackTrace(),
      metadata: {
        ...metadata,
        errorName: error?.name,
        errorMessage: error?.message
      },
      performanceMetrics: this.getPerformanceMetrics()
    };
    
    this.addLogEntry(entry);
  }

  // Métodos de métricas de rendimiento
  startPerformanceMark(markName: string): void {
    if (!this.config.enablePerformanceMetrics) return;
    this.performanceMarks.set(markName, performance.now());
  }

  endPerformanceMark(markName: string, context?: string): number | null {
    if (!this.config.enablePerformanceMetrics) return null;
    
    const startTime = this.performanceMarks.get(markName);
    if (!startTime) return null;
    
    const duration = performance.now() - startTime;
    this.performanceMarks.delete(markName);
    
    this.info(`Performance: ${markName} completed`, context, {
      duration: `${duration.toFixed(2)}ms`,
      markName
    });
    
    return duration;
  }

  // Métodos de consulta y exportación
  getLogs(filter?: {
    level?: LogLevel;
    context?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];
    
    if (filter) {
      if (filter.level !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.level >= filter.level!);
      }
      
      if (filter.context) {
        filteredLogs = filteredLogs.filter(log => 
          log.context?.toLowerCase().includes(filter.context!.toLowerCase())
        );
      }
      
      if (filter.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startDate!);
      }
      
      if (filter.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endDate!);
      }
      
      if (filter.limit) {
        filteredLogs = filteredLogs.slice(-filter.limit);
      }
    }
    
    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    oldestLog?: Date;
    newestLog?: Date;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        DEBUG: 0,
        INFO: 0,
        WARN: 0,
        ERROR: 0
      },
      oldestLog: undefined as Date | undefined,
      newestLog: undefined as Date | undefined
    };
    
    if (this.logs.length > 0) {
      stats.oldestLog = this.logs[0].timestamp;
      stats.newestLog = this.logs[this.logs.length - 1].timestamp;
      
      this.logs.forEach(log => {
        const levelName = LogLevel[log.level] as keyof typeof stats.byLevel;
        stats.byLevel[levelName]++;
      });
    }
    
    return stats;
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }
    
    // CSV format
    const headers = ['ID', 'Timestamp', 'Level', 'Context', 'Message', 'Stack Trace'];
    const csvRows = [headers.join(',')];
    
    this.logs.forEach(log => {
      const row = [
        log.id,
        log.timestamp.toISOString(),
        LogLevel[log.level],
        log.context || '',
        `"${log.message.replace(/"/g, '""')}"`,
        log.stackTrace ? `"${log.stackTrace.replace(/"/g, '""')}"` : ''
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('app_logs');
    this.info('Logs cleared', 'LoggingService');
  }

  updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.info('Logging configuration updated', 'LoggingService', { newConfig });
  }

  getConfig(): LoggingConfig {
    return { ...this.config };
  }
}

// Instancia singleton
const loggingService = new LoggingService();

export default loggingService;
export { LoggingService };