/// <reference types="vite/client" />

// Declaraciones para la API de Electron
declare global {
  interface Window {
    electronAPI: {
      // Información de la aplicación
      getAppVersion: () => Promise<string>;
      
      // Diálogos del sistema
      showSaveDialog: (options: any) => Promise<any>;
      showOpenDialog: (options: any) => Promise<any>;
      showMessageBox: (options: any) => Promise<any>;
      
      // Eventos del menú
      onMenuAction: (callback: (event: any, action: string) => void) => void;
      removeMenuActionListener: (callback: (event: any, action: string) => void) => void;
      
      // Importación de archivos
      onImportFiles: (callback: (event: any, files: string[]) => void) => void;
      removeImportFilesListener: (callback: (event: any, files: string[]) => void) => void;
      
      // Utilidades del sistema
      platform: string;
      
      // API de almacenamiento
      storage: {
        setConfig: (key: string, value: any) => Promise<void>;
        getConfig: (key: string, defaultValue?: any) => Promise<any>;
        saveMemory: (memoryData: any) => Promise<any>;
        loadMemories: (filters?: any) => Promise<any[]>;
        deleteMemory: (memoryId: number) => Promise<boolean>;
        saveFile: (fileData: any, fileName: string) => Promise<string>;
        loadFile: (filePath: string) => Promise<any>;
        deleteFile: (filePath: string) => Promise<boolean>;
      };
      
      // API de IA local
      ai: {
        transcribeAudio: (audioBlob: Blob) => Promise<string>;
        analyzeEmotion: (text: string, audioFeatures?: any) => Promise<any>;
        chatWithAI: (message: string, context?: any) => Promise<string>;
         generateQuestions: (topic: string, count?: number) => Promise<string[]>;
        analyzeContent: (content: string, type: string) => Promise<any>;
      };
      
      // API de seguridad y cifrado
      security: {
        authenticate: (credentials: { username: string; password: string }) => Promise<any>;
        changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
        encryptData: (data: any, password: string) => Promise<string>;
        decryptData: (encryptedData: string, password: string) => Promise<any>;
        createBackup: (password: string) => Promise<string>;
        restoreBackup: (backupPath: string, password: string) => Promise<boolean>;
        getAuditLog: (filters?: any) => Promise<any[]>;
        logActivity: (action: string, details?: any) => Promise<void>;
      };
      
      // API de permisos y usuarios
      permissions: {
        createUser: (userData: any) => Promise<any>;
        updateUser: (userId: number, userData: any) => Promise<any>;
        deleteUser: (userId: number) => Promise<boolean>;
        listUsers: () => Promise<any[]>;
        setPermissions: (userId: number, permissions: any) => Promise<void>;
        getPermissions: (userId: number) => Promise<any>;
        checkPermission: (userId: number, resource: string, action: string) => Promise<boolean>;
      };
      
      // API de audio y multimedia
      media: {
        startRecording: () => Promise<void>;
        stopRecording: () => Promise<Blob>;
        processImage: (imagePath: string, options?: any) => Promise<any>;
        processAudio: (audioPath: string, options?: any) => Promise<any>;
        extractAudioFeatures: (audioBlob: Blob) => Promise<any>;
      };
      
      // API de templates y personalización
      templates: {
        loadTemplate: (templateName: string) => Promise<any>;
        saveTemplate: (templateName: string, templateData: any) => Promise<void>;
        listTemplates: () => Promise<any[]>;
        deleteTemplate: (templateName: string) => Promise<boolean>;
        setTheme: (themeName: string) => Promise<void>;
        getTheme: () => Promise<string>;
      };
    };
    
    secureReview: {
      enterSecureMode: () => Promise<void>;
      exitSecureMode: () => Promise<void>;
      isSecureMode: () => Promise<boolean>;
      onScreenshotAttempt: (callback: (event: any) => void) => void;
      setSessionTimer: (minutes: number) => Promise<void>;
      onSecurityEvent: (callback: (event: any, data: any) => void) => void;
    };
  }
}
