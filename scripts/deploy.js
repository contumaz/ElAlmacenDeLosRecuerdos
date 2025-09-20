#!/usr/bin/env node

/**
 * Script de Deployment para El Almacén de los Recuerdos
 * Automatiza el proceso de build y distribución
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

// Verificaciones previas al deployment
function preDeploymentChecks() {
  logSection('🔍 VERIFICACIONES PREVIAS AL DEPLOYMENT');
  
  const checks = [
    {
      name: 'package.json existe',
      check: () => fs.existsSync('package.json'),
      fix: 'Crear package.json con npm init'
    },
    {
      name: 'node_modules existe',
      check: () => fs.existsSync('node_modules'),
      fix: 'Ejecutar pnpm install'
    },
    {
      name: 'src directory existe',
      check: () => fs.existsSync('src'),
      fix: 'Crear directorio src con código fuente'
    },
    {
      name: 'TypeScript config válido',
      check: () => {
        try {
          JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
          return true;
        } catch {
          return false;
        }
      },
      fix: 'Corregir tsconfig.json'
    }
  ];

  let allPassed = true;
  
  checks.forEach(check => {
    const passed = check.check();
    if (passed) {
      log(`  ✅ ${check.name}`, 'green');
    } else {
      log(`  ❌ ${check.name} - ${check.fix}`, 'red');
      allPassed = false;
    }
  });

  return allPassed;
}

// Testing previo al deployment
function runPreDeploymentTests() {
  logSection('🧪 TESTING PREVIO AL DEPLOYMENT');
  
  try {
    log('Ejecutando tests de integración...', 'blue');
    execSync('node scripts/test-integration.js', { stdio: 'pipe' });
    log('✅ Tests de integración pasaron', 'green');
    return true;
  } catch (error) {
    log('❌ Tests de integración fallaron', 'red');
    console.log(error.stdout?.toString() || error.message);
    return false;
  }
}

// Build de producción
function buildProduction() {
  logSection('🏗️ BUILD DE PRODUCCIÓN');
  
  try {
    log('Ejecutando build de producción...', 'blue');
    execSync('npm run build', { stdio: 'inherit' });
    log('✅ Build de producción exitoso', 'green');
    
    // Verificar que dist existe
    if (fs.existsSync('dist')) {
      log('✅ Directorio dist creado correctamente', 'green');
      
      // Verificar archivos principales
      const distFiles = fs.readdirSync('dist');
      log(`📁 Archivos en dist: ${distFiles.length}`, 'cyan');
      
      return true;
    } else {
      log('❌ Directorio dist no fue creado', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Error en build de producción', 'red');
    console.log(error.message);
    return false;
  }
}

// Build de Electron
function buildElectron() {
  logSection('⚡ BUILD DE ELECTRON');
  
  try {
    log('Ejecutando build de Electron...', 'blue');
    execSync('npm run build:electron', { stdio: 'inherit' });
    log('✅ Build de Electron exitoso', 'green');
    
    // Verificar que release existe
    if (fs.existsSync('release')) {
      log('✅ Directorio release creado correctamente', 'green');
      return true;
    }
    
    return true;
  } catch (error) {
    log('⚠️ Build de Electron falló (puede ser normal si no está configurado)', 'yellow');
    console.log(error.message);
    return false; // No crítico
  }
}

// Generar documentación de deployment
function generateDeploymentDocs() {
  logSection('📚 GENERANDO DOCUMENTACIÓN DE DEPLOYMENT');
  
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    version: getVersion(),
    buildType: 'production',
    nodeVersion: process.version,
    platform: process.platform,
    distFiles: fs.existsSync('dist') ? fs.readdirSync('dist') : [],
    releaseFiles: fs.existsSync('release') ? fs.readdirSync('release') : []
  };

  const docContent = `# Deployment Information - El Almacén de los Recuerdos

**Fecha de Deployment:** ${deploymentInfo.timestamp}
**Versión:** ${deploymentInfo.version}
**Tipo de Build:** ${deploymentInfo.buildType}
**Node.js Version:** ${deploymentInfo.nodeVersion}
**Plataforma:** ${deploymentInfo.platform}

## Archivos de Distribución

### Web Build (dist/)
${deploymentInfo.distFiles.length > 0 ? 
  deploymentInfo.distFiles.map(file => `- ${file}`).join('\n') :
  'No se generaron archivos de distribución web'
}

### Electron Build (release/)
${deploymentInfo.releaseFiles.length > 0 ? 
  deploymentInfo.releaseFiles.map(file => `- ${file}`).join('\n') :
  'No se generaron archivos de distribución Electron'
}

## Instrucciones de Deployment

### Web Deployment
1. Subir contenido de \`dist/\` a servidor web
2. Configurar servidor para SPA (Single Page Application)
3. Asegurar HTTPS para funcionalidades web avanzadas

### Electron Deployment
1. Distribuir archivos de \`release/\`
2. Incluir instrucciones de instalación por plataforma
3. Configurar auto-updater si está habilitado

## Validaciones Realizadas
- ✅ Tests de integración pasados
- ✅ Build de producción exitoso
- ✅ Verificaciones de estructura completadas
- ✅ Documentación generada

---
*Generado automáticamente por script de deployment*
`;

  fs.writeFileSync('deployment-info.md', docContent);
  log('📄 Documentación de deployment generada: deployment-info.md', 'cyan');
}

// Obtener versión del package.json
function getVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

// Generar checklist de deployment
function generateDeploymentChecklist() {
  logSection('📋 GENERANDO CHECKLIST DE DEPLOYMENT');
  
  const checklist = `# Checklist de Deployment - El Almacén de los Recuerdos

## Pre-Deployment
- [ ] ✅ Tests de integración pasaron (${new Date().toISOString()})
- [ ] ✅ Build de producción exitoso
- [ ] ✅ Verificaciones de estructura completadas
- [ ] ✅ Documentación actualizada

## Web Deployment
- [ ] Subir archivos de dist/ a servidor
- [ ] Configurar redirects para SPA
- [ ] Verificar HTTPS habilitado
- [ ] Probar funcionalidades en producción
- [ ] Verificar Web APIs disponibles

## Electron Deployment
- [ ] Generar builds para todas las plataformas
- [ ] Probar instalación en sistemas limpios
- [ ] Verificar permisos de archivos
- [ ] Probar funcionalidades nativas
- [ ] Configurar certificados de código (opcional)

## Post-Deployment
- [ ] Monitorear logs de errores
- [ ] Verificar métricas de performance
- [ ] Recopilar feedback de usuarios
- [ ] Documentar problemas encontrados
- [ ] Planificar siguientes iteraciones

## URLs y Recursos
- Repositorio: [URL del repositorio]
- Documentación: /docs/
- Issues: [URL de issues]
- Testing: /scripts/test-integration.js

---
*Generado el ${new Date().toLocaleString()}*
`;

  fs.writeFileSync('deployment-checklist.md', checklist);
  log('📋 Checklist de deployment generado: deployment-checklist.md', 'cyan');
}

// Función principal
function main() {
  log('🚀 INICIANDO PROCESO DE DEPLOYMENT - EL ALMACÉN DE LOS RECUERDOS', 'bold');
  log('================================================================', 'blue');
  
  // Verificaciones previas
  if (!preDeploymentChecks()) {
    log('\n❌ DEPLOYMENT CANCELADO: Fallan verificaciones previas', 'red');
    process.exit(1);
  }

  // Testing previo
  if (!runPreDeploymentTests()) {
    log('\n❌ DEPLOYMENT CANCELADO: Tests previos fallaron', 'red');
    process.exit(1);
  }

  // Build de producción
  if (!buildProduction()) {
    log('\n❌ DEPLOYMENT CANCELADO: Build de producción falló', 'red');
    process.exit(1);
  }

  // Build de Electron (opcional)
  const electronSuccess = buildElectron();

  // Generar documentación
  generateDeploymentDocs();
  generateDeploymentChecklist();

  // Resultado final
  logSection('🎉 DEPLOYMENT COMPLETADO');
  
  log('✅ Web build completado exitosamente', 'green');
  if (electronSuccess) {
    log('✅ Electron build completado exitosamente', 'green');
  } else {
    log('⚠️ Electron build omitido o falló (no crítico)', 'yellow');
  }
  
  log('\n📁 Archivos generados:', 'cyan');
  log('  - dist/ (web deployment)', 'cyan');
  if (electronSuccess) {
    log('  - release/ (electron deployment)', 'cyan');
  }
  log('  - deployment-info.md', 'cyan');
  log('  - deployment-checklist.md', 'cyan');
  
  log('\n🎯 PROYECTO LISTO PARA PRODUCCIÓN', 'green');
  log('📖 Revisar deployment-checklist.md para siguientes pasos', 'cyan');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  preDeploymentChecks,
  runPreDeploymentTests,
  buildProduction,
  buildElectron,
  generateDeploymentDocs
};
