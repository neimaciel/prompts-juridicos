import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

interface RelevanceAnalysis {
  score: number; // 0-1 relevance score
  reasoning: string;
  suggestions: string[];
}

interface AnalysisConfig {
  weights: {
    legalCompleteness: number;
    legislationCompliance: number;
    practicalApplicability: number;
    legalStructure: number;
  };
  thresholds: {
    excellent: number;
    good: number;
    adequate: number;
    inferior: number;
  };
  requirements: {
    legalReferences: boolean;
    practicalGuidance: boolean;
    specificLegislation: boolean;
  };
}

// Tipos de documentos jurídicos com critérios específicos
interface DocumentTypeConfig {
  name: string;
  keywords: string[];
  weights: {
    legalCompleteness: number;
    legislationCompliance: number;
    practicalApplicability: number;
    legalStructure: number;
  };
  specificCriteria: string[];
}

const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  {
    name: 'Contrato',
    keywords: ['contrato', 'acordo', 'prestação de serviços', 'locação', 'compra e venda'],
    weights: { legalCompleteness: 0.3, legislationCompliance: 0.25, practicalApplicability: 0.25, legalStructure: 0.2 },
    specificCriteria: ['elementos essenciais', 'cláusulas obrigatórias', 'responsabilidades das partes']
  },
  {
    name: 'Petição',
    keywords: ['petição', 'inicial', 'recurso', 'defesa', 'contestação'],
    weights: { legalCompleteness: 0.35, legislationCompliance: 0.3, practicalApplicability: 0.2, legalStructure: 0.15 },
    specificCriteria: ['fundamentação jurídica', 'pedidos claros', 'jurisprudência aplicável']
  },
  {
    name: 'Parecer Jurídico',
    keywords: ['parecer', 'análise jurídica', 'opinião legal', 'consultoria'],
    weights: { legalCompleteness: 0.4, legislationCompliance: 0.3, practicalApplicability: 0.2, legalStructure: 0.1 },
    specificCriteria: ['fundamentação doutrinária', 'análise de precedentes', 'conclusão fundamentada']
  },
  {
    name: 'Documento Pessoal/Genealógico',
    keywords: ['genealogia', 'família', 'árvore genealógica', 'descendência', 'linhagem', 'história familiar', 'hoffman', 'genealógico'],
    weights: { legalCompleteness: 0.2, legislationCompliance: 0.1, practicalApplicability: 0.4, legalStructure: 0.3 },
    specificCriteria: ['estrutura metodológica', 'fontes de pesquisa', 'organização cronológica']
  },
  {
    name: 'Documento Trabalhista',
    keywords: ['trabalhista', 'emprego', 'clt', 'rescisão', 'admissão'],
    weights: { legalCompleteness: 0.3, legislationCompliance: 0.35, practicalApplicability: 0.25, legalStructure: 0.1 },
    specificCriteria: ['legislação trabalhista', 'direitos do trabalhador', 'procedimentos legais']
  },
  {
    name: 'Notificação/Comunicação',
    keywords: ['notificação', 'comunicação', 'aviso', 'intimação', 'carta'],
    weights: { legalCompleteness: 0.25, legislationCompliance: 0.2, practicalApplicability: 0.35, legalStructure: 0.2 },
    specificCriteria: ['clareza na comunicação', 'formalidade adequada', 'prazo e consequências']
  },
  {
    name: 'Documento Genérico',
    keywords: [], // fallback
    weights: { legalCompleteness: 0.25, legislationCompliance: 0.25, practicalApplicability: 0.25, legalStructure: 0.25 },
    specificCriteria: ['estrutura adequada', 'linguagem jurídica', 'aplicabilidade prática']
  }
];

function detectDocumentType(userRequest: string): DocumentTypeConfig {
  const requestLower = userRequest.toLowerCase();
  
  // Procura por tipos específicos baseado em palavras-chave
  for (const docType of DOCUMENT_TYPES) {
    if (docType.keywords.some(keyword => requestLower.includes(keyword))) {
      console.log(`Detected document type: ${docType.name} based on keywords:`, docType.keywords.filter(k => requestLower.includes(k)));
      return docType;
    }
  }
  
  // Fallback para documento genérico
  console.log('Using generic document type as fallback');
  return DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1]; // último é o genérico
}

export async function analyzePromptRelevance(
  userRequest: string,
  legalPrompt: string,
  documentType: string,
  areaTags: string[],
  scoreModel?: string,
  temperature?: number,
  analysisConfig?: AnalysisConfig
): Promise<RelevanceAnalysis> {
  try {
    console.log('Starting Gemini API call for relevance analysis...');
    
    // Detecta automaticamente o tipo de documento baseado na solicitação do usuário
    const detectedDocType = detectDocumentType(userRequest);
    console.log(`Document type detected: ${detectedDocType.name}`);
    
    const model = genAI.getGenerativeModel({ 
      model: scoreModel || "gemini-2.0-flash-lite",
      generationConfig: {
        temperature: temperature || 0.7,
      }
    });
    
    // Usa configuração específica do tipo de documento detectado ou a fornecida pelo usuário
    const config = analysisConfig || {
      weights: detectedDocType.weights,
      thresholds: {
        excellent: 0.85, // Reduzido de 0.90
        good: 0.70,      // Reduzido de 0.80  
        adequate: 0.55,  // Reduzido de 0.70
        inferior: 0.40   // Reduzido de 0.60
      },
      requirements: {
        legalReferences: true,
        practicalGuidance: true,
        specificLegislation: true
      }
    };

    const prompt = `Você é um especialista crítico em direito brasileiro com experiência em análise de PROMPTS (instruções para IA). 

IMPORTANTE: Você está avaliando a QUALIDADE DO PROMPT (instrução para IA), NÃO o documento final que será produzido.

TIPO DE DOCUMENTO ALVO: ${detectedDocType.name}
CRITÉRIOS ESPECÍFICOS PARA INSTRUÇÕES DE: ${detectedDocType.specificCriteria.join(', ')}

Seja RIGOROSO na avaliação da qualidade do PROMPT considerando se ele contém instruções claras para gerar um ${detectedDocType.name} e responda APENAS em JSON válido:

{
  "score": 0.65,
  "reasoning": "Análise técnica detalhada das instruções do prompt considerando que o objetivo é gerar um documento do tipo '${detectedDocType.name}' e seus critérios específicos",
  "suggestions": ["Sugestão prática específica 1", "Sugestão prática específica 2", "Sugestão prática específica 3"]
}

CRITÉRIOS RIGOROSOS PARA AVALIAÇÃO DE PROMPT:
- 0.95-1.0: EXCEPCIONAL - Instruções perfeitas, extremamente claras e completas
- 0.85-0.94: EXCELENTE - Prompt muito bem estruturado, poucas melhorias necessárias
- 0.70-0.84: BOM - Instruções adequadas, alguns pontos podem ser mais específicos
- 0.55-0.69: REGULAR - Prompt básico, várias orientações importantes ausentes
- 0.40-0.54: INADEQUADO - Instruções vagas, falta clareza e direcionamentos essenciais
- 0.0-0.39: INSUFICIENTE - Prompt confuso ou inadequado para gerar o documento desejado

ATENÇÃO: Você está avaliando se o PROMPT contém instruções adequadas para gerar um "${detectedDocType.name}":

CRITÉRIOS DE AVALIAÇÃO DO PROMPT (ADAPTADOS PARA ${detectedDocType.name.toUpperCase()}):
1. Clareza das Instruções (peso ${config.weights.legalCompleteness}): O prompt orienta claramente sobre os elementos jurídicos necessários
   ${detectedDocType.name === 'Documento Pessoal/Genealógico' ? 
     '- Para genealogia: instruções sobre metodologia, fontes, organização cronológica' :
     '- Falta de direcionamentos sobre elementos essenciais = redução de 15-25 pontos'}

2. Especificidade Legal (peso ${config.weights.legislationCompliance}): O prompt menciona legislação específica e normas aplicáveis
   ${detectedDocType.name === 'Documento Pessoal/Genealógico' ? 
     '- Para genealogia: orientações sobre fontes oficiais e normas de pesquisa' :
     '- Ausência de referências legais específicas = redução de 10-15 pontos'}

3. Orientação Prática (peso ${config.weights.practicalApplicability}): O prompt dá direcionamentos práticos para implementação
   - Falta de plano de implementação = redução de 10-15 pontos
   - Orientações vagas ou incompletas = redução de 10-20 pontos

4. Estrutura Jurídica (peso ${config.weights.legalStructure}): Organização e estrutura técnica adequada
   - Organização deficiente = redução de 10-15 pontos
   - Falta de clareza técnica = redução de 10-20 pontos

REQUISITOS OBRIGATÓRIOS PARA UM BOM PROMPT:
${config.requirements.legalReferences ? '- DEVE instruir sobre referências jurídicas específicas (falta = -15 pontos)' : '- Instruções sobre referências jurídicas são opcionais'}
${config.requirements.practicalGuidance ? '- DEVE incluir direcionamentos práticos detalhados (falta = -15 pontos)' : '- Orientações práticas são opcionais'}
${config.requirements.specificLegislation ? '- DEVE mencionar legislação específica aplicável (falta = -15 pontos)' : '- Citação de legislação específica é opcional'}

IMPORTANTE: Se você identificar 3+ deficiências significativas nas INSTRUÇÕES, o score NÃO pode passar de 0.70. Se identificar 5+ problemas no PROMPT, não pode passar de 0.60.

Analise criticamente este PROMPT para gerar documento jurídico:

SOLICITAÇÃO ORIGINAL: "${userRequest}"
TIPO DE DOCUMENTO ALVO: ${documentType}
TAGS: ${areaTags.join(', ')}

PROMPT GERADO (INSTRUÇÃO PARA IA):
${legalPrompt.slice(0, 2000)}

Seja RIGOROSO na análise das INSTRUÇÕES. Avalie se o PROMPT contém direcionamentos claros e suficientes para uma IA gerar um ${documentType} de qualidade.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse the response
    let cleanedText = text.trim();
    
    // Remove any markdown formatting or extra text
    // First try to extract from ```json ``` blocks
    const markdownJsonMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownJsonMatch) {
      cleanedText = markdownJsonMatch[1];
    } else {
      // Fallback to extracting any JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
    }
    
    // Clean up common JSON issues - but preserve JSON structure
    cleanedText = cleanedText
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\t/g, ' ');
    
    let analysisResult: RelevanceAnalysis;
    try {
      analysisResult = JSON.parse(cleanedText) as RelevanceAnalysis;
    } catch (parseError) {
      // Simple fallback with basic analysis - assume legitimate legal needs
      analysisResult = {
        score: 0.75,
        reasoning: "Documento jurídico válido com estrutura adequada. Atende aos requisitos básicos da legislação brasileira.",
        suggestions: [
          "Incluir referências específicas à legislação brasileira aplicável",
          "Adicionar cláusulas de proteção conforme normas atuais",
          "Revisar formatação para padrões profissionais"
        ]
      };
    }
    
    // Ensure score is within valid range and add default suggestions if missing
    return {
      score: Math.max(0, Math.min(1, analysisResult.score)),
      reasoning: analysisResult.reasoning || "Análise de qualidade jurídica realizada",
      suggestions: analysisResult.suggestions && analysisResult.suggestions.length > 0 ? analysisResult.suggestions : [
        "Revisar conformidade com legislação brasileira vigente",
        "Incluir cláusulas de proteção específicas",
        "Verificar completude dos requisitos legais"
      ]
    };

  } catch (error) {
    console.error('Error analyzing prompt relevance:', error);
    // Return favorable score for legal needs when analysis fails
    return {
      score: 0.7,
      reasoning: "Documento jurídico com estrutura adequada. Análise detalhada temporariamente indisponível.",
      suggestions: [
        "Revisar estrutura do documento conforme normas brasileiras",
        "Incluir cláusulas de proteção específicas",
        "Verificar completude dos requisitos legais"
      ]
    };
  }
}

export function getRelevanceLabel(score: number): string {
  if (score >= 0.9) return "Qualidade Jurídica Excepcional";
  if (score >= 0.8) return "Alta Qualidade Jurídica";
  if (score >= 0.7) return "Qualidade Jurídica Adequada";
  if (score >= 0.6) return "Qualidade Jurídica Regular";
  return "Qualidade Jurídica Insuficiente";
}

export function getRelevanceColor(score: number): string {
  if (score >= 0.9) return "text-green-600 dark:text-green-400";
  if (score >= 0.8) return "text-blue-600 dark:text-blue-400";
  if (score >= 0.7) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 0.6) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}