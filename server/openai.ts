import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { openAIResponseSchema, type OpenAIResponse } from "@shared/schema";

// Initialize AI clients
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

const gemini = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;

// Predefined generic prompt templates for various areas
const genericTemplates = {
  legal: {
    keywords: ["contrato", "acordo", "jurídico", "legal", "direito", "petição", "parecer"],
    documentType: "Documento Jurídico",
    areaTags: ["Direito", "Jurídico"],
    template: "Elaborar documento jurídico apropriado que estabeleça claramente os elementos necessários, com linguagem técnica adequada, fundamentação legal sólida e formatação adequada para o tipo de documento solicitado."
  },
  business: {
    keywords: ["negócio", "empresa", "plano", "estratégia", "marketing", "vendas", "comercial"],
    documentType: "Documento Empresarial",
    areaTags: ["Negócios", "Empresarial"],
    template: "Desenvolver documento empresarial estruturado que atenda aos objetivos comerciais, com análise de mercado, estratégias apropriadas e linguagem profissional adequada."
  },
  academic: {
    keywords: ["pesquisa", "acadêmico", "estudo", "artigo", "tese", "dissertação", "científico"],
    documentType: "Documento Acadêmico",
    areaTags: ["Acadêmico", "Pesquisa"],
    template: "Elaborar documento acadêmico com rigor metodológico, fundamentação teórica sólida, análise crítica e formatação adequada aos padrões acadêmicos."
  },
  technical: {
    keywords: ["técnico", "manual", "procedimento", "instrução", "especificação", "documentação"],
    documentType: "Documento Técnico",
    areaTags: ["Técnico", "Documentação"],
    template: "Criar documento técnico claro e preciso, com instruções detalhadas, especificações técnicas e linguagem apropriada para o público-alvo."
  },
  creative: {
    keywords: ["criativo", "roteiro", "história", "narrativa", "conteúdo", "texto"],
    documentType: "Conteúdo Criativo",
    areaTags: ["Criativo", "Conteúdo"],
    template: "Desenvolver conteúdo criativo envolvente e original, com estrutura narrativa adequada, linguagem atrativa e elementos que capturem a atenção do público."
  }
};

function analyzeRequest(userRequest: string): OpenAIResponse {
  const request = userRequest.toLowerCase();
  
  // Find matching template
  let bestMatch = null;
  let maxMatches = 0;
  
  for (const [key, template] of Object.entries(genericTemplates)) {
    const matches = template.keywords.filter(keyword => request.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = template;
    }
  }
  
  // If no specific match, use generic template
  if (!bestMatch || maxMatches === 0) {
    return {
      documentType: "Documento Genérico",
      areaTags: ["Geral", "Personalizado"],
      legalPrompt: `Criar conteúdo adequado e estruturado para a seguinte solicitação: "${userRequest}". O conteúdo deve ser bem organizado, claro, preciso e adequado ao propósito especificado, seguindo as melhores práticas da área correspondente.`
    };
  }
  
  // Enhance the template with specific user request details
  const enhancedPrompt = `${bestMatch.template} 

Considerações específicas para esta solicitação: "${userRequest}"

O conteúdo deve ser elaborado seguindo as melhores práticas da área correspondente, com linguagem apropriada, estrutura clara e formatação adequada para o tipo de documento solicitado.`;

  return {
    documentType: bestMatch.documentType,
    areaTags: bestMatch.areaTags,
    legalPrompt: enhancedPrompt
  };
}

async function useOpenAIAssistant(userRequest: string): Promise<OpenAIResponse> {
  const assistantId = process.env.OPENAI_ASSISTANT_ID;
  
  if (!openai || !assistantId) {
    throw new Error("OpenAI não configurado");
  }

  // Create a thread
  const thread = await openai.beta.threads.create();

  // Add a message to the thread
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: userRequest,
  });

  // Run the assistant
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistantId,
  });

  // Wait for completion
  let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  
  // Poll for completion (with timeout)
  let attempts = 0;
  const maxAttempts = 30;
  
  while (runStatus.status !== "completed" && attempts < maxAttempts) {
    if (runStatus.status === "failed" || runStatus.status === "cancelled") {
      throw new Error(`Assistant execution failed: ${runStatus.status}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    attempts++;
  }

  if (runStatus.status !== "completed") {
    throw new Error("Assistant timeout");
  }

  // Get the messages
  const messages = await openai.beta.threads.messages.list(thread.id);
  const lastMessage = messages.data[0];
  
  if (!lastMessage || !lastMessage.content[0] || lastMessage.content[0].type !== "text") {
    throw new Error("Invalid assistant response");
  }

  const responseText = lastMessage.content[0].text.value;
  
  try {
    const parsedResponse = JSON.parse(responseText);
    return openAIResponseSchema.parse(parsedResponse);
  } catch (parseError) {
    console.error("Failed to parse assistant response:", responseText);
    throw new Error("Invalid response format from assistant");
  }
}

async function useAnthropicAssistant(userRequest: string): Promise<OpenAIResponse> {
  if (!anthropic) {
    throw new Error("Anthropic não configurado");
  }

  const prompt = `Gere um prompt jurídico avançado para uso em LLMs baseado na solicitação: "${userRequest}". 

O prompt deve ser estruturado para orientar uma LLM a gerar documentos jurídicos brasileiros de alta qualidade, seguindo as normas e legislação brasileira.

Retorne apenas JSON válido no formato:
{
  "documentType": "tipo de documento jurídico",
  "areaTags": ["area1", "area2"],
  "legalPrompt": "prompt detalhado e estruturado",
  "promptInstructions": "instruções de como usar este prompt em LLMs",
  "suggestedUsage": "sugestão de uso prático"
}

O legalPrompt deve incluir:
- Instruções claras para a estrutura do documento jurídico brasileiro
- Seções obrigatórias do documento conforme legislação brasileira
- Referências à legislação brasileira aplicável (Códigos, Leis, Regulamentos)
- Orientações sobre linguagem técnica jurídica adequada
- Requisitos formais do documento conforme normas brasileiras
- Considerações sobre jurisprudência e doutrina nacional`;

  const message = await anthropic.messages.create({
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
    model: 'claude-3-5-sonnet-20241022', // Claude 3.5 Sonnet - advanced reasoning capabilities
  });

  try {
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log("Anthropic raw response:", responseText);
    
    // Extract JSON from markdown code block if present
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    // Clean and fix JSON formatting
    jsonText = jsonText
      .trim()
      .replace(/^\uFEFF/, '') // Remove BOM
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \n \r \t
      .replace(/\n/g, ' ') // Replace newlines with spaces in JSON values
      .replace(/\r/g, '')
      .replace(/\t/g, ' ');
    
    // Try to extract just the JSON object if there's extra text
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    }
    
    const parsedResponse = JSON.parse(jsonText);
    return openAIResponseSchema.parse(parsedResponse);
  } catch (parseError) {
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    console.error("Failed to parse Anthropic response:", responseText);
    console.error("Parse error:", parseError);
    throw new Error("Invalid response format from Anthropic");
  }
}

async function useGeminiAssistant(userRequest: string, modelName?: string, temperature?: number): Promise<OpenAIResponse> {
  if (!gemini) {
    throw new Error("Gemini não configurado");
  }

  const model = gemini.getGenerativeModel({ 
    model: modelName || "gemini-2.0-flash-lite",
    generationConfig: {
      temperature: temperature || 0.7,
    }
  });

  const prompt = `Gere um prompt jurídico avançado para uso em LLMs baseado na solicitação: "${userRequest}". 

O prompt deve ser estruturado para orientar uma LLM a gerar documentos jurídicos brasileiros de alta qualidade, seguindo as normas e legislação brasileira.

Retorne apenas JSON válido no formato:
{
  "documentType": "tipo de documento jurídico",
  "areaTags": ["area1", "area2"],
  "legalPrompt": "prompt detalhado e estruturado",
  "promptInstructions": "instruções de como usar este prompt em LLMs",
  "suggestedUsage": "sugestão de uso prático"
}

O legalPrompt deve incluir:
- Instruções claras para a estrutura do documento jurídico brasileiro
- Seções obrigatórias do documento conforme legislação brasileira
- Referências à legislação brasileira aplicável (Códigos, Leis, Regulamentos)
- Orientações sobre linguagem técnica jurídica adequada
- Requisitos formais do documento conforme normas brasileiras
- Considerações sobre jurisprudência e doutrina nacional`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    console.log("Gemini raw response:", responseText);

    // Extract JSON from markdown code block if present
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    // Clean and fix JSON formatting
    jsonText = jsonText
      .trim()
      .replace(/^\uFEFF/, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/\t/g, ' ');
    
    // Try to extract just the JSON object if there's extra text
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    }
    
    const parsedResponse = JSON.parse(jsonText);
    return openAIResponseSchema.parse(parsedResponse);
  } catch (error) {
    console.error("Gemini processing error:", error);
    throw new Error(`Erro ao processar resposta do Gemini: ${error.message}`);
  }
}

export async function generateLegalPrompt(userRequest: string, activeModel?: string, scoreConfig?: { temperature: number, promptModel: string }): Promise<OpenAIResponse> {
  const modelToUse = activeModel || "claude";

  console.log(`Using AI model: ${modelToUse}`);

  switch (modelToUse) {
    case "openai":
      if (openai && process.env.OPENAI_ASSISTANT_ID) {
        console.log("Using OpenAI Assistant ID:", process.env.OPENAI_ASSISTANT_ID);
        return await useOpenAIAssistant(userRequest);
      }
      throw new Error("OpenAI não configurado. Configure OPENAI_API_KEY e OPENAI_ASSISTANT_ID.");

    case "gemini":
      if (gemini) {
        return await useGeminiAssistant(
          userRequest, 
          scoreConfig?.promptModel || "gemini-2.0-flash-lite",
          scoreConfig?.temperature || 0.7
        );
      }
      throw new Error("Gemini não configurado. Configure GOOGLE_API_KEY.");

    case "claude":
    default:
      if (anthropic) {
        return await useAnthropicAssistant(userRequest);
      }
      throw new Error("Claude não configurado. Configure ANTHROPIC_API_KEY.");
  }
}
