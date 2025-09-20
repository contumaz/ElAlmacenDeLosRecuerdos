const { contextBridge, ipcRenderer } = require('electron');

// API segura expuesta al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Información de la aplicación
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  
  // Diálogos del sistema
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // Eventos del menú
  onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
  removeMenuActionListener: (callback) => ipcRenderer.removeListener('menu-action', callback),
  
  // Importación de archivos
  onImportFiles: (callback) => ipcRenderer.on('import-files', callback),
  removeImportFilesListener: (callback) => ipcRenderer.removeListener('import-files', callback),
  
  // Utilidades del sistema
  platform: process.platform,
  
  // API de configuración específica para El Almacén de los Recuerdos
  storage: {
    // Configuración local
    setConfig: (key, value) => ipcRenderer.invoke('storage-set-config', key, value),
    getConfig: (key, defaultValue) => ipcRenderer.invoke('storage-get-config', key, defaultValue),
    
    // Gestión de archivos de recuerdos
    saveMemory: (memoryData) => ipcRenderer.invoke('storage-save-memory', memoryData),
    loadMemories: (filters) => ipcRenderer.invoke('storage-load-memories', filters),
    deleteMemory: (memoryId) => ipcRenderer.invoke('storage-delete-memory', memoryId),
    
    // Gestión de archivos multimedia
    saveFile: (fileData, fileName) => ipcRenderer.invoke('storage-save-file', fileData, fileName),
    loadFile: (filePath) => ipcRenderer.invoke('storage-load-file', filePath),
    deleteFile: (filePath) => ipcRenderer.invoke('storage-delete-file', filePath)
  },
  
  // API de IA local
  ai: {
    // Transcripción de voz
    transcribeAudio: (audioBlob) => ipcRenderer.invoke('ai-transcribe-audio', audioBlob),
    
    // Análisis de emociones
    analyzeEmotion: (text, audioFeatures) => ipcRenderer.invoke('ai-analyze-emotion', text, audioFeatures),
    
    // Conversación con IA
    chatWithAI: (message, context) => ipcRenderer.invoke('ai-chat', message, context),
    
    // Generar preguntas automáticas
    generateQuestions: (userProfile, previousAnswers) => ipcRenderer.invoke('ai-generate-questions', userProfile, previousAnswers),
    
    // Análisis de contenido
    analyzeContent: (content, type) => ipcRenderer.invoke('ai-analyze-content', content, type)
  },
  
  // API de seguridad y cifrado
  security: {
    // Autenticación
    authenticate: (credentials) => ipcRenderer.invoke('security-authenticate', credentials),
    changePassword: (oldPassword, newPassword) => ipcRenderer.invoke('security-change-password', oldPassword, newPassword),
    
    // Cifrado de datos
    encryptData: (data, password) => ipcRenderer.invoke('security-encrypt-data', data, password),
    decryptData: (encryptedData, password) => ipcRenderer.invoke('security-decrypt-data', encryptedData, password),
    
    // Backup cifrado
    createBackup: (password) => ipcRenderer.invoke('security-create-backup', password),
    restoreBackup: (backupPath, password) => ipcRenderer.invoke('security-restore-backup', backupPath, password),
    
    // Auditoría
    getAuditLog: (filters) => ipcRenderer.invoke('security-get-audit-log', filters),
    logActivity: (action, details) => ipcRenderer.invoke('security-log-activity', action, details)
  },
  
  // API de permisos y usuarios
  permissions: {
    // Gestión de usuarios
    createUser: (userData) => ipcRenderer.invoke('permissions-create-user', userData),
    updateUser: (userId, userData) => ipcRenderer.invoke('permissions-update-user', userId, userData),
    deleteUser: (userId) => ipcRenderer.invoke('permissions-delete-user', userId),
    listUsers: () => ipcRenderer.invoke('permissions-list-users'),
    
    // Gestión de permisos
    setPermissions: (userId, permissions) => ipcRenderer.invoke('permissions-set-permissions', userId, permissions),
    getPermissions: (userId) => ipcRenderer.invoke('permissions-get-permissions', userId),
    checkPermission: (userId, resource, action) => ipcRenderer.invoke('permissions-check-permission', userId, resource, action)
  },
  
  // API de audio y multimedia
  media: {
    // Grabación de audio
    startRecording: () => ipcRenderer.invoke('media-start-recording'),
    stopRecording: () => ipcRenderer.invoke('media-stop-recording'),
    
    // Procesamiento de archivos
    processImage: (imagePath, options) => ipcRenderer.invoke('media-process-image', imagePath, options),
    processAudio: (audioPath, options) => ipcRenderer.invoke('media-process-audio', audioPath, options),
    
    // Análisis de características de audio
    extractAudioFeatures: (audioBlob) => ipcRenderer.invoke('media-extract-audio-features', audioBlob)
  },
  
  // API de templates y personalización
  templates: {
    // Gestión de plantillas
    loadTemplate: (templateName) => ipcRenderer.invoke('templates-load-template', templateName),
    saveTemplate: (templateName, templateData) => ipcRenderer.invoke('templates-save-template', templateName, templateData),
    listTemplates: () => ipcRenderer.invoke('templates-list-templates'),
    deleteTemplate: (templateName) => ipcRenderer.invoke('templates-delete-template', templateName),
    
    // Configuración de interfaz
    setTheme: (themeName) => ipcRenderer.invoke('templates-set-theme', themeName),
    getTheme: () => ipcRenderer.invoke('templates-get-theme')
  }
});

// Configuraciones de seguridad adicionales
window.addEventListener('DOMContentLoaded', () => {
  // Prevenir drag & drop de archivos externos no autorizados
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Solo permitir drop en zonas autorizadas con data-allow-drop="true"
    if (!e.target.hasAttribute('data-allow-drop')) {
      return;
    }
  });
  
  // Deshabilitar menú contextual por defecto en producción
  if (process.env.NODE_ENV !== 'development') {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
  
  // Prevenir selección de texto accidental en elementos de UI
  document.addEventListener('selectstart', (e) => {
    if (e.target.tagName && ['BUTTON', 'A', 'LABEL'].includes(e.target.tagName)) {
      e.preventDefault();
    }
  });
});

// Configuración adicional para el modo revisión segura
contextBridge.exposeInMainWorld('secureReview', {
  // Activar modo revisión
  enterSecureMode: () => ipcRenderer.invoke('secure-review-enter'),
  
  // Salir de modo revisión
  exitSecureMode: () => ipcRenderer.invoke('secure-review-exit'),
  
  // Verificar si está en modo revisión
  isSecureMode: () => ipcRenderer.invoke('secure-review-is-active'),
  
  // Prevenir capturas de pantalla (solo detectar intent)
  onScreenshotAttempt: (callback) => ipcRenderer.on('screenshot-attempt', callback),
  
  // Configurar temporizador de sesión
  setSessionTimer: (minutes) => ipcRenderer.invoke('secure-review-set-timer', minutes),
  
  // Eventos de seguridad
  onSecurityEvent: (callback) => ipcRenderer.on('security-event', callback)
});

// Log de inicialización (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('Preload script cargado correctamente para El Almacén de los Recuerdos');
}
