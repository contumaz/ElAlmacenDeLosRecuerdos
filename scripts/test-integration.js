#!/usr/bin/env node

/**
 * Script de Testing Automatizado para El Almacén de los Recuerdos
 * Ejecuta tests de integración, funcionalidad y validación
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

// Verificar estructura del proyecto
function validateProjectStructure() {
  logSection('🔍 VALIDANDO ESTRUCTURA DEL PROYECTO');
  
  const requiredFiles = [
    'package.json',
    'src/App.tsx',
    'src/hooks/useAuth.tsx',
    'src/hooks/useMemories.tsx',
    'src/hooks/useNavigation.tsx',
    'src/services/electronAPI.ts',
    'src/components/ErrorBoundary.tsx',
    'src/components/RouteErrorBoundary.tsx',
    'src/backend/main.js',
    'preload.js'
  ];

  const requiredDirectories = [
    'src/components',
    'src/hooks',
    'src/pages',
    'src/services',
    'src/utils',
    'src/types'
  ];

  let allValid = true;

  // Verificar archivos
  log('\n📄 Verificando archivos requeridos:');
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, '..', file));
    if (exists) {
      log(`  ✅ ${file}`, 'green');
    } else {
      log(`  ❌ ${file} - FALTANTE`, 'red');
      allValid = false;
    }
  });

  // Verificar directorios
  log('\n📁 Verificando directorios:');
  requiredDirectories.forEach(dir => {
    const exists = fs.existsSync(path.join(__dirname, '..', dir));
    if (exists) {
      log(`  ✅ ${dir}/`, 'green');
    } else {
      log(`  ❌ ${dir}/ - FALTANTE`, 'red');
      allValid = false;
    }
  });

  return allValid;
}

// Verificar dependencias
function validateDependencies() {
  logSection('📦 VALIDANDO DEPENDENCIAS');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    
    const requiredDeps = [
      'react',
      'react-dom',
      'react-router-dom',
      'typescript',
      'vite',
      '@types/react',
      'tailwindcss'
    ];

    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    log('\n🔍 Verificando dependencias críticas:');
    let allValid = true;
    
    requiredDeps.forEach(dep => {
      if (allDeps[dep]) {
        log(`  ✅ ${dep} - ${allDeps[dep]}`, 'green');
      } else {
        log(`  ❌ ${dep} - FALTANTE`, 'red');
        allValid = false;
      }
    });

    // Verificar scripts importantes
    log('\n⚙️ Verificando scripts de npm:');
    const requiredScripts = ['dev', 'build', 'electron:dev'];
    
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        log(`  ✅ ${script}`, 'green');
      } else {
        log(`  ⚠️ ${script} - FALTANTE`, 'yellow');
      }
    });

    return allValid;
  } catch (error) {
    log(`❌ Error leyendo package.json: ${error.message}`, 'red');
    return false;
  }
}

// Verificar configuración de TypeScript
function validateTypeScriptConfig() {
  logSection('📝 VALIDANDO CONFIGURACIÓN TYPESCRIPT');
  
  const tsConfigFiles = ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json'];
  let allValid = true;

  tsConfigFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, '..', file));
    if (exists) {
      try {
        const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
        log(`  ✅ ${file} - Válido`, 'green');
      } catch (error) {
        log(`  ❌ ${file} - JSON inválido: ${error.message}`, 'red');
        allValid = false;
      }
    } else {
      log(`  ⚠️ ${file} - No encontrado`, 'yellow');
    }
  });

  return allValid;
}

// Test de compilación TypeScript
function testTypeScriptCompilation() {
  logSection('🔧 TESTING COMPILACIÓN TYPESCRIPT');
  
  try {
    log('Ejecutando verificación de tipos...', 'blue');
    execSync('npx tsc --noEmit', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    log('✅ Compilación TypeScript exitosa', 'green');
    return true;
  } catch (error) {
    log('❌ Errores de TypeScript encontrados:', 'red');
    console.log(error.stdout?.toString() || error.message);
    return false;
  }
}

// Test de build de producción
function testProductionBuild() {
  logSection('🏗️ TESTING BUILD DE PRODUCCIÓN');
  
  try {
    log('Ejecutando build de producción...', 'blue');
    const output = execSync('npm run build', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    // Verificar que se creó el directorio dist
    const distExists = fs.existsSync(path.join(__dirname, '..', 'dist'));
    if (distExists) {
      log('✅ Build de producción exitoso', 'green');
      log('✅ Directorio dist creado correctamente', 'green');
      
      // Verificar archivos principales
      const indexHtml = fs.existsSync(path.join(__dirname, '..', 'dist', 'index.html'));
      if (indexHtml) {
        log('✅ index.html generado', 'green');
      } else {
        log('⚠️ index.html no encontrado en dist', 'yellow');
      }
      
      return true;
    } else {
      log('❌ Directorio dist no fue creado', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Error en build de producción:', 'red');
    console.log(error.stdout?.toString() || error.message);
    return false;
  }
}

// Verificar configuración de Electron
function validateElectronConfig() {
  logSection('⚡ VALIDANDO CONFIGURACIÓN ELECTRON');
  
  const electronFiles = [
    'electron.js',
    'preload.js',
    'src/backend/main.js'
  ];

  let allValid = true;

  electronFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, '..', file));
    if (exists) {
      log(`  ✅ ${file}`, 'green');
    } else {
      log(`  ❌ ${file} - FALTANTE`, 'red');
      allValid = false;
    }
  });

  // Verificar que electron esté en dependencias
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (allDeps.electron) {
      log(`  ✅ Electron dependency - ${allDeps.electron}`, 'green');
    } else {
      log('  ⚠️ Electron no está en dependencias', 'yellow');
    }
  } catch (error) {
    log('  ❌ Error verificando dependencias de Electron', 'red');
    allValid = false;
  }

  return allValid;
}

// Test de funcionalidades críticas (análisis estático)
function testCriticalFunctionalities() {
  logSection('🧪 TESTING FUNCIONALIDADES CRÍTICAS');
  
  const tests = [
    {
      name: 'Hook useAuth',
      file: 'src/hooks/useAuth.tsx',
      patterns: ['useContext', 'createContext', 'login', 'logout', 'isAuthenticated']
    },
    {
      name: 'Hook useMemories',
      file: 'src/hooks/useMemories.tsx',
      patterns: ['saveMemory', 'loadMemories', 'selectSaveDirectory', 'saveFileToDirectory']
    },
    {
      name: 'Hook useNavigation',
      file: 'src/hooks/useNavigation.tsx',
      patterns: ['navigate', 'isValidRoute', 'canAccessRoute', 'getCurrentRouteInfo']
    },
    {
      name: 'ElectronService',
      file: 'src/services/electronAPI.ts',
      patterns: ['authenticate', 'saveMemory', 'showSaveDialog', 'isAvailable']
    },
    {
      name: 'ErrorBoundary',
      file: 'src/components/ErrorBoundary.tsx',
      patterns: ['componentDidCatch', 'getDerivedStateFromError', 'resetError']
    }
  ];

  let allValid = true;

  tests.forEach(test => {
    const filePath = path.join(__dirname, '..', test.file);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const missingPatterns = test.patterns.filter(pattern => !content.includes(pattern));
        
        if (missingPatterns.length === 0) {
          log(`  ✅ ${test.name} - Todas las funciones encontradas`, 'green');
        } else {
          log(`  ⚠️ ${test.name} - Funciones faltantes: ${missingPatterns.join(', ')}`, 'yellow');
          allValid = false;
        }
      } catch (error) {
        log(`  ❌ ${test.name} - Error leyendo archivo: ${error.message}`, 'red');
        allValid = false;
      }
    } else {
      log(`  ❌ ${test.name} - Archivo no encontrado: ${test.file}`, 'red');
      allValid = false;
    }
  });

  return allValid;
}

// Generar reporte
function generateReport(results) {
  logSection('📊 GENERANDO REPORTE');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const passRate = (passedTests / totalTests) * 100;

  const reportContent = `# Reporte de Testing Automatizado
## El Almacén de los Recuerdos

**Fecha:** ${new Date().toLocaleString()}
**Tests ejecutados:** ${totalTests}
**Tests exitosos:** ${passedTests}
**Tasa de éxito:** ${passRate.toFixed(2)}%

## Resultados Detallados

${Object.entries(results).map(([test, passed]) => 
  `- ${passed ? '✅' : '❌'} **${test}**`
).join('\n')}

## Estado General

${passRate >= 90 ? '🎉 **EXCELENTE** - Sistema listo para producción' :
  passRate >= 70 ? '⚠️ **ACEPTABLE** - Algunos problemas menores a resolver' :
  '❌ **CRÍTICO** - Problemas importantes que requieren atención'}

## Próximos Pasos

${passRate >= 90 ? 
  '- ✅ Proceder con deployment\n- ✅ Ejecutar tests en entorno de producción' :
  passRate >= 70 ?
  '- ⚠️ Revisar y corregir problemas menores\n- ⚠️ Re-ejecutar tests después de correcciones' :
  '- ❌ Corregir problemas críticos identificados\n- ❌ No proceder con deployment hasta resolver todos los problemas'
}

---
*Generado automáticamente por script de testing*
`;

  const reportPath = path.join(__dirname, '..', 'testing-report.md');
  fs.writeFileSync(reportPath, reportContent);
  
  log(`📄 Reporte generado: ${reportPath}`, 'cyan');
  
  return { passRate, reportPath };
}

// Función principal
function main() {
  log('🚀 INICIANDO TESTING AUTOMATIZADO - EL ALMACÉN DE LOS RECUERDOS', 'bold');
  log('================================================================', 'blue');
  
  const results = {};
  
  // Ejecutar todos los tests
  results['Estructura del Proyecto'] = validateProjectStructure();
  results['Dependencias'] = validateDependencies();
  results['Configuración TypeScript'] = validateTypeScriptConfig();
  results['Compilación TypeScript'] = testTypeScriptCompilation();
  results['Build de Producción'] = testProductionBuild();
  results['Configuración Electron'] = validateElectronConfig();
  results['Funcionalidades Críticas'] = testCriticalFunctionalities();

  // Generar reporte
  const { passRate, reportPath } = generateReport(results);

  // Resultado final
  logSection('🎯 RESULTADO FINAL');
  
  if (passRate >= 90) {
    log('🎉 ¡EXCELENTE! Sistema completamente funcional', 'green');
    log('✅ Listo para deployment en producción', 'green');
  } else if (passRate >= 70) {
    log('⚠️ Sistema funcional con problemas menores', 'yellow');
    log('⚠️ Revisar y corregir antes del deployment', 'yellow');
  } else {
    log('❌ Problemas críticos encontrados', 'red');
    log('❌ NO proceder con deployment', 'red');
  }

  log(`\n📊 Tasa de éxito: ${passRate.toFixed(2)}%`, 'cyan');
  log(`📄 Reporte completo: ${reportPath}`, 'cyan');

  // Exit code
  process.exit(passRate >= 70 ? 0 : 1);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  validateProjectStructure,
  validateDependencies,
  testTypeScriptCompilation,
  testProductionBuild,
  generateReport
};
