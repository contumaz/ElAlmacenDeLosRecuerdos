const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Importar backend principal
require('./src/backend/main.js');

// Configuración de seguridad
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

let mainWindow;

function createWindow() {
  // Configurar ventana principal con seguridad reforzada
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      // Configuraciones de seguridad para el almacén de recuerdos
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    show: false, // No mostrar hasta que esté listo
    titleBarStyle: 'default',
    frame: true,
    resizable: true,
    maximizable: true,
    fullscreenable: false, // Por seguridad
    // Configuración específica para privacidad
    webPreferences: {
      ...mainWindow?.webPreferences,
      partition: 'persist:almacen-session', // Sesión persistente privada
    }
  });

  // Cargar la aplicación
  if (isDev) {
    mainWindow.loadURL('http://localhost:5175');
    // mainWindow.webContents.openDevTools(); // Solo en desarrollo
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Enfocar la ventana
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Configurar menú de aplicación
  setupApplicationMenu();

  // Eventos de ventana
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevenir navegación externa por seguridad
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:5175' && !isDev) {
      event.preventDefault();
    }
  });

  // Bloquear nueva ventana por seguridad
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Configuración de privacidad adicional
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    // Solo permitir permisos específicos necesarios
    const allowedPermissions = ['microphone', 'camera', 'notifications'];
    callback(allowedPermissions.includes(permission));
  });
}

function setupApplicationMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nuevo Recuerdo',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-memory');
          }
        },
        {
          label: 'Importar Archivo',
          accelerator: 'CmdOrCtrl+I',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile', 'multiSelections'],
              filters: [
                { name: 'Archivos de Recuerdos', extensions: ['jpg', 'png', 'jpeg', 'mp3', 'wav', 'mp4', 'txt', 'pdf'] }
              ]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('import-files', result.filePaths);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Backup Cifrado',
          click: () => {
            mainWindow.webContents.send('menu-action', 'backup');
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectall', label: 'Seleccionar Todo' }
      ]
    },
    {
      label: 'Herramientas',
      submenu: [
        {
          label: 'Entrevista Automática',
          click: () => {
            mainWindow.webContents.send('menu-action', 'start-interview');
          }
        },
        {
          label: 'Análisis de Emociones',
          click: () => {
            mainWindow.webContents.send('menu-action', 'emotion-analysis');
          }
        },
        { type: 'separator' },
        {
          label: 'Configuración de Privacidad',
          click: () => {
            mainWindow.webContents.send('menu-action', 'privacy-settings');
          }
        }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de El Almacén de los Recuerdos',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Acerca de',
              message: 'El Almacén de los Recuerdos',
              detail: 'Una aplicación para crear y preservar legados digitales con absoluta privacidad.\n\nVersión 1.0.0\nDesarrollado con tecnologías 100% gratuitas'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Manejo de IPC para comunicación segura
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// Eventos de aplicación
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Configuración de seguridad adicional
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    // Prevenir ventanas nuevas por seguridad
    event.preventDefault();
  });
});

// Solo permitir ventanas de la propia aplicación
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev && url.startsWith('http://localhost:5175')) {
    // En desarrollo, permitir localhost
    event.preventDefault();
    callback(true);
  } else {
    // En producción, usar validación estricta
    callback(false);
  }
});
