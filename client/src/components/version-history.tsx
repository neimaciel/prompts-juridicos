import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Copy, Eye, Clock, GitBranch, Calendar, Lightbulb, Plus, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PromptIteration } from '@shared/schema';

interface VersionHistoryProps {
  promptId: number;
}

interface VersionHistoryResponse {
  versions: PromptIteration[];
}

export default function VersionHistory({ promptId }: VersionHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // Show 3 versions per page
  const { toast } = useToast();

  const { data: versionsData, isLoading } = useQuery<VersionHistoryResponse>({
    queryKey: [`/api/prompts/${promptId}/versions`],
    enabled: !!promptId,
  });

  const versions = versionsData?.versions || [];
  
  // Find the latest version number to determine which is current
  const latestVersionNumber = Math.max(...versions.map(v => v.iterationNumber));
  
  // Pagination calculations
  const totalPages = Math.ceil(versions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVersions = versions.slice(startIndex, endIndex);
  
  // Reset page if it exceeds available pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);
  
  // Function to get version colors based on position relative to latest
  const getVersionColors = (versionNumber: number) => {
    if (versionNumber === latestVersionNumber) {
      // Current version - green
      return {
        bg: 'bg-green-100 dark:bg-green-900/50',
        text: 'text-green-600 dark:text-green-400'
      };
    } else if (versionNumber === 0) {
      // Original version - lightest gray
      return {
        bg: 'bg-gray-100 dark:bg-gray-800/50',
        text: 'text-gray-400 dark:text-gray-500'
      };
    } else {
      // Intermediate versions - graduated gray
      // More recent versions get darker gray, closer to current
      const progress = versionNumber / latestVersionNumber;
      
      if (progress > 0.7) {
        // Recent versions (70-100%) - darker gray
        return {
          bg: 'bg-gray-300 dark:bg-gray-600/50',
          text: 'text-gray-700 dark:text-gray-300'
        };
      } else if (progress > 0.4) {
        // Middle versions (40-70%) - medium gray
        return {
          bg: 'bg-gray-200 dark:bg-gray-700/50',
          text: 'text-gray-600 dark:text-gray-400'
        };
      } else {
        // Older versions (0-40%) - lighter gray similar to original
        return {
          bg: 'bg-gray-100 dark:bg-gray-800/50',
          text: 'text-gray-500 dark:text-gray-500'
        };
      }
    }
  };

  const handleCopyVersion = async (content: string, versionNumber: number) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Versão copiada!",
        description: `Versão ${versionNumber} copiada para a área de transferência.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a versão.",
        variant: "destructive",
      });
    }
  };

  const handleToggleExpand = (versionId: number) => {
    setExpandedVersion(expandedVersion === versionId ? null : versionId);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
            <GitBranch className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Histórico de Versões
          </h3>
        </div>
        <p className="text-amber-800 dark:text-amber-200 text-sm">
          Este prompt ainda não possui versões anteriores. Quando você aplicar melhorias, as versões serão salvas aqui para consulta futura.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
          <GitBranch className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Histórico de Versões
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {versions.length} vers{versions.length > 1 ? 'ões' : 'ão'} anterior{versions.length > 1 ? 'es' : ''} disponíve{versions.length > 1 ? 'is' : 'l'}
          </p>
        </div>
      </div>

      {/* User Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-700">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm mb-1">
              Como usar o histórico:
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Clique no ícone do olho para visualizar o conteúdo completo</li>
              <li>• Use o botão de copiar para transferir a versão para sua área de trabalho</li>
              <li>• Compare diferentes versões para entender a evolução do documento</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {paginatedVersions.map((version) => (
          <div
            key={version.id}
            className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getVersionColors(version.iterationNumber).bg}`}>
                    <span className={`text-sm font-semibold ${getVersionColors(version.iterationNumber).text}`}>
                      v{version.iterationNumber}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {version.createdAt ? new Date(version.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Data indisponível'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <Clock className="w-3 h-3" />
                      {version.createdAt ? formatDistanceToNow(new Date(version.createdAt), { 
                        addSuffix: true, 
                        locale: ptBR 
                      }) : 'Tempo indisponível'}
                      {version.iterationNumber === 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                          original
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleExpand(version.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="Visualizar conteúdo"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCopyVersion(version.legalPrompt, version.iterationNumber)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  title="Copiar versão"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Version Metadata */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                version.relevanceScore && version.relevanceScore > 0.7
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                Pontuação: {Math.round((version.relevanceScore || 0) * 100)}%
              </span>
            </div>

            {/* Expanded Content */}
            {expandedVersion === version.id && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  Conteúdo da Versão {version.iterationNumber}:
                </h5>
                <div className="max-h-64 overflow-y-auto">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {version.legalPrompt}
                  </p>
                </div>
                
                {/* Selected Improvements */}
                {version.selectedImprovements && Array.isArray(version.selectedImprovements) && version.selectedImprovements.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                        Melhorias Aplicadas
                      </h6>
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs px-2 py-0.5 rounded-full">
                        {version.selectedImprovements.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {version.selectedImprovements.map((improvement: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <CheckCircle2 className="flex-shrink-0 w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                          <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
                            {typeof improvement === 'string' ? improvement : String(improvement)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Additions */}
                {version.customAdditions && version.customAdditions.trim() && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2 mb-3">
                      <Plus className="w-4 h-4 text-blue-500" />
                      <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                        Adições Personalizadas
                      </h6>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                      <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                        {version.customAdditions}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Página {currentPage} de {totalPages} ({versions.length} versões no total)
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}