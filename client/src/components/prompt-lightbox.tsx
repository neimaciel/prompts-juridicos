import { useState, useRef, useEffect } from 'react';
import { X, Copy, CheckCircle, Circle, Sparkles, Download, FileText, AlertTriangle, ThumbsUp, TrendingUp, TrendingDown } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { LegalPrompt, type ImprovementSuggestion, type DetailedQualityAnalysis, type RegenerationRequestType } from '@shared/schema';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import * as DOCX from 'docx';

interface PromptLightboxProps {
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
  quality_criteria: any;
  document_type: string;
  improvement_potential: number;
}

export default function PromptLightbox({ prompt, isOpen, onClose }: PromptLightboxProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'view' | 'analysis' | 'suggestions' | 'regenerate'>('view');
  const [selectedImprovements, setSelectedImprovements] = useState<string[]>([]);
  const [customSuggestions, setCustomSuggestions] = useState<Record<string, string>>({});
  const [customAdditions, setCustomAdditions] = useState<string>('');
  const [showRegeneratedPrompt, setShowRegeneratedPrompt] = useState(false);
  const [regeneratedContent, setRegeneratedContent] = useState<{ legalPrompt: string; analysis: DetailedQualityAnalysis } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch quality analysis
  const { data: analysis, isLoading: analysisLoading } = useQuery<AnalysisResponse>({
    queryKey: ['/api/prompts', prompt.id, 'detailed-analysis'],
    enabled: isOpen && activeTab === 'analysis'
  });

  // Fetch improvement suggestions
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery<SuggestionsResponse>({
    queryKey: ['/api/prompts', prompt.id, 'suggestions'],
    enabled: isOpen && activeTab === 'suggestions'
  });

  // Effect to automatically switch to suggestions tab when suggestions are loaded
  useEffect(() => {
    if (suggestions && activeTab === 'view') {
      setActiveTab('suggestions');
    }
  }, [suggestions, activeTab]);

  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 0.95) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 0.85) return 'text-green-600 dark:text-green-400';
    if (score >= 0.70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 0.55) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 0.40) return 'text-orange-600 dark:text-orange-400';
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Conteúdo copiado para a área de transferência.",
    });
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Prompt Jurídico', margin, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tipo: ${prompt.documentType}`, margin, 50);
    
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(prompt.legalPrompt, maxWidth);
    doc.text(splitText, margin, 70);
    
    doc.save(`prompt-juridico-${prompt.id}.pdf`);
    
    toast({
      title: "PDF baixado!",
      description: "O arquivo PDF foi baixado com sucesso.",
    });
  };

  const handleDownloadDOCX = () => {
    const doc = new DOCX.Document({
      sections: [
        {
          children: [
            new DOCX.Paragraph({
              text: "Prompt Jurídico",
              heading: DOCX.HeadingLevel.HEADING_1,
            }),
            new DOCX.Paragraph({
              text: `Tipo de Documento: ${prompt.documentType}`,
            }),
            new DOCX.Paragraph({
              text: "",
            }),
            new DOCX.Paragraph({
              text: prompt.legalPrompt,
            }),
          ],
        },
      ],
    });

    DOCX.Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `prompt-juridico-${prompt.id}.docx`);
      toast({
        title: "DOCX baixado!",
        description: "O arquivo Word foi baixado com sucesso.",
      });
    });
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
      // Find the suggestion text from AI suggestions only
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
        throw new Error('Falha na regeneração');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setRegeneratedContent(data);
      setShowRegeneratedPrompt(true);
      queryClient.invalidateQueries({ queryKey: ['/api/prompts'] });
      toast({
        title: "Prompt regenerado!",
        description: "O prompt foi melhorado com suas sugestões.",
      });
    },
    onError: () => {
      toast({
        title: "Erro na regeneração",
        description: "Não foi possível regenerar o prompt. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const renderQualityAnalysis = () => (
    <div className="space-y-6">
      {analysisLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : analysis ? (
        <>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Pontuação Atual de Qualidade
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Análise baseada em {analysis.document_type}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(analysis?.current_score || prompt.relevanceScore || 0.55)}`}>
                  {Math.round((analysis?.current_score || prompt.relevanceScore || 0.55) * 100)}%
                </div>
                <div className={`text-sm font-medium ${getScoreColor(analysis?.current_score || prompt.relevanceScore || 0.55)}`}>
                  {getScoreLabel(analysis?.current_score || prompt.relevanceScore || 0.55)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analysis.quality_criteria || {}).map(([key, criteria]: [string, any]) => (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {criteria.description}
                  </h4>
                  <span className={`text-sm font-medium ${getScoreColor(criteria.score)}`}>
                    {Math.round(criteria.score * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      criteria.score >= 0.85 ? 'bg-green-500' :
                      criteria.score >= 0.70 ? 'bg-blue-500' :
                      criteria.score >= 0.55 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${criteria.score * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {criteria.status}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Análise Detalhada</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {analysis.analysis_reasoning}
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">Clique em "Analisar Qualidade" para ver a análise detalhada.</p>
        </div>
      )}
    </div>
  );

  const renderSuggestions = () => (
    <div className="space-y-6">
      {suggestionsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : suggestions ? (
        <>
          {/* AI Suggestions - Now the only suggestion source */}
          {suggestions.ai_suggestions && suggestions.ai_suggestions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Sugestões da IA
              </h3>
              <div className="space-y-3">
                {suggestions.ai_suggestions.map((suggestion: ImprovementSuggestion) => (
                  <div key={suggestion.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleSuggestionToggle(suggestion.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {selectedImprovements.includes(suggestion.id) ? (
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {suggestion.title}
                          </h4>
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                            Impacto: {suggestion.impact_score}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {suggestion.description}
                        </p>
                        {selectedImprovements.includes(suggestion.id) && (
                          <textarea
                            placeholder="Edite a sugestão conforme necessário..."
                            value={customSuggestions[suggestion.id] || suggestion.implementation_text}
                            onChange={(e) => handleCustomSuggestionChange(suggestion.id, e.target.value)}
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                            rows={3}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">Nenhuma sugestão disponível.</p>
        </div>
      )}
    </div>
  );

  const renderRegenerate = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Regenerar Prompt com Melhorias
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selecione as melhorias que deseja aplicar e adicione requisitos personalizados.
        </p>
      </div>

      {/* Summary of selected improvements */}
      {selectedImprovements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Melhorias Selecionadas ({selectedImprovements.length})
          </h4>
          <div className="space-y-2">
            {selectedImprovements.map((id, index) => {
              const suggestion = suggestions?.ai_suggestions?.find((s: ImprovementSuggestion) => s.id === id);
              return (
                <div key={id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {suggestion?.title || 'Sugestão personalizada'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom additions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          Adições Personalizadas (Opcional)
        </h4>
        <textarea
          placeholder="Adicione requisitos específicos ou melhorias personalizadas..."
          value={customAdditions}
          onChange={(e) => setCustomAdditions(e.target.value)}
          className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
          rows={4}
        />
      </div>

      {/* Regenerate button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {selectedImprovements.length === 0 && !customAdditions.trim() 
            ? 'Selecione pelo menos uma melhoria ou adicione requisitos personalizados.'
            : `Pronto para regenerar com ${selectedImprovements.length} melhorias${customAdditions.trim() ? ' e adições personalizadas' : ''}.`
          }
        </p>
        <button
          onClick={handleRegenerate}
          disabled={regenerateMutation.isPending || (selectedImprovements.length === 0 && !customAdditions.trim())}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {regenerateMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Regenerando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Regenerar Prompt
            </>
          )}
        </button>
      </div>

      {/* Show regenerated prompt */}
      {showRegeneratedPrompt && regeneratedContent && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5" />
              Prompt Regenerado com Sucesso!
            </h4>
            <button
              onClick={() => handleCopy(regeneratedContent.legalPrompt)}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              <Copy className="w-3 h-3" />
              Copiar
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
              {regeneratedContent.legalPrompt}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Prompt Jurídico #{prompt.id}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {prompt.documentType} • {new Date(prompt.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {[
            { id: 'view', label: 'Visualizar', icon: FileText },
            { id: 'analysis', label: 'Análise', icon: AlertTriangle },
            { id: 'suggestions', label: 'Sugestões', icon: Sparkles },
            { id: 'regenerate', label: 'Regenerar', icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]" ref={contentRef}>
          {activeTab === 'view' && (
            <div className="space-y-6">
              {/* Prompt content */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Conteúdo do Prompt
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(prompt.legalPrompt)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      Copiar
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </button>
                    <button
                      onClick={handleDownloadDOCX}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      DOCX
                    </button>
                  </div>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {prompt.legalPrompt}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'analysis' && renderQualityAnalysis()}
          {activeTab === 'suggestions' && renderSuggestions()}
          {activeTab === 'regenerate' && renderRegenerate()}
        </div>
      </div>
    </div>
  );
}