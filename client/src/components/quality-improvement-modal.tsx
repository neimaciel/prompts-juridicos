import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Sparkles, Target, Edit3, RefreshCw, ChevronRight, CheckCircle, Circle, TrendingUp, AlertTriangle, XCircle, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import VersionHistory from "@/components/version-history";
import { trackEvent } from "@/lib/analytics";
import type { 
  LegalPrompt, 
  DetailedQualityAnalysis, 
  ImprovementSuggestion,
  QualityCriteria,
  RegenerationRequestType 
} from "@shared/schema";

interface QualityImprovementModalProps {
  prompt: LegalPrompt;
  isOpen: boolean;
  onClose: () => void;
}

// Temporary interface for API responses
interface SuggestionsResponse {
  ai_suggestions: ImprovementSuggestion[];
  cached: boolean;
}

interface AnalysisResponse {
  current_score: number;
  analysis_reasoning: string;
  ai_suggestions: ImprovementSuggestion[];
  quality_criteria: QualityCriteria;
  document_type: string;
  improvement_potential: number;
}

export default function QualityImprovementModal({ prompt, isOpen, onClose }: QualityImprovementModalProps) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'improvements' | 'regenerate'>('analysis');
  const [isCopying, setIsCopying] = useState(false);
  const [selectedImprovements, setSelectedImprovements] = useState<string[]>([]);
  const [customSuggestions, setCustomSuggestions] = useState<Record<string, string>>({});
  const [customAdditions, setCustomAdditions] = useState('');
  const [showRegeneratedPrompt, setShowRegeneratedPrompt] = useState(false);
  const [regeneratedContent, setRegeneratedContent] = useState<string>('');
  const [customTextAnalysis, setCustomTextAnalysis] = useState<{score: number, reasoning: string} | null>(null);
  const [isAnalyzingCustomText, setIsAnalyzingCustomText] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch detailed quality analysis
  const { data: analysis, isLoading: analysisLoading } = useQuery<AnalysisResponse>({
    queryKey: ['/api/prompts', prompt.id, 'detailed-analysis'],
    enabled: isOpen && activeTab === 'analysis',
  });

  // Fetch improvement suggestions
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery<SuggestionsResponse>({
    queryKey: [`/api/prompts/${prompt.id}/improvement-suggestions`],
    enabled: isOpen && activeTab === 'improvements',
  });

  // Debounce effect for custom text analysis
  useEffect(() => {
    if (!customAdditions.trim() || !analysis) {
      setCustomTextAnalysis(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAnalyzingCustomText(true);
      try {
        const response = await fetch('/api/analyze-custom-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customText: customAdditions,
            currentPrompt: prompt.legalPrompt,
            documentType: (analysis as any)?.document_type || 'Contrato'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          setCustomTextAnalysis({
            score: result.qualityScore,
            reasoning: result.reasoning
          });
        }
      } catch (error) {
        console.error('Error analyzing custom text:', error);
      } finally {
        setIsAnalyzingCustomText(false);
      }
    }, 1500); // Wait 1.5 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [customAdditions, prompt.legalPrompt, analysis]);

  // Debug logging
  useEffect(() => {
    if (suggestions) {
      console.log('🔍 Suggestions loaded:', suggestions);
      console.log('🤖 AI suggestions:', suggestions.ai_suggestions?.length || 0);
    }
  }, [suggestions]);

  // Regenerate prompt mutation
  const regenerateMutation = useMutation({
    mutationFn: async (data: RegenerationRequestType) => {
      const response = await fetch(`/api/prompts/${prompt.id}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to regenerate prompt');
      }
      return response.json();
    },
    onSuccess: (result) => {
      // Track prompt improvement event
      trackEvent('improve_prompt', 'quality_improvement', 'prompt_regeneration', Math.round(result.analysis.current_score * 100));
      
      setRegeneratedContent(result.legal_prompt);
      setShowRegeneratedPrompt(true);
      toast({
        title: "Prompt regenerado com sucesso!",
        description: `Nova pontuação: ${Math.round(result.analysis.current_score * 100)}%`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/prompts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prompts', prompt.id, 'detailed-analysis'] });
      queryClient.invalidateQueries({ queryKey: [`/api/prompts/${prompt.id}/improvement-suggestions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/prompts/${prompt.id}/versions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/prompts/${prompt.id}/latest`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na regeneração",
        description: error.message || "Não foi possível regenerar o prompt.",
        variant: "destructive",
      });
    },
  });

  const handleCopy = async (content?: string) => {
    if (isCopying) return;
    
    setIsCopying(true);
    const textToCopy = content || (showRegeneratedPrompt ? regeneratedContent : prompt.legalPrompt);
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      // Track copy event
      trackEvent('copy_prompt', 'user_action', 'clipboard', textToCopy.length);
      
      toast({
        title: "Prompt copiado!",
        description: "Cole este prompt em sua LLM favorita (ChatGPT, Claude, Gemini).",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o prompt.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsCopying(false), 2000);
    }
  };

  const handleSuggestionToggle = (suggestionId: string) => {
    setSelectedImprovements(prev => 
      prev.includes(suggestionId) 
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };

  const handleCustomSuggestionChange = (suggestionId: string, text: string) => {
    setCustomSuggestions(prev => ({
      ...prev,
      [suggestionId]: text
    }));
  };

  const handleRegenerate = () => {
    const improvementTexts = selectedImprovements.map(id => {
      // Find the suggestion text from AI suggestions
      const aiSuggestion = suggestions?.ai_suggestions?.find((s: ImprovementSuggestion) => s.id === id);
      
      const originalText = aiSuggestion?.implementation_text || '';
      const customText = customSuggestions[id];
      
      return customText || originalText;
    });

    regenerateMutation.mutate({
      selected_improvements: improvementTexts,
      custom_additions: customAdditions,
      additional_requirements: ''
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const resetState = () => {
    setActiveTab('analysis');
    setSelectedImprovements([]);
    setCustomSuggestions({});
    setCustomAdditions('');
    setShowRegeneratedPrompt(false);
    setRegeneratedContent('');
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-green-600 dark:text-green-400';
    if (score >= 0.70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 0.55) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.95) return 'Excepcional';
    if (score >= 0.85) return 'Excelente';
    if (score >= 0.70) return 'Boa';
    if (score >= 0.55) return 'Regular';
    if (score >= 0.40) return 'Inadequada';
    return 'Insuficiente';
  };

  // Function to calculate predicted increment
  const calculatePredictedIncrement = () => {
    let totalIncrement = 0;
    const currentScore = (analysis as any)?.current_score || prompt.relevanceScore || 0.55;
    
    // Get selected improvements by finding them in suggestions
    const aiImprovements = (suggestions as any)?.ai_suggestions?.filter((s: any) => 
      selectedImprovements.includes(s.id)) || [];
    
    // AI suggestions: +12% each
    totalIncrement += aiImprovements.length * 12;
    
    // Custom additions: use analyzed score or fallback to 10%
    if (customAdditions.trim()) {
      if (customTextAnalysis) {
        // Use actual analysis score difference
        const impactScore = (customTextAnalysis.score - currentScore) * 100;
        totalIncrement += Math.max(-15, Math.min(25, impactScore)); // Cap between -15% and +25%
      } else if (isAnalyzingCustomText) {
        totalIncrement += 5; // Conservative estimate while analyzing
      } else {
        totalIncrement += 10; // Default estimate
      }
    }
    
    // Apply diminishing returns if current score > 80%
    if (currentScore > 0.80) {
      const diminishingFactor = 1 - ((currentScore - 0.80) / (1 - 0.80)) * 0.5;
      totalIncrement *= diminishingFactor;
    }
    
    // Add iteration bonus if there are improvements
    if (totalIncrement > 0) {
      totalIncrement += 2; // +2% iteration bonus
    }
    
    return Math.round(totalIncrement);
  };;

  const renderQualityAnalysis = () => (
    <div className="space-y-6 pt-2">
      {analysisLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Analisando qualidade jurídica...</p>
          </div>
        </div>
      ) : analysis ? (
        <>
          {/* Enhanced Score Display redesenhado sem roxo/rosa */}
          <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900/50 dark:via-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    Análise de Qualidade Jurídica
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tipo:</span>
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg text-xs sm:text-sm font-medium">
                        {analysis?.document_type || prompt.documentType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-lg text-xs sm:text-sm font-medium">
                        Analisado
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Score circular compacto - centralizado em mobile */}
              <div className="flex justify-center sm:justify-end flex-shrink-0">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${(analysis?.current_score || prompt.relevanceScore || 0.55) * 251.2} 251.2`}
                      strokeLinecap="round"
                      className={getScoreColor(analysis?.current_score || prompt.relevanceScore || 0.55)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-sm font-bold ${getScoreColor(analysis?.current_score || prompt.relevanceScore || 0.55)}`}>
                        {Math.round((analysis?.current_score || prompt.relevanceScore || 0.55) * 100)}%
                      </div>
                      <div className={`text-xs font-medium ${getScoreColor(analysis?.current_score || prompt.relevanceScore || 0.55)} opacity-80`}>
                        {getScoreLabel(analysis?.current_score || prompt.relevanceScore || 0.55)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Escala de pontuação redesenhada */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                Escala de Qualidade
              </h4>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs font-medium text-red-700 dark:text-red-400">0-39% Insuficiente</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-400">40-54% Inadequada</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">55-69% Regular</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">70-84% Boa</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">85%+ Excelente</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Quality Criteria Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {analysis?.quality_criteria && Object.entries(analysis.quality_criteria).map(([key, criteria]: [string, any]) => (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-1">
                      {criteria?.description || 'Critério de Qualidade'}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {key === 'legalCompleteness' && 'Abrangência e completude dos aspectos jurídicos'}
                      {key === 'legislationCompliance' && 'Conformidade com legislação vigente'}
                      {key === 'practicalApplicability' && 'Viabilidade prática de implementação'}
                      {key === 'legalStructure' && 'Organização e estrutura do documento'}
                    </p>
                  </div>
                  <div className="text-center sm:text-right flex-shrink-0">
                    <span className={`text-xl sm:text-2xl font-bold ${getScoreColor(criteria?.score || 0.55)}`}>
                      {Math.round((criteria?.score || 0.55) * 100)}%
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {(criteria?.score || 0.55) >= 0.85 ? 'Excelente' :
                       (criteria?.score || 0.55) >= 0.70 ? 'Bom' :
                       (criteria?.score || 0.55) >= 0.55 ? 'Regular' : 'Precisa melhorar'}
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      (criteria?.score || 0.55) >= 0.85 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      (criteria?.score || 0.55) >= 0.70 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                      (criteria?.score || 0.55) >= 0.55 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                      'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ width: `${(criteria?.score || 0.55) * 100}%` }}
                  />
                </div>
                
                {/* Detailed Feedback */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {criteria?.status || 'Análise em processamento...'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Overall Assessment */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-700">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Avaliação Geral do Documento
                </h4>
                <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                  {(analysis?.current_score || prompt.relevanceScore || 0.55) >= 0.85 
                    ? 'Documento apresenta excelente qualidade jurídica, com estrutura sólida e conformidade legal adequada. Pronto para uso profissional.'
                    : (analysis?.current_score || prompt.relevanceScore || 0.55) >= 0.70 
                    ? 'Documento com boa qualidade jurídica. Algumas melhorias podem torná-lo ainda mais robusto e completo.'
                    : (analysis?.current_score || prompt.relevanceScore || 0.55) >= 0.55
                    ? 'Documento funcional, mas com oportunidades significativas de melhoria em aspectos jurídicos e estruturais.'
                    : 'Documento requer revisão substancial para atingir padrões jurídicos adequados. Recomendamos implementar as melhorias sugeridas.'}
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Reasoning */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Análise Detalhada
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {analysis?.analysis_reasoning || prompt.relevanceReasoning || 'Análise de qualidade em processamento...'}
            </p>
          </div>

          {/* Version History */}
          <VersionHistory promptId={prompt.id} />
        </>
      ) : null}
    </div>
  );

  const renderImprovements = () => (
    <div className="space-y-8">
      {suggestionsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Gerando sugestões inteligentes...</p>
          </div>
        </div>
      ) : suggestions ? (
        <div data-tour="improvement-suggestions">




          {/* AI Suggestions com design profissional */}
          {suggestions.ai_suggestions && suggestions.ai_suggestions.length > 0 && (
            <div className="space-y-6">
              {/* Header destacado com paleta profissional */}
              <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900/50 dark:via-blue-900/30 dark:to-indigo-900/30 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Sistema de Melhorias Inteligentes
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        Selecione as melhorias que deseja implementar. Você pode editar o texto de cada sugestão para adequá-la às suas necessidades específicas.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-600 shadow-sm">
                      <span className="text-blue-700 dark:text-blue-300 font-bold text-lg">
                        {selectedImprovements.filter(id => suggestions.ai_suggestions.some((s: ImprovementSuggestion) => s.id === id)).length}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">
                        melhorias selecionadas
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const aiIds = suggestions.ai_suggestions.map((s: ImprovementSuggestion) => s.id);
                        if (aiIds.every(id => selectedImprovements.includes(id))) {
                          setSelectedImprovements(prev => prev.filter(id => !aiIds.includes(id)));
                        } else {
                          setSelectedImprovements(prev => Array.from(new Set([...prev, ...aiIds])));
                        }
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all border border-blue-200 dark:border-blue-600"
                    >
                      {suggestions.ai_suggestions.every((s: ImprovementSuggestion) => selectedImprovements.includes(s.id)) ? 'Desmarcar todas' : 'Selecionar todas'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Badge das sugestões */}
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sugestões da IA
                </span>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                  {suggestions.ai_suggestions.length} contextuais
                </span>
              </div>
              
              {/* Cards das sugestões com layout completamente novo */}
              <div className="space-y-4">
                {suggestions.ai_suggestions.map((suggestion: ImprovementSuggestion, index: number) => (
                  <div 
                    key={suggestion.id} 
                    onClick={() => handleSuggestionToggle(suggestion.id)}
                    className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                      selectedImprovements.includes(suggestion.id) 
                        ? 'border-blue-500 shadow-lg bg-blue-50/50 dark:bg-blue-900/10' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
                    }`}
                  >
                    {/* Header do card com melhor organização */}
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSuggestionToggle(suggestion.id);
                          }}
                          className="mt-1 flex-shrink-0 transition-transform hover:scale-110 z-10"
                        >
                          {selectedImprovements.includes(suggestion.id) ? (
                            <CheckCircle className="w-7 h-7 text-blue-600" />
                          ) : (
                            <Circle className="w-7 h-7 text-gray-400 hover:text-blue-500" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                Melhoria IA {index + 1}
                                <span className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  IA Contextual
                                </span>
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                {suggestion.description}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-bold">
                                Impacto: {suggestion.impact_score}/10
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Área de edição com layout melhorado */}
                      {selectedImprovements.includes(suggestion.id) && (
                        <div 
                          className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                            <Edit3 className="w-4 h-4" />
                            Personalize esta sugestão da IA:
                          </label>
                          <textarea
                            placeholder="Refine a sugestão da IA conforme seu contexto específico..."
                            value={customSuggestions[suggestion.id] || suggestion.implementation_text}
                            onChange={(e) => handleCustomSuggestionChange(suggestion.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full p-4 border border-blue-200 dark:border-blue-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                            rows={4}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Custom Additions com espaçamento melhorado */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Edit3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Suas Adições Personalizadas
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Adicione requisitos específicos do seu caso ou organização
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600 p-4">
              <textarea
                placeholder={`Exemplos de adições personalizadas:

• Cláusulas específicas para o seu setor de atuação
• Requisitos internos da sua organização
• Adaptações para casos específicos
• Melhorias baseadas na sua experiência

Digite aqui suas próprias sugestões...`}
                value={customAdditions}
                onChange={(e) => setCustomAdditions(e.target.value)}
                className="w-full p-4 border-0 bg-transparent text-gray-900 dark:text-white resize-none focus:ring-0 focus:outline-none"
                rows={6}
              />
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <div className="text-xs text-gray-500">
                {customAdditions.length}/500 caracteres
              </div>
              <div className="flex items-center gap-2">
                {isAnalyzingCustomText && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Analisando qualidade...
                  </div>
                )}
                {customTextAnalysis && !isAnalyzingCustomText && customAdditions.trim() && (
                  <div className={`text-xs flex items-center gap-1 ${
                    customTextAnalysis.score >= 0.7 ? 'text-green-600' : 
                    customTextAnalysis.score >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {customTextAnalysis.score >= 0.7 ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : customTextAnalysis.score >= 0.5 ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    Qualidade: {Math.round(customTextAnalysis.score * 100)}%
                    {customTextAnalysis.reasoning.includes('PENALIDADE') && (
                      <span className="text-red-500 font-medium">⚠</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Score Impact Preview */}
          {(selectedImprovements.length > 0 || customAdditions.trim()) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-600">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Preview de Melhoria de Score
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Impacto previsto das melhorias selecionadas
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Score Atual */}
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                    {Math.round((analysis?.current_score || prompt.relevanceScore || 0.55) * 100)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Score Atual</div>
                  <div className={`text-xs font-medium ${getScoreColor(analysis?.current_score || prompt.relevanceScore || 0.55)}`}>
                    {getScoreLabel(analysis?.current_score || prompt.relevanceScore || 0.55)}
                  </div>
                </div>
                
                {/* Incremento Previsto */}
                <div className={`text-center p-3 bg-white dark:bg-gray-800 rounded-lg border ${
                  calculatePredictedIncrement() >= 0 
                    ? 'border-emerald-200 dark:border-emerald-600' 
                    : 'border-red-200 dark:border-red-600'
                }`}>
                  <div className={`text-2xl font-bold mb-1 flex items-center justify-center gap-1 ${
                    calculatePredictedIncrement() >= 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    <span>{calculatePredictedIncrement() >= 0 ? '+' : ''}{calculatePredictedIncrement()}%</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Incremento</div>
                  <div className={`text-xs font-medium ${
                    calculatePredictedIncrement() >= 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {selectedImprovements.length} melhoria{selectedImprovements.length !== 1 ? 's' : ''}
                    {customAdditions.trim() && selectedImprovements.length > 0 ? ' + edição' : ''}
                    {customAdditions.trim() && selectedImprovements.length === 0 ? 'Edição manual' : ''}
                    {calculatePredictedIncrement() < 0 && (
                      <div className="text-red-500 text-xs mt-1">
                        ⚠ Penalidade aplicada
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Score Projetado */}
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {Math.round(Math.min(100, ((analysis?.current_score || prompt.relevanceScore || 0.55) * 100) + calculatePredictedIncrement()))}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Score Projetado</div>
                  <div className={`text-xs font-medium ${getScoreColor(Math.min(1.0, (analysis?.current_score || prompt.relevanceScore || 0.55) + (calculatePredictedIncrement() / 100)))}`}>
                    {getScoreLabel(Math.min(1.0, (analysis?.current_score || prompt.relevanceScore || 0.55) + (calculatePredictedIncrement() / 100)))}
                  </div>
                </div>
              </div>
              
              {/* Reasoning */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">Análise de Impacto:</h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">

                  {((suggestions as any)?.ai_suggestions?.filter((s: any) => selectedImprovements.includes(s.id))?.length || 0) > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Sugestões da IA: +{((suggestions as any)?.ai_suggestions?.filter((s: any) => selectedImprovements.includes(s.id))?.length || 0) * 12}% (base +12% cada)</span>
                    </div>
                  )}
                  {customAdditions.trim() && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Edição Manual: +10% (impacto estimado baseado na qualidade)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-200 dark:border-gray-600">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-xs">Retorno decrescente aplicado se score atual &gt; 80%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Action Section with Send Button */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedImprovements.length > 0 && (
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    {selectedImprovements.length} melhoria{selectedImprovements.length > 1 ? 's' : ''} selecionada{selectedImprovements.length > 1 ? 's' : ''}
                  </span>
                )}
                {selectedImprovements.length === 0 && customAdditions.trim() === '' && (
                  <span className="text-amber-600 dark:text-amber-400">
                    Selecione melhorias ou adicione suas próprias sugestões
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-center"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setActiveTab('regenerate')}
                  disabled={selectedImprovements.length === 0 && customAdditions.trim() === ''}
                  className="px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar Melhorias
                </button>
              </div>
            </div>
            
            {/* User Guidance */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Como usar as melhorias:</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Selecione as sugestões que considera relevantes</li>
                    <li>• Personalize o texto conforme suas necessidades</li>
                    <li>• Adicione requisitos específicos na área personalizada</li>
                    <li>• Clique em "Enviar Melhorias" para regenerar o prompt</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">Carregando sugestões de melhoria...</p>
        </div>
      )}
    </div>
  );

  const renderRegenerateSection = () => (
    <div className="space-y-6">
      {/* Selected Improvements Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Resumo das Melhorias Selecionadas
        </h3>
        
        {selectedImprovements.length > 0 || customAdditions.trim() ? (
          <div className="space-y-3">
            {selectedImprovements.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Sugestões Selecionadas ({selectedImprovements.length}):
                </p>
                <div className="space-y-3">
                  {selectedImprovements.map((id) => {
                    // Find the suggestion details
                    const aiSuggestion = suggestions?.ai_suggestions?.find((s: ImprovementSuggestion) => s.id === id);
                    const suggestion = aiSuggestion;
                    
                    if (!suggestion) return null;
                    
                    const customText = customSuggestions[id];
                    const finalText = customText || suggestion.implementation_text;
                    
                    return (
                      <div key={id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {suggestion.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              suggestion.type === 'system' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            }`}>
                              {suggestion.type === 'system' ? 'Sistema' : 'IA'}
                            </span>
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                              Impacto: {suggestion.impact_score}/10
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {suggestion.description}
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {customText ? 'Texto Personalizado:' : 'Implementação:'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {finalText}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {customAdditions.trim() && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adições Personalizadas:
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded border">
                  {customAdditions}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Nenhuma melhoria selecionada. Vá para a aba "Melhorias" para selecionar sugestões.
          </p>
        )}
      </div>

      {/* Regenerate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleRegenerate}
          disabled={regenerateMutation.isPending || (selectedImprovements.length === 0 && !customAdditions.trim())}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          {regenerateMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Regenerando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Regenerar Prompt Melhorado
            </>
          )}
        </button>
      </div>

      {/* Regenerated Content */}
      {showRegeneratedPrompt && regeneratedContent && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Prompt Melhorado
            </h3>
            <button
              onClick={() => handleCopy(regeneratedContent)}
              className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              Copiar Versão Melhorada
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700 p-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {regeneratedContent}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-4 px-1 sm:px-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-none max-h-[calc(100vh-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col overflow-hidden sm:max-w-6xl sm:max-h-[calc(100vh-2rem)] sm:w-auto sm:my-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-2 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {prompt.documentType}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Prompts Jurídicos • Ampliados 🇧🇷
                </p>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => handleCopy()}
                  className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg flex items-center gap-1 sm:gap-2 transition-colors ${
                    isCopying
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  }`}
                >
                  {isCopying ? (
                    <>
                      <Check size={12} className="sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} className="sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Copiar Prompt Atual</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto mobile-tabs scrollbar-hide">
              {[
                { id: 'analysis', label: 'Análise', shortLabel: 'Análise', icon: Target },
                { id: 'improvements', label: 'Melhorias', shortLabel: 'Melhorias', icon: Sparkles },
                { id: 'regenerate', label: 'Regenerar', shortLabel: 'Regenerar', icon: RefreshCw }
              ].map(({ id, label, shortLabel, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex-1 min-w-[120px] px-4 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap sm:px-8 sm:py-4 sm:text-sm sm:gap-3 ${
                    activeTab === id
                      ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{shortLabel}</span>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-6 min-h-0">
              {activeTab === 'analysis' && renderQualityAnalysis()}
              {activeTab === 'improvements' && renderImprovements()}
              {activeTab === 'regenerate' && renderRegenerateSection()}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {prompt.areaTags.map((tag) => (
                    <span 
                      key={tag}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  {prompt.relevanceScore && (
                    <span className={getScoreColor(prompt.relevanceScore)}>
                      Qualidade: {Math.round(prompt.relevanceScore * 100)}%
                    </span>
                  )}
                  <span>
                    Criado em {new Date(prompt.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}