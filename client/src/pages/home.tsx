import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SearchForm from "@/components/search-form";
import PromptCard from "@/components/prompt-card";
import { GeneratingPromptCard } from "@/components/generating-prompt-card";
import OrganicAIElement from "@/components/organic-ai-element";
import { useInfinitePrompts } from "@/hooks/use-infinite-prompts";
import { useSEO, seoConfigs } from "@/hooks/use-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { FAQSchema, legalFAQs } from "@/components/faq-schema";

export default function Home() {
  // SEO Configuration
  useSEO(seoConfigs.home);

  // State for generating prompt card
  const [generatingRequest, setGeneratingRequest] = useState<string | null>(null);

  const {
    prompts,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    searchTerm,
    setSearchTerm,
    selectedTags,
    setSelectedTags,
  } = useInfinitePrompts();



  // Get all unique tags from prompts for dynamic filtering
  const allTags = prompts ? 
    prompts.reduce((acc: string[], prompt) => {
      prompt.areaTags.forEach(tag => {
        if (!acc.includes(tag)) acc.push(tag);
      });
      return acc;
    }, []) : [];

  const filteredPrompts = prompts;

  // Handle tag selection with multiple options
  const handleTagToggle = (tag: string) => {
    if (tag === "Todos") {
      setSelectedTags(["Todos"]);
    } else {
      const newSelectedTags = selectedTags.filter(t => t !== "Todos");
      if (selectedTags.includes(tag)) {
        const updated = newSelectedTags.filter(t => t !== tag);
        setSelectedTags(updated.length === 0 ? ["Todos"] : updated);
      } else {
        setSelectedTags([...newSelectedTags, tag]);
      }
    }
  };

  // Dynamic filter options based on actual tags in prompts
  const filterOptions = ["Todos", ...allTags.slice(0, 8)]; // Limit to 8 most common tags



  // Função para obter cor da tag baseada na área jurídica
  const getTagColor = (tag: string): string => {
    const lowerTag = tag.toLowerCase();
    
    // Direito Civil e áreas relacionadas
    if (lowerTag.includes('civil') || lowerTag.includes('família') || lowerTag.includes('sucessões')) {
      return "bg-blue-500 text-white";
    }
    
    // Direito Processual
    if (lowerTag.includes('processual') || lowerTag.includes('processo')) {
      return "bg-indigo-500 text-white";
    }
    
    // Direito Trabalhista
    if (lowerTag.includes('trabalhista') || lowerTag.includes('trabalho') || lowerTag.includes('clt')) {
      return "bg-green-500 text-white";
    }
    
    // Direito Penal/Criminal
    if (lowerTag.includes('penal') || lowerTag.includes('criminal')) {
      return "bg-red-500 text-white";
    }
    
    // Direito Empresarial/Comercial
    if (lowerTag.includes('empresarial') || lowerTag.includes('comercial') || lowerTag.includes('societário')) {
      return "bg-purple-500 text-white";
    }
    
    // Direito Constitucional/Administrativo
    if (lowerTag.includes('constitucional') || lowerTag.includes('administrativo')) {
      return "bg-amber-500 text-white";
    }
    
    // Direito do Consumidor
    if (lowerTag.includes('consumidor') || lowerTag.includes('cdc')) {
      return "bg-cyan-500 text-white";
    }
    
    // Contratos
    if (lowerTag.includes('contrato') || lowerTag.includes('acordo')) {
      return "bg-slate-500 text-white";
    }
    
    // Petições
    if (lowerTag.includes('petição') || lowerTag.includes('inicial')) {
      return "bg-orange-500 text-white";
    }
    
    // Pareceres
    if (lowerTag.includes('parecer') || lowerTag.includes('consultoria')) {
      return "bg-teal-500 text-white";
    }
    
    // Propriedade/Imóveis
    if (lowerTag.includes('propriedade') || lowerTag.includes('imóvel') || lowerTag.includes('registral')) {
      return "bg-emerald-500 text-white";
    }
    
    // Notarial
    if (lowerTag.includes('notarial') || lowerTag.includes('cartório')) {
      return "bg-violet-500 text-white";
    }
    
    // Cobrança
    if (lowerTag.includes('cobrança') || lowerTag.includes('execução')) {
      return "bg-rose-500 text-white";
    }
    
    // Cor padrão para outras tags
    return "bg-gray-500 text-white";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-800 pt-8 pb-4 sm:pt-12 sm:pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto" data-tour="new-prompt-button">
            <SearchForm onGeneratingChange={setGeneratingRequest} />
          </div>
        </div>
      </section>

      {/* Prompts Section */}
<section className="py-4 pb-32 sm:py-6 sm:pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {prompts && prompts.length > 0 && (
            <>
              {/* Header with search and filters */}
              <div className="mb-4">
                {/* Search Bar */}
                <div className="text-center mb-4">
                  <div className="max-w-md mx-auto px-1 sm:px-0">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar prompts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Search className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Filter tags */}
                <div className="flex gap-1 sm:gap-2 flex-wrap justify-center mb-6 px-1 sm:px-0">
                  {filterOptions.map((option) => (
                    <motion.button
                      key={option}
                      onClick={() => handleTagToggle(option)}
                      className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border ${
                        selectedTags.includes(option)
                          ? option === "Todos" 
                            ? "bg-blue-500 text-white shadow-lg border-blue-600 dark:border-blue-400"
                            : `${getTagColor(option)} shadow-lg border-opacity-80`
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Prompts Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 px-2 sm:px-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-32 w-full mb-4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <i className="ph ph-file-text text-gray-400 dark:text-gray-500 text-2xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum prompt encontrado
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedTags.includes("Todos") 
                  ? "Seja o primeiro a gerar um prompt jurídico!"
                  : `Nenhum prompt encontrado para os filtros selecionados.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 px-2 sm:px-0">
              {/* Generating prompt card */}
              {generatingRequest && (
                <GeneratingPromptCard 
                  key="generating" 
                  userRequest={generatingRequest} 
                />
              )}
              
              {/* Regular prompt cards */}
              {filteredPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          )}

          {/* Loading indicator for infinite scroll */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600 dark:text-gray-400">Carregando mais prompts...</span>
              </div>
            </div>
          )}

          {/* End of results indicator */}
          {!hasNextPage && filteredPrompts.length > 0 && (
            <div className="text-center py-8 pb-16 sm:pb-8">
              <p className="text-gray-500 dark:text-gray-400">
                Todos os prompts foram carregados
              </p>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section para Voice Search e SEO */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FAQSchema faqs={legalFAQs.slice(0, 6)} />
        </div>
      </section>

      <Footer />
      

    </div>
  );
}
