import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import compression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'
import viteImagemin from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    react(),
    // Solo aplicar plugins de optimización en producción
    ...(process.env.NODE_ENV === 'production' ? [
      // Compresión gzip
      compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        deleteOriginFile: false
      }),
      // Compresión brotli
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false
      }),
      // Visualizador de bundle mejorado
      visualizer({
        filename: 'dist/stats.html',
        open: process.env.ANALYZE === 'true',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // treemap, sunburst, network
        title: 'Bundle Analysis - El Almacén de los Recuerdos'
      }),
      // Compresión de imágenes
      viteImagemin({
        gifsicle: { optimizationLevel: 7 },
        mozjpeg: { quality: 80 },
        pngquant: { quality: [0.8, 0.9] },
        svgo: {
          plugins: [
            { name: 'removeViewBox', active: false },
            { name: 'removeEmptyAttrs', active: false }
          ]
        },
        webp: { quality: 80 }
      })
    ] : [])
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5175,
    strictPort: true,
    host: true,
    hmr: true
  },
  base: './', // Para Electron
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    target: ['esnext', 'chrome89', 'firefox89', 'safari15'],
    chunkSizeWarningLimit: 600, // Reducido para mejor control
    // Optimizaciones avanzadas
    cssCodeSplit: true,
    cssMinify: true,
    reportCompressedSize: false, // Mejora velocidad de build
    emptyOutDir: true,
    // Configuración de Terser para mejor minificación
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info'] : [],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          // Vendor chunks optimizados con tamaños balanceados
          if (id.includes('node_modules')) {
            // React core - chunk crítico pequeño
            if (id.includes('react/') && !id.includes('react-dom')) {
              return 'react-core';
            }
            if (id.includes('react-dom')) {
              return 'react-dom';
            }
            
            // UI libraries - separar por tamaño
            if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-toast')) {
              return 'ui-critical';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            
            // Charts - chunk pesado separado
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
              return 'charts-vendor';
            }
            
            // Icons - chunk mediano
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            
            // Utilities - chunk pequeño crítico
            if (id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils-vendor';
            }
            
            // Router - chunk crítico
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            
            // State management - chunk pequeño crítico
            if (id.includes('zustand')) {
              return 'state-vendor';
            }
            
            // Crypto - chunk mediano no crítico
            if (id.includes('crypto-js') || id.includes('bcryptjs')) {
              return 'crypto-vendor';
            }
            
            // Speech - chunk grande no crítico
            if (id.includes('react-speech-recognition') || id.includes('speech-')) {
              return 'speech-vendor';
            }
            
            // Error boundary - chunk pequeño
            if (id.includes('react-error-boundary')) {
              return 'error-vendor';
            }
            
            // Resto de vendors en chunk general
            return 'vendor';
          }
          
          // App chunks específicos optimizados por ruta
          if (id.includes('/src/pages/')) {
            // Páginas críticas - chunks separados
            if (id.includes('Dashboard')) {
              return 'page-dashboard';
            }
            if (id.includes('Memorias') && !id.includes('Nueva')) {
              return 'page-memories';
            }
            if (id.includes('NuevaMemoria')) {
              return 'page-new-memory';
            }
            
            // Páginas no críticas - chunks lazy
            if (id.includes('AnalisisEmocional')) {
              return 'page-emotion-analysis';
            }
            if (id.includes('Configuracion')) {
              return 'page-configuration';
            }
            
            return 'pages';
          }
          
          if (id.includes('/src/components/')) {
            // Componentes críticos - chunk pequeño
            if (id.includes('/ui/') && (id.includes('button') || id.includes('input') || id.includes('card'))) {
              return 'ui-critical';
            }
            
            // Componentes pesados - chunks separados
            if (id.includes('ExportDialog')) {
              return 'component-export';
            }
            if (id.includes('AdvancedSearchBar') || id.includes('AdvancedSearchPanel')) {
              return 'component-search';
            }
            if (id.includes('LazyComponents') || id.includes('AdvancedLazyWrapper')) {
              return 'component-lazy';
            }
            
            // Componentes de charts
            if (id.includes('/ui/chart') || id.includes('Chart')) {
              return 'component-charts';
            }
            
            // Componentes de memoria
            if (id.includes('VirtualizedMemoryList') || id.includes('MemoryListItem')) {
              return 'component-memory';
            }
            
            // Componentes de formulario
            if (id.includes('MemoryForm') || id.includes('AudioRecorder')) {
              return 'component-forms';
            }
            
            return 'components';
          }
          
          if (id.includes('/src/hooks/')) {
            // Hooks de optimización - chunk separado
            if (id.includes('useSmartMemoization') || id.includes('useImageOptimization') || id.includes('useVirtualization')) {
              return 'hooks-optimization';
            }
            
            // Hooks de memoria - chunk específico
            if (id.includes('useMemory') || id.includes('useSearch')) {
              return 'hooks-memory';
            }
            
            return 'hooks';
          }
          
          if (id.includes('/src/services/')) {
            // Servicios críticos vs no críticos
            if (id.includes('memoryService') || id.includes('searchService')) {
              return 'services-core';
            }
            if (id.includes('exportService') || id.includes('analysisService')) {
              return 'services-features';
            }
            return 'services';
          }
          
          if (id.includes('/src/utils/')) {
            // Utilidades de optimización
            if (id.includes('bundleOptimization') || id.includes('performanceUtils')) {
              return 'utils-optimization';
            }
            return 'utils';
          }
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          console.log('Chunk info:', facadeModuleId); // Para evitar warning de variable no usada
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || ['asset'];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    }
  },
  optimizeDeps: {
    // Dependencias críticas para pre-bundling
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'react/jsx-runtime',
      '@radix-ui/react-dialog',
      '@radix-ui/react-toast',
      '@radix-ui/react-slot',
      'lucide-react',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'zustand',
      'zustand/middleware',
      'react-error-boundary'
    ],
    exclude: [
      'electron',
      '@babel/core',
      '@babel/helper-plugin-utils',
      '@babel/plugin-transform-react-jsx'
    ],
    // Configuración avanzada de optimización
    esbuildOptions: {
      target: 'esnext',
      supported: {
        'top-level-await': true
      },
      // Optimizaciones adicionales
      treeShaking: true,
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true
    }
  }
})

