import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Download, FileText, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "./auth/auth-modal";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import type { LegalPrompt, TOKEN_COSTS } from "@shared/schema";

interface SimplePromptViewerProps {
  prompt: LegalPrompt;
  isOpen: boolean;
  onClose: () => void;
}

export default function SimplePromptViewer({ prompt, isOpen, onClose }: SimplePromptViewerProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, tokens } = useAuth();

  // Fetch the latest version of the prompt
  const { data: latestPrompt } = useQuery<LegalPrompt>({
    queryKey: [`/api/prompts/${prompt.id}/latest`],
    enabled: isOpen && !!prompt.id,
  });

  // Use the latest prompt if available, otherwise fallback to the original
  const displayPrompt = latestPrompt || prompt;

  const handleCopy = async () => {
    if (isCopying) return;
    
    setIsCopying(true);
    
    try {
      await navigator.clipboard.writeText(displayPrompt.legalPrompt);
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

  const handleExport = async (format: string) => {
    // Check authentication first
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Check token balance
    if (!tokens || tokens.currentBalance < 5) { // TOKEN_COSTS.DOCUMENT_EXPORT = 5
      toast({
        title: "Tokens insuficientes",
        description: "Você precisa de pelo menos 5 tokens para exportar documentos. Faça upgrade do seu plano.",
        variant: "destructive",
      });
      return;
    }

    setExportingFormat(format);

    try {
      const response = await fetch(`/api/prompts/${prompt.id}/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      // Get the filename from the response headers or create a default one
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `documento-juridico-${prompt.id}.${format}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Documento exportado!",
        description: `Documento salvo como ${filename}. 5 tokens foram consumidos.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setExportingFormat(null);
    }
  };

  const canExport = isAuthenticated && tokens && tokens.currentBalance >= 5;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {prompt.documentType}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Visualização do prompt gerado
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Auth Status Indicator */}
              {isAuthenticated && tokens && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {tokens.currentBalance} tokens
                  </span>
                </div>
              )}

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('pdf')}
                  disabled={exportingFormat === 'pdf'}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {exportingFormat === 'pdf' ? 'Gerando...' : 'PDF'}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('docx')}
                  disabled={exportingFormat === 'docx'}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {exportingFormat === 'docx' ? 'Gerando...' : 'DOC'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('txt')}
                  disabled={exportingFormat === 'txt'}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {exportingFormat === 'txt' ? 'Gerando...' : 'TXT'}
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isCopying
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                }`}
              >
                {isCopying ? (
                  <Check className="w-4 h-4 mr-2 inline" />
                ) : (
                  <Copy className="w-4 h-4 mr-2 inline" />
                )}
                {isCopying ? "Copiado!" : "Copiar"}
              </button>

              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
              <div className="font-mono text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                {displayPrompt.legalPrompt}
              </div>
            </div>
            
            {/* Request Info */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Solicitação Original:
              </h4>
              <p className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                "{prompt.userRequest}"
              </p>
            </div>

            {/* Export Information */}
            {!isAuthenticated && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportação de Documentos
                </h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  🔐 <strong>Faça login para exportar documentos em PDF, DOC e TXT</strong><br />
                  ✅ Registre-se gratuitamente e ganhe 10 tokens<br />
                  💾 Cada exportação custa apenas 5 tokens<br />
                  📄 Mantenha um histórico dos seus documentos gerados
                </p>
              </div>
            )}

            {isAuthenticated && !canExport && (
              <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-400">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Tokens Insuficientes
                </h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  🪙 Você tem apenas {tokens?.currentBalance || 0} tokens disponíveis<br />
                  💰 Para exportar documentos, você precisa de 5 tokens<br />
                  🚀 Faça upgrade do seu plano para receber mais tokens
                </p>
              </div>
            )}

            {/* Ethical Disclaimer */}
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-400">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                ⚖️ Aviso Legal Importante
              </h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                <strong>Este conteúdo requer revisão profissional.</strong> O sistema nunca inventa jurisprudência ou leis. 
                Todos os documentos gerados devem ser revisados por um advogado qualificado antes do uso. 
                A plataforma não se responsabiliza pela aplicação prática dos conteúdos gerados.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="register"
      />
    </AnimatePresence>
  );
}