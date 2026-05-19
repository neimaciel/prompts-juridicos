import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingContractButton() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleContractAnalysis = () => {
    // Navigate to contract analysis system at /contratos
    window.location.href = '/contratos';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 bg-white rounded-lg shadow-lg border p-4 w-80"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Análise de Contratos</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Sistema avançado de análise de contratos com IA, detecção de dados sensíveis e criptografia AES-256-GCM.
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                <span>Análise com múltiplas IAs</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                <span>Criptografia de dados sensíveis</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
                <span>Sistema de tokens flexível</span>
              </div>
            </div>
            
            <Button 
              onClick={handleContractAnalysis}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Acessar Sistema
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          size="lg"
          className={`rounded-full h-14 w-14 shadow-lg transition-colors duration-200 ${
            isExpanded
              ? 'bg-gray-600 hover:bg-gray-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="x"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="file"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FileText className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </div>
  );
}