import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { LegalPrompt } from "@shared/schema";

interface RelevanceIndicatorProps {
  score: number | null;
  reasoning?: string | null;
  suggestions?: string[] | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  prompt?: LegalPrompt; // Added for quality improvement modal
}

export default function RelevanceIndicator({ 
  score, 
  reasoning,
  suggestions,
  size = "md", 
  showLabel = true,
  prompt
}: RelevanceIndicatorProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  if (!score) return null;

  const getRelevanceLabel = (score: number): string => {
    if (score >= 0.95) return 'Qualidade Jurídica Excepcional';
    if (score >= 0.85) return 'Qualidade Jurídica Excelente';
    if (score >= 0.70) return 'Qualidade Jurídica Boa';
    if (score >= 0.55) return 'Qualidade Jurídica Regular';
    if (score >= 0.40) return 'Qualidade Jurídica Inadequada';
    return 'Qualidade Jurídica Insuficiente';
  };

  const getRelevanceColor = (score: number): string => {
    if (score >= 0.85) return 'text-green-600 dark:text-green-400';
    if (score >= 0.70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 0.55) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 0.40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (score: number): string => {
    if (score >= 0.85) return 'bg-green-500';
    if (score >= 0.70) return 'bg-blue-500';
    if (score >= 0.55) return 'bg-yellow-500';
    if (score >= 0.40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getIconSize = () => {
    switch (size) {
      case "sm": return "w-3 h-3";
      case "lg": return "w-6 h-6";
      default: return "w-4 h-4";
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm": return "text-xs";
      case "lg": return "text-base";
      default: return "text-sm";
    }
  };

  const percentage = Math.round(score * 100);
  const circumference = 2 * Math.PI * 16; // radius of 16
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score * circumference);

  const analysisContent = (
    <div className="space-y-3">
      {/* Header with heat map indicator */}
      <div className="flex items-center gap-2">
        <div className="font-semibold text-gray-900 dark:text-gray-100">
          Análise de Qualidade Jurídica - {percentage}%
        </div>
        {/* Heat map visual indicator */}
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => {
            const threshold = (i + 1) * 20;
            const isActive = (score * 100) >= threshold;
            let barColor = 'bg-gray-300 dark:bg-gray-600';
            
            if (isActive) {
              if (threshold <= 20) barColor = 'bg-red-500';
              else if (threshold <= 40) barColor = 'bg-red-400';
              else if (threshold <= 60) barColor = 'bg-orange-500';
              else if (threshold <= 80) barColor = 'bg-yellow-500';
              else barColor = 'bg-green-500';
            }
            
            return (
              <div
                key={i}
                className={`w-2 h-4 mx-0.5 rounded-sm ${barColor}`}
              />
            );
          })}
        </div>
      </div>
      
      {/* Analysis content with better separation */}
      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border-l-4 border-blue-500">
        <div 
          className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3"
          dangerouslySetInnerHTML={{ __html: reasoning || '' }}
        />
      </div>
      
      {/* Improvement suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-600">
          <div className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm">
            💡 Sugestões de Melhoria:
          </div>
          <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-1">
                <span className="w-1 h-1 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Educational content */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-2">
          📚 O que constitui um bom prompt jurídico:
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>• <strong>Terminologia precisa:</strong> Uso correto de termos jurídicos brasileiros</div>
          <div>• <strong>Estrutura completa:</strong> Cláusulas essenciais e organização lógica</div>
          <div>• <strong>Conformidade legal:</strong> Adequação à legislação vigente</div>
          <div>• <strong>Proteção jurídica:</strong> Salvaguardas efetivas para as partes</div>
          <div>• <strong>Aplicabilidade prática:</strong> Viabilidade de uso real</div>
        </div>
      </div>
    </div>
  );

  const relevanceIndicator = (
    <div className="flex items-center gap-2 cursor-pointer">
      {/* Circular Progress Indicator */}
      <div className="relative">
        <svg 
          className={`${getIconSize()} transform -rotate-90`}
          viewBox="0 0 36 36"
        >
          {/* Background circle */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className="stroke-gray-200 dark:stroke-gray-700"
            strokeWidth="3"
          />
          {/* Progress circle */}
          <motion.circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className={getProgressColor(score)}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeInOut" }}
            style={{
              strokeDasharray,
              stroke: score >= 0.85 ? '#10b981' : score >= 0.70 ? '#3b82f6' : score >= 0.55 ? '#f59e0b' : score >= 0.40 ? '#f97316' : '#ef4444'
            }}
          />
        </svg>
        
        {/* Score percentage in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${getTextSize()} font-bold ${getRelevanceColor(score)}`}>
            {percentage}
          </span>
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex flex-col">
          <span className={`${getTextSize()} font-medium ${getRelevanceColor(score)}`}>
            {getRelevanceLabel(score)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Análise Técnica
          </span>
        </div>
      )}
    </div>
  );

  // If prompt is available, return just the indicator (modal is handled by parent component)
  if (prompt) {
    return relevanceIndicator;
  }

  // If reasoning is available but no prompt, show simple dialog
  if (reasoning) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer">
            {relevanceIndicator}
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl mx-auto max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <span className="text-xs font-bold text-green-600 dark:text-green-400">
                  {percentage}
                </span>
              </div>
              Análise de Qualidade Jurídica
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh] pr-2">
            {analysisContent}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return relevanceIndicator;
}