interface SensitiveDataCheck {
  hasSensitiveData: boolean;
  detectedTypes: string[];
  message: string;
}

export function detectSensitiveData(text: string): SensitiveDataCheck {
  const detectedTypes: string[] = [];
  
  // Patterns for sensitive data detection
  const patterns = {
    cpf: {
      regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
      name: "CPF"
    },
    cnpj: {
      regex: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
      name: "CNPJ"
    },
    // fullName: {
    //   // Nomes podem ser fictícios ou exemplos em contratos - não há como distinguir se são dados pessoais reais
    //   regex: /\b[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)*\b/g,
    //   name: "nome completo"
    // },
    address: {
      // Detecta endereços completos
      regex: /\b(?:rua|av|avenida|travessa|praça|alameda|estrada|rodovia)\s+[^,\n]+,?\s*(?:n[ºo°]?\s*\d+|número\s*\d+)?(?:\s*,\s*[^,\n]+){0,3}\s*-?\s*[A-Z]{2}\b/ig,
      name: "endereço"
    },
    phone: {
      // Detecta telefones brasileiros
      regex: /\b(?:\(\d{2}\)\s?|\d{2}\s?)(?:9\s?)?\d{4}-?\d{4}\b/g,
      name: "telefone"
    },
    email: {
      // Detecta emails
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      name: "e-mail"
    },
    // money: {
    //   // Valores monetários em contratos são informações comerciais normais, não dados sensíveis LGPD
    //   regex: /\bR\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?\b/g,
    //   name: "valor monetário específico"
    // },
    rg: {
      // Detecta RG
      regex: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9X]\b/g,
      name: "RG"
    },
    processNumber: {
      // Detecta números de processo judicial
      regex: /\b\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4}\b/g,
      name: "número de processo"
    },
    bankAccount: {
      // Detecta contas bancárias
      regex: /\b(?:conta|ag|agência)\s*:?\s*\d{4,6}-?\d?\b/ig,
      name: "dados bancários"
    }
  };

  // Check each pattern
  for (const [key, pattern] of Object.entries(patterns)) {
    if (pattern.regex.test(text)) {
      detectedTypes.push(pattern.name);
    }
  }

  const hasSensitiveData = detectedTypes.length > 0;
  
  let message = "";
  if (hasSensitiveData) {
    message = `DADOS SENSÍVEIS DETECTADOS

Por motivos de segurança e proteção de dados pessoais (LGPD), não é possível gerar prompts contendo: ${detectedTypes.join(", ")}.

COMO CORRIGIR:
Use dados genéricos em colchetes:

• Para CPFs/CNPJs reais → use "[CPF]" ou "[CNPJ]"
• Em vez de "123.456.789-00" → use "[CPF]"
• Em vez de "12.345.678/0001-90" → use "[CNPJ]"
• Em vez de "Rua das Flores, 123" → use "[endereço]"
• Em vez de "(11) 99999-9999" → use "[telefone]"
• Para valores altos sensíveis → use "[valor]" (opcional)

EXEMPLO CORRETO:
"Contrato de locação entre [nome do locador] e [nome do locatário] para imóvel localizado em [endereço], com valor mensal de [valor do aluguel]"

O prompt gerado será estruturado para personalização posterior com dados reais.`;
  }

  return {
    hasSensitiveData,
    detectedTypes,
    message
  };
}