import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";

interface GeneratingPromptCardProps {
  userRequest: string;
}

export function GeneratingPromptCard({ userRequest }: GeneratingPromptCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative"
    >
      <Card className="h-full transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <motion.div
                  className="absolute inset-0"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-4 h-4 text-blue-400 dark:text-blue-300" />
                </motion.div>
              </div>
              <Badge variant="outline" className="text-xs bg-blue-100/80 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Gerando...
              </Badge>
            </div>
          </div>
          
          {/* Skeleton for title */}
          <div className="space-y-2">
            <div className="h-6 bg-gradient-to-r from-blue-200/60 to-blue-300/60 dark:from-blue-800/40 dark:to-blue-700/40 rounded animate-pulse"></div>
            <div className="h-4 bg-gradient-to-r from-blue-200/40 to-blue-300/40 dark:from-blue-800/30 dark:to-blue-700/30 rounded w-3/4 animate-pulse"></div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Skeleton for generated content */}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="h-4 bg-gradient-to-r from-gray-200/60 to-gray-300/60 dark:from-gray-700/40 dark:to-gray-600/40 rounded animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200/60 to-gray-300/60 dark:from-gray-700/40 dark:to-gray-600/40 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200/60 to-gray-300/60 dark:from-gray-700/40 dark:to-gray-600/40 rounded w-4/5 animate-pulse"></div>
            </div>

            <div className="space-y-2">
              <div className="h-4 bg-gradient-to-r from-gray-200/60 to-gray-300/60 dark:from-gray-700/40 dark:to-gray-600/40 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200/60 to-gray-300/60 dark:from-gray-700/40 dark:to-gray-600/40 rounded w-3/4 animate-pulse"></div>
            </div>

            <div className="space-y-2">
              <div className="h-4 bg-gradient-to-r from-gray-200/60 to-gray-300/60 dark:from-gray-700/40 dark:to-gray-600/40 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200/60 to-gray-300/60 dark:from-gray-700/40 dark:to-gray-600/40 rounded w-2/3 animate-pulse"></div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-6 pt-4 border-t border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400">
              <span>Analisando solicitação...</span>
              <motion.div
                className="flex space-x-1"
                initial="start"
                animate="end"
                variants={{
                  start: { opacity: 0.3 },
                  end: { opacity: 1 }
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}