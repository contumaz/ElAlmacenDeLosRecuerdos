#!/usr/bin/env node

/**
 * Bundle Monitor Script
 * Automatiza el análisis de bundle y genera reportes de rendimiento
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');

// Crear directorio de reportes si no existe
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundle() {
  console.log('🔍 Iniciando análisis de bundle...');
  
  try {
    // Ejecutar build con análisis
    console.log('📦 Construyendo proyecto...');
    execSync('ANALYZE=true npm run build', { stdio: 'inherit' });
    
    // Analizar tamaños de archivos
    console.log('📊 Analizando tamaños de archivos...');
    const jsFiles = fs.readdirSync(path.join(DIST_DIR, 'js'))
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const filePath = path.join(DIST_DIR, 'js', file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size)
        };
      })
      .sort((a, b) => b.size - a.size);
    
    const cssFiles = fs.readdirSync(path.join(DIST_DIR, 'css'))
      .filter(file => file.endsWith('.css'))
      .map(file => {
        const filePath = path.join(DIST_DIR, 'css', file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size)
        };
      })
      .sort((a, b) => b.size - a.size);
    
    // Generar reporte
    const report = {
      timestamp: new Date().toISOString(),
      jsFiles,
      cssFiles,
      totalJSSize: jsFiles.reduce((acc, file) => acc + file.size, 0),
      totalCSSSize: cssFiles.reduce((acc, file) => acc + file.size, 0)
    };
    
    // Guardar reporte
    const reportPath = path.join(REPORTS_DIR, `bundle-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Mostrar resumen
    console.log('\n📈 Resumen del Bundle:');
    console.log(`Total JS: ${formatBytes(report.totalJSSize)}`);
    console.log(`Total CSS: ${formatBytes(report.totalCSSSize)}`);
    console.log(`Total: ${formatBytes(report.totalJSSize + report.totalCSSSize)}`);
    
    console.log('\n📄 Archivos JS más grandes:');
    jsFiles.slice(0, 5).forEach(file => {
      console.log(`  ${file.name}: ${file.sizeFormatted}`);
    });
    
    console.log(`\n✅ Reporte guardado en: ${reportPath}`);
    console.log('🌐 Abriendo visualizador de bundle...');
    
    // Abrir visualizador si está disponible
    if (fs.existsSync(path.join(DIST_DIR, 'stats.html'))) {
      execSync('open dist/stats.html', { stdio: 'inherit' });
    }
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error.message);
    process.exit(1);
  }
}

function checkBundleSize() {
  console.log('\n🔍 Verificando límites de tamaño...');
  
  const limits = {
    'vendor-*.js': 2 * 1024 * 1024, // 2MB
    'react-vendor-*.js': 800 * 1024, // 800KB
    'components-*.js': 200 * 1024, // 200KB
    'pages-*.js': 150 * 1024, // 150KB
    'index-*.css': 100 * 1024 // 100KB
  };
  
  let hasViolations = false;
  
  for (const [pattern, limit] of Object.entries(limits)) {
    const files = glob.sync(`dist/js/${pattern}`) || glob.sync(`dist/css/${pattern}`);
    
    for (const file of files) {
      try {
        const stats = fs.statSync(file);
        const size = stats.size;
        const sizeKB = (size / 1024).toFixed(2);
        const limitKB = (limit / 1024).toFixed(0);
        
        if (size > limit) {
          console.log(`❌ ${path.basename(file)}: ${sizeKB}KB > ${limitKB}KB`);
          hasViolations = true;
        } else {
          console.log(`✅ ${path.basename(file)}: ${sizeKB}KB <= ${limitKB}KB`);
        }
      } catch (error) {
        console.log(`⚠️  No se pudo verificar ${file}`);
      }
    }
  }
  
  if (hasViolations) {
    console.log('\n⚠️  Algunos bundles exceden los límites establecidos');
    process.exit(1);
  } else {
    console.log('\n✅ Todos los bundles están dentro de los límites');
  }
}

// Ejecutar según argumentos
const command = process.argv[2];

switch (command) {
  case 'analyze':
    analyzeBundle();
    break;
  case 'check':
    checkBundleSize();
    break;
  case 'full':
    analyzeBundle();
    checkBundleSize();
    break;
  default:
    console.log('Uso: node bundle-monitor.js [analyze|check|full]');
    console.log('  analyze: Genera análisis completo del bundle');
    console.log('  check: Verifica que los tamaños estén dentro de los límites');
    console.log('  full: Ejecuta análisis completo y verificación');
    break;
}