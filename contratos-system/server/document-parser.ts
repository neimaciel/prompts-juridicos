import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { createHash } from 'crypto';

export interface ParsedDocument {
  text: string;
  metadata: {
    filename: string;
    fileSize: number;
    pageCount?: number;
    wordCount: number;
    hash: string;
  };
}

export class DocumentParser {
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly supportedTypes = ['pdf', 'doc', 'docx'];

  async parseDocument(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    if (buffer.length > this.maxFileSize) {
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    const extension = this.getFileExtension(filename);
    if (!this.supportedTypes.includes(extension)) {
      throw new Error(`Tipo de arquivo não suportado. Suportados: ${this.supportedTypes.join(', ')}`);
    }

    let text = '';
    let pageCount: number | undefined;

    try {
      switch (extension) {
        case 'pdf':
          const pdfData = await pdf(buffer);
          text = pdfData.text;
          pageCount = pdfData.numpages;
          break;
        
        case 'doc':
        case 'docx':
          const result = await mammoth.extractRawText({ buffer });
          text = result.value;
          break;
        
        default:
          throw new Error(`Tipo de arquivo não suportado: ${extension}`);
      }
    } catch (error) {
      throw new Error(`Erro ao processar documento: ${error.message}`);
    }

    if (!text.trim()) {
      throw new Error('Não foi possível extrair texto do documento');
    }

    const hash = createHash('sha256').update(buffer).digest('hex');
    const wordCount = this.countWords(text);

    return {
      text: text.trim(),
      metadata: {
        filename,
        fileSize: buffer.length,
        pageCount,
        wordCount,
        hash
      }
    };
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  // Validate if document appears to be a contract
  validateContractStructure(text: string): {
    isValid: boolean;
    issues: string[];
    confidence: number;
  } {
    const issues: string[] = [];
    let confidence = 0;

    // Check for basic contract elements
    const contractIndicators = [
      /\b(?:contrato|acordo|ajuste|convenção)\b/gi,
      /\b(?:partes?|contratante|contratado)\b/gi,
      /\b(?:cláusula|artigo|parágrafo)\b/gi,
      /\b(?:objeto|finalidade|escopo)\b/gi,
      /\b(?:prazo|vigência|duração)\b/gi,
      /\b(?:valor|preço|remuneração)\b/gi
    ];

    contractIndicators.forEach(pattern => {
      if (pattern.test(text)) {
        confidence += 15;
      }
    });

    // Check minimum length
    if (text.length < 500) {
      issues.push('Documento muito curto para ser um contrato');
      confidence -= 20;
    }

    // Check for party identification
    if (!/\b(?:nome|razão social|cpf|cnpj)\b/gi.test(text)) {
      issues.push('Não foram identificadas informações das partes');
      confidence -= 15;
    }

    // Check for signatures or execution date
    if (!/\b(?:assinatura|data|local)\b/gi.test(text)) {
      issues.push('Não foram identificadas informações de execução');
      confidence -= 10;
    }

    confidence = Math.max(0, Math.min(100, confidence));
    const isValid = confidence >= 40 && issues.length < 3;

    return {
      isValid,
      issues,
      confidence
    };
  }

  // Extract potential contract type
  detectContractType(text: string): string {
    const contractTypes = {
      'Compra e Venda': [
        /\b(?:compra|venda|aquisição|alienação)\b/gi,
        /\b(?:bem|imóvel|veículo|produto)\b/gi
      ],
      'Prestação de Serviços': [
        /\b(?:prestação|serviços|execução)\b/gi,
        /\b(?:serviço|trabalho|atividade)\b/gi
      ],
      'Trabalho': [
        /\b(?:emprego|trabalho|função|cargo)\b/gi,
        /\b(?:salário|remuneração|clt)\b/gi
      ],
      'Locação': [
        /\b(?:locação|aluguel|arrendamento)\b/gi,
        /\b(?:locador|locatário|inquilino)\b/gi
      ],
      'Sociedade': [
        /\b(?:sociedade|sócios|participação)\b/gi,
        /\b(?:capital|quotas|ações)\b/gi
      ],
      'Financiamento': [
        /\b(?:financiamento|empréstimo|crédito)\b/gi,
        /\b(?:juros|parcelas|garantia)\b/gi
      ]
    };

    let bestMatch = 'Não Identificado';
    let highestScore = 0;

    Object.entries(contractTypes).forEach(([type, patterns]) => {
      let score = 0;
      patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          score += matches.length;
        }
      });

      if (score > highestScore) {
        highestScore = score;
        bestMatch = type;
      }
    });

    return bestMatch;
  }
}