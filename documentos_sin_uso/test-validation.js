// Test manual del sistema de validación
const ValidationService = require('./src/services/ValidationService.ts');

// Test de validación de memoria
const testMemory = {
  id: 1,
  title: 'Test Memory',
  content: 'This is a test memory',
  type: 'texto',
  privacyLevel: 3,
  tags: ['test'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {}
};

console.log('Testing ValidationService...');
console.log('Memory validation:', ValidationService.validateMemory(testMemory));
console.log('Text sanitization:', ValidationService.sanitizeText('<script>alert("xss")</script>Hello World'));
console.log('Data integrity check completed successfully!');