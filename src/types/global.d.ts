/**
 * Declaraciones de tipos globales para El Almacén de los Recuerdos
 */

interface ElectronAPI {
  // Autenticación
  authenticate: (username: string, password: string) => Promise<any>;
  
  // Manejo de archivos
  showSaveDialog: (options?: any) => Promise<any>;
  showOpenDialog: (options?: any) => Promise<any>;
  saveFile: (filePath: string, data: any) => Promise<boolean>;
  readFile: (filePath: string) => Promise<any>;
  
  // Memorias
  saveMemory: (memory: any) => Promise<boolean>;
  loadMemories: () => Promise<any[]>;
  
  // Directorio
  showDirectoryPicker: () => Promise<string>;
  
  // Logging
  logActivity: (activity: string) => Promise<void>;
  logError: (error: string) => Promise<void>;
  
  // Utilidades
  isAvailable: () => boolean;
  
  // Audio/Video
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  
  // Sistema
  getVersion: () => Promise<string>;
  quit: () => void;
  
  // APIs estructuradas
  storage: {
    setConfig: (key: string, value: any) => Promise<any>;
    getConfig: (key: string, defaultValue?: any) => Promise<any>;
    saveMemory: (memoryData: any) => Promise<any>;
    loadMemories: (filters?: any) => Promise<any>;
    deleteMemory: (memoryId: number) => Promise<any>;
    saveFile: (fileData: any) => Promise<any>;
    createBackup: () => Promise<any>;
  };
  
  security: {
    authenticate: (credentials: any) => Promise<any>;
    changePassword: (data: any) => Promise<any>;
    getAuditLog: () => Promise<any>;
    logActivity: (activity: string) => Promise<void>;
    createBackup: () => Promise<any>;
  };
  
  ai: {
    transcribeAudio: (audioBlob: Blob) => Promise<any>;
    analyzeEmotion: (text: string, audioFeatures?: any) => Promise<any>;
    chatWithAI: (message: string, context?: any) => Promise<any>;
    generateQuestions: (topic: string, count?: number) => Promise<any>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
