import type { LegalPrompt } from "@shared/schema";

export const demoPrompts: LegalPrompt[] = [
  {
    id: 1,
    userRequest: "Preciso de um contrato de trabalho para contratar um funcionário CLT",
    legalPrompt: "Elaborar um contrato de trabalho regido pela CLT (Consolidação das Leis do Trabalho) que deve incluir: identificação completa das partes (empregador e empregado), descrição detalhada da função e atribuições, jornada de trabalho conforme legislação brasileira, salário e benefícios, período de experiência conforme permitido por lei, cláusulas sobre férias, 13º salário e demais direitos trabalhistas, normas disciplinares e motivos para rescisão, observância às normas de segurança do trabalho e convenções coletivas aplicáveis. O documento deve estar em conformidade com a CLT, respeitando todos os direitos fundamentais do trabalhador garantidos pela Constituição Federal.",
    documentType: "Contrato de Trabalho CLT",
    areaTags: ["Direito Trabalhista", "Contratos", "CLT"],
    region: "Região Metropolitana de Curitiba",
    city: "Curitiba",
    aiModel: "claude",
    relevanceScore: 0.92,
    relevanceReasoning: "Excelente qualidade técnica com todas as cláusulas essenciais presentes. Compliance total com CLT e código civil brasileiro. Estrutura profissional adequada.",
    relevanceSuggestions: [
      "Incluir cláusula de rescisão antecipada com multa específica",
      "Adicionar seção sobre direitos do consumidor conforme CDC",
      "Especificar jurisdição competente para resolução de conflitos"
    ],
    createdAt: new Date("2024-06-01T21:20:00.000Z")
  },
  {
    id: 2,
    userRequest: "Notificação extrajudicial para cobrança de dívida em atraso",
    legalPrompt: "Redigir uma notificação extrajudicial de cobrança que contenha: identificação completa do credor e devedor, descrição detalhada da dívida (valor original, juros, correção monetária), fundamentação legal para a cobrança, prazo para pagamento voluntário, advertência sobre as consequências do não pagamento (protesto, negativação, execução judicial), referência aos artigos do Código Civil sobre mora e inadimplemento, observância à Lei 9.492/97 (Lei de Protesto) e ao CDC quando aplicável. A notificação deve ser clara, objetiva e em linguagem acessível, respeitando os direitos do consumidor quando for o caso.",
    documentType: "Notificação Extrajudicial de Cobrança",
    areaTags: ["Direito Civil", "Cobrança", "Processo Civil"],
    region: "Norte Central Paranaense",
    city: "Maringá",
    aiModel: "claude",
    relevanceScore: 0.88,
    relevanceReasoning: "Boa estrutura documental seguindo legislação civil. Inclui fundamentação legal adequada, mas poderia detalhar melhor os procedimentos de cobrança.",
    relevanceSuggestions: [
      "Incluir referência específica aos artigos 394-401 do Código Civil sobre mora",
      "Adicionar cláusula sobre honorários advocatícios conforme CPC art. 85",
      "Especificar prazo mínimo de 15 dias para pagamento voluntário"
    ],
    createdAt: new Date("2024-06-01T21:15:00.000Z")
  },
  {
    id: 3,
    userRequest: "Acordo de confidencialidade para parceria empresarial",
    legalPrompt: "Elaborar um acordo de confidencialidade (NDA) empresarial que estabeleça: definição clara de informações confidenciais, obrigações das partes quanto ao sigilo, exceções ao dever de confidencialidade, prazo de vigência do acordo, consequências pelo descumprimento (multa, perdas e danos), cláusula de devolução ou destruição de materiais confidenciais, foro competente para dirimir conflitos, observância à LGPD quando envolver dados pessoais. O documento deve proteger adequadamente os interesses comerciais das partes e estar alinhado com as práticas empresariais brasileiras e legislação aplicável.",
    documentType: "Acordo de Confidencialidade (NDA)",
    areaTags: ["Direito Empresarial", "Contratos", "Propriedade Intelectual"],
    region: "Oeste Paranaense",
    city: "Cascavel",
    aiModel: "openai",
    relevanceScore: 0.85,
    relevanceReasoning: "Adequada para uso empresarial com proteção básica de informações. Faltam algumas cláusulas de segurança LGPD mais específicas para dados pessoais.",
    relevanceSuggestions: [
      "Adicionar cláusulas específicas sobre tratamento de dados pessoais conforme LGPD",
      "Incluir seção sobre penalidades por violação de confidencialidade",
      "Especificar procedimentos de devolução/destruição de materiais confidenciais"
    ],
    createdAt: new Date("2024-06-01T21:10:00.000Z")
  }
];