import Anthropic from '@anthropic-ai/sdk';
import { IContractStorage } from './storage';
import { AdvancedSensitiveDataDetector } from './sensitive-data-detector';
import { NativeContractCrypto } from './crypto-engine';
import { 
  AnalysisResult, 
  Risk, 
  Recommendation, 
  SensitiveDataMatch,
  TOKEN_COSTS 
} from '../shared/schema';

interface AnalysisRequest {
  userId: number;
  text: string;
  metadata: any;
  contractType: string;
  sensitiveData: SensitiveDataMatch[];
  securityChoice: 'encrypt' | 'fictional' | 'none';
  tokenCost: number;
}

interface ContractScores {
  completeness: number;
  compliance: number;
  protection: number;
  clarity: number;
  overall: number;
}

export class ContractAnalysisEngine {
  private anthropic: Anthropic;
  private storage: IContractStorage;
  private sensitiveDetector: AdvancedSensitiveDataDetector;
  private crypto: NativeContractCrypto;

  constructor(
    storage: IContractStorage,
    sensitiveDetector: AdvancedSensitiveDataDetector,
    crypto: NativeContractCrypto
  ) {
    this.storage = storage;
    this.sensitiveDetector = sensitiveDetector;
    this.crypto = crypto;
    
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async processAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      // Check and consume tokens
      const success = await this.storage.consumeTokens(
        request.userId,
        request.tokenCost,
        `analysis_${request.securityChoice}`,
        `Análise de contrato: ${request.contractType}`
      );

      if (!success) {
        throw new Error('Tokens insuficientes para realizar a análise');
      }

      // Prepare text for analysis
      let analysisText = request.text;
      let contentType = 'plain';

      if (request.securityChoice === 'encrypt') {
        const encrypted = this.crypto.encryptContract(request.text, request.userId.toString());
        analysisText = this.prepareEncryptedTextForAnalysis(request.text, request.sensitiveData);
        contentType = 'encrypted';
      } else if (request.securityChoice === 'fictional') {
        analysisText = this.replaceSensitiveDataWithFictional(request.text, request.sensitiveData);
        contentType = 'fictional';
      }

      // Perform AI analysis
      const scores = await this.analyzeContractWithAI(analysisText, request.contractType);
      const risks = await this.identifyRisks(analysisText, request.contractType);
      const recommendations = await this.generateRecommendations(analysisText, scores, risks);

      // Store analysis in database
      const analysis = await this.storage.createContractAnalysis({
        userId: request.userId,
        originalFilename: request.metadata.filename,
        fileHash: request.metadata.hash,
        fileSize: request.metadata.fileSize,
        contentType,
        extractedText: request.securityChoice === 'encrypt' ? undefined : analysisText,
        encryptedContent: request.securityChoice === 'encrypt' ? 
          this.crypto.encryptContract(request.text, request.userId.toString()).encryptedContent : undefined,
        encryptionIv: request.securityChoice === 'encrypt' ? 
          this.crypto.encryptContract(request.text, request.userId.toString()).iv : undefined,
        encryptionTag: request.securityChoice === 'encrypt' ? 
          this.crypto.encryptContract(request.text, request.userId.toString()).authTag : undefined,
        overallScore: scores.overall,
        completenessScore: scores.completeness,
        complianceScore: scores.compliance,
        protectionScore: scores.protection,
        clarityScore: scores.clarity,
        contractType: request.contractType,
        sensitiveDataDetected: request.sensitiveData,
        analysisResults: { scores, risks, recommendations },
        recommendations,
        tokensConsumed: request.tokenCost,
        operationBreakdown: {
          base_analysis: TOKEN_COSTS.analyze_basic,
          security_processing: request.tokenCost - TOKEN_COSTS.analyze_basic
        },
        analysisDuration: Date.now() - startTime,
        aiModelUsed: 'claude-sonnet-4-20250514'
      });

      return {
        id: analysis.id,
        overallScore: scores.overall,
        scores,
        contractType: request.contractType,
        risks,
        recommendations,
        sensitiveDataHandled: request.sensitiveData.length > 0,
        tokensUsed: request.tokenCost,
        analysisTime: Date.now() - startTime
      };

    } catch (error) {
      // Refund tokens on error
      await this.storage.addTokens(
        request.userId,
        request.tokenCost,
        'refund',
        `Reembolso por erro na análise: ${error.message}`
      );
      throw error;
    }
  }

  private async analyzeContractWithAI(text: string, contractType: string): Promise<ContractScores> {
    const prompt = `
Analise este contrato do tipo "${contractType}" seguindo os critérios rigorosos de avaliação jurídica brasileira.

CRITÉRIOS DE AVALIAÇÃO (25 pontos cada):

1. COMPLETUDE LEGAL (25 pontos):
   - Presença de elementos obrigatórios
   - Identificação clara das partes
   - Objeto bem definido
   - Prazo e condições de execução

2. CONFORMIDADE LEGISLATIVA (25 pontos):
   - Adequação ao Código Civil
   - Conformidade com legislação específica
   - Respeito aos direitos do consumidor
   - Adequação trabalhista (quando aplicável)

3. PROTEÇÃO JURÍDICA (25 pontos):
   - Cláusulas de proteção adequadas
   - Definição clara de responsabilidades
   - Mecanismos de resolução de conflitos
   - Garantias e seguranças

4. CLAREZA E APLICABILIDADE (25 pontos):
   - Linguagem clara e objetiva
   - Ausência de ambiguidades
   - Exequibilidade das obrigações
   - Equilíbrio contratual

ESCALA RIGOROSA:
- 23-25 pontos: Excepcional
- 20-22 pontos: Excelente  
- 17-19 pontos: Boa
- 14-16 pontos: Regular
- 10-13 pontos: Inadequada
- 0-9 pontos: Insuficiente

Retorne APENAS um JSON no formato:
{
  "completeness": <pontos 0-25>,
  "compliance": <pontos 0-25>,
  "protection": <pontos 0-25>,
  "clarity": <pontos 0-25>,
  "overall": <soma total>,
  "justification": {
    "completeness": "explicação detalhada",
    "compliance": "explicação detalhada", 
    "protection": "explicação detalhada",
    "clarity": "explicação detalhada"
  }
}

CONTRATO A ANALISAR:
${text}
`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: 'Você é um especialista em análise jurídica de contratos brasileiros. Seja rigoroso e preciso na avaliação.',
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const result = JSON.parse(content.text);
        return {
          completeness: result.completeness,
          compliance: result.compliance,
          protection: result.protection,
          clarity: result.clarity,
          overall: result.overall
        };
      }
      
      throw new Error('Resposta inválida da IA');
    } catch (error) {
      console.error('AI Analysis error:', error);
      // Fallback scoring
      return {
        completeness: 15,
        compliance: 15,
        protection: 15,
        clarity: 15,
        overall: 60
      };
    }
  }

  private async identifyRisks(text: string, contractType: string): Promise<Risk[]> {
    const prompt = `
Identifique os principais riscos jurídicos neste contrato do tipo "${contractType}".

Analise especificamente:
- Cláusulas potencialmente abusivas
- Lacunas contratuais perigosas
- Desequilíbrios entre as partes
- Riscos de não conformidade legal
- Ambiguidades que podem gerar litígios

Para cada risco, forneça:
- Nível (high/medium/low)
- Categoria específica
- Descrição clara do problema
- Cláusula específica (se aplicável)
- Sugestão de correção

Retorne um JSON array:
[
  {
    "level": "high|medium|low",
    "category": "categoria do risco",
    "description": "descrição detalhada",
    "clause": "texto da cláusula problemática",
    "suggestion": "sugestão de correção"
  }
]

CONTRATO:
${text}
`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: 'Analise riscos jurídicos com foco na legislação brasileira.',
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      
      return [];
    } catch (error) {
      console.error('Risk analysis error:', error);
      return [];
    }
  }

  private async generateRecommendations(
    text: string, 
    scores: ContractScores, 
    risks: Risk[]
  ): Promise<Recommendation[]> {
    const prompt = `
Com base na análise do contrato e nos scores obtidos:
- Completude: ${scores.completeness}/25
- Conformidade: ${scores.compliance}/25
- Proteção: ${scores.protection}/25
- Clareza: ${scores.clarity}/25

E nos riscos identificados: ${JSON.stringify(risks)}

Gere recomendações específicas para melhorar o contrato.

Para cada recomendação, forneça:
- Tipo: add (adicionar), modify (modificar), remove (remover)
- Categoria da melhoria
- Descrição da recomendação
- Prioridade (high/medium/low)
- Texto sugerido (quando aplicável)

Retorne um JSON array:
[
  {
    "type": "add|modify|remove",
    "category": "categoria",
    "description": "descrição da recomendação",
    "priority": "high|medium|low",
    "suggestedText": "texto sugerido quando aplicável"
  }
]

CONTRATO:
${text}
`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: 'Gere recomendações práticas para melhorias contratuais.',
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      
      return [];
    } catch (error) {
      console.error('Recommendations error:', error);
      return [];
    }
  }

  private prepareEncryptedTextForAnalysis(text: string, sensitiveData: SensitiveDataMatch[]): string {
    let processedText = text;
    
    // Replace sensitive data with placeholders for analysis
    sensitiveData.forEach(item => {
      const placeholder = `[${item.type.toUpperCase()}_ENCRYPTED]`;
      processedText = processedText.replace(item.value, placeholder);
    });
    
    return processedText;
  }

  private replaceSensitiveDataWithFictional(text: string, sensitiveData: SensitiveDataMatch[]): string {
    let processedText = text;
    
    // Sort by position (desc) to avoid offset issues
    const sortedData = sensitiveData.sort((a, b) => b.position.start - a.position.start);
    
    sortedData.forEach(item => {
      const replacement = this.sensitiveDetector.generateFictionalReplacement(item.type, item.value);
      processedText = processedText.substring(0, item.position.start) + 
                    replacement + 
                    processedText.substring(item.position.end);
    });
    
    return processedText;
  }

  async decryptContractForDownload(analysisId: number, userId: number): Promise<string> {
    const analysis = await this.storage.getContractAnalysis(analysisId);
    
    if (!analysis || analysis.userId !== userId) {
      throw new Error('Análise não encontrada');
    }
    
    if (analysis.contentType !== 'encrypted' || !analysis.encryptedContent) {
      throw new Error('Contrato não está criptografado');
    }
    
    // Check token balance for decryption
    const success = await this.storage.consumeTokens(
      userId,
      TOKEN_COSTS.decrypt,
      'decrypt',
      `Descriptografia do contrato ID: ${analysisId}`
    );
    
    if (!success) {
      throw new Error('Tokens insuficientes para descriptografia');
    }
    
    try {
      const decrypted = this.crypto.decryptContract({
        encryptedContent: analysis.encryptedContent,
        iv: analysis.encryptionIv!,
        authTag: analysis.encryptionTag!,
        keyHash: '' // Will be recalculated in decrypt method
      }, userId.toString());
      
      return decrypted;
    } catch (error) {
      // Refund tokens on error
      await this.storage.addTokens(
        userId,
        TOKEN_COSTS.decrypt,
        'refund',
        `Reembolso por erro na descriptografia: ${error.message}`
      );
      throw error;
    }
  }
}