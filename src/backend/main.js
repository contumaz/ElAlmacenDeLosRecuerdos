/**
 * Backend Principal de El Almacén de los Recuerdos
 * Maneja IA local, almacenamiento cifrado y todas las funcionalidades principales
 */

const { ipcMain, dialog, app } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const Database = require('sqlite3').Database;
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pipeline } = require('@xenova/transformers');

class AlmacenBackend {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../../data/almacen.db');
    this.uploadsPath = path.join(__dirname, '../../data/uploads');
    this.modelsPath = path.join(__dirname, '../../data/models');
    this.encryptionKey = null;
    this.currentUser = null;
    
    // Modelos de IA cargados
    this.emotionAnalyzer = null;
    this.textGenerator = null;
    this.isInitialized = false;
    
    this.init();
  }

  async init() {
    try {
      // Crear directorios necesarios
      await this.ensureDirectories();
      
      // Inicializar base de datos
      await this.initDatabase();
      
      // Cargar modelos de IA
      await this.loadAIModels();
      
      // Configurar IPC handlers
      this.setupIPC();
      
      this.isInitialized = true;
      console.log('✅ Almacén Backend inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando backend:', error);
    }
  }

  async ensureDirectories() {
    const dirs = [
      path.dirname(this.dbPath),
      this.uploadsPath,
      this.modelsPath,
      path.join(this.uploadsPath, 'images'),
      path.join(this.uploadsPath, 'audio'),
      path.join(this.uploadsPath, 'documents')
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
    }
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Crear tablas principales
        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  async createTables() {
    const tables = [
      // Usuarios y autenticación
      `CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        profile_data TEXT, -- JSON con datos del perfil
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )`,

      // Permisos y accesos
      `CREATE TABLE IF NOT EXISTS permisos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        tipo_acceso TEXT NOT NULL, -- 'lectura', 'escritura', 'admin'
        recursos TEXT, -- JSON con recursos específicos
        activo BOOLEAN DEFAULT 1,
        granted_by INTEGER, -- usuario que otorgó el permiso
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
        FOREIGN KEY (granted_by) REFERENCES usuarios (id)
      )`,

      // Memorias y contenido principal
      `CREATE TABLE IF NOT EXISTS memorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        contenido TEXT,
        tipo TEXT NOT NULL, -- 'texto', 'audio', 'foto', 'video', 'documento'
        archivo_path TEXT,
        archivo_hash TEXT, -- hash del archivo para verificar integridad
        metadatos TEXT, -- JSON con metadatos específicos
        privacidad_nivel INTEGER DEFAULT 1, -- 1=privado, 2=familia, 3=público
        es_favorito BOOLEAN DEFAULT 0,
        emocion_detectada TEXT,
        tags TEXT, -- JSON array de tags
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )`,

      // Conversaciones con IA
      `CREATE TABLE IF NOT EXISTS conversaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        sesion_id TEXT NOT NULL,
        tipo_conversacion TEXT NOT NULL, -- 'entrevista', 'chat', 'preguntas_automaticas'
        pregunta TEXT NOT NULL,
        respuesta TEXT NOT NULL,
        contexto TEXT, -- JSON con contexto de la conversación
        emocion_detectada TEXT,
        metadata TEXT, -- JSON con metadatos adicionales
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )`,

      // Entrevistas automáticas
      `CREATE TABLE IF NOT EXISTS entrevistas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        tipo TEXT NOT NULL, -- 'autobiografia', 'familiar', 'profesional'
        estado TEXT DEFAULT 'iniciada', -- 'iniciada', 'en_progreso', 'pausada', 'completada'
        progreso_actual INTEGER DEFAULT 0,
        total_preguntas INTEGER,
        configuracion TEXT, -- JSON con configuración de la entrevista
        audio_path TEXT, -- path del audio completo de la entrevista
        transcripcion_completa TEXT,
        resumen_generado TEXT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )`,

      // Análisis de emociones y características de audio
      `CREATE TABLE IF NOT EXISTS analisis_audio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memoria_id INTEGER,
        conversacion_id INTEGER,
        entrevista_id INTEGER,
        audio_path TEXT NOT NULL,
        duracion_segundos REAL,
        tono_promedio REAL,
        variacion_tono REAL,
        velocidad_habla REAL,
        pausas_detectadas INTEGER,
        volumen_promedio REAL,
        emociones_detectadas TEXT, -- JSON con emociones y confianza
        transcripcion TEXT,
        confianza_transcripcion REAL,
        idioma_detectado TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (memoria_id) REFERENCES memorias (id),
        FOREIGN KEY (conversacion_id) REFERENCES conversaciones (id),
        FOREIGN KEY (entrevista_id) REFERENCES entrevistas (id)
      )`,

      // Templates y configuraciones personalizables
      `CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL, -- 'interfaz', 'entrevista', 'reporte'
        configuracion TEXT NOT NULL, -- JSON con la configuración del template
        es_publico BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )`,

      // Configuraciones del sistema
      `CREATE TABLE IF NOT EXISTS configuraciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        categoria TEXT NOT NULL, -- 'general', 'ia', 'seguridad', 'privacidad'
        clave TEXT NOT NULL,
        valor TEXT NOT NULL,
        descripcion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )`,

      // Backups y exportaciones
      `CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        tipo TEXT NOT NULL, -- 'completo', 'incremental', 'exportacion'
        archivo_path TEXT NOT NULL,
        estado TEXT DEFAULT 'en_progreso', -- 'en_progreso', 'completado', 'error'
        tamaño_bytes INTEGER,
        cifrado BOOLEAN DEFAULT 1,
        hash_verificacion TEXT,
        metadata TEXT, -- JSON con metadatos del backup
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )`,

      // Auditoría y logs de actividad (INMUTABLE)
      `CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        accion TEXT NOT NULL,
        recurso TEXT NOT NULL,
        detalles TEXT, -- JSON con detalles de la acción
        ip_address TEXT,
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        hash_anterior TEXT,
        hash_actual TEXT,
        session_id TEXT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )`
    ];

    for (const table of tables) {
      await new Promise((resolve, reject) => {
        this.db.run(table, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Crear índices para optimizar consultas
    await this.createIndexes();
  }

  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_memorias_usuario_fecha ON memorias(usuario_id, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_memorias_tipo ON memorias(tipo)',
      'CREATE INDEX IF NOT EXISTS idx_conversaciones_usuario_sesion ON conversaciones(usuario_id, sesion_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_usuario_fecha ON audit_log(usuario_id, timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_permisos_usuario ON permisos(usuario_id, activo)'
    ];

    for (const index of indexes) {
      await new Promise((resolve, reject) => {
        this.db.run(index, (err) => {
          if (err && !err.message.includes('already exists')) reject(err);
          else resolve();
        });
      });
    }
  }

  async loadAIModels() {
    try {
      console.log('🤖 Cargando modelos de IA...');
      
      // Cargar modelo de análisis de emociones
      this.emotionAnalyzer = await pipeline(
        'text-classification',
        'j-hartmann/emotion-english-distilroberta-base'
      );

      // TODO: Integrar con Ollama para LLM local
      // Por ahora, simular con respuestas predefinidas
      
      console.log('✅ Modelos de IA cargados correctamente');
    } catch (error) {
      console.error('❌ Error cargando modelos de IA:', error);
      // Continuar sin IA si hay errores
    }
  }

  setupIPC() {
    // Autenticación y usuarios
    ipcMain.handle('security-authenticate', this.authenticate.bind(this));
    ipcMain.handle('security-change-password', this.changePassword.bind(this));
    ipcMain.handle('permissions-create-user', this.createUser.bind(this));
    ipcMain.handle('permissions-update-user', this.updateUser.bind(this));
    ipcMain.handle('permissions-delete-user', this.deleteUser.bind(this));
    ipcMain.handle('permissions-list-users', this.listUsers.bind(this));
    ipcMain.handle('permissions-set-permissions', this.setPermissions.bind(this));
    ipcMain.handle('permissions-get-permissions', this.getPermissions.bind(this));
    ipcMain.handle('permissions-check-permission', this.checkPermission.bind(this));
    
    // Gestión de memorias
    ipcMain.handle('storage-save-memory', this.saveMemory.bind(this));
    ipcMain.handle('storage-load-memories', this.loadMemories.bind(this));
    ipcMain.handle('storage-delete-memory', this.deleteMemory.bind(this));
    
    // Gestión de archivos
    ipcMain.handle('storage-save-file', this.saveFile.bind(this));
    ipcMain.handle('storage-load-file', this.loadFile.bind(this));
    ipcMain.handle('storage-delete-file', this.deleteFile.bind(this));
    ipcMain.handle('save-file-to-directory', this.saveFileToDirectory.bind(this));
    
    // Diálogos del sistema
    ipcMain.handle('show-save-dialog', this.showSaveDialog.bind(this));
    ipcMain.handle('show-open-dialog', this.showOpenDialog.bind(this));
    ipcMain.handle('show-message-box', this.showMessageBox.bind(this));
    
    // IA y análisis
    ipcMain.handle('ai-analyze-emotion', this.analyzeEmotion.bind(this));
    ipcMain.handle('ai-chat', this.chatWithAI.bind(this));
    ipcMain.handle('ai-generate-questions', this.generateQuestions.bind(this));
    ipcMain.handle('ai-transcribe-audio', this.transcribeAudio.bind(this));
    ipcMain.handle('ai-analyze-content', this.analyzeContent.bind(this));
    
    // Multimedia
    ipcMain.handle('media-start-recording', this.startRecording.bind(this));
    ipcMain.handle('media-stop-recording', this.stopRecording.bind(this));
    ipcMain.handle('media-process-audio', this.processAudio.bind(this));
    ipcMain.handle('media-process-image', this.processImage.bind(this));
    ipcMain.handle('media-extract-audio-features', this.extractAudioFeatures.bind(this));
    
    // Configuraciones
    ipcMain.handle('storage-set-config', this.setConfig.bind(this));
    ipcMain.handle('storage-get-config', this.getConfig.bind(this));
    
    // Templates
    ipcMain.handle('templates-load-template', this.loadTemplate.bind(this));
    ipcMain.handle('templates-save-template', this.saveTemplate.bind(this));
    ipcMain.handle('templates-list-templates', this.listTemplates.bind(this));
    ipcMain.handle('templates-delete-template', this.deleteTemplate.bind(this));
    ipcMain.handle('templates-set-theme', this.setTheme.bind(this));
    ipcMain.handle('templates-get-theme', this.getTheme.bind(this));
    
    // Seguridad
    ipcMain.handle('security-encrypt-data', this.encryptData.bind(this));
    ipcMain.handle('security-decrypt-data', this.decryptData.bind(this));
    ipcMain.handle('security-create-backup', this.createBackup.bind(this));
    ipcMain.handle('security-restore-backup', this.restoreBackup.bind(this));
    ipcMain.handle('security-log-activity', this.logActivity.bind(this));
    ipcMain.handle('security-get-audit-log', this.getAuditLog.bind(this));
    
    // Modo revisión segura
    ipcMain.handle('secure-review-enter', this.enterSecureMode.bind(this));
    ipcMain.handle('secure-review-exit', this.exitSecureMode.bind(this));
    ipcMain.handle('secure-review-is-active', this.isSecureMode.bind(this));
    ipcMain.handle('secure-review-set-timer', this.setSecureTimer.bind(this));
    
    // Información de la aplicación
    ipcMain.handle('app-version', this.getAppVersion.bind(this));
  }

  // Métodos de autenticación
  async authenticate(event, credentials) {
    try {
      const { username, password } = credentials;
      
      const user = await new Promise((resolve, reject) => {
        this.db.get(
          'SELECT * FROM usuarios WHERE username = ? AND is_active = 1',
          [username],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Contraseña incorrecta');
      }

      // Actualizar último login
      await new Promise((resolve, reject) => {
        this.db.run(
          'UPDATE usuarios SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Generar token JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'almacen-secret-key',
        { expiresIn: '24h' }
      );

      this.currentUser = user;
      
      await this.logActivity(event, {
        action: 'login',
        resource: 'authentication',
        details: { username }
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile_data: user.profile_data ? JSON.parse(user.profile_data) : {}
        },
        token
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createUser(event, userData) {
    try {
      const { username, email, password, role = 'user' } = userData;
      
      // Generar salt y hash de contraseña
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const userId = await new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO usuarios (username, email, password_hash, salt, role) 
           VALUES (?, ?, ?, ?, ?)`,
          [username, email, passwordHash, salt, role],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      await this.logActivity(event, {
        action: 'create_user',
        resource: 'users',
        details: { username, email, role }
      });

      return { success: true, userId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Métodos de gestión de memorias
  async saveMemory(event, memoryData) {
    try {
      const { 
        titulo, 
        contenido, 
        tipo, 
        archivo_path, 
        metadatos = {}, 
        privacidad_nivel = 1,
        tags = []
      } = memoryData;

      const memoryId = await new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO memorias (usuario_id, titulo, contenido, tipo, archivo_path, metadatos, privacidad_nivel, tags) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            this.currentUser.id,
            titulo,
            contenido,
            tipo,
            archivo_path,
            JSON.stringify(metadatos),
            privacidad_nivel,
            JSON.stringify(tags)
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      // Analizar emociones si hay contenido de texto
      if (contenido && this.emotionAnalyzer) {
        try {
          const emotion = await this.analyzeEmotion(event, { text: contenido });
          if (emotion.success) {
            await new Promise((resolve, reject) => {
              this.db.run(
                'UPDATE memorias SET emocion_detectada = ? WHERE id = ?',
                [emotion.emotion, memoryId],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          }
        } catch (emotionError) {
          console.warn('No se pudo analizar emoción:', emotionError);
        }
      }

      await this.logActivity(event, {
        action: 'create_memory',
        resource: 'memories',
        details: { memoryId, titulo, tipo }
      });

      return { success: true, memoryId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadMemories(event, filters = {}) {
    try {
      let query = `
        SELECT m.*, u.username 
        FROM memorias m 
        JOIN usuarios u ON m.usuario_id = u.id 
        WHERE m.usuario_id = ?
      `;
      let params = [this.currentUser.id];

      // Aplicar filtros
      if (filters.tipo) {
        query += ' AND m.tipo = ?';
        params.push(filters.tipo);
      }

      if (filters.desde) {
        query += ' AND m.created_at >= ?';
        params.push(filters.desde);
      }

      if (filters.hasta) {
        query += ' AND m.created_at <= ?';
        params.push(filters.hasta);
      }

      if (filters.busqueda) {
        query += ' AND (m.titulo LIKE ? OR m.contenido LIKE ?)';
        params.push(`%${filters.busqueda}%`, `%${filters.busqueda}%`);
      }

      query += ' ORDER BY m.created_at DESC';

      if (filters.limite) {
        query += ' LIMIT ?';
        params.push(filters.limite);
      }

      const memories = await new Promise((resolve, reject) => {
        this.db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      // Procesar datos JSON
      const processedMemories = memories.map(memory => ({
        ...memory,
        metadatos: memory.metadatos ? JSON.parse(memory.metadatos) : {},
        tags: memory.tags ? JSON.parse(memory.tags) : []
      }));

      return { success: true, memories: processedMemories };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Métodos de IA
  async analyzeEmotion(event, data) {
    try {
      if (!this.emotionAnalyzer) {
        return { success: false, error: 'Modelo de emociones no disponible' };
      }

      const { text } = data;
      const result = await this.emotionAnalyzer(text);
      
      // El modelo retorna un array de emociones con scores
      const topEmotion = result[0];
      
      return {
        success: true,
        emotion: topEmotion.label,
        confidence: topEmotion.score,
        allEmotions: result
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async chatWithAI(event, data) {
    try {
      const { message, context = {} } = data;
      
      // Por ahora, respuestas simuladas. 
      // TODO: Integrar con Ollama para LLM real
      const responses = [
        "Esa es una memoria muy interesante. ¿Podrías contarme más detalles sobre ese momento?",
        "Me gustaría conocer más sobre las emociones que sentiste en esa situación.",
        "¿Qué aprendiste de esa experiencia?",
        "¿Hay alguna persona especial que estuvo contigo en ese momento?",
        "¿Cómo crees que esa experiencia te cambió como persona?"
      ];

      const response = responses[Math.floor(Math.random() * responses.length)];

      // Guardar conversación
      const conversacionId = await new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO conversaciones (usuario_id, sesion_id, tipo_conversacion, pregunta, respuesta, contexto) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            this.currentUser.id,
            context.sessionId || 'default',
            context.tipo || 'chat',
            message,
            response,
            JSON.stringify(context)
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      return {
        success: true,
        response,
        conversacionId
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async generateQuestions(event, data) {
    try {
      const { userProfile = {}, previousAnswers = [] } = data;
      
      // Preguntas base para entrevistas automáticas
      const questionCategories = {
        infancia: [
          "¿Cuál es tu primer recuerdo de la infancia?",
          "¿Cómo era tu casa cuando eras niño/a?",
          "¿Quién era tu persona favorita en la familia?",
          "¿Cuál era tu juego favorito de pequeño/a?"
        ],
        familia: [
          "Háblame de tus padres, ¿cómo eran?",
          "¿Tienes hermanos? ¿Cómo era la relación con ellos?",
          "¿Qué tradiciones familiares recuerdas con más cariño?",
          "¿Quién te enseñó las lecciones más importantes de la vida?"
        ],
        juventud: [
          "¿Cómo era tu adolescencia?",
          "¿Cuál fue tu primera experiencia de amor?",
          "¿Qué querías ser cuando fueras mayor?",
          "¿Cuál fue el momento más rebelde de tu juventud?"
        ],
        logros: [
          "¿Cuál ha sido tu mayor logro en la vida?",
          "¿De qué te sientes más orgulloso/a?",
          "¿Cuál ha sido tu mayor desafío y cómo lo superaste?",
          "¿Qué consejo le darías a tu yo más joven?"
        ]
      };

      // Seleccionar categoría basada en progreso
      const categories = Object.keys(questionCategories);
      const selectedCategory = categories[previousAnswers.length % categories.length];
      const questions = questionCategories[selectedCategory];
      
      // Seleccionar pregunta que no haya sido respondida
      const answeredQuestions = previousAnswers.map(a => a.question);
      const availableQuestions = questions.filter(q => !answeredQuestions.includes(q));
      
      const selectedQuestion = availableQuestions.length > 0 
        ? availableQuestions[0] 
        : questions[0];

      return {
        success: true,
        question: selectedQuestion,
        category: selectedCategory,
        progress: {
          answered: previousAnswers.length,
          total: Object.values(questionCategories).flat().length
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Métodos de configuración
  async setConfig(event, key, value) {
    try {
      await new Promise((resolve, reject) => {
        this.db.run(
          `INSERT OR REPLACE INTO configuraciones (usuario_id, categoria, clave, valor) 
           VALUES (?, 'general', ?, ?)`,
          [this.currentUser?.id || null, key, JSON.stringify(value)],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getConfig(event, key, defaultValue = null) {
    try {
      const config = await new Promise((resolve, reject) => {
        this.db.get(
          'SELECT valor FROM configuraciones WHERE usuario_id = ? AND clave = ?',
          [this.currentUser?.id || null, key],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      const value = config ? JSON.parse(config.valor) : defaultValue;
      return { success: true, value };
    } catch (error) {
      return { success: false, error: error.message, value: defaultValue };
    }
  }

  // Métodos de auditoría
  async logActivity(event, data) {
    try {
      const { action, resource, details = {} } = data;
      
      await new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO audit_log (usuario_id, accion, recurso, detalles, ip_address, session_id) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            this.currentUser?.id || null,
            action,
            resource,
            JSON.stringify(details),
            '127.0.0.1', // Local app
            'electron-session'
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getAuditLog(event, filters = {}) {
    try {
      let query = 'SELECT * FROM audit_log WHERE usuario_id = ?';
      let params = [this.currentUser.id];

      if (filters.desde) {
        query += ' AND timestamp >= ?';
        params.push(filters.desde);
      }

      if (filters.hasta) {
        query += ' AND timestamp <= ?';
        params.push(filters.hasta);
      }

      query += ' ORDER BY timestamp DESC LIMIT 1000';

      const logs = await new Promise((resolve, reject) => {
        this.db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      return { success: true, logs };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============= MÉTODOS FALTANTES =============

  // Métodos de gestión de usuarios adicionales
  async updateUser(event, userId, userData) {
    try {
      const { username, email, role } = userData;
      
      await new Promise((resolve, reject) => {
        this.db.run(
          'UPDATE usuarios SET username = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [username, email, role, userId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      await this.logActivity(event, {
        action: 'update_user',
        resource: 'users',
        details: { userId, username, role }
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteUser(event, userId) {
    try {
      await new Promise((resolve, reject) => {
        this.db.run(
          'UPDATE usuarios SET is_active = 0 WHERE id = ?',
          [userId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      await this.logActivity(event, {
        action: 'delete_user',
        resource: 'users',
        details: { userId }
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listUsers(event) {
    try {
      const users = await new Promise((resolve, reject) => {
        this.db.all(
          'SELECT id, username, email, role, created_at, last_login FROM usuarios WHERE is_active = 1',
          [],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      return { success: true, users };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async setPermissions(event, userId, permissions) {
    try {
      // Eliminar permisos existentes
      await new Promise((resolve, reject) => {
        this.db.run(
          'DELETE FROM permisos WHERE usuario_id = ?',
          [userId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Añadir nuevos permisos
      for (const permission of permissions) {
        await new Promise((resolve, reject) => {
          this.db.run(
            'INSERT INTO permisos (usuario_id, tipo_acceso, recursos, granted_by) VALUES (?, ?, ?, ?)',
            [userId, permission.type, JSON.stringify(permission.resources), this.currentUser?.id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      await this.logActivity(event, {
        action: 'set_permissions',
        resource: 'permissions',
        details: { userId, permissions }
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getPermissions(event, userId) {
    try {
      const permissions = await new Promise((resolve, reject) => {
        this.db.all(
          'SELECT * FROM permisos WHERE usuario_id = ? AND activo = 1',
          [userId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      return { success: true, permissions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkPermission(event, userId, resource, action) {
    try {
      const permission = await new Promise((resolve, reject) => {
        this.db.get(
          `SELECT * FROM permisos 
           WHERE usuario_id = ? AND activo = 1 
           AND (tipo_acceso = 'admin' OR (recursos LIKE ? AND tipo_acceso = ?))`,
          [userId, `%${resource}%`, action],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      return { success: true, hasPermission: !!permission };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Métodos de gestión de archivos
  async saveFile(event, fileData, fileName, directory) {
    try {
      const targetPath = directory ? 
        path.join(directory, fileName) : 
        path.join(this.uploadsPath, fileName);

      await fs.writeFile(targetPath, fileData);

      await this.logActivity(event, {
        action: 'save_file',
        resource: 'files',
        details: { fileName, targetPath }
      });

      return { success: true, filePath: targetPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadFile(event, filePath) {
    try {
      const data = await fs.readFile(filePath);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteFile(event, filePath) {
    try {
      await fs.unlink(filePath);

      await this.logActivity(event, {
        action: 'delete_file',
        resource: 'files',
        details: { filePath }
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Nuevo método para guardar archivos en directorios específicos
  async saveFileToDirectory(event, directory, fileName, fileData) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Validar que el directorio existe, si no, crearlo
      try {
        await fs.access(directory);
      } catch (error) {
        await fs.mkdir(directory, { recursive: true });
      }

      const targetPath = path.join(directory, fileName);
      
      // Guardar el archivo
      if (fileData instanceof Buffer || typeof fileData === 'string') {
        await fs.writeFile(targetPath, fileData);
      } else if (fileData instanceof Uint8Array) {
        await fs.writeFile(targetPath, Buffer.from(fileData));
      } else {
        // Intentar convertir a Buffer
        const buffer = Buffer.from(fileData);
        await fs.writeFile(targetPath, buffer);
      }

      await this.logActivity(event, {
        action: 'save_file_to_directory',
        resource: 'files',
        details: { directory, fileName, targetPath }
      });

      return { success: true, filePath: targetPath };
    } catch (error) {
      console.error('Error saving file to directory:', error);
      return { success: false, error: error.message };
    }
  }

  // Diálogos del sistema
  async showSaveDialog(event, options) {
    try {
      const { dialog } = require('electron');
      const result = await dialog.showSaveDialog(options);
      return result;
    } catch (error) {
      return { canceled: true, error: error.message };
    }
  }

  async showOpenDialog(event, options) {
    try {
      const { dialog } = require('electron');
      const result = await dialog.showOpenDialog(options);
      return result;
    } catch (error) {
      return { canceled: true, error: error.message };
    }
  }

  async showMessageBox(event, options) {
    try {
      const { dialog } = require('electron');
      const result = await dialog.showMessageBox(options);
      return result;
    } catch (error) {
      return { response: 0, error: error.message };
    }
  }

  // Métodos de IA adicionales
  async transcribeAudio(event, audioBlob) {
    try {
      // Placeholder para transcripción de audio
      // En una implementación real, aquí usarías un modelo de speech-to-text
      return {
        success: true,
        text: 'Transcripción no implementada aún',
        confidence: 0.1
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async analyzeContent(event, content, type) {
    try {
      // Placeholder para análisis de contenido
      return {
        success: true,
        analysis: {
          type: type,
          contentLength: content.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Métodos de multimedia
  async startRecording(event, options = {}) {
    try {
      // Placeholder para iniciar grabación
      return {
        success: true,
        sessionId: Date.now(),
        message: 'Grabación iniciada'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async stopRecording(event) {
    try {
      // Placeholder para detener grabación
      return {
        success: true,
        message: 'Grabación detenida'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processAudio(event, audioPath, options) {
    try {
      // Placeholder para procesamiento de audio
      return {
        success: true,
        processedPath: audioPath,
        features: {}
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processImage(event, imagePath, options) {
    try {
      // Placeholder para procesamiento de imagen
      return {
        success: true,
        processedPath: imagePath,
        metadata: {}
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async extractAudioFeatures(event, audioBlob) {
    try {
      // Placeholder para extracción de características de audio
      return {
        success: true,
        features: {
          duration: 0,
          sampleRate: 44100,
          channels: 1
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Métodos de templates
  async loadTemplate(event, templateName) {
    try {
      const template = await new Promise((resolve, reject) => {
        this.db.get(
          'SELECT * FROM templates WHERE nombre = ? AND (usuario_id = ? OR es_publico = 1)',
          [templateName, this.currentUser?.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (template) {
        return {
          success: true,
          template: {
            ...template,
            configuracion: JSON.parse(template.configuracion)
          }
        };
      } else {
        return { success: false, error: 'Template no encontrado' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async saveTemplate(event, templateName, templateData) {
    try {
      await new Promise((resolve, reject) => {
        this.db.run(
          `INSERT OR REPLACE INTO templates (usuario_id, nombre, tipo, configuracion) 
           VALUES (?, ?, ?, ?)`,
          [
            this.currentUser?.id,
            templateName,
            templateData.type || 'custom',
            JSON.stringify(templateData)
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listTemplates(event) {
    try {
      const templates = await new Promise((resolve, reject) => {
        this.db.all(
          'SELECT nombre, tipo, created_at FROM templates WHERE usuario_id = ? OR es_publico = 1',
          [this.currentUser?.id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      return { success: true, templates };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteTemplate(event, templateName) {
    try {
      await new Promise((resolve, reject) => {
        this.db.run(
          'DELETE FROM templates WHERE nombre = ? AND usuario_id = ?',
          [templateName, this.currentUser?.id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async setTheme(event, themeName) {
    return await this.setConfig(event, 'theme', themeName);
  }

  async getTheme(event) {
    return await this.getConfig(event, 'theme', 'light');
  }

  // Métodos de seguridad adicionales
  async encryptData(event, data, password) {
    try {
      const cipher = crypto.createCipher('aes-256-cbc', password);
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return { success: true, encryptedData: encrypted };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async decryptData(event, encryptedData, password) {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', password);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return { success: true, data: JSON.parse(decrypted) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createBackup(event, password) {
    try {
      // Crear backup de la base de datos
      const backupPath = path.join(this.uploadsPath, `backup_${Date.now()}.db`);
      await fs.copyFile(this.dbPath, backupPath);

      return { success: true, backupPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async restoreBackup(event, backupPath, password) {
    try {
      // Restaurar backup
      await fs.copyFile(backupPath, this.dbPath);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Modo revisión segura
  async enterSecureMode(event) {
    try {
      this.secureMode = true;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async exitSecureMode(event) {
    try {
      this.secureMode = false;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async isSecureMode(event) {
    return { success: true, isSecure: !!this.secureMode };
  }

  async setSecureTimer(event, minutes) {
    try {
      // Configurar temporizador de sesión
      return { success: true, timerSet: minutes };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Información de la aplicación
  async getAppVersion(event) {
    try {
      const { app } = require('electron');
      return app.getVersion();
    } catch (error) {
      return '1.0.0';
    }
  }
}

// Inicializar backend
const backend = new AlmacenBackend();

module.exports = backend;
