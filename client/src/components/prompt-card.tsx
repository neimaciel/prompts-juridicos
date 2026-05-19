import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { exportToWord } from "@/lib/export";
import RelevanceIndicator from "@/components/relevance-indicator";
import SimplePromptViewer from "@/components/simple-prompt-viewer";
import QualityImprovementModal from "@/components/quality-improvement-modal";
import { FeedbackSurveyModal } from "@/components/feedback-survey-modal";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { trackEvent } from "@/lib/analytics";
import { useFeedbackSurvey } from "@/hooks/use-feedback-survey";
import { Sparkles } from "lucide-react";
import type { LegalPrompt } from "@shared/schema";

interface PromptCardProps {
  prompt: LegalPrompt;
}

// Cores específicas para áreas jurídicas
const getTagColor = (tag: string): string => {
  const lowerTag = tag.toLowerCase();
  
  // Direito Civil e áreas relacionadas
  if (lowerTag.includes('civil') || lowerTag.includes('família') || lowerTag.includes('sucessões')) {
    return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700";
  }
  
  // Direito Processual
  if (lowerTag.includes('processual') || lowerTag.includes('processo')) {
    return "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700";
  }
  
  // Direito Trabalhista
  if (lowerTag.includes('trabalhista') || lowerTag.includes('trabalho') || lowerTag.includes('clt')) {
    return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700";
  }
  
  // Direito Penal/Criminal
  if (lowerTag.includes('penal') || lowerTag.includes('criminal')) {
    return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700";
  }
  
  // Propriedade Intelectual
  if (lowerTag.includes('propriedade intelectual') || lowerTag.includes('intelectual')) {
    return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700";
  }
  
  // Direito Empresarial/Comercial
  if (lowerTag.includes('empresarial') || lowerTag.includes('comercial') || lowerTag.includes('societário')) {
    return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700";
  }
  
  // Direito Constitucional/Administrativo
  if (lowerTag.includes('constitucional') || lowerTag.includes('administrativo')) {
    return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700";
  }
  
  // Direito do Consumidor
  if (lowerTag.includes('consumidor') || lowerTag.includes('cdc')) {
    return "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700";
  }
  
  // Contratos
  if (lowerTag.includes('contrato') || lowerTag.includes('acordo')) {
    return "bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
  }
  
  // Petições
  if (lowerTag.includes('petição') || lowerTag.includes('inicial')) {
    return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700";
  }
  
  // Pareceres
  if (lowerTag.includes('parecer') || lowerTag.includes('consultoria')) {
    return "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700";
  }
  
  // Propriedade/Imóveis
  if (lowerTag.includes('propriedade') || lowerTag.includes('imóvel') || lowerTag.includes('registral')) {
    return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700";
  }
  
  // Cobrança
  if (lowerTag.includes('cobrança') || lowerTag.includes('executivo')) {
    return "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700";
  }
  
  // Cor padrão para outras tags
  return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700";
};

export default function PromptCard({ prompt }: PromptCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [hasImprovements, setHasImprovements] = useState(false);
  const [versionNumber, setVersionNumber] = useState(1);
  const { toast } = useToast();
  
  // Feedback survey integration
  const { 
    shouldShowSurvey, 
    markPromptCardViewed, 
    submitFeedback, 
    dismissSurvey 
  } = useFeedbackSurvey();

  // Verificar se o prompt tem melhorias e pegar a versão
  useEffect(() => {
    const checkForImprovements = async () => {
      try {
        const response = await fetch(`/api/prompts/${prompt.id}/iterations`);
        if (response.ok) {
          const data = await response.json();
          const hasIterations = data.iterations && data.iterations.length > 0;
          setHasImprovements(hasIterations);
          // Versão = 1 + número de iterações
          setVersionNumber(hasIterations ? 1 + data.iterations.length : 1);
        }
      } catch (error) {
        console.error('Erro ao verificar melhorias:', error);
      }
    };

    checkForImprovements();
    
    // Mark that user has viewed a prompt card for feedback survey trigger
    markPromptCardViewed();
  }, [prompt.id, markPromptCardViewed]);

  // Determina se o prompt é novo (criado nos últimos 30 segundos)
  const isNewPrompt = () => {
    const now = new Date();
    const createdAt = new Date(prompt.createdAt);
    const diffInSeconds = (now.getTime() - createdAt.getTime()) / 1000;
    return diffInSeconds <= 30 && !hasInteracted;
  };

  const markAsInteracted = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleCardClick = () => {
    markAsInteracted();
    setIsQualityModalOpen(true);
  };

  const handleFlip = () => {
    markAsInteracted();
    setIsFlipped(!isFlipped);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsInteracted();
    
    if (isCopying) return;
    
    setIsCopying(true);
    
    // Track copy event for analytics
    trackEvent('prompt_copy', 'engagement', prompt.documentType);
    
    try {
      await navigator.clipboard.writeText(prompt.legalPrompt);
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

  const handleOpenLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsInteracted();
    setIsLightboxOpen(true);
  };

  const handleExportWord = async (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsInteracted();
    try {
      await exportToWord(prompt);
      toast({
        title: "Word exportado!",
        description: "O prompt foi exportado como documento Word.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar Word",
        description: "Não foi possível exportar o arquivo.",
        variant: "destructive",
      });
    }
  };

  const timeAgo = formatDistanceToNow(new Date(prompt.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  // Generate structured data for each prompt card
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": prompt.documentType,
    "description": prompt.userRequest.substring(0, 160) + "...",
    "author": {
      "@type": "Organization",
      "name": "Prompts Jurídicos Ampliados"
    },
    "dateCreated": prompt.createdAt,
    "inLanguage": "pt-BR",
    "genre": "Legal Document Template",
    "keywords": prompt.areaTags.join(", "),
    ...(prompt.relevanceScore && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": (prompt.relevanceScore / 100 * 5).toFixed(1),
        "ratingCount": 1,
        "bestRating": 5,
        "worstRating": 1
      }
    }),
    "about": {
      "@type": "Thing",
      "name": prompt.areaTags[0] || "Direito",
      "description": "Área jurídica especializada"
    }
  };

  const cardContent = (
    <>
      {/* SEO Structured Data for this card */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      <article 
        className={`prompt-card group bg-white dark:bg-gray-800 rounded-lg ${isNewPrompt() ? '' : 'border border-gray-200 dark:border-gray-700'} p-4 sm:p-6 hover:shadow-lg dark:hover:shadow-xl transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer`}
        onClick={handleCardClick}
        itemScope
        itemType="https://schema.org/CreativeWork"
      >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {prompt.documentType}
              </h3>
              {hasImprovements && (
                <div className="relative group">
                  {/* Ícone Sparkles colorido - sempre visível */}
                  <div className="relative w-7 h-7 flex items-center justify-center transform transition-all duration-300 hover:scale-110 hover:rotate-12">
                    <svg
                      className="w-6 h-6 drop-shadow-lg"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <defs>
                        <linearGradient id={`sparkle-gradient-${prompt.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#7bb3f5" />
                          <stop offset="50%" stopColor="#b476f2" />
                          <stop offset="100%" stopColor="#f070a6" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                        stroke={`url(#sparkle-gradient-${prompt.id})`}
                        fill={`url(#sparkle-gradient-${prompt.id})`}
                      />
                    </svg>
                  </div>
                  
                  {/* Tooltip - aparece apenas no hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                    Recebeu melhorias - v{versionNumber}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {prompt.areaTags.map((tag) => (
              <span 
                key={tag}
                className={`tag-button px-3 py-1.5 text-xs rounded-full font-medium ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
          {prompt.relevanceScore !== null ? (
            <div className="mb-4" data-tour="quality-score">
              <RelevanceIndicator 
                score={prompt.relevanceScore} 
                reasoning={prompt.relevanceReasoning}
                suggestions={prompt.relevanceSuggestions}
                size="md" 
                showLabel={true}
                prompt={prompt}
              />
            </div>
          ) : (
            <div className="mb-4">
              <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg text-sm border border-blue-200 dark:border-blue-700">
                Análise de qualidade em processamento...
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-row lg:flex-col xl:flex-col 2xl:flex-row gap-1 lg:gap-1 xl:gap-1 2xl:gap-2 ml-2 sm:ml-4" data-tour="prompt-actions">
          <button 
            onClick={handleCopy}
            className={`p-2 rounded transition-colors ${
              isCopying 
                ? "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400" 
                : "text-gray-400/60 dark:text-gray-500/60 hover:text-orange-600 dark:hover:text-orange-400 hover:opacity-100"
            }`}
            title="Copiar prompt"
          >
            <i className={`text-lg ${
              isCopying ? "ph ph-check" : "ph ph-copy"
            }`}></i>
          </button>
          
          <button 
            onClick={handleOpenLightbox}
            className="p-2 text-gray-400/60 dark:text-gray-500/60 hover:text-purple-600 dark:hover:text-purple-400 rounded transition-colors hover:opacity-100"
            title="Visualizar prompt completo"
          >
            <i className="ph ph-eye text-lg"></i>
          </button>
          
          <button 
            onClick={handleExportWord}
            className="p-2 text-gray-400/60 dark:text-gray-500/60 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors hover:opacity-100"
            title="Exportar Word"
          >
            <i className="ph ph-file-doc text-lg"></i>
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
        <div className="text-sm text-gray-700 dark:text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">
          {prompt.legalPrompt}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
        <span>
          <i className="ph ph-clock mr-1"></i>
          {timeAgo}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped(!isFlipped);
          }}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {isFlipped ? 'Ver prompt' : 'Ver solicitação'}
        </button>
      </div>
      
      {isFlipped && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400 dark:border-blue-500">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Solicitação Original:</h4>
          <div className="max-h-32 overflow-y-auto">
            <p className="text-gray-700 dark:text-gray-300 font-mono text-sm whitespace-pre-wrap">"{prompt.userRequest}"</p>
          </div>
        </div>
      )}
      </article>
    </>
  );

  // Retorna o card com ou sem background gradiente
  const cardWithLightbox = (
    <>
      {cardContent}
      <SimplePromptViewer 
        prompt={prompt}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
      <QualityImprovementModal
        prompt={prompt}
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
      />
      <FeedbackSurveyModal
        isOpen={shouldShowSurvey}
        onClose={dismissSurvey}
        onSubmit={submitFeedback}
      />
    </>
  );

  if (isNewPrompt()) {
    return (
      <BackgroundGradient 
        className="bg-white dark:bg-gray-800 rounded-lg"
        containerClassName="rounded-lg"
      >
        {cardWithLightbox}
      </BackgroundGradient>
    );
  }

  return cardWithLightbox;
}
