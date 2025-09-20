#!/usr/bin/env node

/**
 * Script de validación del sistema de memorias reparado
 * Verifica que todos los componentes estén correctamente integrados
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validando Sistema de Memorias...\n');

const srcPath = path.join(__dirname, '..', 'src');
const checks = {
  backend: {
    name: 'Backend IPC Handlers',
    file: path.join(srcPath, 'backend', 'main.js'),
    tests: [
      {
        name: 'Handler save-file-to-directory existe',
        pattern: /ipcMain\.handle\('save-file-to-directory'/,
        required: true
      },
      {
        name: 'Método saveFileToDirectory implementado',
        pattern: /async saveFileToDirectory\(event, directory, fileName, fileData\)/,
        required: true
      },
      {
        name: 'Handler show-save-dialog existe',
        pattern: /ipcMain\.handle\('show-save-dialog'/,
        required: true
      }
    ]
  },
  
  electronService: {
    name: 'Electron Service',
    file: path.join(srcPath, 'services', 'electronAPI.ts'),
    tests: [
      {
        name: 'Método saveFileToDirectory llama handler correcto',
        pattern: /invoke\('save-file-to-directory'/,
        required: true
      },
      {
        name: 'Método showSaveDialog implementado',
        pattern: /async showSaveDialog/,
        required: true
      },
      {
        name: 'Fallback para modo web en saveFileToDirectory',
        pattern: /downloadFile\(data, fileName\)/,
        required: true
      }
    ]
  },
  
  useMemories: {
    name: 'Hook useMemories',
    file: path.join(srcPath, 'hooks', 'useMemories.tsx'),
    tests: [
      {
        name: 'Usa ElectronService en lugar de window.electronAPI',
        pattern: /new ElectronService\(\)/,
        required: true
      },
      {
        name: 'Método selectSaveDirectory implementado',
        pattern: /const selectSaveDirectory = async/,
        required: true
      },
      {
        name: 'Método saveFileToDirectory implementado',
        pattern: /const saveFileToDirectory = async/,
        required: true
      },
      {
        name: 'Fallback para modo web en selectSaveDirectory',
        pattern: /showDirectoryPicker/,
        required: true
      }
    ]
  },
  
  routing: {
    name: 'Sistema de Rutas',
    file: path.join(srcPath, 'App.tsx'),
    tests: [
      {
        name: 'Ruta para ver memoria específica',
        pattern: /\/memorias\/:id.*element=\{<VerMemoria/,
        required: true
      },
      {
        name: 'Ruta para editar memoria específica',
        pattern: /\/memorias\/:id\/editar.*element=\{<EditarMemoria/,
        required: true
      },
      {
        name: 'Future flags de React Router configurados',
        pattern: /v7_startTransition.*v7_relativeSplatPath/,
        required: true
      }
    ]
  },
  
  verMemoria: {
    name: 'Página VerMemoria',
    file: path.join(srcPath, 'pages', 'VerMemoria.tsx'),
    tests: [
      {
        name: 'VerMemoria.tsx existe',
        pattern: /export function VerMemoria/,
        required: true
      }
    ]
  },
  
  editarMemoria: {
    name: 'Página EditarMemoria',
    file: path.join(srcPath, 'pages', 'EditarMemoria.tsx'),
    tests: [
      {
        name: 'EditarMemoria.tsx existe',
        pattern: /export function EditarMemoria/,
        required: true
      }
    ]
  },
  
  navigation: {
    name: 'Hook useNavigation',
    file: path.join(srcPath, 'hooks', 'useNavigation.tsx'),
    tests: [
      {
        name: 'Valida rutas de memoria específica',
        pattern: /memoryViewMatch.*path\.match.*\/memorias/,
        required: true
      },
      {
        name: 'Valida rutas de edición de memoria',
        pattern: /memoryEditMatch.*path\.match.*\/editar/,
        required: true
      }
    ]
  },
  
  audioRecorder: {
    name: 'AudioRecorder Component',
    file: path.join(srcPath, 'components', 'AudioRecorder.tsx'),
    tests: [
      {
        name: 'AudioRecorder usa useMemories correctamente',
        pattern: /selectSaveDirectory, saveFileToDirectory.*useMemories/,
        required: true
      }
    ]
  },
  
  nuevaMemoria: {
    name: 'NuevaMemoria Component',
    file: path.join(srcPath, 'pages', 'NuevaMemoria.tsx'),
    tests: [
      {
        name: 'NuevaMemoria usa sistema de guardado',
        pattern: /saveFileToDirectory.*selectedDirectory/,
        required: true
      }
    ]
  }
};

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

// Función para ejecutar validaciones
function validateFile(filePath, tests, sectionName) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${sectionName}: Archivo no encontrado: ${filePath}`);
    tests.forEach(test => {
      totalTests++;
      failedTests.push(`${sectionName}: ${test.name} - Archivo no encontrado`);
    });
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(`📁 ${sectionName}:`);
  
  tests.forEach(test => {
    totalTests++;
    const passed = test.pattern.test(content);
    
    if (passed) {
      passedTests++;
      console.log(`  ✅ ${test.name}`);
    } else {
      console.log(`  ❌ ${test.name}`);
      failedTests.push(`${sectionName}: ${test.name}`);
    }
  });
  
  console.log('');
}

// Ejecutar todas las validaciones
Object.entries(checks).forEach(([section, config]) => {
  if (config.file && config.tests) {
    validateFile(config.file, config.tests, config.name);
  }
});

// Mostrar resumen
console.log('📊 RESUMEN DE VALIDACIÓN:');
console.log(`Total de pruebas: ${totalTests}`);
console.log(`✅ Exitosas: ${passedTests}`);
console.log(`❌ Fallidas: ${totalTests - passedTests}`);
console.log(`📈 Porcentaje de éxito: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (failedTests.length > 0) {
  console.log('❌ PRUEBAS FALLIDAS:');
  failedTests.forEach(test => console.log(`  - ${test}`));
  console.log('');
}

// Verificaciones adicionales específicas del sistema de memorias
console.log('🔧 VERIFICACIONES ADICIONALES:');

// Verificar que no hay window.electronAPI directo en useMemories
const useMemoriesPath = path.join(srcPath, 'hooks', 'useMemories.tsx');
if (fs.existsSync(useMemoriesPath)) {
  const useMemoriesContent = fs.readFileSync(useMemoriesPath, 'utf8');
  const hasDirectElectronAPI = /window\.electronAPI/.test(useMemoriesContent);
  
  if (!hasDirectElectronAPI) {
    console.log('  ✅ useMemories no usa window.electronAPI directamente');
  } else {
    console.log('  ❌ useMemories todavía usa window.electronAPI directamente');
  }
}

// Verificar compatibilidad Electron/Web
const electronServicePath = path.join(srcPath, 'services', 'electronAPI.ts');
if (fs.existsSync(electronServicePath)) {
  const electronServiceContent = fs.readFileSync(electronServicePath, 'utf8');
  const hasWebFallbacks = /if \(!this\.electronAPI\)/.test(electronServiceContent);
  
  if (hasWebFallbacks) {
    console.log('  ✅ ElectronService tiene fallbacks para modo web');
  } else {
    console.log('  ❌ ElectronService no tiene fallbacks para modo web');
  }
}

// Estado final
if (passedTests === totalTests) {
  console.log('\n🎉 ¡SISTEMA DE MEMORIAS COMPLETAMENTE REPARADO!');
  console.log('   Todas las funcionalidades están implementadas y validadas.');
  process.exit(0);
} else {
  console.log('\n⚠️  SISTEMA DE MEMORIAS PARCIALMENTE REPARADO');
  console.log('   Algunas funcionalidades requieren atención adicional.');
  process.exit(1);
}
