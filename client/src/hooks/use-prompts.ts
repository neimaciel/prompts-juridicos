import { useQuery } from "@tanstack/react-query";
import type { LegalPrompt } from "@shared/schema";

export function usePrompts() {
  return useQuery<LegalPrompt[]>({
    queryKey: ["/api/prompts"],
    queryFn: async () => {
      const response = await fetch("/api/prompts");
      if (!response.ok) throw new Error('Falha ao carregar prompts');
      const data = await response.json();
      return data.prompts || data;
    },
  });
}

export function usePrompt(id: number) {
  return useQuery<LegalPrompt>({
    queryKey: [`/api/prompts/${id}`],
    enabled: !!id,
  });
}
