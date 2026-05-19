import { storage } from "./storage";

/**
 * Atualiza as sugestões de documentos com base nos tipos mais criados
 * Esta função deve ser executada semanalmente
 */
export async function updateWeeklySuggestions(): Promise<string[]> {
  try {
    // Busca todos os prompts para análise
    const allPrompts = await storage.getAllLegalPrompts();
    
    // Filtra prompts dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentPrompts = allPrompts.filter(prompt => 
      new Date(prompt.createdAt) >= thirtyDaysAgo
    );

    // Conta frequência de cada tipo de documento
    const documentTypeCount: Record<string, number> = {};
    
    recentPrompts.forEach(prompt => {
      const docType = prompt.documentType;
      documentTypeCount[docType] = (documentTypeCount[docType] || 0) + 1;
    });

    // Ordena por frequência e pega os top 6
    const sortedTypes = Object.entries(documentTypeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([docType]) => docType);

    // Se não houver dados suficientes, usar sugestões padrão
    if (sortedTypes.length < 6) {
      return [
        "Petição inicial",
        "Parecer jurídico", 
        "Notificação extrajudicial",
        "Contestação cível",
        "Acordo de confidencialidade",
        "Alegações finais"
      ];
    }
    
    console.log(`✅ Sugestões atualizadas com base nos dados dos últimos 30 dias:`, sortedTypes);
    
    return sortedTypes;
  } catch (error) {
    console.error('❌ Erro ao atualizar sugestões:', error);
    
    // Retornar sugestões padrão em caso de erro
    return [
      "Petição inicial",
      "Parecer jurídico", 
      "Notificação extrajudicial",
      "Contestação cível",
      "Acordo de confidencialidade",
      "Alegações finais"
    ];
  }
}

/**
 * Normaliza nomes de documentos para exibição
 */
function normalizeDocumentName(name: string): string {
  // Converter para lowercase e capitalizar primeira letra
  return name.toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

/**
 * Agenda a atualização automática das sugestões
 * Executa toda segunda-feira às 00:00
 */
export function scheduleWeeklySuggestionUpdate() {
  const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000; // 1 semana em millisegundos
  
  // Calcular próxima segunda-feira
  const now = new Date();
  const nextMonday = new Date();
  const daysUntilMonday = (1 + 7 - now.getDay()) % 7;
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  
  const timeUntilNextMonday = nextMonday.getTime() - now.getTime();
  
  // Agendar primeira execução
  setTimeout(() => {
    updateWeeklySuggestions();
    
    // Agendar execuções semanais subsequentes
    setInterval(() => {
      updateWeeklySuggestions();
    }, WEEK_IN_MS);
    
  }, timeUntilNextMonday);
  
  console.log(`📅 Atualização automática de sugestões agendada para: ${nextMonday.toLocaleDateString('pt-BR')} às 00:00`);
}

/**
 * Cache das sugestões atuais
 */
let cachedSuggestions: string[] = [
  "Petição inicial",
  "Parecer jurídico", 
  "Notificação extrajudicial",
  "Contestação cível",
  "Acordo de confidencialidade",
  "Alegações finais"
];

/**
 * Obtém as sugestões atuais (com cache)
 */
export function getCurrentSuggestions(): string[] {
  return cachedSuggestions;
}

/**
 * Atualiza o cache de sugestões
 */
export function updateSuggestionsCache(newSuggestions: string[]) {
  cachedSuggestions = newSuggestions;
}

/**
 * Força uma atualização manual das sugestões
 */
export async function forceUpdateSuggestions(): Promise<string[]> {
  const newSuggestions = await updateWeeklySuggestions();
  updateSuggestionsCache(newSuggestions);
  return newSuggestions;
}