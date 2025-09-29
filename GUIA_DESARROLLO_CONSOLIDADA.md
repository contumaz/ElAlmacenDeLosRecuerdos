# GUÍA DE DESARROLLO CONSOLIDADA
## "El Almacén de los Recuerdos" - Documento Maestro de Programación

---

## 📋 RESUMEN EJECUTIVO

**Proyecto**: El Almacén de los Recuerdos v2.0  
**Objetivo**: Migración a arquitectura modular inspirada en Obsidian  
**Stack Principal**: React + TypeScript + Electron + Sistema de Archivos  
**Filosofía**: Simplicidad radical con extensibilidad opcional  

---

## 🎯 VISIÓN Y FILOSOFÍA DEL PROYECTO

### Principios Fundamentales
1. **Simplicidad**: Interfaz accesible para usuarios no técnicos
2. **Privacidad**: Almacenamiento 100% local, sin servidores
3. **Conexión**: Enlaces bidireccionales entre recuerdos
4. **Multimedia**: Soporte nativo para texto, audio, imagen y video
5. **Extensibilidad**: Sistema de plugins para funcionalidades avanzadas

### Diferenciación Competitiva vs Obsidian
- **Obsidian**: "Segundo cerebro" para conocimiento
- **El Almacén**: "Corazón digital" para memorias emocionales
- **Ventaja única**: IA local para análisis emocional + multimedia nativo

---

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Tecnológico Confirmado
```json
{
  "frontend": {
    "react": "^18.3.1",
    "typescript": "^5.9.2",
    "vite": "^5.3.1",
    "tailwindcss": "^3.4.16",
    "zustand": "^5.0.8",
    "react-router-dom": "^7.9.1",
    "react-hook-form": "^7.54.2",
    "zod": "^3.24.1",
    "@radix-ui/react-*": "latest"
  },
  "desktop": {
    "electron": "^32.2.6",
    "electron-builder": "^25.1.8"
  },
  "backend_local": {
    "node.js": "^20.x",
    "sharp": "^0.33.5",
    "chokidar": "^4.0.1"
  }
}
```

### Arquitectura v2.0: Core Mínimo + Plugins

```
┌─────────────────────────────────────────────────────────────────┐
│                        APLICACIÓN CORE                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Crear/Editar  │  │   Buscar/Ver    │  │   Configurar    │  │
│  │    Recuerdos    │  │    Recuerdos    │  │   Aplicación    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      SISTEMA DE PLUGINS                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Vista Grafo   │  │  Canvas Visual  │  │  Análisis IA    │  │
│  │   (D3.js)       │  │   (Konva.js)    │  │   (Local)       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Línea Temporal │  │   Consultas     │  │    Cifrado      │  │
│  │  (React Window) │  │  (Dataview)     │  │   (Opcional)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                   ALMACENAMIENTO HÍBRIDO                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  /memorias/2025-09-29_cumpleanos-mama/                   │  │
│  │  ├── memoria.md              # Contenido principal       │  │
│  │  ├── metadata.json           # Metadatos estructurados   │  │
│  │  └── adjuntos/              # Archivos multimedia       │  │
│  │      ├── foto1.jpg                                       │  │
│  │      ├── foto2.jpg                                       │  │
│  │      └── audio1.m4a                                │   │
│  │  └── .index/                 # Índices para búsqueda   │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 SISTEMA DE ALMACENAMIENTO HÍBRIDO

### Migración Crítica: SQLite → Sistema de Archivos

**Estructura de Memoria Individual:**
```
/memorias/2025-09-29_cumpleanos-mama/
├── memoria.md              # Contenido principal en Markdown
├── metadata.json           # Metadatos estructurados
└── adjuntos/              # Archivos multimedia
    ├── foto1.jpg
    ├── foto2.jpg
    └── audio_felicitacion.m4a
```

### Ejemplo de memoria.md
```markdown
---
id: mem_20250929_001
titulo: Cumpleaños de mamá
fecha: 2025-09-29
tipo: evento
---

# Cumpleaños de mamá

Hoy celebramos el cumpleaños de mamá en [[Madrid]]. Estuvieron presentes 
@mama, @Cristina y toda la familia.

Fue un día muy especial, lleno de [[alegría]]. La tarta estaba deliciosa.

## Personas
- [[Mamá]]
- [[Cristina]]
- [[Tío Juan]]

## Lugares
- [[Madrid]]
- [[Casa de mamá]]

#familia #cumpleaños #celebración
```

### Ejemplo de metadata.json
```json
{
  "id": "mem_20250929_001",
  "version": "2.0",
  "created_at": "2025-09-29T18:30:00Z",
  "updated_at": "2025-09-29T20:15:00Z",
  "titulo": "Cumpleaños de mamá",
  "fecha_evento": "2025-09-29",
  "tipo": "evento",
  "privacidad": "privado",
  "personas": ["Mamá", "Cristina", "Tío Juan"],
  "lugares": ["Madrid", "Casa de mamá"],
  "etiquetas": ["familia", "cumpleaños", "celebración"],
  "adjuntos": [
    {
      "nombre": "foto1.jpg",
      "tipo": "imagen",
      "tamaño": 2458624,
      "metadata_exif": {
        "fecha": "2025-09-29T17:45:00Z",
        "camara": "iPhone 15",
        "ubicacion": { "lat": 40.4168, "lon": -3.7038 }
      }
    }
  ],
  "analisis_ia": {
    "emocion_principal": "alegría",
    "emociones": {
      "alegría": 0.89,
      "amor": 0.76,
      "nostalgia": 0.23
    },
    "sentimiento": "muy_positivo",
    "temas": ["familia", "celebración", "amor_maternal"]
  },
  "enlaces": {
    "entrantes": ["mem_20241225_001", "mem_20250501_003"],
    "salientes": ["mem_20230929_001"]
  }
}
```

### Ventajas del Sistema Híbrido
1. **Portabilidad total**: Archivos legibles sin la aplicación
2. **Compatible con Obsidian**: Usuarios pueden migrar fácilmente
3. **Backup simple**: Copiar carpeta = backup completo
4. **Versionado Git**: Control de versiones opcional
5. **Búsqueda externa**: Herramientas del sistema operativo funcionan
6. **Resistente a corrupción**: Un archivo corrupto no afecta al resto

---

## 🔗 SISTEMA DE ENLACES BIDIRECCIONALES

### Sintaxis de Enlaces
```markdown
[[Nombre del Recuerdo]]           # Enlace a otro recuerdo
[[Madrid|la capital]]              # Enlace con texto alternativo
@persona                           # Enlace a persona
#etiqueta                          # Etiqueta simple
#familia/padres/mamá               # Etiqueta jerárquica
```

### Implementación Técnica
```typescript
interface MemoryLink {
  sourceMemoryId: string;
  targetMemoryId: string;
  linkType: 'manual' | 'person' | 'place' | 'theme' | 'emotion' | 'temporal';
  strength: number; // 0-1, calculado por IA o manual
  context?: string; // Texto alrededor del enlace
  createdAt: Date;
  bidirectional: boolean; // Siempre true
}

class BiDirectionalLinkService {
  /**
   * Crea automáticamente enlaces en ambas direcciones
   */
  async createLink(
    memoryA: string,
    memoryB: string,
    type: LinkType
  ): Promise<void> {
    // Crear enlace A -> B
    await this.addLinkToMetadata(memoryA, memoryB, type);
    
    // Crear enlace B -> A automáticamente
    await this.addLinkToMetadata(memoryB, memoryA, type);
    
    // Actualizar índice de enlaces global
    await this.updateLinkIndex();
    
    // Recalcular grafo si está activo el plugin
    if (this.isPluginActive('graph-view')) {
      await this.updateGraph();
    }
  }
}
```

---

## 🔌 SISTEMA DE PLUGINS

### Arquitectura de Plugin
```typescript
interface MemoryPlugin {
  // Metadatos del plugin
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon: string;
  
  // Dependencias
  dependencies?: string[];
  
  // Hooks del ciclo de vida
  onload(): Promise<void>;
  onunload(): void;
  
  // Hooks de eventos
  onMemoryCreate?(memory: Memory): Promise<void>;
  onMemoryUpdate?(oldMemory: Memory, newMemory: Memory): Promise<void>;
  onMemoryDelete?(memoryId: string): Promise<void>;
  onMemoryView?(memory: Memory): Promise<void>;
  
  // Extensiones de UI
  contributeCommands?(): Command[];
  contributeViews?(): ViewContribution[];
  contributePanels?(): PanelContribution[];
  contributeStatusBar?(): StatusBarItem[];
  
  // API disponible
  api: PluginAPI;
}

interface PluginAPI {
  // Acceso a memorias
  memories: {
    get(id: string): Promise<Memory>;
    list(filters?: MemoryFilters): Promise<Memory[]>;
    create(data: CreateMemoryInput): Promise<Memory>;
    update(id: string, data: Partial<Memory>): Promise<Memory>;
    delete(id: string): Promise<void>;
  };
  
  // Acceso a UI
  ui: {
    showNotification(message: string, type: 'info' | 'success' | 'error'): void;
    showDialog(config: DialogConfig): Promise<DialogResult>;
    registerView(view: View): void;
    addCommand(command: Command): void;
  };
  
  // Acceso a archivos
  files: {
    read(path: string): Promise<string | Buffer>;
    write(path: string, content: string | Buffer): Promise<void>;
    exists(path: string): Promise<boolean>;
    list(directory: string): Promise<string[]>;
  };
  
  // Acceso a configuración
  config: {
    get<T>(key: string, defaultValue?: T): T;
    set(key: string, value: any): Promise<void>;
  };
}
```

---

## 🚀 ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Refactorización Core (8 semanas) - Q1 2026

#### Semanas 1-2: Diseño del Sistema de Plugins
**Objetivos:**
- Definir API completa de plugins
- Crear sistema de registro y carga
- Implementar sandboxing básico

**Entregables:**
- PluginAPI interface completa
- PluginManager service
- Documentación de API para desarrolladores

#### Semanas 3-4: Migración a Almacenamiento Híbrido
**Objetivos:**
- Implementar lectura/escritura de archivos .md
- Parser de frontmatter YAML
- Migrador automático desde SQLite

**Entregables:**
- FileSystemStorage service
- Migrador con UI de progreso
- Tests de integridad de datos

#### Semanas 5-6: Sistema de Enlaces Bidireccionales
**Objetivos:**
- Parser de sintaxis [[]], @, #
- Actualización automática de enlaces inversos
- Índice de enlaces global

**Entregables:**
- LinkParser utility
- BiDirectionalLinkService
- Vista de backlinks en cada memoria

#### Semanas 7-8: Extracción de Funcionalidades a Plugins
**Objetivos:**
- Convertir IA en plugin opcional
- Convertir cifrado en plugin opcional
- Convertir exportación en plugin opcional

**Entregables:**
- 3 plugins oficiales funcionando
- Core reducido en 40%
- Tiempo de carga mejorado

### Fase 2: Plugins Esenciales (6 semanas) - Q2 2026

#### Plugin 1: Vista de Grafo (2 semanas)
**Tecnología:** D3.js (gratuita, MIT license)

```typescript
interface GraphViewPlugin {
  // Visualización
  renderGraph(memories: Memory[]): void;
  
  // Interacción
  onNodeClick(node: MemoryNode): void;
  onNodeHover(node: MemoryNode): void;
  
  // Filtros
  filterByEmotion(emotion: Emotion): void;
  filterByDateRange(start: Date, end: Date): void;
  filterByPerson(person: string): void;
  
  // Layout
  setLayout(layout: 'force' | 'tree' | 'radial'): void;
}
```

**Recursos gratuitos:**
- D3.js: https://d3js.org/
- D3 Force Layout: https://github.com/d3/d3-force
- Ejemplos: https://observablehq.com/@d3/force-directed-graph

#### Plugin 2: Canvas de Recuerdos (2 semanas)
**Tecnología:** Konva.js (gratuita, MIT license)

```typescript
interface CanvasPlugin {
  // Creación de canvas
  createCanvas(name: string): Canvas;
  
  // Elementos
  addMemoryCard(memory: Memory, position: Point): void;
  addTextNode(text: string, position: Point): void;
  addConnection(from: string, to: string): void;
  
  // Interacción
  enableDragAndDrop(): void;
  enableDrawing(): void;
  
  // Exportación
  exportAsImage(): Promise<Blob>;
  exportAsJSON(): string;
}
```

**Recursos gratuitos:**
- Konva.js: https://konvajs.org/
- React Konva: https://github.com/konvajs/react-konva

#### Plugin 3: Sistema de Consultas (2 semanas)
**Inspirado en Dataview de Obsidian**

```typescript
// Lenguaje de consultas simplificado
const ejemplos = [
  // Consulta básica
  `FROM memorias 
   WHERE emocion = "alegría" 
   AND año = 2025`,
  
  // Con ordenamiento
  `FROM memorias 
   WHERE tags CONTAINS "familia"
   SORT BY fecha DESC
   LIMIT 20`,
  
  // Agrupación
  `FROM memorias
   GROUP BY mes
   SHOW COUNT, emocion_promedio`,
  
  // Vista de tabla
  `TABLE titulo, fecha, personas
   FROM memorias
   WHERE lugar = "Madrid"
   SORT BY fecha DESC`
];

interface QueryPlugin {
  executeQuery(query: string): Promise<QueryResult>;
  getSuggestions(partial: string): Suggestion[];
  saveQuery(name: string, query: string): void;
  listSavedQueries(): SavedQuery[];
}
```

### Fase 3: Optimización y Pulido (4 semanas) - Q3 2026

#### Semana 1-2: Optimización de Rendimiento
**Objetivos:**
- Virtualización de listas con react-window (gratuita)
- Lazy loading de plugins
- Caché inteligente de búsquedas
- Optimización de imágenes con sharp (gratuita)

#### Semana 3-4: Mejoras de UX
**Objetivos:**
- Paleta de comandos (Ctrl+K)
- Navegación por teclado completa
- Atajos personalizables
- Modo de enfoque sin distracciones

---

## 💡 FUNCIONALIDADES CLAVE INSPIRADAS EN OBSIDIAN

### 1. De "Guardar" a "Conectar" Recuerdos
**Implementación:**
- Vínculos inteligentes con autocompletado
- Sintaxis @ para personas, # para lugares/temas
- Grafo interactivo como herramienta de descubrimiento

### 2. Vistas Inteligentes (Álbumes Dinámicos)
**Ejemplos de consultas:**
- "Muéstrame todas las FOTOS de tipo 'cumpleaños' donde aparezca '@mamá'"
- "Lista todos los VÍDEOS grabados en '#Madrid' ordenados por fecha"
- "Crea una cronología con todos los recuerdos donde la 'emoción' detectada sea 'alegría'"

### 3. Organización Visual (Storyboards de Vida)
**Funcionalidades:**
- Lienzo infinito para arrastrar y soltar recuerdos
- Narrar viajes cronológicamente
- Crear árboles genealógicos visuales
- Proyectar hacia el futuro

### 4. Creación Ágil (Plantillas y Comandos Rápidos)
**Plantillas de Recuerdos:**
- "Recuerdo de Viaje": Destino, fechas, personas
- "Receta Familiar": Foto del plato, audio con historia, ingredientes
- "Carta a mi yo del futuro": Con fecha de "apertura" sugerida

**Paleta de Comandos (Ctrl+K):**
- "Grabar audio"
- "Nuevo recuerdo de texto"
- "Buscar fotos de 2024"
- "Añadir persona a último recuerdo"

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

### Sprint 1 (2 semanas)
1. **Configurar entorno de desarrollo con plugins**
2. **Implementar PluginAPI básica**
3. **Crear primer plugin de ejemplo (Línea Temporal)**

### Sprint 2 (2 semanas)
1. **Migrar sistema de almacenamiento a archivos**
2. **Implementar parser de Markdown con frontmatter**
3. **Crear migrador desde SQLite**

### Sprint 3 (2 semanas)
1. **Sistema de enlaces bidireccionales**
2. **Parser de sintaxis [[]], @, #**
3. **Vista de backlinks**

### Sprint 4 (2 semanas)
1. **Plugin de Vista de Grafo con D3.js**
2. **Filtros interactivos**
3. **Layouts múltiples**

---

## 📊 MÉTRICAS DE RENDIMIENTO

### Objetivos de Rendimiento
- **Tiempo de carga inicial**: < 3 segundos
- **Tamaño del bundle**: < 50MB
- **Memorias soportadas**: > 10,000 sin degradación
- **Búsqueda**: < 500ms para 1,000 memorias
- **Análisis de IA**: < 2 segundos por memoria
- **Consumo de RAM**: < 200MB en reposo

### Métricas de Calidad del Código
- **Errores de TypeScript**: 0
- **Warnings de ESLint**: < 10
- **Cobertura de tests**: > 80%
- **Documentación**: 100% de APIs públicas

---

## 🔧 HERRAMIENTAS DE DESARROLLO

### Tecnologías Gratuitas Confirmadas
- **D3.js**: Visualización de grafos
- **Konva.js**: Canvas interactivo
- **React Window**: Virtualización de listas
- **Sharp**: Optimización de imágenes
- **Chokidar**: Vigilancia de archivos
- **Zod**: Validación de esquemas
- **Zustand**: Gestión de estado

### Recursos de Aprendizaje
- **D3.js**: https://d3js.org/
- **Konva.js**: https://konvajs.org/
- **React Konva**: https://github.com/konvajs/react-konva
- **Obsidian Plugin Development**: https://docs.obsidian.md/

---

## 📝 CONCLUSIONES

**El Almacén de los Recuerdos v2.0** representa una evolución natural hacia un sistema más flexible y potente, manteniendo la simplicidad como principio rector. La inspiración en Obsidian no busca crear un clon, sino adaptar los mejores conceptos de conectividad y extensibilidad al dominio único de las memorias emocionales.

**Fortalezas clave del proyecto:**
1. **Nicho emocional único**: "Corazón digital" vs "segundo cerebro"
2. **Multimedia nativo**: Ventaja competitiva clara
3. **IA local**: Análisis emocional sin comprometer privacidad
4. **Arquitectura híbrida**: Portabilidad y longevidad de datos

**La migración propuesta combina:**
- La simplicidad y extensibilidad de Obsidian
- El enfoque emocional y multimedia de El Almacén
- Un sistema de plugins que mantiene el core ligero
- Compatibilidad con herramientas existentes

Este documento sirve como guía técnica completa para iniciar el desarrollo de la versión 2.0, con especificaciones detalladas, ejemplos de código y un roadmap claro de implementación.