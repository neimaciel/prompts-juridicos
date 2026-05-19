import { AlertTriangle, Shield, CheckCircle, Lightbulb } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SensitiveDataAlertProps {
  detectedTypes: string[];
  onClose?: () => void;
}

export default function SensitiveDataAlert({ detectedTypes, onClose }: SensitiveDataAlertProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Dados Sensíveis Detectados
            </h2>
            <button 
              onClick={onClose}
              className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Alert Message */}
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              Por motivos de segurança e proteção de dados pessoais (LGPD), não é possível gerar 
              prompts contendo: <strong>{detectedTypes.join(", ")}</strong>.
            </AlertDescription>
          </Alert>

          {/* How to Fix Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Como Corrigir:</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Use dados genéricos em colchetes:
            </p>
            <div className="space-y-2 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-red-600 dark:text-red-400">"João da Silva Santos"</span>
                  <span className="text-gray-500 mx-2">→</span>
                  <span className="text-green-600 dark:text-green-400">"[nome completo]"</span>
                </div>
                <div>
                  <span className="text-red-600 dark:text-red-400">"123.456.789-00"</span>
                  <span className="text-gray-500 mx-2">→</span>
                  <span className="text-green-600 dark:text-green-400">"[CPF]"</span>
                </div>
                <div>
                  <span className="text-red-600 dark:text-red-400">"12.345.678/0001-90"</span>
                  <span className="text-gray-500 mx-2">→</span>
                  <span className="text-green-600 dark:text-green-400">"[CNPJ]"</span>
                </div>
                <div>
                  <span className="text-red-600 dark:text-red-400">"Rua das Flores, 123"</span>
                  <span className="text-gray-500 mx-2">→</span>
                  <span className="text-green-600 dark:text-green-400">"[endereço]"</span>
                </div>
                <div>
                  <span className="text-red-600 dark:text-red-400">"(11) 99999-9999"</span>
                  <span className="text-gray-500 mx-2">→</span>
                  <span className="text-green-600 dark:text-green-400">"[telefone]"</span>
                </div>
                <div>
                  <span className="text-red-600 dark:text-red-400">"R$ 5.000,00"</span>
                  <span className="text-gray-500 mx-2">→</span>
                  <span className="text-green-600 dark:text-green-400">"[valor]"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Example Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Exemplo Correto:</h3>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
              <p className="text-green-800 dark:text-green-200 italic">
                "Contrato de locação entre [nome do locador] e [nome do locatário] para imóvel 
                localizado em [endereço], com valor mensal de [valor do aluguel]"
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              O prompt gerado será estruturado para personalização posterior com dados reais.
            </p>
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}