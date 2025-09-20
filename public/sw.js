// Service Worker optimizado para modo offline
const CACHE_VERSION = '2.0.0';
const STATIC_CACHE = `static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-v${CACHE_VERSION}`;
const DATA_CACHE = `data-v${CACHE_VERSION}`;
const IMAGES_CACHE = `images-v${CACHE_VERSION}`;
const FONTS_CACHE = `fonts-v${CACHE_VERSION}`;
const JS_CACHE = `js-v${CACHE_VERSION}`;
const CSS_CACHE = `css-v${CACHE_VERSION}`;

// Archivos estáticos para cachear con prioridades
const CRITICAL_STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

const STATIC_ASSETS = [
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Patrones de recursos para cache inteligente
const CACHE_PATTERNS = {
  images: /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i,
  fonts: /\.(woff|woff2|ttf|eot)$/i,
  scripts: /\.(js|mjs)$/i,
  styles: /\.(css)$/i,
  api: /^\/api\//,
  static: /\.(html|json|xml)$/i
};

// URLs de API para cachear con TTL
const API_CACHE_CONFIG = {
  '/api/memories': { ttl: 5 * 60 * 1000, strategy: 'networkFirst' }, // 5 min
  '/api/tags': { ttl: 30 * 60 * 1000, strategy: 'staleWhileRevalidate' }, // 30 min
  '/api/categories': { ttl: 60 * 60 * 1000, strategy: 'cacheFirst' }, // 1 hour
  '/api/search': { ttl: 2 * 60 * 1000, strategy: 'networkFirst' }, // 2 min
  '/api/export': { ttl: 0, strategy: 'networkOnly' } // No cache
};

// Límites de cache por tipo
const CACHE_LIMITS = {
  [IMAGES_CACHE]: 50, // 50 imágenes
  [DYNAMIC_CACHE]: 100, // 100 recursos dinámicos
  [DATA_CACHE]: 200, // 200 respuestas de API
  [JS_CACHE]: 30, // 30 archivos JS
  [CSS_CACHE]: 20 // 20 archivos CSS
};

// Cola de operaciones offline
let offlineQueue = [];

// Instalar Service Worker con cache optimizado
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing with enhanced caching...');
  
  event.waitUntil(
    Promise.all([
      // Cache crítico de archivos estáticos
      caches.open(STATIC_CACHE).then(async (cache) => {
        console.log('Service Worker: Caching critical static files');
        try {
          await cache.addAll(CRITICAL_STATIC_FILES);
          // Cache adicional de assets estáticos (no críticos)
          await Promise.allSettled(
            STATIC_ASSETS.map(asset => 
              cache.add(asset).catch(err => 
                console.warn(`Failed to cache ${asset}:`, err)
              )
            )
          );
        } catch (error) {
          console.error('Failed to cache critical files:', error);
          throw error;
        }
      }),
      
      // Inicializar otros caches
      caches.open(IMAGES_CACHE),
      caches.open(FONTS_CACHE),
      caches.open(JS_CACHE),
      caches.open(CSS_CACHE),
      
      // Saltar la espera para activar inmediatamente
      self.skipWaiting()
    ])
  );
});

// Activar Service Worker con limpieza optimizada
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating with cache cleanup...');
  
  const currentCaches = [
    STATIC_CACHE, DYNAMIC_CACHE, DATA_CACHE, 
    IMAGES_CACHE, FONTS_CACHE, JS_CACHE, CSS_CACHE
  ];
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos y gestionar límites
      caches.keys().then(async (cacheNames) => {
        // Eliminar caches obsoletos
        const deletePromises = cacheNames
          .filter(cacheName => !currentCaches.includes(cacheName))
          .map(cacheName => {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          });
        
        await Promise.all(deletePromises);
        
        // Gestionar límites de cache
        await manageCacheLimits();
      }),
      
      // Tomar control de todas las páginas
      self.clients.claim(),
      
      // Procesar cola offline al activarse
      processOfflineQueue()
    ])
  );
});

// Interceptar peticiones con estrategias inteligentes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo interceptar peticiones del mismo origen o APIs
  if (!url.origin.includes(location.origin) && !url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Estrategia para archivos estáticos críticos
  if (CRITICAL_STATIC_FILES.some(file => url.pathname === file || url.pathname.endsWith(file))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // Estrategia para APIs con configuración específica
  if (CACHE_PATTERNS.api.test(url.pathname)) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Estrategia para imágenes
  if (CACHE_PATTERNS.images.test(url.pathname)) {
    event.respondWith(cacheFirstWithLimit(request, IMAGES_CACHE));
    return;
  }
  
  // Estrategia para fuentes
  if (CACHE_PATTERNS.fonts.test(url.pathname)) {
    event.respondWith(cacheFirst(request, FONTS_CACHE));
    return;
  }
  
  // Estrategia para JavaScript
  if (CACHE_PATTERNS.scripts.test(url.pathname)) {
    event.respondWith(staleWhileRevalidateWithLimit(request, JS_CACHE));
    return;
  }
  
  // Estrategia para CSS
  if (CACHE_PATTERNS.styles.test(url.pathname)) {
    event.respondWith(staleWhileRevalidateWithLimit(request, CSS_CACHE));
    return;
  }
  
  // Estrategia para otros recursos dinámicos
  event.respondWith(staleWhileRevalidateWithLimit(request, DYNAMIC_CACHE));
});

// Estrategia: Cache First
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache First failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Estrategia: Network First con soporte offline
async function networkFirstWithOfflineSupport(request) {
  try {
    // Intentar red primero
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cachear respuesta exitosa
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
      
      // Procesar cola offline si hay conexión
      processOfflineQueue();
      
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    // Si es una operación de escritura (POST, PUT, DELETE), agregar a cola
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      await addToOfflineQueue(request);
      return new Response(
        JSON.stringify({ 
          success: true, 
          offline: true, 
          message: 'Operación guardada para sincronizar cuando haya conexión' 
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Para operaciones de lectura, intentar cache
    const cache = await caches.open(DATA_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Retornar página offline
    return caches.match('/offline.html');
  }
}

// Estrategia: Stale While Revalidate con límites
async function staleWhileRevalidateWithLimit(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch en background para actualizar cache
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      await enforeCacheLimit(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  // Retornar cache inmediatamente si existe, sino esperar red
  return cachedResponse || fetchPromise;
}

// Estrategia: Cache First con límites
async function cacheFirstWithLimit(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await enforeCacheLimit(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache First with limit failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Manejo inteligente de APIs
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const apiPath = url.pathname;
  
  // Buscar configuración específica para esta API
  const config = Object.entries(API_CACHE_CONFIG).find(([path]) => 
    apiPath.startsWith(path)
  )?.[1];
  
  if (!config || config.strategy === 'networkOnly') {
    return networkFirstWithOfflineSupport(request);
  }
  
  switch (config.strategy) {
    case 'cacheFirst':
      return cacheFirstWithTTL(request, config.ttl);
    case 'networkFirst':
      return networkFirstWithTTL(request, config.ttl);
    case 'staleWhileRevalidate':
      return staleWhileRevalidateWithTTL(request, config.ttl);
    default:
      return networkFirstWithOfflineSupport(request);
  }
}

// Cache First con TTL
async function cacheFirstWithTTL(request, ttl) {
  const cache = await caches.open(DATA_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, ttl)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseWithTimestamp = addTimestamp(networkResponse.clone());
      await enforeCacheLimit(DATA_CACHE);
      cache.put(request, responseWithTimestamp);
    }
    return networkResponse;
  } catch (error) {
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Network First con TTL
async function networkFirstWithTTL(request, ttl) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE);
      const responseWithTimestamp = addTimestamp(networkResponse.clone());
      await enforeCacheLimit(DATA_CACHE);
      cache.put(request, responseWithTimestamp);
      processOfflineQueue();
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(DATA_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, ttl)) {
      return cachedResponse;
    }
    
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      await addToOfflineQueue(request);
      return new Response(
        JSON.stringify({ 
          success: true, 
          offline: true, 
          message: 'Operación guardada para sincronizar cuando haya conexión' 
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    return cachedResponse || caches.match('/offline.html');
  }
}

// Stale While Revalidate con TTL
async function staleWhileRevalidateWithTTL(request, ttl) {
  const cache = await caches.open(DATA_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const responseWithTimestamp = addTimestamp(networkResponse.clone());
      await enforeCacheLimit(DATA_CACHE);
      cache.put(request, responseWithTimestamp);
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  if (cachedResponse && !isExpired(cachedResponse, ttl)) {
    fetchPromise.catch(() => {}); // Actualizar en background
    return cachedResponse;
  }
  
  return fetchPromise;
}

// Agregar operación a cola offline
async function addToOfflineQueue(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now()
    };
    
    offlineQueue.push(requestData);
    
    // Guardar en IndexedDB para persistencia
    await saveOfflineQueue();
    
    // Notificar a la aplicación
    notifyClients({
      type: 'OFFLINE_OPERATION_QUEUED',
      data: { count: offlineQueue.length }
    });
    
    console.log('Operation queued for offline sync:', requestData);
  } catch (error) {
    console.error('Failed to queue offline operation:', error);
  }
}

// Procesar cola offline
async function processOfflineQueue() {
  if (offlineQueue.length === 0) {
    await loadOfflineQueue();
  }
  
  if (offlineQueue.length === 0) return;
  
  console.log(`Processing ${offlineQueue.length} offline operations...`);
  
  const processedOperations = [];
  
  for (const operation of offlineQueue) {
    try {
      const request = new Request(operation.url, {
        method: operation.method,
        headers: operation.headers,
        body: operation.body
      });
      
      const response = await fetch(request);
      
      if (response.ok) {
        processedOperations.push(operation);
        console.log('Offline operation synced:', operation.url);
      } else {
        console.error('Failed to sync operation:', operation.url, response.status);
      }
    } catch (error) {
      console.error('Error processing offline operation:', error);
      break; // Detener si no hay conexión
    }
  }
  
  // Remover operaciones procesadas
  if (processedOperations.length > 0) {
    offlineQueue = offlineQueue.filter(op => !processedOperations.includes(op));
    await saveOfflineQueue();
    
    // Notificar a la aplicación
    notifyClients({
      type: 'OFFLINE_OPERATIONS_SYNCED',
      data: { 
        synced: processedOperations.length,
        remaining: offlineQueue.length
      }
    });
  }
}

// Guardar cola en IndexedDB
async function saveOfflineQueue() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    await store.clear();
    
    for (const [index, operation] of offlineQueue.entries()) {
      await store.add({ ...operation, id: index });
    }
    
    await transaction.complete;
  } catch (error) {
    console.error('Failed to save offline queue:', error);
  }
}

// Cargar cola desde IndexedDB
async function loadOfflineQueue() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['offlineQueue'], 'readonly');
    const store = transaction.objectStore('offlineQueue');
    const operations = await store.getAll();
    
    offlineQueue = operations.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('Failed to load offline queue:', error);
    offlineQueue = [];
  }
}

// Abrir IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AlmacenMemoriasDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offlineQueue')) {
        const store = db.createObjectStore('offlineQueue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

// Notificar a clientes
function notifyClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

// Escuchar mensajes de la aplicación
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SYNC_OFFLINE_QUEUE':
      processOfflineQueue();
      break;
      
    case 'GET_OFFLINE_STATUS':
      event.ports[0].postMessage({
        isOnline: navigator.onLine,
        queueLength: offlineQueue.length
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage({ stats });
      });
      break;
      
    case 'MANAGE_CACHE_LIMITS':
      manageCacheLimits().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});

// Limpiar todos los caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Gestionar límites de cache
async function manageCacheLimits() {
  const cacheNames = Object.keys(CACHE_LIMITS);
  
  for (const cacheName of cacheNames) {
    await enforeCacheLimit(cacheName);
  }
}

// Aplicar límite a un cache específico
async function enforeCacheLimit(cacheName) {
  const limit = CACHE_LIMITS[cacheName];
  if (!limit) return;
  
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > limit) {
      // Eliminar las entradas más antiguas
      const entriesToDelete = keys.length - limit;
      const keysToDelete = keys.slice(0, entriesToDelete);
      
      await Promise.all(
        keysToDelete.map(key => cache.delete(key))
      );
      
      console.log(`Cache ${cacheName}: Removed ${entriesToDelete} old entries`);
    }
  } catch (error) {
    console.error(`Failed to enforce cache limit for ${cacheName}:`, error);
  }
}

// Agregar timestamp a respuesta
function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// Verificar si una respuesta ha expirado
function isExpired(response, ttl) {
  if (ttl === 0) return true; // TTL 0 significa no cachear
  
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return true; // Sin timestamp, considerar expirado
  
  const age = Date.now() - parseInt(cachedAt);
  return age > ttl;
}

// Obtener estadísticas de cache
async function getCacheStats() {
  const stats = {};
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[cacheName] = {
        entries: keys.length,
        limit: CACHE_LIMITS[cacheName] || 'unlimited'
      };
    } catch (error) {
      stats[cacheName] = { error: error.message };
    }
  }
  
  return stats;
}

// Sincronización en background
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-sync') {
    event.waitUntil(processOfflineQueue());
  }
});

// Detectar cambios de conectividad
self.addEventListener('online', () => {
  console.log('Connection restored, processing offline queue...');
  processOfflineQueue();
});

console.log('Service Worker: Loaded successfully');