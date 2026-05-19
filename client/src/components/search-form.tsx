import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDynamicSuggestions, DEFAULT_SUGGESTIONS } from "@/hooks/use-suggestions";
import { Checkbox } from "@/components/ui/checkbox";
import SensitiveDataAlert from "@/components/sensitive-data-alert";
import type { GeneratePromptRequest } from "@shared/schema";
import sucoIcon from "@assets/suco.png";
import { trackEvent, trackPromptGeneration } from "@/lib/analytics";
import { ArrowUp } from "lucide-react";

interface SearchFormProps {
  onGeneratingChange?: (generatingRequest: string | null) => void;
}

export default function SearchForm({ onGeneratingChange }: SearchFormProps = {}) {
  const [userRequest, setUserRequest] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToNoSensitiveData, setAgreedToNoSensitiveData] = useState(false);
  const [agreedToTermsOfUse, setAgreedToTermsOfUse] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasClickedSearchBar, setHasClickedSearchBar] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionText, setLastSubmissionText] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Buscar sugestões dinâmicas
  const { data: suggestionsData } = useDynamicSuggestions();
  const suggestions = suggestionsData?.suggestions || DEFAULT_SUGGESTIONS;
  
  // Fetch admin settings to check topic restriction
  const { data: adminSettings } = useQuery({
    queryKey: ["/api/admin/settings"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  const [sensitiveDataAlert, setSensitiveDataAlert] = useState<{
    show: boolean;
    detectedTypes: string[];
  }>({ show: false, detectedTypes: [] });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for overlay management
  const [isHovering, setIsHovering] = useState(false);

  // Initialize agreement states from localStorage on component mount
  useEffect(() => {
    const agreementData = localStorage.getItem('termsAgreement');
    if (agreementData) {
      try {
        const { timestamp, noSensitiveData, termsOfUse } = JSON.parse(agreementData);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        // Check if agreement is still valid (less than 24 hours old)
        if (now - timestamp < twentyFourHours) {
          setAgreedToNoSensitiveData(!!noSensitiveData);
          setAgreedToTermsOfUse(!!termsOfUse);
          setAgreedToTerms(!!(noSensitiveData && termsOfUse));
        }
      } catch (e) {
        // If parsing fails, leave states as false
        console.warn('Failed to parse agreement data from localStorage');
      }
    }
  }, []);

  // Manage blur overlay with useEffect
  useEffect(() => {
    let overlay: HTMLElement | null = null;

    if (isHovering) {
      overlay = document.querySelector('.blur-overlay') as HTMLElement;
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'blur-overlay';
        document.body.appendChild(overlay);
      }
      // Force reflow then activate
      overlay.offsetHeight;
      overlay.classList.add('active');
    } else {
      overlay = document.querySelector('.blur-overlay') as HTMLElement;
      if (overlay) {
        overlay.classList.remove('active');
        const timeoutId = setTimeout(() => {
          const currentOverlay = document.querySelector('.blur-overlay') as HTMLElement;
          if (currentOverlay && !currentOverlay.classList.contains('active')) {
            try {
              document.body.removeChild(currentOverlay);
            } catch (e) {
              // Ignore if already removed
            }
          }
        }, 300);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isHovering]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const overlay = document.querySelector('.blur-overlay') as HTMLElement;
      if (overlay) {
        try {
          document.body.removeChild(overlay);
        } catch (e) {
          // Ignore if already removed
        }
      }
    };
  }, []);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  // Single placeholder for the search input
  const placeholder = "O que você quer fazer hoje?";

  // Set placeholder on component mount
  useEffect(() => {
    setCurrentPlaceholder(placeholder);
  }, []);



  // Validate if the request is legal-related and meaningful
  const validateLegalRequest = (text: string): { isValid: boolean; reason?: string } => {
    const words = text.trim().split(/\s+/);
    
    // Check minimum word count
    if (words.length < 2) {
      return { isValid: false, reason: "Descreva sua necessidade com pelo menos 2 palavras" };
    }

    // Check for obvious non-legal or nonsensical content (mais restritivo)
    const nonLegalPatterns = [
      /^[a-z]{1,2}$/i, // Single or double letters only
      /^\d+$/, // Only numbers
      /^[^a-zA-ZàáãâçéêíóôõúüÀÁÃÂÇÉÊÍÓÔÕÚÜ]*$/, // No valid letters at all
      /^(.)\1{6,}$/, // Same character repeated 7+ times
      /^(teste|test|aaa|bbb|xxx|yyy|zzz)$/i, // Obvious test words only
      /^(asdf|qwer|zxcv|hjkl|1234)$/i // Keyboard patterns only
    ];

    const hasNonLegalPattern = nonLegalPatterns.some(pattern => pattern.test(text));
    if (hasNonLegalPattern) {
      return { isValid: false, reason: "Por favor, descreva uma necessidade real e específica" };
    }

    // Check for legal-related keywords (prioritizing legal context but allowing other professional areas)
    const legalKeywords = [
      'contrato', 'acordo', 'lei', 'direito', 'jurídico', 'legal', 'processo', 'ação',
      'petição', 'recurso', 'defesa', 'sentença', 'decisão', 'tribunal', 'juiz',
      'advogado', 'cliente', 'parte', 'réu', 'autor', 'trabalhista', 'civil',
      'penal', 'criminal', 'administrativo', 'constitucional', 'empresa', 'sociedade',
      'responsabilidade', 'dano', 'indenização', 'multa', 'penalidade', 'conflito',
      'disputa', 'negociação', 'mediação', 'arbitragem', 'regulamentação', 'norma',
      'regulamento', 'compliance', 'documentação', 'parecer', 'consultoria',
      'assessoria', 'orientação', 'análise', 'revisão', 'elaboração', 'redação',
      'site', 'website', 'página', 'páginas', 'hospedagem', 'manutenção', 'antivírus',
      'garantia', 'invasões', 'alterações', 'aprovação', 'layout', 'interface', 'design',
      'específico', 'especifica', 'contempla', 'inclua', 'modelo', 'setor', 'área', 'áreas'
    ];

    // Allow other professional areas when no legal context is found
    const professionalKeywords = [
      'documento', 'texto', 'conteúdo', 'artigo', 'relatório', 'estudo', 'pesquisa', 
      'manual', 'guia', 'instrução', 'procedimento', 'proposta', 'projeto', 'plano',
      'apresentação', 'técnico', 'científico', 'acadêmico', 'educativo', 'comercial',
      'negócio', 'organização', 'administração', 'gestão', 'comunicação'
    ];

    const hasLegalContext = legalKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    const hasProfessionalContext = professionalKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    // If no meaningful keywords but seems like a reasonable request, allow it
    const seemsReasonable = words.length >= 2 && 
                           !hasNonLegalPattern && 
                           text.length >= 8;

    // Prioritize legal content but allow other professional areas
    if (!hasLegalContext && !hasProfessionalContext && !seemsReasonable) {
      return { isValid: false, reason: "Descreva uma necessidade jurídica específica ou área profissional" };
    }

    return { isValid: true };
  };

  // Check if user has agreed in the last 24 hours
  useEffect(() => {
    const checkTermsAgreement = () => {
      const agreementData = localStorage.getItem('termsAgreement');
      if (agreementData) {
        const { timestamp, noSensitiveData, termsOfUse } = JSON.parse(agreementData);
        const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const now = Date.now();
        
        if (now - timestamp < twentyFourHours) {
          setAgreedToNoSensitiveData(noSensitiveData || false);
          setAgreedToTermsOfUse(termsOfUse || false);
          setAgreedToTerms(noSensitiveData && termsOfUse);
        } else {
          // Remove expired agreement
          localStorage.removeItem('termsAgreement');
        }
      }
    };

    checkTermsAgreement();
    
    // Note: hasClickedSearchBar starts as false and only becomes true 
    // when user clicks in the current session
  }, []);

  // Handle individual checkbox changes
  const handleNoSensitiveDataChange = (checked: boolean) => {
    setAgreedToNoSensitiveData(checked);
    updateAgreement(checked, agreedToTermsOfUse);
  };

  const handleTermsOfUseChange = (checked: boolean) => {
    setAgreedToTermsOfUse(checked);
    updateAgreement(agreedToNoSensitiveData, checked);
  };

  // Update agreement and localStorage
  const updateAgreement = (noSensitiveData: boolean, termsOfUse: boolean) => {
    const bothAgreed = noSensitiveData && termsOfUse;
    setAgreedToTerms(bothAgreed);
    
    if (bothAgreed) {
      const agreementData = {
        timestamp: Date.now(),
        noSensitiveData: true,
        termsOfUse: true
      };
      localStorage.setItem('termsAgreement', JSON.stringify(agreementData));
    } else {
      localStorage.removeItem('termsAgreement');
    }
  };

  // Handle search bar click - show terms on first click in this session
  const handleSearchBarClick = () => {
    if (!hasClickedSearchBar) {
      setHasClickedSearchBar(true);
      // Note: We don't save this to localStorage - it's session-only
    }
  };

  // Check if we should show the terms card
  const shouldShowTermsCard = () => {
    // Only show if user has clicked search bar AND hasn't agreed to terms
    if (!hasClickedSearchBar) return false;
    
    const agreementData = localStorage.getItem('termsAgreement');
    if (!agreementData) return true;
    
    try {
      const { timestamp } = JSON.parse(agreementData);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const now = Date.now();
      
      return now - timestamp >= twentyFourHours;
    } catch (e) {
      // If parsing fails, show terms
      return true;
    }
  };

  const generateMutation = useMutation({
    mutationFn: async (data: GeneratePromptRequest) => {
      setIsSubmitting(true);
      const response = await apiRequest("POST", "/api/prompts/generate", data);
      return response; // apiRequest already returns parsed JSON
    },
    onSuccess: (newPrompt) => {
      // Track prompt generation event
      trackEvent('generate_prompt', 'legal_document', 'prompt_generation', 1);
      
      // Track Meta Pixel conversion event
      trackPromptGeneration(newPrompt.documentType);
      
      // Remove generating card and add real prompt to cache
      if (onGeneratingChange) {
        onGeneratingChange(null);
      }
      
      // Add the new prompt to existing data without invalidating
      queryClient.setQueryData(['prompts', 'infinite'], (oldData: any) => {
        if (!oldData?.pages) return oldData;
        
        const newPages = [...oldData.pages];
        if (newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            prompts: [newPrompt, ...newPages[0].prompts]
          };
        }
        
        return {
          ...oldData,
          pages: newPages
        };
      });
      
      setUserRequest("");
      setIsSubmitting(false);
      setLastSubmissionText("");
      toast({
        title: "Prompt gerado com sucesso!",
        description: "Seu prompt jurídico foi criado e adicionado à galeria.",
      });
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      // Remove generating card on error
      if (onGeneratingChange) {
        onGeneratingChange(null);
      }
      
      // Check if it's a sensitive data error
      if (error.detectedTypes && Array.isArray(error.detectedTypes)) {
        setSensitiveDataAlert({
          show: true,
          detectedTypes: error.detectedTypes
        });
      } else {
        toast({
          title: "Erro ao gerar prompt",
          description: error.message || "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const trimmedRequest = userRequest.trim();
    
    // Prevent empty submissions
    if (!trimmedRequest) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, descreva sua necessidade jurídica.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has agreed to terms
    if (!agreedToTerms) {
      toast({
        title: "Termos obrigatórios",
        description: "Por favor, aceite os termos de uso antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    // Prevent duplicate submissions of the same text
    if (trimmedRequest === lastSubmissionText && (isSubmitting || generateMutation.isPending)) {
      toast({
        title: "Aguarde um momento",
        description: "Sua solicitação já está sendo processada.",
        variant: "default",
      });
      return;
    }

    // Prevent multiple submissions while processing
    if (isSubmitting || generateMutation.isPending) {
      return;
    }

    // Validate the request before submitting
    const validation = validateLegalRequest(trimmedRequest);
    if (!validation.isValid) {
      toast({
        variant: "destructive",
        title: "Solicitação inválida",
        description: validation.reason,
        duration: 4000,
      });
      return;
    }

    // Store the current submission text to prevent duplicates
    setLastSubmissionText(trimmedRequest);
    setIsSubmitting(true);

    // Show generating card immediately
    if (onGeneratingChange) {
      onGeneratingChange(trimmedRequest);
    }

    // Track the search event
    trackEvent('search', 'legal_prompt', 'prompt_generation');
    
    generateMutation.mutate({ userRequest: trimmedRequest });
  };

  // Debounced submit function
  const debouncedSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault(); // Call preventDefault synchronously
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      handleSubmit(); // Call without event
    }, 300); // 300ms debounce
  }, [userRequest, isSubmitting, lastSubmissionText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(); // Call directly without debounce for Enter key
    }
    // Shift+Enter allows line break (default behavior)
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0 pb-16 sm:pb-8">
      <form onSubmit={debouncedSubmit}>
        <div 
          className="search-form-container no-hover relative group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Copy Icon à direita - clicável para enviar */}
          <button
            type="submit"
            className="absolute bottom-4 right-4 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10 opacity-70 hover:opacity-100"
            disabled={generateMutation.isPending || isSubmitting || !userRequest.trim() || !agreedToTerms}
          >
            <ArrowUp className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
          </button>
          
          <textarea 
            value={userRequest}
            onChange={(e) => {
              setUserRequest(e.target.value);
              // Adjust text alignment and padding based on content
              const target = e.target as HTMLTextAreaElement;
              if (e.target.value.trim()) {
                target.style.textAlign = 'left';
                if (typeof window !== 'undefined') {
                  target.style.paddingTop = window.innerWidth >= 640 ? '20px' : '16px';
                  target.style.paddingLeft = window.innerWidth >= 640 ? '16px' : '12px';
                  target.style.paddingRight = window.innerWidth >= 640 ? '80px' : '60px';
                }
              } else {
                target.style.textAlign = 'center';
                if (typeof window !== 'undefined') {
                  target.style.paddingTop = window.innerWidth >= 640 ? '1.75rem' : '1.25rem';
                  target.style.paddingLeft = window.innerWidth >= 640 ? '32px' : '20px';
                  target.style.paddingRight = window.innerWidth >= 640 ? '80px' : '60px';
                }
              }
            }}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              handleSearchBarClick();
              const target = e.target as HTMLTextAreaElement;
              if (!userRequest.trim() && typeof window !== 'undefined') {
                target.style.textAlign = 'left';
                target.style.paddingLeft = window.innerWidth >= 640 ? '16px' : '12px';
                target.style.paddingTop = window.innerWidth >= 640 ? '20px' : '16px';
                target.style.paddingRight = window.innerWidth >= 640 ? '80px' : '60px';
              }
            }}
            onFocus={(e) => {
              handleSearchBarClick();
              const target = e.target as HTMLTextAreaElement;
              if (!userRequest.trim() && typeof window !== 'undefined') {
                target.style.textAlign = 'left';
                target.style.paddingLeft = window.innerWidth >= 640 ? '16px' : '12px';
                target.style.paddingTop = window.innerWidth >= 640 ? '20px' : '16px';
                target.style.paddingRight = window.innerWidth >= 640 ? '80px' : '60px';
              }
            }}
            placeholder={currentPlaceholder}
            rows={1}
            className="search-input no-hover w-full pl-3 pr-14 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-lg hover:shadow-xl transition-all duration-200 group-hover:shadow-xl resize-none overflow-hidden min-h-[3.5rem] text-center leading-relaxed touch-manipulation break-words sm:pl-8 sm:pr-20 sm:py-6 sm:text-base sm:rounded-3xl sm:min-h-[5.5rem]"
            disabled={generateMutation.isPending}
            style={{
              height: 'auto',
              minHeight: typeof window !== 'undefined' ? (window.innerWidth >= 640 ? '5.5rem' : '3.5rem') : '3.5rem',
              paddingTop: typeof window !== 'undefined' ? (window.innerWidth >= 640 ? '1.75rem' : '1.25rem') : '1.25rem'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 150) + 'px';
            }}
          />
          
          {/* Indicador de carregamento à direita (sem seta) */}
          {generateMutation.isPending && (
            <div className="absolute inset-y-0 right-1 sm:right-4 flex items-center pr-2 sm:pr-4">
              <i className="ph ph-circle-notch animate-spin text-sm sm:text-base text-blue-600 dark:text-blue-400"></i>
            </div>
          )}
        </div>
      </form>

      {/* Compact suggestion tags */}
      <div className="mt-4 sm:mt-6">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setUserRequest(suggestion)}
                className="suggestion-tag group relative overflow-hidden px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-600/80 dark:text-gray-300/80 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-full border border-white/30 dark:border-gray-600/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                {/* Ultra light blue glass reflection sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out skew-x-12 rounded-full"></div>
                
                {/* Ultra light ambient glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-blue-50/30 to-cyan-50/35 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
                
                {/* Ultra light morphing background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-blue-100/25 to-blue-50/30 opacity-0 group-hover:opacity-60 transition-all duration-500 rounded-full blur-sm"></div>
                
                {/* Text content */}
                <span className="relative z-10">{suggestion}</span>
                
                {/* Liquid edge glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-sm scale-110"></div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {shouldShowTermsCard() && (
        <div className="mt-8 flex justify-center">
          <div className="relative max-w-md w-full mx-4">
            {/* Glass morphism background */}
            <div className="relative bg-white/10 dark:bg-gray-900/10 backdrop-blur-2xl border border-gray-300/40 dark:border-gray-600/40 rounded-3xl p-4 sm:p-6 shadow-xl">
              <div className="space-y-4">
                <div className="text-base font-semibold text-gray-800 dark:text-gray-100 text-center">
                  Estou de acordo:
                </div>
                
                <div className="space-y-4">
                  {/* First checkbox */}
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="no-sensitive-data"
                      checked={agreedToNoSensitiveData}
                      onCheckedChange={(checked) => handleNoSensitiveDataChange(!!checked)}
                      className="mt-1 flex-shrink-0"
                    />
                    <label 
                      htmlFor="no-sensitive-data"
                      className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer"
                    >
                      Não vou incluir dados sensíveis e estou de acordo com os prompts serem públicos no uso gratuito.
                    </label>
                  </div>
                  
                  {/* Second checkbox */}
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="terms-of-use"
                      checked={agreedToTermsOfUse}
                      onCheckedChange={(checked) => handleTermsOfUseChange(!!checked)}
                      className="mt-1 flex-shrink-0"
                    />
                    <label 
                      htmlFor="terms-of-use"
                      className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer"
                    >
                      Li, e aceito os{' '}
                      <a 
                        href="/termos" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                      >
                        termos de uso
                      </a>.
                    </label>
                  </div>
                  
                  {/* Agreement button */}
                  {agreedToNoSensitiveData && agreedToTermsOfUse && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => {
                          // Button just confirms the agreement is complete
                          toast({
                            title: "Acordo confirmado",
                            description: "Agora você pode gerar prompts jurídicos.",
                          });
                        }}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md"
                      >
                        De acordo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/3 to-green-500/3 blur-xl -z-10"></div>
          </div>
        </div>
      )}

      {/* Sensitive Data Alert Modal */}
      {sensitiveDataAlert.show && (
        <SensitiveDataAlert
          detectedTypes={sensitiveDataAlert.detectedTypes}
          onClose={() => setSensitiveDataAlert({ show: false, detectedTypes: [] })}
        />
      )}
    </div>
  );
}
