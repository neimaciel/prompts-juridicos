import { SensitiveDataMatch } from '../shared/schema';

export class AdvancedSensitiveDataDetector {
  private patterns = {
    cpf: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
    cnpj: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
    rg: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dXx]\b/g,
    phone: /\b\(?\d{2}\)?\s?\d{4,5}-?\d{4}\b/g,
    email: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    address: /(?:rua|av|avenida|travessa|alameda|r\.|av\.)\s+[\w\s,.-]+\d+[\w\s,.-]*/gi,
    bankAccount: /\b(?:ag[ência]*|conta)\s*:?\s*\d{4,5}-?\d?\b/gi,
    salary: /\b(?:salário|remuneração|valor)\s*:?\s*r?\$?\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?\b/gi,
    cep: /\b\d{5}-?\d{3}\b/g,
    pis: /\b\d{3}\.?\d{5}\.?\d{2}-?\d\b/g,
    passport: /\b[A-Z]{2}\d{6,7}\b/g
  };

  private confidenceRules = {
    cpf: (value: string) => this.validateCPF(value) ? 0.95 : 0.7,
    cnpj: (value: string) => this.validateCNPJ(value) ? 0.95 : 0.7,
    rg: () => 0.8,
    phone: (value: string) => value.length >= 10 ? 0.9 : 0.6,
    email: (value: string) => value.includes('.') ? 0.95 : 0.7,
    address: () => 0.75,
    bankAccount: () => 0.85,
    salary: () => 0.9,
    cep: () => 0.9,
    pis: () => 0.8,
    passport: () => 0.9
  };

  detectSensitiveData(text: string): SensitiveDataMatch[] {
    const matches: SensitiveDataMatch[] = [];
    
    Object.entries(this.patterns).forEach(([type, pattern]) => {
      const found = Array.from(text.matchAll(pattern));
      for (const match of found) {
        if (match.index !== undefined) {
          const value = match[0];
          matches.push({
            type,
            value,
            position: { 
              start: match.index, 
              end: match.index + value.length 
            },
            confidence: this.calculateConfidence(type, value),
            suggestion: this.getSuggestion(type)
          });
        }
      }
    });
    
    return this.removeDuplicates(matches);
  }

  private calculateConfidence(type: string, value: string): number {
    const rule = this.confidenceRules[type as keyof typeof this.confidenceRules];
    return rule ? rule(value) : 0.5;
  }

  private getSuggestion(type: string): string {
    const suggestions = {
      cpf: "###.###.###-##",
      cnpj: "##.###.###/####-##",
      rg: "##.###.###-#",
      phone: "(##) #####-####",
      email: "email@exemplo.com",
      address: "Rua Exemplo, 123, Bairro",
      bankAccount: "Ag: #### Conta: #####-#",
      salary: "R$ #.###,##",
      cep: "#####-###",
      pis: "###.#####.##-#",
      passport: "XX######"
    };
    return suggestions[type as keyof typeof suggestions] || "[DADO_PROTEGIDO]";
  }

  private validateCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cleanCPF.charAt(10));
  }

  private validateCNPJ(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14 || /^(\d)\1+$/.test(cleanCNPJ)) return false;
    
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    return digit2 === parseInt(cleanCNPJ.charAt(13));
  }

  private removeDuplicates(matches: SensitiveDataMatch[]): SensitiveDataMatch[] {
    const seen = new Set<string>();
    return matches.filter(match => {
      const key = `${match.type}-${match.position.start}-${match.position.end}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Generate replacement suggestions for fictional data
  generateFictionalReplacement(type: string, originalValue: string): string {
    const generators = {
      cpf: () => this.generateFictionalCPF(),
      cnpj: () => this.generateFictionalCNPJ(),
      phone: () => "(11) 99999-9999",
      email: () => "contato@exemplo.com.br",
      address: () => "Rua das Flores, 123, Centro",
      bankAccount: () => "Ag: 1234 Conta: 12345-6",
      salary: () => "R$ 5.000,00",
      cep: () => "01234-567",
      pis: () => "123.45678.90-1",
      passport: () => "EX123456",
      rg: () => "12.345.678-9"
    };
    
    const generator = generators[type as keyof typeof generators];
    return generator ? generator() : "[VALOR_EXEMPLO]";
  }

  private generateFictionalCPF(): string {
    // Generate valid but fictional CPF
    const digits = Array.from({length: 9}, () => Math.floor(Math.random() * 10));
    
    // Calculate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    const digit1 = remainder === 10 || remainder === 11 ? 0 : remainder;
    
    // Calculate second digit
    sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (11 - i);
    }
    sum += digit1 * 2;
    remainder = (sum * 10) % 11;
    const digit2 = remainder === 10 || remainder === 11 ? 0 : remainder;
    
    return `${digits.slice(0,3).join('')}.${digits.slice(3,6).join('')}.${digits.slice(6,9).join('')}-${digit1}${digit2}`;
  }

  private generateFictionalCNPJ(): string {
    // Generate valid but fictional CNPJ
    const digits = Array.from({length: 12}, () => Math.floor(Math.random() * 10));
    
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    // Calculate first digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    // Calculate second digit
    sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * weights2[i];
    }
    sum += digit1 * weights2[12];
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return `${digits.slice(0,2).join('')}.${digits.slice(2,5).join('')}.${digits.slice(5,8).join('')}/${digits.slice(8,12).join('')}-${digit1}${digit2}`;
  }
}