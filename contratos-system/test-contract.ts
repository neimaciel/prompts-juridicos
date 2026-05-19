import { DocumentParser } from './server/document-parser';
import { AdvancedSensitiveDataDetector } from './server/sensitive-data-detector';
import { NativeContractCrypto } from './server/crypto-engine';

async function testContractSystem() {
  console.log('🧪 Testing Contract Analysis System...\n');

  // Test document parser
  console.log('1. Testing Document Parser...');
  const parser = new DocumentParser();
  const testContractText = `
    CONTRATO DE PRESTAÇÃO DE SERVIÇOS

    CONTRATANTE: João Silva, brasileiro, casado, portador do CPF nº 123.456.789-00
    CONTRATADO: Maria Santos Advogados LTDA, CNPJ 12.345.678/0001-90

    CLÁUSULA 1ª - DO OBJETO
    O presente contrato tem por objeto a prestação de serviços jurídicos na área cível.

    CLÁUSULA 2ª - DO VALOR
    O valor dos serviços será de R$ 5.000,00 (cinco mil reais).

    CLÁUSULA 3ª - DO PRAZO
    O prazo para execução dos serviços será de 30 (trinta) dias.

    Local e Data: São Paulo, 23 de junho de 2025
  `;

  const mockParsedDoc = {
    text: testContractText,
    metadata: {
      filename: 'teste-contrato.txt',
      fileSize: testContractText.length,
      wordCount: testContractText.split(' ').length,
      hash: 'test-hash-123'
    }
  };

  const contractValidation = parser.validateContractStructure(testContractText);
  console.log('   ✓ Contract validation:', contractValidation.isValid ? 'VALID' : 'INVALID');
  console.log('   ✓ Confidence:', contractValidation.confidence + '%');

  const contractType = parser.detectContractType(testContractText);
  console.log('   ✓ Detected type:', contractType);

  // Test sensitive data detection
  console.log('\n2. Testing Sensitive Data Detection...');
  const sensitiveDetector = new AdvancedSensitiveDataDetector();
  const sensitiveData = sensitiveDetector.detectSensitiveData(testContractText);
  console.log('   ✓ Sensitive data found:', sensitiveData.length, 'items');
  sensitiveData.forEach(item => {
    console.log(`     - ${item.type}: ${item.value}`);
  });

  // Test encryption
  console.log('\n3. Testing Encryption Engine...');
  const crypto = new NativeContractCrypto();
  const userId = 'test-user-123';
  
  try {
    const encrypted = crypto.encryptContract(testContractText, userId);
    console.log('   ✓ Encryption successful');
    console.log('   ✓ Encrypted length:', encrypted.encryptedContent.length);
    
    const decrypted = crypto.decryptContract(encrypted, userId);
    const isDecryptionSuccessful = decrypted === testContractText;
    console.log('   ✓ Decryption:', isDecryptionSuccessful ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.log('   ❌ Encryption test failed:', error.message);
  }

  // Test fictional data replacement
  console.log('\n4. Testing Fictional Data Replacement...');
  if (sensitiveData.length > 0) {
    const processedText = testContractText;
    let fictionalText = processedText;
    
    sensitiveData.forEach(item => {
      const replacement = sensitiveDetector.generateFictionalReplacement(item.type, item.value);
      fictionalText = fictionalText.replace(item.value, replacement);
    });
    
    console.log('   ✓ Original CPF found:', /123\.456\.789-00/.test(testContractText));
    console.log('   ✓ Fictional replacement:', !/123\.456\.789-00/.test(fictionalText));
  }

  console.log('\n✅ Contract Analysis System Tests Completed');
  return true;
}

// Run tests
testContractSystem().catch(console.error);