import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RatingPopupProps {
  isOpen: boolean;
  visitNumber: number;
  onClose: () => void;
  onSubmit: (rating: string, feedback?: string) => void;
}

const RATING_OPTIONS = [
  { value: 'very_bad', emoji: '😔', label: 'Muito Ruim' },
  { value: 'bad', emoji: '🙁', label: 'Ruim' },
  { value: 'neutral', emoji: '😐', label: 'Regular' },
  { value: 'good', emoji: '🙂', label: 'Bom' },
  { value: 'very_good', emoji: '😍', label: 'Excelente' }
];

export default function RatingPopup({ isOpen, visitNumber, onClose, onSubmit }: RatingPopupProps) {
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!selectedRating) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(selectedRating, feedback.trim() || undefined);
      onClose();
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (visitNumber === 2) {
      return 'Como está sendo sua experiência? 🤔';
    } else if (visitNumber === 10) {
      return 'Parabéns! Esta é sua 10ª visita! 🎉';
    }
    return 'Como você avalia nossa plataforma?';
  };

  const getSubtitle = () => {
    if (visitNumber === 2) {
      return 'Queremos saber como podemos melhorar para você';
    } else if (visitNumber === 10) {
      return 'Sua opinião é muito importante para nós';
    }
    return 'Sua avaliação nos ajuda a melhorar';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {getTitle()}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getSubtitle()}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Rating Selection */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Como você avalia sua experiência?
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {RATING_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedRating(option.value)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                        selectedRating === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                      }`}
                    >
                      <span className="text-2xl mb-1">{option.emoji}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Feedback */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comentário (opcional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Conte-nos mais sobre sua experiência..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {feedback.length}/500 caracteres
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Agora não
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedRating || isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send size={16} />
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}