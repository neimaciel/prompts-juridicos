import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, TrendingUp, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ScoringDetailsModal from "./scoring-details-modal";

interface UpdateNotificationProps {
  onViewDetails?: () => void;
}

export default function UpdateNotification({ onViewDetails }: UpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    // Check if the notification should be shown
    const notificationDate = new Date('2025-06-21'); // Data da atualização (hoje)
    const now = new Date();
    const tenDaysLater = new Date(notificationDate.getTime() + (10 * 24 * 60 * 60 * 1000));

    // Show if within 10 days and not dismissed for this version
    const isWithinPeriod = now >= notificationDate && now <= tenDaysLater;
    const currentVersion = '2025.06.21.v1'; // Version identifier (updated to force show)
    const dismissedVersion = localStorage.getItem('updateNotification_version');
    
    console.log('Update notification check:', {
      isWithinPeriod,
      currentVersion,
      dismissedVersion,
      now: now.toISOString(),
      notificationDate: notificationDate.toISOString(),
      tenDaysLater: tenDaysLater.toISOString()
    });
    
    if (isWithinPeriod && dismissedVersion !== currentVersion) {
      setShouldShow(true);
      console.log('Setting shouldShow to true');
      // Show after 3 seconds of page load
      const timer = setTimeout(() => {
        console.log('Showing update notification');
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      console.log('Not showing notification:', { isWithinPeriod, dismissedVersion, currentVersion });
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('updateNotification_dismissed', new Date().toISOString());
    localStorage.setItem('updateNotification_version', '2025.06.21.v1');
    console.log('Update notification dismissed');
  };

  const handleViewDetails = () => {
    setShowDetailsModal(true);
    setIsVisible(false); // Hide the notification popup
    if (onViewDetails) {
      onViewDetails();
    }
  };

  if (!shouldShow) {
    console.log('UpdateNotification: shouldShow is false, not rendering');
    return null;
  }

  console.log('UpdateNotification: shouldShow is true, isVisible:', isVisible);

  return (
    <>
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[9999] max-w-sm"
          style={{ zIndex: 9999 }}
        >
          <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-green-500/10 animate-pulse"></div>
                
                {/* Header with sparkles */}
                <div className="relative p-4 border-b border-blue-200/30 dark:border-blue-700/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          Nova Atualização!
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Sistema aprimorado
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDismiss}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="relative p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          Pontuação Mais Rigorosa
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Escala de avaliação criteriosa que reflete a qualidade real dos prompts jurídicos.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          Análise Detalhada
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Feedback específico e orientações práticas para melhorias.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          Proteção LGPD
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Sistema robusto de proteção de dados mantido.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={handleViewDetails}
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white text-xs"
                    >
                      Ver Detalhes
                    </Button>
                    <Button
                      onClick={handleDismiss}
                      variant="outline"
                      size="sm"
                      className="text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Dispensar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
    
    {/* Details Modal */}
    <ScoringDetailsModal 
      isOpen={showDetailsModal} 
      onClose={() => setShowDetailsModal(false)} 
    />
    </>
  );
}