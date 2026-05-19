import { 
  type DetailedQualityAnalysis, 
  type ImprovementSuggestion, 
  type LegalPrompt,
  type QualityCriteria 
} from "@shared/schema";
import { generateLegalPrompt } from "./openai";
import { analyzePromptRelevance } from "./relevance";

/**
 * Sistema de sugestões inteligentes para melhoria da qualidade jurídica
 */
export class SmartSuggestionEngine {
  
  /**
   * Gera análise detalhada com sugestões da IA apenas
   */
  async generateDetailedAnalysis(prompt: LegalPrompt): Promise<DetailedQualityAnalysis> {
    // Gerar análise de relevância atualizada
    const relevanceAnalysis = await analyzePromptRelevance(
      prompt.userRequest, 
      prompt.legalPrompt,
      prompt.documentType,
      prompt.areaTags
    );
    
    // Gerar apenas sugestões da IA baseadas no contexto
    const aiSuggestions = await this.generateAISuggestions(prompt, relevanceAnalysis);
    
    // Calcular critérios de qualidade detalhados
    const qualityCriteria = this.calculateQualityCriteria(relevanceAnalysis);
    
    // Calcular potencial de melhoria
    const improvementPotential = this.calculateImprovementPotential([], aiSuggestions);
    
    return {
      current_score: relevanceAnalysis.score,
      analysis_reasoning: relevanceAnalysis.reasoning,
      ai_suggestions: aiSuggestions,
      quality_criteria: qualityCriteria,
      document_type: prompt.documentType,
      improvement_potential: improvementPotential
    };
  }

  /**
   * Removido: Sistema não usa mais sugestões do sistema
   */
  private generateSystemSuggestions_REMOVED(prompt: LegalPrompt, analysis: any): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];
    const userRequest = prompt.userRequest.toLowerCase();
    const legalPrompt = prompt.legalPrompt.toLowerCase();

    // Sugestões baseadas no tipo de documento
    if (prompt.documentType.toLowerCase().includes('contrato')) {
      suggestions.push(...this.getContractSuggestions(legalPrompt, analysis.score));
    }
    
    if (prompt.documentType.toLowerCase().includes('petição')) {
      suggestions.push(...this.getPetitionSuggestions(legalPrompt, analysis.score));
    }
    
    if (prompt.documentType.toLowerCase().includes('parecer')) {
      suggestions.push(...this.getLegalOpinionSuggestions(legalPrompt, analysis.score));
    }

    // Sugestões gerais baseadas na pontuação
    if (analysis.score < 0.7) {
      suggestions.push(...this.getLowScoreSuggestions(legalPrompt));
    }

    // Verificar ausência de elementos essenciais
    suggestions.push(...this.checkMissingElements(legalPrompt, prompt.documentType));

    return suggestions.slice(0, 5); // Limitar a 5 sugestões principais
  }

  /**
   * Gera sugestões específicas para contratos
   */
  private getContractSuggestions(legalPrompt: string, score: number): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // 1. Base legal robusta
    if (!legalPrompt.includes('código civil') && !legalPrompt.includes('lei')) {
      suggestions.push({
        id: 'contract-legal-framework',
        type: 'system',
        category: 'legal_references',
        title: 'Fortalecer Base Legal e Normativa',
        description: 'Contrato carece de fundamentação legal sólida com referências específicas ao ordenamento jurídico brasileiro',
        impact_score: 9,
        implementation_text: 'Este contrato rege-se pelas disposições do Código Civil (Lei 10.406/2002), especialmente arts. 421-480 (contratos em geral), pela legislação específica aplicável e jurisprudência dos tribunais superiores. Aplicam-se subsidiariamente os princípios gerais do direito e os usos comerciais.',
        selected: false
      });
    }

    // 2. Sistema completo de rescisão
    if (!legalPrompt.includes('resolução') && !legalPrompt.includes('rescisão')) {
      suggestions.push({
        id: 'contract-termination-complete',
        type: 'system',
        category: 'structure',
        title: 'Sistema Completo de Rescisão e Resolução',
        description: 'Estabelecer mecanismos abrangentes para encerramento contratual em diferentes cenários',
        impact_score: 10,
        implementation_text: 'Rescisão por inadimplemento (notificação, prazo de 30 dias para purga), rescisão imotivada (aviso prévio de 60 dias), resolução por impossibilidade, rescisão por acordo mútuo, procedimentos de transição e liquidação de valores.',
        selected: false
      });
    }

    // 3. Penalidades graduadas
    if (!legalPrompt.includes('penalidade') && !legalPrompt.includes('multa')) {
      suggestions.push({
        id: 'contract-penalty-system',
        type: 'system',
        category: 'compliance',
        title: 'Sistema Graduado de Penalidades',
        description: 'Criar estrutura de penalizações proporcionais e juridicamente eficazes',
        impact_score: 8,
        implementation_text: 'Multa moratória de 2% ao mês (limitada a 20%) para atrasos, multa compensatória de 20% do valor contratual para rescisão injustificada, multa específica para confidencialidade, multa diária para mora em obrigações de fazer.',
        selected: false
      });
    }

    // 4. Jurisdição e foro
    if (!legalPrompt.includes('foro') && !legalPrompt.includes('jurisdição')) {
      suggestions.push({
        id: 'contract-jurisdiction-complete',
        type: 'system',
        category: 'legal_references',
        title: 'Cláusula Jurisdicional Robusta',
        description: 'Definir competência territorial e mecanismos alternativos de resolução de conflitos',
        impact_score: 8,
        implementation_text: 'Foro da comarca específica, renúncia a outros foros, mediação prévia obrigatória em 60 dias, arbitragem para valores superiores a R$ 100.000 conforme Lei 9.307/96.',
        selected: false
      });
    }

    // 5. LGPD e confidencialidade
    if (!legalPrompt.includes('confidencialidade') && !legalPrompt.includes('lgpd')) {
      suggestions.push({
        id: 'contract-data-protection',
        type: 'system',
        category: 'compliance',
        title: 'Conformidade com LGPD e Confidencialidade',
        description: 'Adequação às exigências de proteção de dados pessoais e informações confidenciais',
        impact_score: 9,
        implementation_text: 'Cumprimento da Lei 13.709/18 (LGPD), confidencialidade por 5 anos pós-contrato, vedação de uso para fins diversos, multa de R$ 50.000 por violação.',
        selected: false
      });
    }

    // 6. Força maior adaptada
    if (!legalPrompt.includes('força maior') && !legalPrompt.includes('caso fortuito')) {
      suggestions.push({
        id: 'contract-force-majeure-br',
        type: 'system',
        category: 'practical',
        title: 'Cláusula de Força Maior Brasileira',
        description: 'Previsão de eventos extraordinários conforme direito brasileiro',
        impact_score: 7,
        implementation_text: 'Eventos: pandemias OMS, catástrofes naturais, atos de autoridade, greves gerais, guerra. Procedimentos: notificação 48h, documentação oficial, renegociação 30 dias, rescisão após 120 dias.',
        selected: false
      });
    }

    // Revisão para scores baixos
    if (score < 0.6) {
      suggestions.push({
        id: 'contract-fundamental-review',
        type: 'system',
        category: 'structure',
        title: 'Revisão Estrutural Fundamental',
        description: 'Score baixo indica necessidade de reformulação estrutural completa',
        impact_score: 10,
        implementation_text: 'Reestruturação completa: identificação das partes, objeto detalhado, obrigações específicas, cronograma, pagamento, garantias, fiscalização.',
        selected: false
      });
    }

    return suggestions.slice(0, 6);
  }

  /**
   * Gera sugestões específicas para petições
   */
  private getPetitionSuggestions(legalPrompt: string, score: number): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    if (!legalPrompt.includes('jurisprudência') && !legalPrompt.includes('precedente')) {
      suggestions.push({
        id: 'petition-jurisprudence',
        type: 'system',
        category: 'legal_references',
        title: 'Jurisprudência de Apoio',
        description: 'Incluir precedentes jurisprudenciais relevantes',
        impact_score: 8,
        implementation_text: 'Cite decisões do STF, STJ ou tribunais superiores que sustentem a tese jurídica.',
        selected: false
      });
    }

    if (!legalPrompt.includes('causa de pedir') && !legalPrompt.includes('fundamento')) {
      suggestions.push({
        id: 'petition-legal-basis',
        type: 'system',
        category: 'structure',
        title: 'Fundamentação Jurídica Clara',
        description: 'Aprimorar a causa de pedir e fundamentação legal',
        impact_score: 9,
        implementation_text: 'Estruture claramente os fatos, o direito aplicável e o pedido, com fundamentação doutrinária.',
        selected: false
      });
    }

    return suggestions;
  }

  /**
   * Gera sugestões específicas para pareceres jurídicos
   */
  private getLegalOpinionSuggestions(legalPrompt: string, score: number): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    if (!legalPrompt.includes('doutrina') && !legalPrompt.includes('autor')) {
      suggestions.push({
        id: 'opinion-doctrine',
        type: 'system',
        category: 'legal_references',
        title: 'Base Doutrinária Sólida',
        description: 'Incluir citações de doutrinadores reconhecidos',
        impact_score: 7,
        implementation_text: 'Cite autores consagrados e obras de referência na área jurídica específica.',
        selected: false
      });
    }

    if (!legalPrompt.includes('conclusão') && !legalPrompt.includes('recomenda')) {
      suggestions.push({
        id: 'opinion-conclusion',
        type: 'system',
        category: 'structure',
        title: 'Conclusão Objetiva',
        description: 'Apresentar conclusão clara e recomendações práticas',
        impact_score: 8,
        implementation_text: 'Finalize com conclusão objetiva e recomendações específicas para o caso.',
        selected: false
      });
    }

    return suggestions;
  }

  /**
   * Sugestões para pontuações baixas
   */
  private getLowScoreSuggestions(legalPrompt: string): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    suggestions.push({
      id: 'improve-terminology',
      type: 'system',
      category: 'clarity',
      title: 'Aprimorar Terminologia Jurídica',
      description: 'Usar termos técnicos precisos e linguagem jurídica adequada',
      impact_score: 6,
      implementation_text: 'Substitua termos leigos por terminologia jurídica precisa e utilize linguagem formal adequada.',
      selected: false
    });

    suggestions.push({
      id: 'improve-structure',
      type: 'system',
      category: 'structure',
      title: 'Melhorar Organização Lógica',
      description: 'Estruturar o documento de forma mais clara e lógica',
      impact_score: 7,
      implementation_text: 'Reorganize o conteúdo em seções claras: introdução, desenvolvimento e conclusão.',
      selected: false
    });

    return suggestions;
  }

  /**
   * Verifica elementos essenciais ausentes
   */
  private checkMissingElements(legalPrompt: string, documentType: string): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // Verificar ausência de prazos
    if (!legalPrompt.includes('prazo') && !legalPrompt.includes('período')) {
      suggestions.push({
        id: 'add-timeframe',
        type: 'system',
        category: 'practical',
        title: 'Especificar Prazos',
        description: 'Incluir prazos específicos quando aplicável',
        impact_score: 6,
        implementation_text: 'Defina prazos claros para cumprimento de obrigações e procedimentos.',
        selected: false
      });
    }

    // Verificar ausência de valores monetários quando necessário
    if (documentType.toLowerCase().includes('contrato') && !legalPrompt.includes('valor') && !legalPrompt.includes('preço')) {
      suggestions.push({
        id: 'add-values',
        type: 'system',
        category: 'practical',
        title: 'Especificar Valores',
        description: 'Incluir referências a valores e forma de pagamento',
        impact_score: 8,
        implementation_text: 'Defina valores, forma de pagamento, correção monetária e juros aplicáveis.',
        selected: false
      });
    }

    return suggestions;
  }

  /**
   * Gera sugestões da IA baseadas no contexto
   */
  private async generateAISuggestions(prompt: LegalPrompt, analysis: any): Promise<ImprovementSuggestion[]> {
    // Simular sugestões da IA baseadas no contexto
    // Em uma implementação real, isso seria uma chamada para a IA
    
    const contextualSuggestions: ImprovementSuggestion[] = [];

    // Sugestão baseada na análise de relevância
    if (analysis.suggestions && analysis.suggestions.length > 0) {
      analysis.suggestions.slice(0, 3).forEach((suggestion: string, index: number) => {
        contextualSuggestions.push({
          id: `ai-suggestion-${index}`,
          type: 'ai',
          category: 'compliance',
          title: `Melhoria IA ${index + 1}`,
          description: suggestion,
          impact_score: 7,
          implementation_text: suggestion,
          selected: false
        });
      });
    }

    return contextualSuggestions;
  }

  /**
   * Calcula critérios de qualidade detalhados
   */
  private calculateQualityCriteria(analysis: any): QualityCriteria {
    const baseScore = analysis.score;
    
    return {
      terminology: {
        score: Math.min(baseScore + 0.1, 1.0),
        status: this.getQualityStatus(baseScore + 0.1),
        description: 'Uso adequado de terminologia jurídica brasileira'
      },
      structure: {
        score: Math.max(baseScore - 0.05, 0),
        status: this.getQualityStatus(baseScore - 0.05),
        description: 'Organização lógica e estrutura completa'
      },
      legal_compliance: {
        score: baseScore,
        status: this.getQualityStatus(baseScore),
        description: 'Adequação à legislação vigente'
      },
      legal_protection: {
        score: Math.max(baseScore - 0.1, 0),
        status: this.getQualityStatus(baseScore - 0.1),
        description: 'Proteção jurídica efetiva para as partes'
      },
      practical_applicability: {
        score: Math.min(baseScore + 0.05, 1.0),
        status: this.getQualityStatus(baseScore + 0.05),
        description: 'Viabilidade de aplicação prática'
      }
    };
  }

  /**
   * Converte score em status qualitativo
   */
  private getQualityStatus(score: number): string {
    if (score >= 0.95) return 'Excepcional';
    if (score >= 0.85) return 'Excelente';
    if (score >= 0.70) return 'Boa';
    if (score >= 0.55) return 'Regular';
    if (score >= 0.40) return 'Inadequada';
    return 'Insuficiente';
  }

  /**
   * Calcula potencial de melhoria baseado nas sugestões
   */
  private calculateImprovementPotential(systemSuggestions: ImprovementSuggestion[], aiSuggestions: ImprovementSuggestion[]): number {
    const totalSuggestions = systemSuggestions.length + aiSuggestions.length;
    const avgImpact = [...systemSuggestions, ...aiSuggestions]
      .reduce((sum, s) => sum + s.impact_score, 0) / Math.max(totalSuggestions, 1);
    
    // Normalizar para 0-1 considerando que impact_score é 1-10
    return Math.min(avgImpact / 10, 1.0);
  }

  /**
   * Aplica melhorias selecionadas e regenera o prompt
   */
  async regenerateWithImprovements(
    originalPrompt: LegalPrompt,
    selectedImprovements: string[],
    customAdditions: string,
    additionalRequirements: string,
    activeModel?: string
  ): Promise<{ legalPrompt: string; analysis: DetailedQualityAnalysis }> {
    
    // Construir solicitação melhorada
    let enhancedRequest = originalPrompt.userRequest;
    
    // Adicionar melhorias selecionadas
    if (selectedImprovements.length > 0) {
      enhancedRequest += '\n\nMelhorias a incluir:\n' + selectedImprovements.join('\n- ');
    }
    
    // Adicionar customizações do usuário
    if (customAdditions.trim()) {
      enhancedRequest += '\n\nAdições específicas:\n' + customAdditions;
    }
    
    // Adicionar requisitos adicionais
    if (additionalRequirements.trim()) {
      enhancedRequest += '\n\nRequisitos adicionais:\n' + additionalRequirements;
    }
    
    // Gerar novo prompt com melhorias usando o modelo ativo configurado
    const improvedResponse = await generateLegalPrompt(enhancedRequest, activeModel || 'gemini');
    
    // Criar prompt temporário para análise
    const tempPrompt: LegalPrompt = {
      ...originalPrompt,
      userRequest: enhancedRequest,
      legalPrompt: improvedResponse.legalPrompt,
    };
    
    // Aplicar scoring inteligente com incremento por melhorias
    const baseAnalysis = await analyzePromptRelevance(
      tempPrompt.userRequest,
      tempPrompt.legalPrompt,
      tempPrompt.documentType,
      tempPrompt.areaTags
    );
    
    // Calcular incremento por melhorias aplicadas
    const improvementBonus = this.calculateImprovementBonus(
      selectedImprovements,
      customAdditions,
      additionalRequirements,
      originalPrompt.relevanceScore || 0
    );
    
    // Aplicar incremento inteligente
    const newScore = Math.min(1.0, (originalPrompt.relevanceScore || 0) + improvementBonus);
    
    // Gerar nova análise com score melhorado
    const newAnalysis = await this.generateDetailedAnalysis(tempPrompt);
    newAnalysis.current_score = newScore;
    newAnalysis.analysis_reasoning = baseAnalysis.reasoning + 
      ` Incremento por melhorias: +${Math.round(improvementBonus * 100)}% (${selectedImprovements.length} sugestões aplicadas).`;
    
    return {
      legalPrompt: improvedResponse.legalPrompt,
      analysis: newAnalysis
    };
  }

  /**
   * Calcula bônus de melhoria baseado no tipo e quantidade de melhorias aplicadas
   */
  private calculateImprovementBonus(
    selectedImprovements: string[],
    customAdditions: string,
    additionalRequirements: string,
    currentScore: number
  ): number {
    let bonus = 0;
    
    // Bônus por sugestões AI implementadas (+8% médio por sugestão)
    if (selectedImprovements.length > 0) {
      bonus += selectedImprovements.length * 0.08;
    }
    
    // Bônus por adições personalizadas (+5% se significativas)
    if (customAdditions.trim().length > 50) {
      bonus += 0.05;
    }
    
    // Bônus por requisitos adicionais (+5% se significativos)
    if (additionalRequirements.trim().length > 50) {
      bonus += 0.05;
    }
    
    // Aplicar fator de retorno decrescente para scores altos
    if (currentScore > 0.8) {
      const diminishingFactor = 1 - ((currentScore - 0.8) / 0.2) * 0.5;
      bonus *= diminishingFactor;
    }
    
    // Bônus por iteração bem-sucedida (+2%)
    if (bonus > 0) {
      bonus += 0.02;
    }
    
    // Limitar bônus máximo por iteração
    return Math.min(bonus, 0.25);
  }
}

export const smartSuggestionEngine = new SmartSuggestionEngine();