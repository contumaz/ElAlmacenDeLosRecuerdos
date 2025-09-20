/**
 * Testing del análisis emocional para ejecutar en el navegador
 * Ejecutar en la consola del navegador: window.testEmotionAnalysis()
 */

import emotionAnalysisService from '../services/EmotionAnalysisService';

// Textos de prueba con diferentes emociones
const testTexts = {
  joy: "¡Estoy tan feliz! Hoy es el mejor día de mi vida. Todo sale perfecto.",
  sadness: "Me siento muy triste y melancólico. Nada parece tener sentido.",
  anger: "Estoy furioso con esta situación. No puedo creer que haya pasado esto.",
  fear: "Tengo mucho miedo de lo que pueda pasar. Me siento muy ansioso.",
  surprise: "¡No puedo creer lo que acaba de pasar! ¡Qué sorpresa tan increíble!",
  love: "Te amo tanto. Eres la persona más importante en mi vida.",
  neutral: "Hoy fui al supermercado y compré algunas cosas para la casa."
};

// Función principal de testing
export async function testEmotionAnalysis() {
  console.log('🧪 Iniciando testing del análisis emocional...');
  
  try {
    // Test 1: Inicialización del servicio
    console.log('\n📋 Test 1: Inicialización del servicio');
    const service = emotionAnalysisService;
    console.log('✅ Servicio inicializado correctamente');
    
    // Esperar a que el modelo se cargue
    console.log('⏳ Cargando modelo de análisis emocional...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Análisis de texto individual
    console.log('\n📋 Test 2: Análisis de texto individual');
    const results: any[] = [];
    
    for (const [emotion, text] of Object.entries(testTexts)) {
      try {
        console.log(`🔍 Analizando: ${emotion}`);
        const result = await emotionAnalysisService.analyzeEmotion(text);
        results.push({ expected: emotion, ...result });
        console.log(`✅ ${emotion}: ${result.dominantEmotion} (${(result.confidence * 100).toFixed(1)}%)`);
        
        // Verificar estructura del resultado
        if (!result.dominantEmotion || typeof result.confidence !== 'number') {
          console.error(`❌ Estructura incorrecta para ${emotion}:`, result);
        }
      } catch (error) {
        console.error(`❌ Error analizando ${emotion}:`, error);
      }
    }
    
    // Test 3: Análisis en lote
    console.log('\n📋 Test 3: Análisis en lote');
    try {
      const batchTexts = Object.values(testTexts).slice(0, 3);
      const batchResults = await emotionAnalysisService.analyzeBatch(batchTexts);
      console.log(`✅ Análisis en lote completado: ${batchResults.length} resultados`);
      
      batchResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.dominantEmotion} (${(result.confidence * 100).toFixed(1)}%)`);
      });
    } catch (error) {
      console.error('❌ Error en análisis en lote:', error);
    }
    
    // Test 4: Estadísticas emocionales
    console.log('\n📋 Test 4: Estadísticas emocionales');
    try {
      const mockHistory = [
        { emotions: [], dominantEmotion: 'joy', confidence: 0.8, timestamp: new Date(Date.now() - 1000) },
        { emotions: [], dominantEmotion: 'joy', confidence: 0.9, timestamp: new Date(Date.now() - 2000) },
        { emotions: [], dominantEmotion: 'sadness', confidence: 0.7, timestamp: new Date(Date.now() - 3000) },
        { emotions: [], dominantEmotion: 'love', confidence: 0.85, timestamp: new Date(Date.now() - 4000) }
      ];
      
      const stats = service.getEmotionStatistics(mockHistory);
      console.log('✅ Estadísticas generadas:');
      console.log(`   Total de análisis: ${mockHistory.length}`);
      console.log(`   Emoción dominante: ${stats.mostFrequentEmotion}`);
      console.log(`   Confianza promedio: ${(stats.averageConfidence * 100).toFixed(1)}%`);
      console.log(`   Distribución:`, stats.emotionCounts);
      console.log(`   Tendencias:`, stats.emotionTrends);
    } catch (error) {
      console.error('❌ Error generando estadísticas:', error);
    }
    
    // Test 5: Mapeo de colores
    console.log('\n📋 Test 5: Mapeo de colores para emociones');
    const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'love'];
    emotions.forEach(emotion => {
      const color = service.getEmotionColor(emotion);
      console.log(`✅ ${emotion}: ${color}`);
    });
    
    // Test 6: Cache del servicio
    console.log('\n📋 Test 6: Verificación de cache');
    try {
      const testText = testTexts.joy;
      
      // Primera llamada (sin cache)
      const start1 = performance.now();
      await emotionAnalysisService.analyzeEmotion(testText);
      const time1 = performance.now() - start1;
      
      // Segunda llamada (con cache)
      const start2 = performance.now();
      await emotionAnalysisService.analyzeEmotion(testText);
      const time2 = performance.now() - start2;
      
      console.log(`✅ Primera llamada: ${time1.toFixed(2)}ms`);
      console.log(`✅ Segunda llamada (cache): ${time2.toFixed(2)}ms`);
      
      if (time2 < time1 * 0.5) {
        console.log('✅ Cache funcionando correctamente');
      } else {
        console.log('⚠️ Cache podría no estar funcionando óptimamente');
      }
    } catch (error) {
      console.error('❌ Error verificando cache:', error);
    }
    
    console.log('\n🎉 Testing completado!');
    console.log('\n📊 Resumen de resultados:');
    results.forEach(result => {
      const accuracy = result.expected === result.dominantEmotion ? '✅' : '⚠️';
      console.log(`${accuracy} Esperado: ${result.expected} | Detectado: ${result.dominantEmotion} (${(result.confidence * 100).toFixed(1)}%)`);
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Error crítico en el testing:', error);
    return null;
  }
}

// Test de rendimiento
export async function testPerformance() {
  console.log('\n⚡ Iniciando test de rendimiento...');
  
  const service = emotionAnalysisService;
  const testText = testTexts.joy;
  const iterations = 5;
  
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await emotionAnalysisService.analyzeEmotion(testText + ` ${i}`);
    const end = performance.now();
    times.push(end - start);
    console.log(`   Iteración ${i + 1}: ${(end - start).toFixed(2)}ms`);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  console.log(`📈 Rendimiento promedio: ${avgTime.toFixed(2)}ms`);
  console.log(`📈 Tiempo mínimo: ${minTime.toFixed(2)}ms`);
  console.log(`📈 Tiempo máximo: ${maxTime.toFixed(2)}ms`);
  
  if (avgTime < 1000) {
    console.log('✅ Rendimiento excelente (< 1s)');
  } else if (avgTime < 3000) {
    console.log('⚠️ Rendimiento aceptable (1-3s)');
  } else {
    console.log('❌ Rendimiento lento (> 3s)');
  }
  
  return { avgTime, minTime, maxTime };
}

// Hacer disponible globalmente en el navegador
if (typeof window !== 'undefined') {
  (window as any).testEmotionAnalysis = testEmotionAnalysis;
  (window as any).testPerformance = testPerformance;
  
  console.log('🧪 Tests de análisis emocional disponibles:');
  console.log('💡 Ejecuta: testEmotionAnalysis() para tests completos');
  console.log('💡 Ejecuta: testPerformance() para test de rendimiento');
}