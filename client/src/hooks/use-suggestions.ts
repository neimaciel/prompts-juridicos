import { useQuery } from "@tanstack/react-query";

interface SuggestionsResponse {
  suggestions: string[];
}

/**
 * Hook para buscar sugestões dinâmicas de documentos
 */
export function useDynamicSuggestions() {
  return useQuery<SuggestionsResponse>({
    queryKey: ["/api/suggestions"],
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Sugestões padrão como fallback
 */
export const DEFAULT_SUGGESTIONS = [
  "Petição inicial",
  "Parecer jurídico", 
  "Notificação extrajudicial",
  "Contestação cível",
  "Acordo de confidencialidade",
  "Alegações finais"
];