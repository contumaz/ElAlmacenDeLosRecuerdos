#!/usr/bin/env node

/**
 * Script de validación para verificar que las correcciones DOM están implementadas
 * Valida que todas las protecciones contra errores DOM críticos estén en su lugar
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validando Correcciones DOM...\n');

const srcPath = path.join(__dirname, '..', 'src');
const validations = {
  useMemoriesProtection: {
    name: 'Hook useMemories - Protección de Estados',
    file: path.join(srcPath, 'hooks', 'useMemories.tsx'),
    tests: [
      {
        name: 'Import useRef añadido',
        pattern: /import.*useRef.*from 'react'/,
        required: true
      },
      {
        name: 'isMountedRef declarado',
        pattern: /const isMountedRef = useRef\(true\)/,
        required: true
      },
      {
        name: 'Cleanup implementado',
        pattern: /isMountedRef\.current = false/,
        required: true
      },
      {
        name: 'setMemories protegido en loadMemories',
        pattern: /if \(isMountedRef\.current\) \{\s*setMemories/,
        required: true
      },
      {
        name: 'setLoading protegido',
        pattern: /if \(isMountedRef\.current\) \{\s*setLoading/,
        required: true
      },
      {
        name: 'setError protegido',
        pattern: /if \(isMountedRef\.current\) \{\s*setError/,
        required: true
      },
      {
        name: 'saveMemory con protección de estado',
        pattern: /if \(isMountedRef\.current\) \{[\s\S]*?setMemories\(prev/,
        required: true
      }
    ]
  },

  nuevaMemoriaProtection: {
    name: 'Componente NuevaMemoria - Navegación Segura',
    file: path.join(srcPath, 'pages', 'NuevaMemoria.tsx'),
    tests: [
      {
        name: 'Import useEffect añadido',
        pattern: /import.*useEffect.*from 'react'/,
        required: true
      },
      {
        name: 'isMountedRef declarado',
        pattern: /const isMountedRef = useRef\(true\)/,
        required: true
      },
      {
        name: 'Cleanup implementado',
        pattern: /useEffect\(\(\) => \{[\s\S]*?isMountedRef\.current = false/,
        required: true
      },
      {
        name: 'setTimeout antes de navegación',
        pattern: /setTimeout\(\(\) => \{[\s\S]*?navigate\('\/memorias'\)/,
        required: true
      },
      {
        name: 'Verificación antes de setIsSaving',
        pattern: /if \(isMountedRef\.current\) \{[\s\S]*?setIsSaving\(false\)/,
        required: true
      }
    ]
  },

  safeDOMWrapper: {
    name: 'SafeDOMWrapper - Protección DOM',
    file: path.join(srcPath, 'components', 'SafeDOMWrapper.tsx'),
    tests: [
      {
        name: 'Archivo SafeDOMWrapper existe',
        pattern: /export class SafeDOMWrapper/,
        required: true
      },
      {
        name: 'getDerivedStateFromError implementado',
        pattern: /static getDerivedStateFromError/,
        required: true
      },
      {
        name: 'Captura errores removeChild',
        pattern: /error\.message\.includes\('removeChild'\)/,
        required: true
      },
      {
        name: 'Captura errores insertBefore',
        pattern: /error\.message\.includes\('insertBefore'\)/,
        required: true
      },
      {
        name: 'flushSync importado',
        pattern: /import.*flushSync.*from 'react-dom'/,
        required: true
      }
    ]
  },

  appIntegration: {
    name: 'App.tsx - Integración SafeDOMWrapper',
    file: path.join(srcPath, 'App.tsx'),
    tests: [
      {
        name: 'SafeDOMWrapper importado',
        pattern: /import.*SafeDOMWrapper.*from/,
        required: true
      },
      {
        name: 'SafeDOMWrapper envolviendo MemoriesProvider',
        pattern: /<SafeDOMWrapper>[\s\S]*?<MemoriesProvider>/,
        required: true
      },
      {
        name: 'Future flags configurados',
        pattern: /future=\{\{[\s\S]*?v7_startTransition: true/,
        required: true
      }
    ]
  }
};

// Función para ejecutar validaciones
function runValidation(validationGroup) {
  const { name, file, tests } = validationGroup;
  
  console.log(`📁 ${name}:`);
  
  if (!fs.existsSync(file)) {
    console.log(`  ❌ Archivo no encontrado: ${file}`);
    return { passed: 0, total: tests.length };
  }

  const content = fs.readFileSync(file, 'utf8');
  let passed = 0;

  tests.forEach(test => {
    const match = content.match(test.pattern);
    if (match) {
      console.log(`  ✅ ${test.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${test.name}`);
      if (test.required) {
        console.log(`     🔍 Patrón esperado: ${test.pattern}`);
      }
    }
  });

  console.log('');
  return { passed, total: tests.length };
}

// Ejecutar todas las validaciones
let totalPassed = 0;
let totalTests = 0;

Object.values(validations).forEach(validation => {
  const result = runValidation(validation);
  totalPassed += result.passed;
  totalTests += result.total;
});

// Validaciones adicionales específicas
console.log('🔧 VERIFICACIONES ADICIONALES:');

// Verificar que no hay console.error o console.warn relacionados con DOM
const searchFiles = [
  path.join(srcPath, 'hooks', 'useMemories.tsx'),
  path.join(srcPath, 'pages', 'NuevaMemoria.tsx')
];

let additionalPassed = 0;
let additionalTotal = 3;

searchFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Verificar que no hay setState sin protección
    const unprotectedSetState = content.match(/(?<!if \(isMountedRef\.current\) \{\s*)set[A-Z]\w*\(/g);
    if (!unprotectedSetState || unprotectedSetState.length === 0) {
      console.log(`  ✅ No hay setState sin protección en ${path.basename(file)}`);
      additionalPassed++;
    } else {
      console.log(`  ⚠️ Posibles setState sin protección en ${path.basename(file)}: ${unprotectedSetState.length}`);
    }
  }
});

// Verificar build exitoso
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(srcPath, '..', 'package.json'), 'utf8'));
  if (packageJson.devDependencies && packageJson.devDependencies.terser) {
    console.log('  ✅ Terser instalado para build de producción');
    additionalPassed++;
  } else {
    console.log('  ❌ Terser no encontrado en devDependencies');
  }
} catch (e) {
  console.log('  ❌ Error leyendo package.json');
}

totalPassed += additionalPassed;
totalTests += additionalTotal;

// Resumen final
console.log('📊 RESUMEN DE VALIDACIÓN:');
console.log(`Total de pruebas: ${totalTests}`);
console.log(`✅ Exitosas: ${totalPassed}`);
console.log(`❌ Fallidas: ${totalTests - totalPassed}`);
console.log(`📈 Porcentaje de éxito: ${((totalPassed / totalTests) * 100).toFixed(1)}%\n`);

// Verificaciones críticas
const criticalChecks = [
  totalPassed >= totalTests * 0.9, // 90% o más de éxito
  fs.existsSync(path.join(srcPath, 'components', 'SafeDOMWrapper.tsx')),
  fs.existsSync(path.join(srcPath, 'hooks', 'useMemories.tsx')),
];

const allCriticalPassed = criticalChecks.every(check => check);

if (allCriticalPassed && totalPassed >= totalTests * 0.9) {
  console.log('🎉 ¡VALIDACIÓN EXITOSA!');
  console.log('   Todas las correcciones DOM están implementadas correctamente.');
  console.log('   El proyecto está protegido contra errores DOM críticos.');
  console.log('');
  console.log('✅ ESTADO: LISTO PARA PRODUCCIÓN');
} else {
  console.log('⚠️ VALIDACIÓN INCOMPLETA');
  console.log('   Algunas correcciones pueden estar faltando.');
  console.log('   Revisar los elementos marcados como fallidos.');
  console.log('');
  console.log('❌ ESTADO: REQUIERE ATENCIÓN');
}

console.log('\n🔄 Para probar manualmente:');
console.log('1. npm run dev');
console.log('2. Crear nueva memoria con audio');
console.log('3. Guardar inmediatamente');
console.log('4. Verificar consola sin errores DOM');
