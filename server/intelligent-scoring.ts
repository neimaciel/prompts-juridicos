import { analyzePromptRelevance } from './relevance';
import type { LegalPrompt } from '@shared/schema';

// Interface para configuração de scoring
export interface ScoringConfig {
  // Fatores de melhoria incrementais
  incrementalFactors: {
    systemSuggestionImplemented: number; // +0.05 a +0.15 por sugestão
    aiSuggestionImplemented: number; // +0.08 a +0.20 por sugestão 
    userCustomEdit: number; // -0.05 a +0.25 dependendo da qualidade
    iterationBonus: number; // Bônus por iteração bem-sucedida
  };
  
  // Limites de score
  limits: {
    maxScore: number; // 1.0
    minScorePerIteration: number; // Não pode cair mais que X por iteração
    diminishingReturns: number; // Fator de retorno decrescente após score alto
  };
  
  // Thresholds para classificação
  thresholds: {
    exceptional: number; // 0.95+
    excellent: number;   // 0.85+
    good: number;        // 0.70+
    adequate: number;    // 0.55+
    inadequate: number;  // 0.40+
    insufficient: number; // <0.40
  };
  
  // Pesos por tipo de documento
  documentTypeWeights: {
    [documentType: string]: {
      legalCompleteness: number;
      legislationCompliance: number;
      practicalApplicability: number;
      legalStructure: number;
    };
  };
}

// Configuração padrão do sistema
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  incrementalFactors: {
    systemSuggestionImplemented: 0.08, // +8% médio por sugestão do sistema
    aiSuggestionImplemented: 0.12, // +12% médio por sugestão da IA
    userCustomEdit: 0.10, // Varia de -5% a +25% baseado na qualidade
    iterationBonus: 0.02, // +2% por iteração bem-sucedida
  },
  
  limits: {
    maxScore: 1.0,
    minScorePerIteration: -0.15, // Não pode cair mais que 15% por iteração
    diminishingReturns: 0.80, // Após 80%, melhorias têm retorno decrescente
  },
  
  thresholds: {
    exceptional: 0.95,
    excellent: 0.85,
    good: 0.70,
    adequate: 0.55,
    inadequate: 0.40,
    insufficient: 0.0,
  },
  
  documentTypeWeights: {
    'Contrato': {
      legalCompleteness: 0.30,
      legislationCompliance: 0.25,
      practicalApplicability: 0.25,
      legalStructure: 0.20
    },
    'Petição Inicial': {
      legalCompleteness: 0.35,
      legislationCompliance: 0.30,
      practicalApplicability: 0.20,
      legalStructure: 0.15
    },
    'Parecer Jurídico': {
      legalCompleteness: 0.40,
      legislationCompliance: 0.30,
      practicalApplicability: 0.15,
      legalStructure: 0.15
    },
    'Documento Pessoal/Genealógico': {
      legalCompleteness: 0.20,
      legislationCompliance: 0.10,
      practicalApplicability: 0.40,
      legalStructure: 0.30
    },
    'Documento Trabalhista': {
      legalCompleteness: 0.30,
      legislationCompliance: 0.35,
      practicalApplicability: 0.20,
      legalStructure: 0.15
    },
    'Notificação': {
      legalCompleteness: 0.25,
      legislationCompliance: 0.20,
      practicalApplicability: 0.35,
      legalStructure: 0.20
    }
  }
};

// Interface para histórico de melhorias
export interface ScoreEvolution {
  version: number;
  score: number;
  previousScore: number;
  scoreChange: number;
  improvementType: 'system_suggestion' | 'ai_suggestion' | 'user_edit';
  improvementsApplied: string[];
  timestamp: Date;
  reasoning: string;
}

// Interface para análise preditiva
export interface ScorePrediction {
  predictedScore: number;
  scoreChange: number;
  confidence: number; // 0-1, confiança na previsão
  factors: string[]; // Fatores que influenciam a mudança
  recommendation: 'apply' | 'modify' | 'reject';
  reasoning: string;
}

// Interface para impacto de melhorias
export interface ImprovementImpact {
  suggestionId: string;
  estimatedScoreGain: number;
  difficultyLevel: 'low' | 'medium' | 'high';
  implementationText: string;
  reasoning: string;
}

/**
 * Sistema Inteligente de Scoring Progressivo
 */
export class IntelligentScoringEngine {
  private config: ScoringConfig;
  
  constructor(config: ScoringConfig = DEFAULT_SCORING_CONFIG) {
    this.config = config;
  }
  
  /**
   * Calcula score progressivo baseado no histórico de melhorias
   */
  async calculateProgressiveScore(
    currentPrompt: LegalPrompt,
    previousVersions: ScoreEvolution[],
    improvementsApplied: string[],
    improvementType: 'system_suggestion' | 'ai_suggestion' | 'user_edit'
  ): Promise<ScoreEvolution> {
    
    // Obtém score base atual através da análise tradicional
    const baseAnalysis = await analyzePromptRelevance(
      currentPrompt.userRequest,
      currentPrompt.legalPrompt,
      currentPrompt.documentType,
      currentPrompt.areaTags
    );
    
    const previousScore = previousVersions.length > 0 
      ? previousVersions[previousVersions.length - 1].score 
      : 0;
    
    // Calcula incremento baseado no tipo de melhoria
    let scoreIncrement = 0;
    let reasoning = baseAnalysis.reasoning;
    
    switch (improvementType) {
      case 'system_suggestion':
        scoreIncrement = this.calculateSystemSuggestionImpact(improvementsApplied, previousScore);
        reasoning += ` Melhorias aplicadas do sistema: ${improvementsApplied.length} sugestões implementadas.`;
        break;
        
      case 'ai_suggestion':
        scoreIncrement = this.calculateAISuggestionImpact(improvementsApplied, previousScore);
        reasoning += ` Melhorias aplicadas da IA: ${improvementsApplied.length} sugestões implementadas.`;
        break;
        
      case 'user_edit':
        scoreIncrement = await this.calculateUserEditImpact(
          currentPrompt,
          previousVersions.length > 0 ? previousVersions[previousVersions.length - 1] : null
        );
        reasoning += ` Modificação manual detectada. Análise de impacto realizada.`;
        break;
    }
    
    // Aplica fator de retorno decrescente para scores altos
    if (previousScore > this.config.limits.diminishingReturns) {
      const diminishingFactor = 1 - ((previousScore - this.config.limits.diminishingReturns) / (1 - this.config.limits.diminishingReturns)) * 0.5;
      scoreIncrement *= diminishingFactor;
    }
    
    // Aplica bônus por iteração bem-sucedida
    if (scoreIncrement > 0 && previousVersions.length > 0) {
      scoreIncrement += this.config.incrementalFactors.iterationBonus;
    }
    
    // Calcula novo score com limites
    let newScore = Math.max(
      previousScore + Math.max(scoreIncrement, this.config.limits.minScorePerIteration),
      Math.min(previousScore + scoreIncrement, this.config.limits.maxScore)
    );
    
    // Garante que o score não ultrapasse os limites
    newScore = Math.max(0, Math.min(this.config.limits.maxScore, newScore));
    
    return {
      version: previousVersions.length + 1,
      score: newScore,
      previousScore,
      scoreChange: newScore - previousScore,
      improvementType,
      improvementsApplied,
      timestamp: new Date(),
      reasoning
    };
  }
  
  /**
   * Prediz o impacto de uma mudança antes de aplicá-la
   */
  async predictScoreImpact(
    currentPrompt: LegalPrompt,
    proposedChanges: string,
    currentScore: number
  ): Promise<ScorePrediction> {
    
    // Cria uma versão temporária com as mudanças propostas
    const tempPrompt: LegalPrompt = {
      ...currentPrompt,
      legalPrompt: proposedChanges
    };
    
    // Analisa a qualidade da versão modificada
    const newAnalysis = await analyzePromptRelevance(
      tempPrompt.userRequest,
      tempPrompt.legalPrompt,
      tempPrompt.documentType,
      tempPrompt.areaTags
    );
    
    const predictedChange = newAnalysis.score - currentScore;
    const confidence = this.calculatePredictionConfidence(currentPrompt, proposedChanges);
    
    // Determina fatores que influenciam a mudança
    const factors = this.identifyChangeFactors(currentPrompt.legalPrompt, proposedChanges);
    
    // Gera recomendação
    let recommendation: 'apply' | 'modify' | 'reject';
    if (predictedChange > 0.05) {
      recommendation = 'apply';
    } else if (predictedChange > -0.02) {
      recommendation = 'modify';
    } else {
      recommendation = 'reject';
    }
    
    return {
      predictedScore: newAnalysis.score,
      scoreChange: predictedChange,
      confidence,
      factors,
      recommendation,
      reasoning: this.generatePredictionReasoning(predictedChange, factors, recommendation)
    };
  }
  
  /**
   * Calcula impacto de sugestões do sistema
   */
  private calculateSystemSuggestionImpact(suggestions: string[], currentScore: number): number {
    const baseImpact = this.config.incrementalFactors.systemSuggestionImplemented;
    const suggestionCount = suggestions.length;
    
    // Mais sugestões = maior impacto, mas com retorno decrescente
    const totalImpact = baseImpact * suggestionCount * (1 - Math.pow(0.8, suggestionCount));
    
    // Reduz impacto se score já é alto
    const scoreMultiplier = currentScore < 0.7 ? 1 : (1 - currentScore) * 2;
    
    return totalImpact * scoreMultiplier;
  }
  
  /**
   * Calcula impacto de sugestões da IA
   */
  private calculateAISuggestionImpact(suggestions: string[], currentScore: number): number {
    const baseImpact = this.config.incrementalFactors.aiSuggestionImplemented;
    const suggestionCount = suggestions.length;
    
    // IA tem impacto maior que sistema, mas também diminishing returns
    const totalImpact = baseImpact * suggestionCount * (1 - Math.pow(0.75, suggestionCount));
    
    const scoreMultiplier = currentScore < 0.7 ? 1 : (1 - currentScore) * 2;
    
    return totalImpact * scoreMultiplier;
  }
  
  /**
   * Calcula impacto de edição manual do usuário
   */
  private async calculateUserEditImpact(
    currentPrompt: LegalPrompt,
    previousVersion: ScoreEvolution | null
  ): Promise<number> {
    
    if (!previousVersion) return 0;
    
    // Compara com versão anterior para entender a mudança
    const currentAnalysis = await analyzePromptRelevance(
      currentPrompt.userRequest,
      currentPrompt.legalPrompt,
      currentPrompt.documentType,
      currentPrompt.areaTags
    );
    
    // Mudança bruta baseada na análise
    const rawChange = currentAnalysis.score - previousVersion.score;
    
    // Aplica fatores de edição manual (mais conservador)
    const editFactor = this.config.incrementalFactors.userCustomEdit;
    
    return rawChange * editFactor;
  }
  
  /**
   * Calcula confiança na predição
   */
  private calculatePredictionConfidence(
    currentPrompt: LegalPrompt,
    proposedChanges: string
  ): number {
    // Fatores que afetam confiança:
    // 1. Tamanho da mudança
    const changeSize = Math.abs(proposedChanges.length - currentPrompt.legalPrompt.length) / currentPrompt.legalPrompt.length;
    const sizeFactor = Math.max(0.5, 1 - changeSize);
    
    // 2. Complexidade do documento
    const complexityFactor = currentPrompt.areaTags.length > 3 ? 0.8 : 0.9;
    
    // 3. Base de qualidade atual
    const qualityFactor = currentPrompt.relevanceScore > 0.5 ? 0.9 : 0.7;
    
    return Math.min(0.95, sizeFactor * complexityFactor * qualityFactor);
  }
  
  /**
   * Identifica fatores que influenciam a mudança
   */
  private identifyChangeFactors(originalText: string, newText: string): string[] {
    const factors: string[] = [];
    
    // Análise textual básica
    if (newText.length > originalText.length * 1.2) {
      factors.push('Expansão significativa do conteúdo');
    } else if (newText.length < originalText.length * 0.8) {
      factors.push('Redução do conteúdo');
    }
    
    // Palavras-chave jurídicas
    const legalKeywords = ['lei', 'código', 'artigo', 'inciso', 'parágrafo', 'cláusula', 'norma'];
    const originalKeywords = legalKeywords.filter(keyword => originalText.toLowerCase().includes(keyword)).length;
    const newKeywords = legalKeywords.filter(keyword => newText.toLowerCase().includes(keyword)).length;
    
    if (newKeywords > originalKeywords) {
      factors.push('Adição de referências jurídicas');
    } else if (newKeywords < originalKeywords) {
      factors.push('Remoção de referências jurídicas');
    }
    
    // Estrutura e organização
    const originalParagraphs = originalText.split('\n').length;
    const newParagraphs = newText.split('\n').length;
    
    if (newParagraphs > originalParagraphs * 1.5) {
      factors.push('Melhoria na estruturação');
    } else if (newParagraphs < originalParagraphs * 0.7) {
      factors.push('Simplificação da estrutura');
    }
    
    return factors.length > 0 ? factors : ['Modificação geral do texto'];
  }
  
  /**
   * Gera reasoning para predição
   */
  private generatePredictionReasoning(
    scoreChange: number,
    factors: string[],
    recommendation: 'apply' | 'modify' | 'reject'
  ): string {
    let reasoning = '';
    
    if (scoreChange > 0.1) {
      reasoning = 'Mudança prevista para ter impacto muito positivo. ';
    } else if (scoreChange > 0.05) {
      reasoning = 'Mudança prevista para ter impacto positivo. ';
    } else if (scoreChange > -0.02) {
      reasoning = 'Mudança prevista para ter impacto neutro. ';
    } else {
      reasoning = 'Mudança prevista para ter impacto negativo. ';
    }
    
    reasoning += `Fatores identificados: ${factors.join(', ')}. `;
    
    switch (recommendation) {
      case 'apply':
        reasoning += 'Recomendação: aplicar as mudanças.';
        break;
      case 'modify':
        reasoning += 'Recomendação: considerar refinamentos antes de aplicar.';
        break;
      case 'reject':
        reasoning += 'Recomendação: evitar essas mudanças.';
        break;
    }
    
    return reasoning;
  }
  
  /**
   * Atualiza configuração do sistema
   */
  updateConfig(newConfig: Partial<ScoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Obtém configuração atual
   */
  getConfig(): ScoringConfig {
    return { ...this.config };
  }
  
  /**
   * Obtém label de qualidade baseado no score
   */
  getScoreLabel(score: number): string {
    if (score >= this.config.thresholds.exceptional) return 'Excepcional';
    if (score >= this.config.thresholds.excellent) return 'Excelente';
    if (score >= this.config.thresholds.good) return 'Boa';
    if (score >= this.config.thresholds.adequate) return 'Regular';
    if (score >= this.config.thresholds.inadequate) return 'Inadequada';
    return 'Insuficiente';
  }
  
  /**
   * Obtém cor CSS baseada no score
   */
  getScoreColor(score: number): string {
    if (score >= this.config.thresholds.excellent) return 'text-green-600 dark:text-green-400';
    if (score >= this.config.thresholds.good) return 'text-blue-600 dark:text-blue-400';
    if (score >= this.config.thresholds.adequate) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= this.config.thresholds.inadequate) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }
}

// Instância global do engine
export const intelligentScoringEngine = new IntelligentScoringEngine();